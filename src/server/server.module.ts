import { ServerTcpController } from './server.controller';
import { OrderBookSchema } from './../db/orderBook/shemas/orderBook.shema';
import { OrderBookService } from './../db/orderBook/orderBook.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderService } from './../db/order/order.service';
import { OrderSchema } from './../db/order/shemas/order.shema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'OrderBook', schema: OrderBookSchema },
  { name: 'Order', schema: OrderSchema }])],
  controllers: [ServerTcpController],
  providers: [OrderBookService, OrderService],
})
export class ServerTcpModule {}
