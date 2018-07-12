import { TradeDto } from './dto/trade.dto';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Trade } from '../../common/models/trade';

@Injectable()
export class TradeService {
  constructor(@InjectModel('Trade') private readonly tradeModel: Model<Trade>) { }

  async create(createTradeDto: TradeDto): Promise<Trade> {
    const createdTrade = new this.tradeModel(createTradeDto);
    return await createdTrade.save();
  }

  async addNewData(data: Trade) {
    const createdTrade = await new this.tradeModel(data);
    await createdTrade.save();
  }

  async findAll(): Promise<Trade[]> {
    return await this.tradeModel.find().exec();
  }

  async getTradeByPeriod(startDate: number, endDate: number): Promise<Trade[]> {
    return await this.tradeModel.find({ time: { $gte: startDate, $lt: endDate } },
      {
        _id: 0, exchange: 1, pair: 1, price: 1, volume: 1, typeOrder: 1, idOrder: 1,
        exchOrderId: 1, time: 1,
      }).exec();
  }
}
