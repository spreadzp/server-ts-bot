import { ordersProviders } from './order.providers';
import { OrderSchema } from './shemas/order.shema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }])],
  controllers: [OrderController],
  providers: [OrderService, ...ordersProviders],
})
export class OrderModule { }
