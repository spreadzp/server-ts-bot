export class TradeDto {
    readonly exchange: string;
    readonly pair: string;
    readonly price: number;
    readonly volume: number;
    readonly typeOrder: string;
    readonly idOrder: string;
    readonly time: string;
  }
