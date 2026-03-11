export function scaleQuantity(quantity: string, factor: number): string {
  const match = quantity.match(/^\s*(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return quantity;

  const value = Number(match[1]);
  if (Number.isNaN(value)) return quantity;

  const scaled = Math.round(value * factor * 100) / 100;
  const formatted = Number.isInteger(scaled)
    ? String(scaled)
    : scaled
        .toFixed(2)
        .replace(/\.0+$/, "")
        .replace(/(\.\d*[1-9])0+$/, "$1");

  return `${formatted}${match[2]}`;
}
