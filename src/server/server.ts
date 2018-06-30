import * as net from 'toa-net';
import * as uniqid from 'uniqid';
import { Model } from 'mongoose';
import {Parser} from './parser';
import { OrderBookService } from 'db/orderBook/orderBook.service';
import { OrderBook } from 'common/models/orderBook';
const auth = new net.Auth('secretxxx');
let client = null;

export class ServerTcpBot {
    server: any;
    parser: Parser;
    orderBooksService: OrderBookService;

    constructor(
        
    ) {
        this.orderBooksService = new OrderBookService(OrderBook);
        this.parser = new Parser(this.orderBooksService);
    }

    createTcpServer() {
        this.server = new net.Server((socket) => {
            socket.on('message', (message) => {
                if (message.type === 'notification' && message.payload.method === 'responseOrder') {
                    this.parser.parseSentOrder(message);
                }
                if (message.type === 'request') {
                    this.startClient(message.payload.params);
                    // echo request
                    socket.success(message.payload.id, message.payload.params);
                } else {
                    this.parser.parseTcpMessage(message);
                    const orders = this.parser.makeOrders();
                    this.sendOrdersToBot(orders);
                }
            });
        });
        this.server.listen(8000);
        console.log('Tcp server listen port 8000' );

        // Enable authentication for server
        this.server.getAuthenticator = () => {
            return (signature) => auth.verify(signature);
        };
    }

    stopTcpServer() {
        this.server.close();
        console.log('Tcp server stoped' );
    }

    createClient(clientSocket) {
        client = new net.Client();
        // Enable authentication for client
        client.getSignature = () => {
            return auth.sign({ id: 'clientIdxxx' });
        },
            client.connect(clientSocket);
    }

    sendOrdersToBot(orders) {
        if (orders) {
            const arbitrageId = uniqid();
            console.log('arbitrageId :', arbitrageId);

            if (orders.seller !== undefined) {
                const parametersSellOrder = {
                    serverPort: orders.seller.port, host: orders.seller.host,
                    order: {
                        pair: orders.seller.pair, exchange: orders.seller.exchange, price: orders.seller.price,
                        volume: orders.seller.volume, typeOrder: 'sell', arbitrageId: arbitrageId,
                        deviationPrice: orders.seller.deviationPrice,
                    },
                };
                this.startClient(parametersSellOrder);
            }
            if (orders.buyer !== undefined) {
                const parametersBuyOrder = {
                    serverPort: orders.buyer.port, host: orders.buyer.host,
                    order: {
                        pair: orders.buyer.pair, exchange: orders.buyer.exchange, price: orders.buyer.price,
                        volume: orders.buyer.volume, typeOrder: 'buy', arbitrageId: arbitrageId,
                        deviationPrice: orders.buyer.deviationPrice,
                    },
                };
                this.startClient(parametersBuyOrder);
            }

        }
    }

    startClient(order) {
        try {
            const clientSocket = `tcp://${order.host}:${order.serverPort}`;
            this.createClient(clientSocket);
            client.on('error', (err) => {
                //console.log('err.trace :', err); 
                if (err.code === 'ETIMEDOUT') {
                    client.destroy();
                }
                client.reconnect();
            });
            const stringOrder = JSON.stringify(order.order);
            client.notification('sendOrder', [`${stringOrder}`]);
        } catch (e) {
            console.log('err :', e);
        }
    }
} 
