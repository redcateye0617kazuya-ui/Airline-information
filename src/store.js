import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'watchlist.json');

const MAX_HISTORY_POINTS = 200;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

function readAll() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(items) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

export function listWatches() {
  return readAll();
}

export function getWatch(id) {
  return readAll().find((w) => w.id === id) || null;
}

export function addWatch(watch) {
  const items = readAll();
  items.push(watch);
  writeAll(items);
  return watch;
}

export function removeWatch(id) {
  const items = readAll();
  const next = items.filter((w) => w.id !== id);
  writeAll(next);
  return next.length !== items.length;
}

export function appendHistory(id, point) {
  const items = readAll();
  const watch = items.find((w) => w.id === id);
  if (!watch) return null;
  watch.history.push(point);
  if (watch.history.length > MAX_HISTORY_POINTS) {
    watch.history = watch.history.slice(-MAX_HISTORY_POINTS);
  }
  watch.lastUpdated = point.timestamp;
  writeAll(items);
  return watch;
}
