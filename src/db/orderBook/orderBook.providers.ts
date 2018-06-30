import { OrderBookSchema } from './shemas/orderBook.shema';
import { Connection } from 'mongoose';
const DB_PROVIDER = 'DbConnectionToken';

export const orderBooksProviders = [
  {
    provide: 'OrderBookModelToken',
    useFactory: (connection: Connection) => connection.model('OrderBook', OrderBookSchema),
    inject: [DB_PROVIDER],
  },
];
