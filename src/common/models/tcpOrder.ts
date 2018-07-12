
export interface TcpOrder extends Document{
    readonly name: string;
    readonly exchange: string;
    readonly pair: string;
    readonly typeOrder: string;
    readonly arbitrageId: string;
    readonly time: string;
    readonly host: string;
    readonly port: number;
}