import { ErrorInfo } from '../../includes/ErrorInfo';
import { LotParams } from '../Binance';

export const getQuantity = (
  qty: number,
  price: number,
  lotParams: LotParams,
): number => {
  const { stepSize, maxNotional, minNotional } = lotParams;

  const minQty = minNotional / price;
  const maxQty = maxNotional / price;

  if (minQty >= qty) {
    throw new ErrorInfo('getQuantity', 'minQty >= qty', {
      qty,
      minQty,
    });
  }

  const [integer, decimal] = String(qty).split('.');
  if (decimal === undefined) return Math.min(Number(integer), maxQty);

  const length = stepSize.toString().replaceAll(/[^0]/g, '').length;

  const quantityDecimal = decimal.slice(0, length);

  const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

  return Math.min(Number(quantity), maxQty);
};
