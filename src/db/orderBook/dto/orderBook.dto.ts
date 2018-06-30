export class OrderBookDto {
  readonly exchangeName: string;
  readonly pair: string;
  readonly bid: number;
  readonly ask: number;
  readonly time: string;
}
