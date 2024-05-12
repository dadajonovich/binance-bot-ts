import { Order } from '../Order';
import { Executor, type ActionResult } from '../Executor';
import { Pair } from '../../config';

export class SpotService {
  public static async buy(pair: Pair, usdt: number): Promise<ActionResult> {
    const action = await Executor.create(pair);

    action.addEventListener('createdOrder', SpotService.recreate);

    await action.buy(usdt);

    return action.result;
  }

  public static async sell(pair: Pair, qty: number): Promise<ActionResult> {
    const action = await Executor.create(pair);

    action.addEventListener('createdOrder', SpotService.recreate);
    action.addEventListener('filled', SpotService.deleteLastOrder);

    await action.sell(qty);

    return action.result;
  }

  public static async deleteLastOrder() {
    const lastOrder = await SpotService.getLast();

    await lastOrder?.destroy();
  }

  public static async getLast() {
    return await LastOrder.findOne();
  }

  private static async recreate(order: Order): Promise<void> {
    await SpotService.deleteLastOrder();

    console.log('event createdOrder');
    const { symbol, orderId } = order;
    await LastOrder.create({ symbol, orderId });
  }
}
