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

  async addNewData(data: OrderBook[]) {
    await this.orderBookModel.insert(data);
  }

  async findAll(): Promise<OrderBook[]> {
    return await this.orderBookModel.find().exec();
  }
}
