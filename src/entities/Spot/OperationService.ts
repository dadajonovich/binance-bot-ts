import { Asset, Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { sleep } from '../../includes/sleep';
import { BinanceRepository } from '../../repositories/binance';
import { Order } from '../Order/Order';
import { getQuantity } from '../Order/getQuantity';

export class OperationService {
  private static async repeat(order: Order): Promise<Order> {
    if (order.isFilled) return order;
    await sleep(1000 * 60 * 0.25);

    const { symbol, orderId } = order;
    const currentOrder = await BinanceRepository.getOrder(symbol, orderId);

    if (order.isFilled) {
      return currentOrder;
    }
    return await BinanceRepository.cancelOrder(symbol, orderId);
  }

  public static async buy(pair: Pair, usdt: number): Promise<Order> {
    console.log('BinanceService.buy');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = getQuantity(usdt / currentPrice, stepSize);
    console.log(
      '1 BinanceService.buy newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    const newOrder = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'BUY',
      quantity,
    );
    console.log('BinanceService.buy newOrder', newOrder);

    const order = await OperationService.repeat(newOrder);
    console.log(
      '2 BinanceService.buy newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    if (order.isFilled) return order;

    return await OperationService.buy(
      order.symbol,
      usdt - order.cummulativeQuoteQty,
    );
  }

  public static async sell(pair: Pair, qty: number): Promise<Order> {
    console.log('BinanceService.sell');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    if (stepSize >= qty) {
      throw new ErrorInfo('Order.sell', 'stepSize >= qty', {
        stepSize,
        asset: qty,
      });
    }

    const currentPrice = await BinanceRepository.getPrice(pair);

    const validQty = getQuantity(qty, stepSize);
    console.log(
      '1 BinanceService.sell newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    const newOrder = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'SELL',
      validQty,
    );

    console.log('BinanceService.sell newOrder', newOrder);

    const order = await OperationService.repeat(newOrder);
    console.log(
      '2 BinanceService.sell newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    if (order.isFilled) return order;

    return await OperationService.sell(order.symbol, qty - order.executedQty);
  }
}

// export class OrderService {
//   private static async update(
//     order: Order,
//     orderProps: OrderDto,
//   ): Promise<Order> {
//     const { status, executedQty, cummulativeQuoteQty } = orderProps;

//     return await order.update({
//       status,
//       executedQty: Number(executedQty),
//       cummulativeQuoteQty: Number(cummulativeQuoteQty),
//     });
//   }

//   public static async get(orderId: number): Promise<Order> {
//     const order = await OrderService.getByPk(orderId);
//     const { symbol } = order;

//     const responce = await BinanceRepository.getOrder(symbol, orderId);

//     return await OrderService.update(order, responce);
//   }

//   public static async cancel(orderId: number): Promise<Order> {
//     const order = await OrderService.getByPk(orderId);

//     const { symbol } = order;

//     const responce = await BinanceRepository.cancelOrder(symbol, orderId);

//     return await OrderService.update(order, responce);
//   }

//   private static async create(
//     symbol: Pair,
//     price: number,
//     side: Order['side'],
//     quantity: number,
//     type: Order['type'] = 'LIMIT',
//   ): Promise<Order> {
//     const responce = await BinanceRepository.createOrder(
//       symbol,
//       price,
//       side,
//       quantity,
//       type,
//     );

//     const { orderId, status, executedQty, cummulativeQuoteQty, origQty } =
//       responce;

//     return await Order.create({
//       orderId,
//       symbol,
//       price,
//       side,
//       type,
//       status,
//       executedQty: Number(executedQty),
//       cummulativeQuoteQty: Number(cummulativeQuoteQty),
//       origQty: Number(origQty),
//     });
//   }

//   private static async getByPk(orderId: number): Promise<Order> {
//     return await Order.findByPk(orderId, {
//       rejectOnEmpty: new ErrorInfo(
//         'BinanceRepository.getOrder',
//         'orderId не найден',
//         { orderId },
//       ),
//     });
//   }

//   public static async buy(pair: Pair, usdt: number): Promise<Order> {
//     console.log('OrderService.buy');
//     const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

//     const currentPrice = await BinanceRepository.getPrice(pair);

//     const quantity = getQuantity(1000 / currentPrice, stepSize);

//     const newOrder = await OrderService.create(
//       pair,
//       currentPrice,
//       'BUY',
//       quantity,
//     );
//     console.log('OrderService.buy newOrder', newOrder);

//     const order = await OrderService.repeat(newOrder);
//     if (orderIsFilled(order)) return order;

//     return await OrderService.buy(
//       order.symbol,
//       1000 - order.cummulativeQuoteQty,
//     );
//   }

//   private static async repeat(order: Order): Promise<Order> {
//     if (orderIsFilled(order)) return order;
//     await sleep(1000 * 60 * 0.25);

//     const currentOrder = await OrderService.get(order.orderId);

//     if (orderIsFilled(currentOrder)) {
//       return currentOrder;
//     }
//     return await OrderService.cancel(currentOrder.orderId);
//   }

//   public static async sell(pair: Pair, qty: number): Promise<Order> {
//     console.log('OrderService.sell');
//     const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

//     if (stepSize >= qty) {
//       throw new ErrorInfo('Order.sell', 'stepSize >= qty', {
//         stepSize,
//         asset: qty,
//       });
//     }

//     const currentPrice = await BinanceRepository.getPrice(pair);

//     const validQty = getQuantity(qty, stepSize);

//     const newOrder = await OrderService.create(
//       pair,
//       currentPrice,
//       'SELL',
//       validQty,
//     );

//     console.log('OrderService.sell newOrder', newOrder);

//     const order = await OrderService.repeat(newOrder);
//     if (orderIsFilled(order)) return order;

//     return await OrderService.sell(order.symbol, qty - order.executedQty);
//   }

//   public static async getOpen(): Promise<Order[]> {
//     return await Order.findAll({ where: { status: 'NEW' } });
//   }

//   public static async getLast(): Promise<Order | null> {
//     return await Order.findOne({ order: [['orderId', 'DESC']] });
//   }
// }
