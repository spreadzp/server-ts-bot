import { OrderBook } from './../common/models/orderBook';
import { OrderBookService } from 'db/orderBook/orderBook.service';
import { Component, Controller } from '@nestjs/common'; 
import { IDataExchange } from './../common/models/dataExchange'; 
import * as dotenv from 'dotenv';
dotenv.config();
const cTable = require('console.table');
const emoji = require('node-emoji');
const logger = require('./winston')
const forexLoader = require('./forex-loader'); 

const orderBooks = {};
let result;
let responseForexResource;
let fiatPrices;
let connectedExhanges;
let currentBalance = 0;
let currentVolume = 0;

@Controller()
export class Parser {
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
        let exchangePair = data.payload.method.split(' ');
        let orderBook = data.payload.params[0];
        let host = data.payload.params[1];
        let port = data.payload.params[2];
        this.parseMessage(exchangePair, orderBook, host, port);
    }
    parseData(data) {
        let exchangePair = data.exchange.split(' ');
        let orderBook = data.orderBook;
        let host = data.host;
        let port = data.port;
        this.parseMessage(exchangePair, orderBook, host, port);
    }
    parseSentOrder(data) {
        const responseOrderData = data.payload.params[0];
        this.defineStateBalance(responseOrderData);
    }
    parseMessage(exchangePair, orderBook, host, port) {
        let currentForexPair, bids, asks;
        if (!fiatPrices) {
            this.getForexPrices();
        }
        if (exchangePair[1] && fiatPrices) {
            orderBooks.pair = exchangePair[1];
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
            if (!orderBooks.orderBooksData && orderBook.bids !== undefined
                && orderBook.asks !== undefined) {

                orderBooks.orderBooksData = [
                    {
                        exchange: exchangePair[0],
                        pair: exchangePair[1],
                        bids: bids,
                        asks: asks,
                        currentStatus: 4,
                        host: host,
                        port: port
                    },
                ];
            }
            if (bids && asks) {
                for (let i = 0; i < orderBooks.orderBooksData.length; i++) {
                    if (orderBooks.orderBooksData[i].exchange === exchangePair[0]
                        && orderBooks.orderBooksData[i].pair === exchangePair[1]
                        && orderBook.bids !== undefined && orderBook.asks !== undefined) {
                        orderBooks.orderBooksData[i].pair = exchangePair[1];
                        orderBooks.orderBooksData[i].bids = bids;
                        orderBooks.orderBooksData[i].asks = asks;
                        orderBooks.orderBooksData[i].currentStatus = 4;
                        host = host;
                        port = port;
                        createdExchangeField = true;
                    } else {
                        orderBooks.orderBooksData[i].currentStatus -= 1;
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
                    orderBooks.orderBooksData.push(
                        {
                            exchange: exchangePair[0],
                            pair: exchangePair[1],
                            bids: bids,
                            asks: asks,
                            currentStatus: 4,
                            host: host,
                            port: port
                        },
                    );
                }
            }
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
                console.log('fiat', fiat, searchFiat);
                return searchFiat;
            }
        }
    }
    getSocket(data) {
        const hostClient = data.host;
        const portClient = data.port;
        console.log(hostClient, portClient);
    }
    makeOrders() {
        if (orderBooks.orderBooksData) {
            const currentOrders = this.fetchOrders();
            for (const iterator of currentOrders) {
                if (iterator.bid !== 0 && iterator.ask !== 0) {
                    const newOrderBookData: OrderBook = {
                        exchangeName: iterator.exchangeName, pair: iterator.pair,
                        bid: iterator.bid, ask: iterator.ask, time: Date.now(),
                    };
                    this.orderBooksService.addNewData(newOrderBookData);
                }
            }
            this.showData();

            return this.defineSellBuy(connectedExhanges);
        }
    }
    fetchOrders(): [OrderBook] {
        return orderBooks.orderBooksData.map(data => ({
            exchangeName: data.exchange, pair: data.pair,
            bid: data.bids[0][0], ask: data.asks[0][0], time: Date.now(),
        }));
    }
    showData() {
        console.log('');
        console.log('');
        console.log('=======================================================================');
        result = this.getCurrentPrice();
        connectedExhanges = result.filter(this.checkConnectedExchanges);
        const failExchangePrises = result.filter(this.isDisonnectedBot);
        if (failExchangePrises.length) {
            console.table(`${emoji.get('white_frowning_face')} Disconnected bots`, failExchangePrises);
            console.log(`${emoji.get('hammer_and_pick')}  <---------------------------------------------->  ${emoji.get('hammer_and_pick')}`);
        }
        console.log('');
        console.table(result);
        console.log('');
        console.log(`@@@@@@@@@@  BALANCE = ${currentBalance}BTC VOLUME = ${currentVolume}`);
    }
    getCurrentPrice(): IDataExchange {
        return orderBooks.orderBooksData.map(data => ({
            exchange: data.exchange, pair: data.pair,
            bid: data.bids[0][0], ask: data.asks[0][0], spread: ((data.asks[0][0] / data.bids[0][0]) - 1) * 100,
            status: data.currentStatus > 0, host: data.host, port: data.port, time: Date.now(),
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
            this.saveOrderToLog(data);
        }
    }
    saveOrderToLog(data) {
        if (data) {
            const executeOrder = `pair: ${data.pair}, exchange: ${data.exchange}, typeOrder: ${data.typeOrder}, arbitrageId: ${data.arbitrageId}, price: ${data.price}, volume: ${data.volume}, idOrderExchange: ${data.idOrderExcange}, fulfill: ${data.fulfill}`;
        }

    }
    defineCurrentForexPair(cryptoPair) {
        return this.getPriceFiatForex(cryptoPair);
    }
    defineSellBuy(result) {
        let ordersBot;
        const maxBuyPrise = this.getMinAsk(result);
        const minSellPrise = this.getMaxBid(result);
        const marketSpread = (minSellPrise / maxBuyPrise - 1) * 100;
        const sellExchange = result.find(findSellExchange);
        const buyExchange = result.find(findBuyExchange);
        function findBuyExchange(data) {
            return data.ask === maxBuyPrise;
        }
        function findSellExchange(data) {
            return data.bid === minSellPrise;
        }
        console.log(marketSpread, +process.env.PERCENT_PROFIT);
        if (sellExchange && buyExchange && marketSpread > +process.env.PERCENT_PROFIT) {

            console.log(`pair ${sellExchange.pair} Max Price: ${sellExchange.exchange}  ${minSellPrise}  Min Price: pair ${buyExchange.pair} ${buyExchange.exchange}  ${maxBuyPrise}  spread: ${marketSpread}%`);

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
            const sellerOrder = {
                pair: sellExchange.pair,
                exchange: sellExchange.exchange,
                price: sellPrice,
                volume: 1,
                fee: process.env.FEE,
                deviationPrice: process.env.DEVIATION_PRICE,
                host: sellExchange.host,
                port: sellExchange.port,
            };
            const buyerOrder = {
                pair: buyExchange.pair,
                exchange: buyExchange.exchange,
                price: buyPrice,
                volume: 1,
                fee: process.env.FEE,
                deviationPrice: process.env.DEVIATION_PRICE,
                host: buyExchange.host,
                port: buyExchange.port,
            };
            if (currentVolume === 0 && sellerOrder && buyerOrder) {
                ordersBot = Object.assign({ seller: sellerOrder }, { buyer: buyerOrder });
                console.log(`pair ${sellExchange.pair} sell: ${ordersBot.seller.exchange} ${ordersBot.seller.price} buy: ${ordersBot.buyer.exchange} ${ordersBot.buyer.price}  spread: ${marketSpread}%`);
            } if (currentVolume > 0) {
                ordersBot = Object.assign({ seller: sellerOrder });
                console.log(`pair ${sellExchange.pair} sell: ${ordersBot.seller.exchange} ${ordersBot.seller.price}  spread: ${marketSpread}%`);
            } if (currentVolume < 0) {
                ordersBot = Object.assign({ buyer: buyerOrder });
                console.log(`pair ${buyExchange.pair} buy: ${ordersBot.buyer.exchange} ${ordersBot.buyer.price}  spread: ${marketSpread}%`);
            }
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
            if (Number(arr[len].bid) > max) {
                max = Number(arr[len].bid);
            }
        }
        return max;
    }
    getMinAsk(arr) {
        let len = arr.length, min = Infinity;
        while (len--) {
            if (Number(arr[len].ask) < min) {
                min = Number(arr[len].ask);
            }
        }
        return min;
    }
}
