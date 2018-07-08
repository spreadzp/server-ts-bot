export interface IDataExchange {
    exchange: string;
    pair: string;
    bid: number;
    ask: number;
    spread: number;
    status: boolean;
    host: string;
    port: string;
    time: string;
}
