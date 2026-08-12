import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import searchRouter from './routes/search.js';
import watchlistRouter from './routes/watchlist.js';
import { listWatches, appendHistory } from './store.js';
import { getQuoteFor } from './dataSource/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const AUTO_REFRESH_MS = 15 * 60 * 1000; // 每 15 分鐘自動幫全部監察項目更新一次價錢

app.use(express.json());
app.use('/api', searchRouter);
app.use('/api', watchlistRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`Airline price tracker running at http://localhost:${PORT}`);
});

setInterval(() => {
  const watches = listWatches();
  for (const watch of watches) {
    const quote = getQuoteFor({
      origin: watch.origin,
      destination: watch.destination,
      departDate: watch.departDate,
      returnDate: watch.returnDate,
      tripType: watch.tripType,
      airlineCode: watch.airlineCode,
    });
    if (quote) {
      appendHistory(watch.id, { timestamp: new Date().toISOString(), price: quote.price });
    }
  }
}, AUTO_REFRESH_MS).unref();
