export const getQuantity = (
  quantityAsset: number,
  stepSize: number,
): number => {
  const [integer, decimal] = String(quantityAsset).split('.');
  if (decimal === undefined) return Number(integer);

  const length = stepSize.toString().replaceAll(/[^0]/g, '').length;

  const quantityDecimal = decimal.slice(0, length);

  const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

  console.log('getQuantity', quantityAsset, stepSize, quantity);
  return Number(quantity);
};
