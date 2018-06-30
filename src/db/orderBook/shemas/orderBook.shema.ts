import * as mongoose from 'mongoose';

export const OrderBookSchema = new mongoose.Schema({
    exchangeName: String,
    pair: String,
    bid: Number,
    ask: Number,
    time: String,
});
