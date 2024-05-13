import { BinanceRepository } from '../Binance';
import { Deal } from '../Deal';
import { Order, OrderDto } from './Order';

export class OrderService {
  public static async getOrder(
    ...args: Parameters<(typeof BinanceRepository)['getOrder']>
  ) {
    const order = await BinanceRepository.getOrder(...args);
    return this.updateOrCreate(order);
  }

  public static async createOrder(
    ...args: Parameters<(typeof BinanceRepository)['createOrder']>
  ): Promise<Order> {
    const order = await BinanceRepository.createOrder(...args);
    return this.updateOrCreate(order);
  }

  public static async getLastOrder(): Promise<Order | null> {
    return await Order.findOne({ order: [['orderId', 'DESC']] });
  }
  private static async getDealId(): Promise<number> {
    const lastOrder = await OrderService.getLastOrder();

    if (lastOrder) {
      return lastOrder.DealId;
    }

    const { id } = await Deal.create({ profitPercent: 0, profitUsdt: 0 });
    return id;
  }

  private static async updateOrCreate(orderDto: OrderDto): Promise<Order> {
    const {
      symbol,
      orderId,
      price,
      side,
      type,
      status,
      origQty,
      executedQty,
      cummulativeQuoteQty,
    } = orderDto;

    const dealId = await OrderService.getDealId();

    const [order, created] = await Order.findOrCreate({
      where: { orderId },
      defaults: {
        DealId: dealId,
        symbol,
        orderId,
        price: Number(price),
        side,
        type,
        status,
        origQty: Number(origQty),
        executedQty: Number(executedQty),
        cummulativeQuoteQty: Number(cummulativeQuoteQty),
      },
    });

    if (created) return order;

    return await order.update({
      status,
      executedQty: Number(executedQty),
      cummulativeQuoteQty: Number(cummulativeQuoteQty),
    });
  }
}
