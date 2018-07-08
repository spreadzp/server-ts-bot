import * as mongoose from 'mongoose';

export const OrderSchema = new mongoose.Schema({
    exchange: String,
    pair: String,
    price: Number,
    volume: Number,
    typeOrder: String,
    fee: Number,
    arbitrageId: String,
    deviationPrice: Number,
    time: String,
});
