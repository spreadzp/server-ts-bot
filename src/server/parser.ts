
import { Component, Controller } from '@nestjs/common';
import * as uniqid from 'uniqid';
import * as dotenv from 'dotenv';
import { Order } from './../common/models/order';
import { ExchangeData } from './../common/models/exchangeData';
import { Trade } from 'common/models/trade';
import { OrderBook } from './../common/models/orderBook';
import { OrderBookService } from 'db/orderBook/orderBook.service';
import { StateTrading } from 'common/models/stateTrading';
const cTable = require('console.table');
const emoji = require('node-emoji');
const forexLoader = require('./forex-loader');
dotenv.config();

let result;
let responseForexResource;
let fiatPrices;
let connectedExhanges;
let currentBalance = 0;
let currentVolume = 0;

@Controller()
export class Parser {
    exchangeData: ExchangeData[] = [];
    stateTrading: StateTrading[] = [];
    constructor(private readonly orderBooksService: OrderBookService) { }
    getForexPrices() {
        if (responseForexResource === undefined) {
            const pair = process.env.FOREX_PAIRS.split(',');
            responseForexResource = forexLoader.getNewFiatPrice([pair]);
        } else {
            if (responseForexResource.responseContent !== undefined) {
                const prices = responseForexResource.responseContent.body;
                fiatPrices = forexLoader.fiatParser(prices);
            }
        }
    }
    parseTcpMessage(data) {
        const exchangePair = data.payload.method.split(' ');
        const orderBook = data.payload.params[0];
        const host = data.payload.params[1];
        const port = data.payload.params[2];
        return { exchangePair, orderBook, host, port };
    }
    parseSentOrder(data) {
        const responseOrderData = data.payload.params[0];
        this.defineStateBalance(responseOrderData);
    }
    calculateAskBid({ exchangePair, orderBook, host, port }) {
        let currentForexPair, bids, asks;
        if (!fiatPrices) {
            this.getForexPrices();
        }
        if (exchangePair[1] && fiatPrices) {
            let createdExchangeField = false;
            currentForexPair = this.getPriceFiatForex(exchangePair[1]);
            bids = (currentForexPair !== undefined) ? (currentForexPair === 'USDJPY') ?
                [[+orderBook.bids[0][0] / +fiatPrices[currentForexPair][0], 0]] :
                [[+orderBook.bids[0][0] * +fiatPrices[currentForexPair][0], 0]] :
                orderBook.bids;

            asks = (currentForexPair !== undefined) ? (currentForexPair === 'USDJPY') ?
                [[+orderBook.asks[0][0] / +fiatPrices[currentForexPair][0], 0]] :
                [[+orderBook.asks[0][0] * +fiatPrices[currentForexPair][0], 0]] :
                orderBook.asks;
            ({ bids, asks, host, port, createdExchangeField } =
                this.setOldStatusPrice(orderBook, exchangePair, bids, asks, host, port, createdExchangeField, currentForexPair));
        }
    }
    private setOldStatusPrice(
        orderBook: any, exchangePair: any, bids: any, asks: any, host: any,
        port: any, createdExchangeField: boolean, currentForexPair: any) {
        if (!this.exchangeData && orderBook.bids !== undefined
            && orderBook.asks !== undefined) {
            this.exchangeData = [
                {
                    exchange: exchangePair[0],
                    pair: exchangePair[1],
                    bids: bids,
                    asks: asks,
                    currentStatus: 4,
                    status: true,
                    spread: 0,
                    host: host,
                    port: port,
                    time: Date.now().toString(),
                },
            ];
        }
        if (bids && asks) {
            for (let i = 0; i < this.exchangeData.length; i++) {
                if (this.exchangeData[i].exchange === exchangePair[0]
                    && this.exchangeData[i].pair === exchangePair[1]
                    && orderBook.bids !== undefined && orderBook.asks !== undefined) {
                    this.exchangeData[i].pair = exchangePair[1];
                    this.exchangeData[i].bids = bids;
                    this.exchangeData[i].asks = asks;
                    this.exchangeData[i].currentStatus = 4;
                    this.exchangeData[i].host = host;
                    this.exchangeData[i].port = port;
                    this.exchangeData[i].time = Date.now().toString(),
                        createdExchangeField = true;
                }
                else {
                    this.exchangeData[i].currentStatus -= 1;
                }
            }
        }
        if (!createdExchangeField && fiatPrices && exchangePair[1]) {
            bids = (currentForexPair !== undefined) ? (currentForexPair === 'USDJPY') ?
                [[+orderBook.bids[0][0] / +fiatPrices[currentForexPair][0], 0]] :
                [[+orderBook.bids[0][0] * +fiatPrices[currentForexPair][0], 0]] :
                orderBook.bids;
            asks = (currentForexPair !== undefined) ? (currentForexPair === 'USDJPY') ?
                [[+orderBook.asks[0][0] / +fiatPrices[currentForexPair][0], 0]] :
                [[+orderBook.asks[0][0] * +fiatPrices[currentForexPair][0], 0]] :
                orderBook.asks;
            if (orderBook.bids !== undefined && orderBook.asks !== undefined) {
                this.exchangeData.push({
                    exchange: exchangePair[0],
                    pair: exchangePair[1],
                    bids: bids,
                    asks: asks,
                    currentStatus: 4,
                    spread: 0,
                    host: host,
                    port: port,
                    time: Date.now().toString(),
                    status: true,
                });
            }
        }
        return { bids, asks, host, port, createdExchangeField };
    }
    unblockTradingPair(trade: Trade) {
        if (this.stateTrading.length) {
            for (const tradeItem of this.stateTrading) {
                if (trade.typeOrder === 'sell') {
                    if (tradeItem.arbitOrderId === trade.idOrder
                        && tradeItem.typeOrder === 'buy'
                    ) {
                        tradeItem.canTrade = true;
                    }
                }
                if (trade.typeOrder === 'buy') {
                    if (tradeItem.arbitOrderId === trade.idOrder
                        && tradeItem.typeOrder === 'sell'
                    ) {
                        tradeItem.canTrade = true;
                    }
                }
            }
        }
    }
    getOppositeOrder(arbitId, typeOrderDone): StateTrading {
        for (const order of this.stateTrading) {
            if (order.arbitOrderId === arbitId && order.typeOrder !== typeOrderDone) {
                return order;
            }
        }
    }
    accessTrading(order: Order) {
        let trade = true;
        if (this.stateTrading) {
            for (const state of this.stateTrading) {
                if (state.exchange === order.exchange &&
                    state.pair === order.pair &&
                    state.canTrade === false) {
                    trade = false;
                }
            }
        }
        return trade;
    }
    filterExchangesWithNotFullfiledOrders(connectedExchangesData: ExchangeData[]) {

    }
    setStatusTrade(order: Order) {
        let newOrderFlag = true;
        if (this.stateTrading.length) {
            for (const tradeItem of this.stateTrading) {
                if (tradeItem.exchange === order.exchange
                    && tradeItem.pair === order.pair
                    && tradeItem.typeOrder === order.typeOrder
                ) {
                    tradeItem.canTrade = false;
                    newOrderFlag = false;
                }
            }
            if (newOrderFlag) {
                let newOrder: StateTrading = {
                    exchange: order.exchange,
                    pair: order.pair,
                    typeOrder: order.typeOrder,
                    canTrade: false,
                    arbitOrderId: order.arbitrageId,
                    host: order.host,
                    port: order.port,
                };
                this.stateTrading.push(newOrder);
            }
        } else {
            let newOrder: StateTrading = {
                exchange: order.exchange,
                pair: order.pair,
                typeOrder: order.typeOrder,
                canTrade: false,
                arbitOrderId: order.arbitrageId,
                host: order.host,
                port: order.port,
            };
            this.stateTrading.push(newOrder);
        }
    }

