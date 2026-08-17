import { Router } from 'express';
import crypto from 'node:crypto';
import { getQuoteFor } from '../dataSource/index.js';
import { listWatches, getWatch, addWatch, removeWatch, appendHistory } from '../store.js';
import { findAirline } from '../dataSource/airlines.js';

const router = Router();

const IATA_RE = /^[A-Za-z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function refreshWatch(watch) {
  const quote = getQuoteFor({
    origin: watch.origin,
    destination: watch.destination,
    departDate: watch.departDate,
    returnDate: watch.returnDate,
    tripType: watch.tripType,
    airlineCode: watch.airlineCode,
  });
  if (!quote) return watch;
  return appendHistory(watch.id, { timestamp: new Date().toISOString(), price: quote.price });
}

router.get('/watchlist', (_req, res) => {
  res.json({ watches: listWatches() });
});

router.post('/watchlist', (req, res) => {
  const { origin, destination, departDate, returnDate, tripType = 'oneway', airlineCode } = req.body || {};

  if (!origin || !IATA_RE.test(origin)) return res.status(400).json({ error: '出發地代碼不正確' });
  if (!destination || !IATA_RE.test(destination)) return res.status(400).json({ error: '目的地代碼不正確' });
  if (!departDate || !DATE_RE.test(departDate)) return res.status(400).json({ error: '出發日期不正確' });
  if (tripType === 'roundtrip' && (!returnDate || !DATE_RE.test(returnDate))) {
    return res.status(400).json({ error: '來回程需要回程日期' });
  }
  const airline = airlineCode && findAirline(airlineCode);
  if (!airline) return res.status(400).json({ error: '揀嘅航空公司唔存在' });

  const watch = {
    id: crypto.randomUUID(),
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departDate,
    returnDate: tripType === 'roundtrip' ? returnDate : null,
    tripType,
    airlineCode: airline.code,
    airlineName: airline.name,
    createdAt: new Date().toISOString(),
    lastUpdated: null,
    history: [],
  };

  addWatch(watch);
  const updated = refreshWatch(watch);
  res.status(201).json({ watch: updated });
});

router.post('/watchlist/:id/refresh', (req, res) => {
  const watch = getWatch(req.params.id);
  if (!watch) return res.status(404).json({ error: '搵唔到呢個監察項目' });
  const updated = refreshWatch(watch);
  res.json({ watch: updated });
});

router.post('/watchlist/refresh-all', (_req, res) => {
  const watches = listWatches();
  const updated = watches.map((w) => refreshWatch(w));
  res.json({ watches: updated });
});

router.delete('/watchlist/:id', (req, res) => {
  const removed = removeWatch(req.params.id);
  if (!removed) return res.status(404).json({ error: '搵唔到呢個監察項目' });
  res.status(204).end();
});

export default router;
