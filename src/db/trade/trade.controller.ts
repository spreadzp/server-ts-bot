import { Controller, Get, Post, Body, Res, Request } from '@nestjs/common';
import { TradeService } from './trade.service';
import { Trade } from '../../common/models/trade';
import { TradeDto } from './dto/trade.dto';

@Controller('trades')
export class TradeController {
    constructor(private readonly tradesService: TradeService) { }

    @Post('create')
    async create(@Body() tradeDto: TradeDto) {
        console.log('create root! :');
        this.tradesService.create(tradeDto);
    }

    @Get('all')
    async findAll(): Promise<Trade[]> {
        const trades = await this.tradesService.findAll();
        return trades;
    }

    @Get('find/')
    async getTradeByPeriod(@Request() req): Promise<Trade[]> {
        const trades = await this.tradesService.getTradeByPeriod(req.query.startDate, req.query.endDate);
        //console.log(trades);
        return trades;
    }

    @Post('save')
    async saveNew(@Body() data: Trade) {
        const tradeBooks = await this.tradesService.addNewData(data);
    }

    @Get('**')
    notFoundPage(@Res() res) {
        res.redirect('/');
    }
}