    getPriceFiatForex(fiat) {
        if (fiatPrices) {
            const assetFiat = fiat.split('-');
            if (assetFiat[1] !== 'USD') {
                const key = Object.keys(fiatPrices);
                const searchFiat = key.find((element) => {
                    return element.includes(assetFiat[1]);
                });
                return searchFiat;
            }
        }
    }
    getSocket(data) {
        const hostClient = data.host;
        const portClient = data.port;
        console.log(hostClient, portClient);
    }
    makeOrders(): Order[] {
        if (this.exchangeData) {
            const currentOrderBooks = this.fetchOrderBook();
            for (const iterator of currentOrderBooks) {
                if (iterator.bids !== 0 && iterator.asks !== 0) {
                    const newOrderBookData: OrderBook = {
                        exchangeName: iterator.exchange, pair: iterator.pair,
                        bid: iterator.bids, ask: iterator.asks, time: Date.now(),
                    };
                    this.orderBooksService.addNewData(newOrderBookData);
                }
            }
            this.showData();

            return this.defineSellBuy(currentOrderBooks);
        }
    }
    fetchOrderBook(): ExchangeData[] {
        return this.exchangeData.map(data => ({
            exchange: data.exchange, pair: data.pair,
            bids: data.bids[0][0], asks: data.asks[0][0], time: Date.now().toString(),
            currentStatus: data.currentStatus, host: data.host, port: data.port, status: true,
            spread: 0,
        }));
    }
    showData() {
        console.log('');
        console.log('');
        console.log('=======================================================================');
        result = this.getCurrentPrice();
        connectedExhanges = result.filter(this.checkConnectedExchanges);
        const failExchangePrises = result.filter(this.isDisonnectedBot);
       /*  if (failExchangePrises.length) {
            console.table(`${emoji.get('white_frowning_face')} Disconnected bots`, failExchangePrises);
            console.log(`${emoji.get('hammer_and_pick')}  <---------------------------------------------->  ${emoji.get('hammer_and_pick')}`);
        }
        console.log('');
        console.table(result);
        console.log('');
        console.log(`@@@@@@@@@@  BALANCE = ${currentBalance}BTC VOLUME = ${currentVolume}`); */
    }
    getCurrentPrice(): ExchangeData[] {
        return this.exchangeData.map(data => ({
            exchange: data.exchange, pair: data.pair, bids: data.bids[0][0], asks: data.asks[0][0],
            spread: ((data.asks[0][0] / data.bids[0][0]) - 1) * 100, currentStatus: data.currentStatus,
            status: data.currentStatus > 0, host: data.host, port: data.port, time: Date.now().toString(),
        }));
    }

