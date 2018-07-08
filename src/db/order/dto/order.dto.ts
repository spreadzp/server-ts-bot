export class OrderDto {
    readonly exchange: string;
    readonly pair: string;
    readonly price: number;
    readonly volume: number;
    readonly typeOrder: string;
    readonly fee: number;
    readonly arbitrageId: string;
    readonly deviationPrice: number;
    readonly time: string;
  }
