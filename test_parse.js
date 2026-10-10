import { getTotalStock } from './src/utils/parse.js';
const p = { stock_by_branch: { "ละไม": 5, "เฉวง": 4 } };
console.log(getTotalStock(p));
