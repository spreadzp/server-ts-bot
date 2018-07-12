import * as mongoose from 'mongoose';

export const TradeSchema = new mongoose.Schema({
    exchange: String,
    pair: String,
    price: Number,
    volume: Number,
    typeOrder: String,
    idOrder: String,
    exchOrderId: String,
    time: String,
});
