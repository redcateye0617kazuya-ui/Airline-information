import { AIRLINES, findAirline } from './airlines.js';

// 簡單、確定性（deterministic）嘅 hash，用嚟由字串產生穩定嘅 seed
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

// mulberry32 PRNG：用固定 seed 就會每次產生返同一串「隨機」數，方便做到
// 「同一條航線 + 同一日期」每次查詢都有相近價錢，但唔同時間段會有小幅波動
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TIME_BUCKET_MS = 10 * 60 * 1000; // 10 分鐘一個波動區間，模擬價錢會隨時間輕微變動

function dateFactor(dateStr) {
  const departure = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((departure - today) / (24 * 60 * 60 * 1000));

  let urgencyFactor = 1.0;
  if (daysUntil <= 3) urgencyFactor = 1.75;
  else if (daysUntil <= 7) urgencyFactor = 1.5;
  else if (daysUntil <= 14) urgencyFactor = 1.3;
  else if (daysUntil <= 30) urgencyFactor = 1.12;
  else if (daysUntil <= 90) urgencyFactor = 1.0;
  else urgencyFactor = 0.92;

  const weekday = departure.getDay(); // 0=Sun ... 6=Sat
  const weekendFactor = weekday === 5 || weekday === 6 || weekday === 0 ? 1.1 : 1.0;

  return urgencyFactor * weekendFactor;
}

function routeBasePrice(origin, destination) {
  const seed = hashString(`${origin.toUpperCase()}-${destination.toUpperCase()}`);
  const rng = mulberry32(seed);
  return 500 + Math.floor(rng() * 3500);
}

// 時長/經停係「航線 + 航空公司」一齊決定，等唔同航空公司喺同一條航線都有唔同飛行時間
function flightProfile(origin, destination, airlineCode) {
  const seed = hashString(`${origin.toUpperCase()}-${destination.toUpperCase()}-${airlineCode}-profile`);
  const rng = mulberry32(seed);
  const durationHours = 1 + Math.floor(rng() * 13);
  const durationMinutes = Math.floor(rng() * 60);
  const stops = rng() < 0.35 ? 1 : 0;
  const flightNumber = `${airlineCode}${100 + Math.floor(rng() * 900)}`;
  return { durationHours, durationMinutes, stops, flightNumber };
}

function legPrice({ origin, destination, date, airlineCode }) {
  const basePrice = routeBasePrice(origin, destination);
  const airline = findAirline(airlineCode);
  const profile = flightProfile(origin, destination, airlineCode);

  const timeBucket = Math.floor(Date.now() / TIME_BUCKET_MS);
  const jitterSeed = hashString(`${origin}-${destination}-${date}-${airlineCode}-${timeBucket}`);
  const jitterRng = mulberry32(jitterSeed);
  const jitter = 0.94 + jitterRng() * 0.12; // 0.94 ~ 1.06

  const price = Math.round(basePrice * dateFactor(date) * airline.multiplier * jitter);

  return {
    price,
    flightNumber: profile.flightNumber,
    durationHours: profile.durationHours,
    durationMinutes: profile.durationMinutes,
    stops: profile.stops,
  };
}

// 每次都要提供 origin/destination/date/tripType，回傳全部航空公司嘅報價（由平至貴排序）
export function searchQuotes({ origin, destination, departDate, returnDate, tripType }) {
  return AIRLINES.map((airline) => {
    const outbound = legPrice({ origin, destination, date: departDate, airlineCode: airline.code });
    let totalPrice = outbound.price;
    let inbound = null;

    if (tripType === 'roundtrip' && returnDate) {
      inbound = legPrice({ origin: destination, destination: origin, date: returnDate, airlineCode: airline.code });
      totalPrice = Math.round((outbound.price + inbound.price) * 0.92); // 來回輕微折扣
    }

    return {
      airlineCode: airline.code,
      airlineName: airline.name,
      currency: 'HKD',
      price: totalPrice,
      outbound,
      inbound,
    };
  }).sort((a, b) => a.price - b.price);
}

// 用嚟畀監察名單攞返「現時」單一航空公司報價
export function getQuoteFor({ origin, destination, departDate, returnDate, tripType, airlineCode }) {
  const all = searchQuotes({ origin, destination, departDate, returnDate, tripType });
  return all.find((q) => q.airlineCode === airlineCode) || null;
}

export { AIRLINES };
