export interface StateTrading {
    exchange: string;
    pair: string;
    typeOrder: string;
    arbitOrderId: string;
    canTrade: boolean;
    host: string;
    port: number;
}
