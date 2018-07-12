import { OrderBookService } from './../db/orderBook/orderBook.service';
import { ServerTcpBot } from './server-tcp';
import { Controller, Get, Post, Body, Param, HttpStatus, Res } from '@nestjs/common';
import { OrderService } from './../db/order/order.service';
import { TradeService } from './../db/trade/trade.service';

@Controller('sever-tcp')
export class ServerTcpController {
    setverTcp: ServerTcpBot;
    constructor(
        private readonly orderBooksService: OrderBookService,
        private readonly orderService: OrderService,
        private readonly tradeService: TradeService,
    ) {
        this.setverTcp = new ServerTcpBot(this.orderBooksService, this.orderService, this.tradeService );
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
