import { ErrorInfo } from '../../includes/ErrorInfo';
import { Order } from '../Order/Order';
import { LastOrder } from '../LastOrder';
import { BinanceService } from '../Binance/BinanceService';

export class SpotService extends BinanceService {
  protected static override async handleCreateOrder(
    order: Order,
  ): Promise<void> {
    console.log('handleCreateOrder');
    const { symbol, orderId } = order;
    await LastOrder.create({ symbol, orderId });
  }
  protected static override async deleteOrder(orderId: number): Promise<void> {
    console.log('deleteOrder');
    const lastOrder = await SpotService.getByPk(orderId);
    // await LastOrder.destroy({ where: { orderId } });
    await lastOrder.destroy();
  }

  public static async getByPk(orderId: number): Promise<LastOrder> {
    return await LastOrder.findByPk(orderId, {
      rejectOnEmpty: new ErrorInfo('SpotService.getByPk', 'orderId не найден', {
        orderId,
      }),
    });
  }

  public static async getLast(): Promise<LastOrder | null> {
    return await LastOrder.findOne();
  }
}
