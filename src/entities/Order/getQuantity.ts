import { LotParams } from '../Binance';

export const getQuantity = (
  qty: number,
  price: number,
  lotParams: LotParams,
): number => {
  const { stepSize, maxNotional } = lotParams;

  const maxQty = maxNotional / price;

  const [integer, decimal] = String(qty).split('.');
  if (decimal === undefined) return Math.min(Number(integer), maxQty);

  const length = stepSize.toString().replaceAll(/[^0]/g, '').length;

  const quantityDecimal = decimal.slice(0, length);

  const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

  return Math.min(Number(quantity), maxQty);
};
