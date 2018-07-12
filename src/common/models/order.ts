import { Document } from 'mongoose';

export class Order extends Document{
    readonly exchange: string;
    readonly pair: string;
    readonly price: number;
    readonly volume: number;
    readonly typeOrder: string;
    readonly fee: number;
    readonly arbitrageId: string;
    readonly deviationPrice: number;
    readonly time: string;
    readonly host: string;
    readonly port: number;
    readonly statusOrder: string;
}
