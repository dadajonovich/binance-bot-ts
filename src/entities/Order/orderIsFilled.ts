import { OrderDto } from './Order';

export const orderIsFilled = (order: Pick<OrderDto, 'status'>): boolean => {
  return order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED';
};
