// 資料來源 adapter：而家預設用 mock provider。
// 之後有真實 API（例如 Amadeus）嘅時候，將呢行改做 import from './amadeusProvider.js' 就得，
// routes / 前端完全唔使改。
export * from './mockProvider.js';
