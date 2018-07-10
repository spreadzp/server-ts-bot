import { TradeSchema } from './shemas/trade.shema';
import { Connection } from 'mongoose';
const DB_PROVIDER = 'DbConnectionToken';

export const tradesProviders = [
  {
    provide: 'TradeModelToken',
    useFactory: (connection: Connection) => connection.model('Trade', TradeSchema),
    inject: [DB_PROVIDER],
  },
];
