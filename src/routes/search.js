import { Router } from 'express';
import { searchQuotes } from '../dataSource/index.js';

const router = Router();

const IATA_RE = /^[A-Za-z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get('/search', (req, res) => {
  const { origin, destination, departDate, returnDate, tripType = 'oneway' } = req.query;

  if (!origin || !IATA_RE.test(origin)) {
    return res.status(400).json({ error: '請輸入正確嘅出發地 IATA 機場代碼（3 個英文字母）' });
  }
  if (!destination || !IATA_RE.test(destination)) {
    return res.status(400).json({ error: '請輸入正確嘅目的地 IATA 機場代碼（3 個英文字母）' });
  }
  if (origin.toUpperCase() === destination.toUpperCase()) {
    return res.status(400).json({ error: '出發地同目的地唔可以一樣' });
  }
  if (!departDate || !DATE_RE.test(departDate)) {
    return res.status(400).json({ error: '請輸入正確嘅出發日期' });
  }
  if (!['oneway', 'roundtrip'].includes(tripType)) {
    return res.status(400).json({ error: 'tripType 必須係 oneway 或 roundtrip' });
  }
  if (tripType === 'roundtrip') {
    if (!returnDate || !DATE_RE.test(returnDate)) {
      return res.status(400).json({ error: '來回程請輸入正確嘅回程日期' });
    }
    if (returnDate < departDate) {
      return res.status(400).json({ error: '回程日期唔可以早過出發日期' });
    }
  }

  const quotes = searchQuotes({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departDate,
    returnDate: tripType === 'roundtrip' ? returnDate : null,
    tripType,
  });

  res.json({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departDate,
    returnDate: tripType === 'roundtrip' ? returnDate : null,
    tripType,
    quotes,
  });
});

export default router;
