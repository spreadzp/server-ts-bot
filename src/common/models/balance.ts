import { Document } from 'mongoose';

export class Balance extends Document {
    readonly exchange: string;
    readonly asset: [{
        assetName: string;
        amount: number;
    }];
    readonly currency: [{
        currencyName: string;
        amountCurrency: string;
        amountCurrencyInUsd: string;
    }];
    readonly arbitIdOrders: [{
        arbitId: string;
        statusArbitId: string;
    }];
    readonly volume: number;
    readonly typeOrder: string;
    readonly fee: number;
    readonly arbitrageId: string;
    readonly deviationPrice: number;
    readonly time: string;
    readonly host: string;
    readonly port: number;
}
