import { OrderBookDto } from './dto/orderBook.dto';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrderBook } from '../../common/models/orderBook';

@Injectable()
export class OrderBookService {
  constructor(@InjectModel('OrderBook') private readonly orderBookModel: Model<OrderBook>) {}

  async create(createOrderBookDto: OrderBookDto): Promise<OrderBook> {
    const createdOrderBook = new this.orderBookModel(createOrderBookDto);
    return await createdOrderBook.save();
  }

  async addNewData(data: OrderBook) {
    const createdOrderBook = await new this.orderBookModel(data); 
    await createdOrderBook.save();
  }

  async findAll(): Promise<OrderBook[]> {
    return await this.orderBookModel.find().exec();
  }

  async getOrderBookByPeriod(startDate: number, endDate: number): Promise<OrderBook[]> {
    return await this.orderBookModel.find({time: { $gte: startDate,  $lt: endDate}},
    {_id: 0, exchangeName: 1, pair: 1, bid: 1, ask: 1, time: 1}).exec();
  }
}
