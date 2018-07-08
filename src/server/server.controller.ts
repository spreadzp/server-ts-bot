import { OrderBookService } from './../db/orderBook/orderBook.service';
import { ServerTcpBot } from './server';
import { Controller, Get, Post, Body, Param, HttpStatus, Res } from '@nestjs/common';
import { OrderBook } from 'common/models/orderBook';
import { OrderService } from './../db/order/order.service';

@Controller('sever-tcp')
export class ServerTcpController {
    setverTcp: ServerTcpBot;
    constructor(
        private readonly orderBooksService: OrderBookService,
        private readonly orderService: OrderService) {
        this.setverTcp = new ServerTcpBot(this.orderBooksService, this.orderService);
    }
    /*  @Get('save')
     async saveNew(data: OrderBook) {
         const orderBooks = await this.orderBooksService.addNewData(data);
     } */
    @Get('start-server')
    startTcpServer() {
        this.setverTcp.createTcpServer();
    }

    @Get('stop-server')
    stopTcpServer() {
        this.setverTcp.stopTcpServer();
    }

    @Get('current-price')
    userBalance(@Res() res) {
        const currentPrice = this.setverTcp.getCurrentPrice();
        res.status(HttpStatus.OK).json(currentPrice);
    }
}
 /*  [
                { name: "Apple iPhone 7", price: 56000 },
                { name: "HP Elite x3", price: 56000 },
                { name: "Alcatel Idol S4", price: 25000 },
            ], */