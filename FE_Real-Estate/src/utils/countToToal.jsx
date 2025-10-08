// format tiền VND
export const fmtVND = (n = 0) =>
    n.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

/**
 * Tính tổng tiền từ qty và 2 mảng sản phẩm
 * @param {Record<string, number>} qty - map id -> quantity
 * @param {Array<{id:string, price:number}>} singles
 * @param {Array<{id:string, price:number}>} combos
 */
export const calcTotal = (qty = {}, singles = [], combos = []) => {
    const all = [...singles, ...combos];
    return all.reduce((sum, it) => sum + (qty[it.id] || 0) * it.price, 0);
};
