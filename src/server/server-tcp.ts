import * as net from 'toa-net';
import * as uniqid from 'uniqid';
import { Parser } from './parser';
import { OrderBookService } from 'db/orderBook/orderBook.service';
import { OrderService } from 'db/order/order.service';
import { IDataExchange } from './../common/models/dataExchange';
import { Controller } from '@nestjs/common';
import { ClientTcp } from './client-tcp';
import { TradeService } from 'db/trade/trade.service';
const auth = new net.Auth('secretxxx');

@Controller()
export class ServerTcpBot {
    server: any;
    parser: Parser;
    clientsTcp: ClientTcp[] = [];

    constructor(
        private readonly orderBooksService: OrderBookService,
        private readonly orderService: OrderService,
        private readonly tradeService: TradeService) {
        this.parser = new Parser(this.orderBooksService);
    }

    createTcpServer() {
        this.server = new net.Server((socket) => {
            socket.on('message', (message) => {
                if (message.type === 'notification' && message.payload.method === 'responseOrder') {
                    this.parser.parseSentOrder(message);
                    this.parser.parseTcpMessage(message);
                    const orders = this.parser.makeOrders();
                    if (orders) {
                        this.sendOrdersToBot(orders);
                    }
                }
                if (message.type === 'notification' && message.payload.method === 'trades') {
                    const trades = this.parser.parseTrades(message); 
                    if (trades.length) {
                        console.log('trades.length :', trades.length);
                        for (const trade of trades) {
                            this.tradeService.addNewData(trade);
                        }
                    }
                }
                if (message.type === 'request') {
                    this.startClient(message.payload.params);
                    // echo request
                    socket.success(message.payload.id, message.payload.params);
                } else {
                    this.parser.parseTcpMessage(message);
                    const orders = this.parser.makeOrders();
                    if (orders) {
                        this.sendOrdersToBot(orders);
                    }
                }
            });
        });
        this.server.listen(process.env.TCP_PORT);
        console.log(`Tcp server listen port ${process.env.TCP_PORT}`);

        // Enable authentication for server
        this.server.getAuthenticator = () => {
            return (signature) => auth.verify(signature);
        };
    }

    stopTcpServer() {
        this.server.close();
        console.log('Tcp server stoped');
    }

    createClient(clientSocket) {
        const newClientTcp = new net.Client();
        this.clientsTcp.push({ socket: clientSocket, client: newClientTcp });
        newClientTcp.getSignature = () => {
            return auth.sign({ id: 'clientIdxxx' });
        };
        newClientTcp.connect(clientSocket);
        return newClientTcp;
    }

    sendOrdersToBot(orders) {
        if (orders) {
            const arbitrageUnicId = uniqid();

            if (orders.seller !== undefined && orders.seller.volume !== 0 && orders.seller.price !== 0) {
                const parametersSellOrder = {
                    serverPort: orders.seller.port, host: orders.seller.host,
                    order: {
                        pair: orders.seller.pair, exchange: orders.seller.exchange, price: orders.seller.price,
                        volume: orders.seller.volume, typeOrder: 'sell', fee: orders.seller.fee, arbitrageId: arbitrageUnicId,
                        deviationPrice: orders.seller.deviationPrice, time: Date.now().toString(),
                    },
                };
                if (parametersSellOrder.order) {
                    this.startClient(parametersSellOrder);
                    this.orderService.addNewData(parametersSellOrder.order);
                }
            }
            if (orders.buyer !== undefined && orders.buyer.volume !== 0 && orders.buyer.price !== 0) {
                const parametersBuyOrder = {
                    serverPort: orders.buyer.port, host: orders.buyer.host,
                    order: {
                        pair: orders.buyer.pair, exchange: orders.buyer.exchange, price: orders.buyer.price,
                        volume: orders.buyer.volume, typeOrder: 'buy', fee: orders.buyer.fee, arbitrageId: arbitrageUnicId,
                        deviationPrice: orders.buyer.deviationPrice, time: Date.now().toString(),
                    },
                };
                if (parametersBuyOrder.order) {
                    this.startClient(parametersBuyOrder);
                    this.orderService.addNewData(parametersBuyOrder.order);
                }
            }
        }
    }

    startClient(order) {
        try {
            if (order.host && order.serverPort) {
                const clientSocket = `tcp://${order.host}:${order.serverPort}`;
                let currentClient = this.defineTcpClient(clientSocket);
                if (!currentClient) {
                    currentClient = this.createClient(clientSocket);
                }
                currentClient.on('error', (err) => {
                    if (err.code === 'ETIMEDOUT') {
                        currentClient.destroy();
                    }
                    currentClient.reconnect();
                });
                const stringOrder = JSON.stringify(order.order);
                currentClient.notification('sendOrder', [`${stringOrder}`]);
            }
        } catch (e) {
            console.log('err :', e);
        }
    }
    defineTcpClient(socketTcp): any {
        if (this.clientsTcp) {
            for (const iterator of this.clientsTcp) {
                if (iterator.socket === socketTcp) {
                    return iterator.client;
                }
            }
        }
    }

    getCurrentPrice(): IDataExchange {
        return this.parser.getCurrentPrice();
    }
}
