import { Asset, Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { sleep } from '../../includes/sleep';
import { BinanceRepository } from '.';
import { Order } from '../Order/Order';
import { getQuantity } from '../Order/getQuantity';
import { LastOrder } from '../LastOrder';

export class OperationService {
  private static async getByPk(orderId: number): Promise<LastOrder> {
    return await LastOrder.findByPk(orderId, {
      rejectOnEmpty: new ErrorInfo(
        'OperationService.getOrder',
        'orderId не найден',
        { orderId },
      ),
    });
  }

  private static async update(
    lastOrder: LastOrder,
    newOrder: LastOrder,
  ): Promise<LastOrder> {
    const { orderId, symbol } = newOrder;

    return await lastOrder.update({
      orderId,
      symbol,
    });
  }
}
