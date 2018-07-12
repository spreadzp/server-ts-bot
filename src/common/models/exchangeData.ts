export interface ExchangeData {
    exchange: string;
    pair: string;
    bids: any;
    asks: any;
    currentStatus: number;
    time: string;
    status: boolean;
    spread: number;
    host: string;
    port: number;
}