    defineStateBalance(data) {
        if (!fiatPrices) {
            this.getForexPrices();
        }
        if (fiatPrices) {
            const currentForexPair = this.getPriceFiatForex(data.pair);
            const priceConfirmed = (currentForexPair !== undefined) ? (currentForexPair === 'USDJPY') ?
                data.price / +fiatPrices[currentForexPair][0] :
                data.price * +fiatPrices[currentForexPair][0] :
                data.price;
            if (data.typeOrder === 'sell' && data.fulfill) {
                currentVolume -= data.volume;
                currentBalance += priceConfirmed * data.volume;
            }
            if (data.typeOrder === 'buy' && data.fulfill) {
                currentVolume += data.volume;
                currentBalance -= priceConfirmed * data.volume;
            } else {
                console.log('');
                console.log(`/@---@/ !! Arbitrage  order for ${data.typeOrder} # ${data.arbitrageId} not fulfilled!!!!`);
                console.log('');
            }
        }
    }
    defineCurrentForexPair(cryptoPair) {
        return this.getPriceFiatForex(cryptoPair);
    }
    defineSellBuy(result: ExchangeData[]) {
        let ordersBot: Order[];
        const maxBuyPrise = this.getMinAsk(result);
        const minSellPrise = this.getMaxBid(result);
        const marketSpread = (minSellPrise / maxBuyPrise - 1) * 100;
        const sellExchange = result.find(findSellExchange);
        const buyExchange = result.find(findBuyExchange);
        function findBuyExchange(data) {
            return data.asks === maxBuyPrise;
        }
        function findSellExchange(data) {
            return data.bids === minSellPrise;
        }
        console.log(marketSpread, +process.env.PERCENT_PROFIT);
        if (sellExchange && buyExchange && marketSpread > +process.env.PERCENT_PROFIT) {

            //console.log(`pair ${sellExchange.pair} Max Price: ${sellExchange.exchange}  ${minSellPrise}  Min Price: pair ${buyExchange.pair} ${buyExchange.exchange}  ${maxBuyPrise}  spread: ${marketSpread}%`);

            this.calculateOrderPricesWithFiat(maxBuyPrise, minSellPrise);
            const buyForexPair = this.defineCurrentForexPair(buyExchange.pair);
            const buyPrice = (buyForexPair !== undefined) ? (buyForexPair === 'USDJPY') ?
                maxBuyPrise * +fiatPrices[buyForexPair][0] :
                maxBuyPrise / +fiatPrices[buyForexPair][0] :
                maxBuyPrise;
            const sellForexPair = this.defineCurrentForexPair(sellExchange.pair);
            const sellPrice = (sellForexPair !== undefined) ? (sellForexPair === 'USDJPY') ?
                minSellPrise * +fiatPrices[sellForexPair][0] :
                minSellPrise / +fiatPrices[sellForexPair][0] :
                minSellPrise;
            const arbitrageUnicId = uniqid();
            const sellerOrder: Order = {
                pair: sellExchange.pair,
                exchange: sellExchange.exchange,
                price: sellPrice,
                volume: Number(process.env.TRADE_VOLUME),
                typeOrder: 'sell',
                fee: +process.env.FEE,
                deviationPrice: +process.env.DEVIATION_PRICE,
                host: sellExchange.host,
                port: sellExchange.port,
                arbitrageId: arbitrageUnicId,
                time: Date.now().toString(),
            };
            const buyerOrder: Order = {
                pair: buyExchange.pair,
                exchange: buyExchange.exchange,
                price: buyPrice,
                volume: +process.env.TRADE_VOLUME,
                typeOrder: 'buy',
                fee: +process.env.FEE,
                deviationPrice: +process.env.DEVIATION_PRICE,
                host: buyExchange.host,
                port: buyExchange.port,
                arbitrageId: arbitrageUnicId,
                time: Date.now().toString(),
            };
            ordersBot = this.setOrdersForTrade(sellerOrder, buyerOrder, sellExchange, marketSpread, buyExchange);
        }
        return ordersBot;
    }
    private setOrdersForTrade(sellerOrder: Order, buyerOrder: Order,
        sellExchange: any, marketSpread: number, buyExchange: any): Order[] {
        const ordersBot: Order[] = [];
        if (currentVolume === 0 && sellerOrder && buyerOrder) {
            //ordersBot = Object.assign({ seller: sellerOrder }, { buyer: buyerOrder });
            ordersBot.push(sellerOrder);
            ordersBot.push(buyerOrder);
            console.log(`pair ${sellExchange.pair} sell: ${sellerOrder.exchange} ${sellerOrder.price} buy: ${buyerOrder.exchange} ${buyerOrder.price}  spread: ${marketSpread}%`);
        }
        if (currentVolume > 0) {
            ordersBot.push(sellerOrder);
            console.log(`pair ${sellExchange.pair} sell: ${sellerOrder.exchange} ${sellerOrder.price}  spread: ${marketSpread}%`);
        }
        if (currentVolume < 0) {
            ordersBot.push(buyerOrder);
            console.log(`pair ${buyExchange.pair} buy: ${buyerOrder.exchange} ${buyerOrder.price}  spread: ${marketSpread}%`);
        }
        return ordersBot;
    }

