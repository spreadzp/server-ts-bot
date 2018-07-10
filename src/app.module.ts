import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderBookModule } from './db/orderBook/orderBook.module';
import {ServerTcpModule} from './server/server.module';
import { OrderModule } from './db/order/order.module';
import { TradeModule } from './db/trade/trade.module';

@Module({
  imports: [
   MongooseModule.forRoot('mongodb://localhost:27017/orders-book'),
    OrderBookModule, ServerTcpModule, OrderModule, TradeModule,
  ],
  controllers: [AppController],
  providers: [ AppService ],
})
export class AppModule {}
