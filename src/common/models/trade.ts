import { Document } from 'mongoose';

export interface Trade extends Document {
    exchange: string;
    pair: string;
    price: number;
    volume: number;
    typeOrder: string;
    idOrder: string;
    exchOrderId: string;
    time: string;
}
