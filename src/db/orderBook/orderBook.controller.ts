import { Controller, Get, Post, Body, Param, HttpStatus, Res } from '@nestjs/common';
import { OrderBookService } from './orderBook.service';
import { OrderBook } from '../../common/models/orderBook';
import { OrderBookDto } from './dto/orderBook.dto';

@Controller('orderBooks')
export class OrderBookController {
  constructor(private readonly orderBooksService: OrderBookService) { }

  @Post('create')
  async create(@Body() orderBookDto: OrderBookDto) {
    console.log('create root! :');
    this.orderBooksService.create(orderBookDto);
  }

  @Get('all')
  async findAll(): Promise<OrderBook[]> {
    const orderBooks = await this.orderBooksService.findAll();
    return orderBooks;
  }
  @Get('**')
  notFoundPage(@Res() res) {
    res.redirect('/');
  }
}