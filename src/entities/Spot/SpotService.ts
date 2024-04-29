import { Order } from '../Order';
import { LastOrder } from '../LastOrder';
import { Actioner } from '../Actioner';

export const SpotService = new (class SpotService extends Actioner {
  public constructor() {
    super();
    this.addEventListener(
      'createdOrder',
      async (order: Order): Promise<void> => {
        await this.deleteLastOrder();

        console.log('event createdOrder');
        const { symbol, orderId } = order;
        await LastOrder.create({ symbol, orderId });
      },
    );

    this.addEventListener('filledSell', async (): Promise<void> => {
      await this.deleteLastOrder();
    });
  }

  public async deleteLastOrder() {
    const lastOrder = await this.getLast();

    await lastOrder?.destroy();
  }

  public async getLast() {
    return await LastOrder.findOne();
  }
})();