    calculateOrderPricesWithFiat(buyPrice, sellPrice) {
        return { buyPrice: buyPrice, sellPrice: sellPrice };
    }
    isDisonnectedBot(data) {
        if (data.status) {
            return false;
        } else {
            console.error(`${emoji.get('fire')}<---------------------------------------------->${emoji.get('fire')}`);
            console.log(`from ${data.exchange} old data ${data.pair}, try reconnect ${data.host}:${data.port} ${emoji.get('exclamation')}`);
            return true;
        }
    }
    parseTrades(newTrades): Trade[] {
        const trades: Trade[] = [];
        //const exchangePair = newTrades.payload.method.split(' ');
        const tradedOrders = newTrades.payload.params[0];
        const host = newTrades.payload.params[1];
        const port = newTrades.payload.params[2];
        if (tradedOrders.length) {
            for (const trade of tradedOrders) {
                console.log('trade :', trade);
                trades.push(trade);
            }
        }
        return trades;
    }
    checkConnectedExchanges(data) {
        if (data.status) {
            return true;
        } else {
            return false;
        }
    }
    getMaxBid(arr) {
        let len = arr.length, max = -Infinity;
        while (len--) {
            if (Number(arr[len].bids) > max) {
                max = Number(arr[len].bids);
            }
        }
        return max;
    }
    getMinAsk(arr) {
        let len = arr.length, min = Infinity;
        while (len--) {
            if (Number(arr[len].asks) < min) {
                min = Number(arr[len].asks);
            }
        }
        return min;
    }
}
