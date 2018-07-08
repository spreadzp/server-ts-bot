import { OrderSchema } from './shemas/order.shema';
import { Connection } from 'mongoose';
const DB_PROVIDER = 'DbConnectionToken';

export const ordersProviders = [
  {
    provide: 'OrderModelToken',
    useFactory: (connection: Connection) => connection.model('Order', OrderSchema),
    inject: [DB_PROVIDER],
  },
];
