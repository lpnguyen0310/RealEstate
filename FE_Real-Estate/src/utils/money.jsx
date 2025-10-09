export const money = (n = 0) =>
  Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
