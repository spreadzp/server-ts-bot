import { ServerTcpController } from './server.controller';
import { OrderBookSchema } from './../db/orderBook/shemas/orderBook.shema';
import { OrderBookService } from './../db/orderBook/orderBook.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderService } from './../db/order/order.service';
import { OrderSchema } from './../db/order/shemas/order.shema';
import { TradeService } from './../db/trade/trade.service';
import { TradeSchema } from './../db/trade/shemas/trade.shema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'OrderBook', schema: OrderBookSchema },
    { name: 'Order', schema: OrderSchema },
    { name: 'Trade', schema: TradeSchema }])],
  controllers: [ServerTcpController],
  providers: [OrderBookService, OrderService, TradeService],
})
export class ServerTcpModule { }
