import { OrderBookSchema } from './shemas/orderBook.shema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderBookController } from './orderBook.controller';
import { OrderBookService } from './orderBook.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'OrderBook', schema: OrderBookSchema }])],
  controllers: [OrderBookController],
  providers: [OrderBookService],
})
export class OrderBookModule { }
