import { OrderDto } from './dto/order.dto';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from '../../common/models/order';

@Injectable()
export class OrderService {
  constructor(@InjectModel('Order') private readonly orderModel: Model<Order>) { }

  async create(createOrderDto: OrderDto): Promise<Order> {
    const createdOrder = new this.orderModel(createOrderDto);
    return await createdOrder.save();
  }

  async addNewData(data: Order) {
    const createdOrder = await new this.orderModel(data);
    await createdOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return await this.orderModel.find().exec();
  }

  async getOrderByPeriod(startDate: number, endDate: number): Promise<Order[]> {
    return await this.orderModel.find({ time: { $gte: startDate, $lt: endDate } },
      {
        _id: 0, exchange: 1, pair: 1, price: 1, volume: 1, typeOrder: 1, fee: 1,
        arbitrageId: 1, deviationPrice: 1, time: 1,
      }).exec();
  }
}
