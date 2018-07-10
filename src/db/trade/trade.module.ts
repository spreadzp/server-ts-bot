import { tradesProviders } from './trade.providers';
import { TradeSchema } from './shemas/trade.shema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Trade', schema: TradeSchema }])],
  controllers: [TradeController],
  providers: [TradeService, ...tradesProviders],
})
export class TradeModule { }
