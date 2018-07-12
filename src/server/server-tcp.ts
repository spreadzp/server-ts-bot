import { Trade } from './../common/models/trade';
import { Order } from './../common/models/order';
import * as net from 'toa-net';
import * as uniqid from 'uniqid';
import { Parser } from './parser';
import { OrderBookService } from 'db/orderBook/orderBook.service';
import { OrderService } from 'db/order/order.service';
import { IDataExchange } from './../common/models/dataExchange';
import { Controller } from '@nestjs/common';
import { ClientTcp } from './client-tcp';
import { TradeService } from 'db/trade/trade.service';
import { StateTrading } from 'common/models/stateTrading';
import { ExchangeData } from 'common/models/exchangeData';
const auth = new net.Auth('secretxxx');

@Controller()
export class ServerTcpBot {
    server: any;
    parser: Parser;
    clientsTcp: ClientTcp[] = [];
    stateTrading: StateTrading[] = [];

    constructor(
        private readonly orderBooksService: OrderBookService,
        private readonly orderService: OrderService,
        private readonly tradeService: TradeService) {
        this.parser = new Parser(this.orderBooksService);
    }

    createTcpServer() {
        this.server = new net.Server((socket) => {
            socket.on('message', (message) => {
                if (message.type === 'notification' && message.payload.method === 'trades') {
                    const trades = this.parser.parseTrades(message);
                    if (trades.length) {
                        for (const trade of trades) {
                            this.tradeService.addNewData(trade);
                            this.requestBalanceArbitId(trade);
                        }
                    }
                }
                if (message.type === 'notification' && message.payload.method === 'resCheckOrder') {
                   // const currentBalanceArbitId = this.balanceService.addOppositeTrade(message.payload.params[0])
                    //this.parser.unblockTradingPair(trade);
                    const checkingOrder = JSON.parse(message.payload.params[0]);
                    console.log('+++@@@!!!checkingOrder :', checkingOrder);
                } else {
                    const parsedMessage = this.parser.parseTcpMessage(message);
                    this.parser.calculateAskBid(parsedMessage);
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

    private requestBalanceArbitId(trade: Trade) {
        const oppositeArbitOrder = this.parser.getOppositeOrder(trade.idOrder, trade.typeOrder);
        if (oppositeArbitOrder) {
            const oppositeCheckOrder = {
                name: 'checkOrder', order: { arbitOrderId: oppositeArbitOrder.arbitOrderId },
                serverPort: oppositeArbitOrder.port, host: oppositeArbitOrder.host,
            };
            this.startClient(oppositeCheckOrder);
        }

        ///return this.getCurrentBalanceArbitOrder(trade);
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

    sendOrdersToBot(orders: Order[]) {
        if (orders.length) {
            for (const currentOrder of orders) {
                const parametersOrder = {
                    nameOrder: 'sendOrder',
                    serverPort: currentOrder.port, host: currentOrder.host,
                    order: currentOrder,
                };
                if (this.parser.accessTrading(currentOrder) && parametersOrder.order.price > 0) {
                    this.startClient(parametersOrder);
                    this.orderService.addNewData(currentOrder);
                    this.parser.setStatusTrade(currentOrder);
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
                currentClient.notification(order.nameOrder, [`${stringOrder}`]);
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

    getCurrentPrice(): ExchangeData[] {
        return this.parser.getCurrentPrice();
    }
}
