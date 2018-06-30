import * as mongoose from 'mongoose';
require('dotenv').config();
const DB_PROVIDER = 'DbConnectionToken';

export const databaseProviders = [
    {
        provide: DB_PROVIDER,
        useFactory: async () => {
            (mongoose as any).Promise = global.Promise;
            return await mongoose.connect('mongodb://localhost:27017/orders-book');
        },
    },
];