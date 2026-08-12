const searchForm = document.getElementById('search-form');
const tripTypeRadios = document.querySelectorAll('input[name="tripType"]');
const returnField = document.getElementById('return-field');
const departDateInput = document.getElementById('departDate');
const returnDateInput = document.getElementById('returnDate');
const originInput = document.getElementById('origin');
const destinationInput = document.getElementById('destination');

const resultsCard = document.getElementById('results-card');
const resultsBody = document.getElementById('results-body');
const searchError = document.getElementById('search-error');
const addSelectedBtn = document.getElementById('add-selected-btn');

const watchlistBody = document.getElementById('watchlist-body');
const watchlistEmpty = document.getElementById('watchlist-empty');
const refreshAllBtn = document.getElementById('refresh-all-btn');

let lastSearch = null; // { origin, destination, departDate, returnDate, tripType }
const selectedQuotes = new Map(); // airlineCode -> quote

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

departDateInput.value = todayPlus(14);
returnDateInput.value = todayPlus(21);
returnDateInput.min = departDateInput.value;

tripTypeRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    const isRoundtrip = document.querySelector('input[name="tripType"]:checked').value === 'roundtrip';
    returnField.hidden = !isRoundtrip;
    returnDateInput.required = isRoundtrip;
  });
});

departDateInput.addEventListener('change', () => {
  returnDateInput.min = departDateInput.value;
  if (returnDateInput.value < departDateInput.value) {
    returnDateInput.value = departDateInput.value;
  }
});

function formatDuration(hours, minutes) {
  return `${hours}小時${minutes ? ` ${minutes}分鐘` : ''}`;
}

function updateAddSelectedBtn() {
  addSelectedBtn.textContent = `加入監察名單（已選 ${selectedQuotes.size}）`;
  addSelectedBtn.disabled = selectedQuotes.size === 0;
}

function renderResults(quotes) {
  selectedQuotes.clear();
  updateAddSelectedBtn();
  resultsBody.innerHTML = '';

  quotes.forEach((quote) => {
    const tr = document.createElement('tr');

    const checkTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedQuotes.set(quote.airlineCode, quote);
      else selectedQuotes.delete(quote.airlineCode);
      updateAddSelectedBtn();
    });
    checkTd.appendChild(checkbox);
    tr.appendChild(checkTd);

    const nameTd = document.createElement('td');
    nameTd.textContent = `${quote.airlineName} (${quote.airlineCode})`;
    tr.appendChild(nameTd);

    const flightTd = document.createElement('td');
    flightTd.textContent = quote.inbound
      ? `${quote.outbound.flightNumber} / ${quote.inbound.flightNumber}`
      : quote.outbound.flightNumber;
    tr.appendChild(flightTd);

    const durationTd = document.createElement('td');
    durationTd.textContent = formatDuration(quote.outbound.durationHours, quote.outbound.durationMinutes);
    tr.appendChild(durationTd);

    const stopsTd = document.createElement('td');
    stopsTd.textContent = quote.outbound.stops === 0 ? '直航' : `轉機 ${quote.outbound.stops} 次`;
    tr.appendChild(stopsTd);

    const priceTd = document.createElement('td');
    priceTd.className = 'price';
    priceTd.textContent = `$${quote.price.toLocaleString()}`;
    tr.appendChild(priceTd);

    resultsBody.appendChild(tr);
  });

  resultsCard.hidden = false;
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  searchError.hidden = true;

  const tripType = document.querySelector('input[name="tripType"]:checked').value;
  const params = new URLSearchParams({
    origin: originInput.value.trim().toUpperCase(),
    destination: destinationInput.value.trim().toUpperCase(),
    departDate: departDateInput.value,
    tripType,
  });
  if (tripType === 'roundtrip') params.set('returnDate', returnDateInput.value);

  try {
    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '搜尋失敗');

    lastSearch = {
      origin: data.origin,
      destination: data.destination,
      departDate: data.departDate,
      returnDate: data.returnDate,
      tripType: data.tripType,
    };
    renderResults(data.quotes);
  } catch (err) {
    searchError.textContent = err.message;
    searchError.hidden = false;
    resultsCard.hidden = true;
  }
});

addSelectedBtn.addEventListener('click', async () => {
  if (!lastSearch || selectedQuotes.size === 0) return;
  addSelectedBtn.disabled = true;

  const requests = Array.from(selectedQuotes.values()).map((quote) =>
    fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lastSearch, airlineCode: quote.airlineCode }),
    })
  );

  await Promise.all(requests);
  selectedQuotes.clear();
  resultsBody.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
  updateAddSelectedBtn();
  await loadWatchlist();
});

function buildSparkline(history) {
  if (!history || history.length === 0) return '';
  const width = 100;
  const height = 30;
  if (history.length === 1) {
    return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <circle cx="${width / 2}" cy="${height / 2}" r="3" fill="var(--accent)" />
    </svg>`;
  }

  const prices = history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = history
    .map((h, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((h.price - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <polyline fill="none" stroke="var(--accent)" stroke-width="2" points="${points}" />
  </svg>`;
}

function trendBadge(history) {
  if (!history || history.length < 2) return '';
  const last = history[history.length - 1].price;
  const prev = history[history.length - 2].price;
  if (last === prev) return '<span>—</span>';
  const diff = last - prev;
  const pct = ((diff / prev) * 100).toFixed(1);
  return diff > 0
    ? `<span class="trend-up">▲ +${pct}%</span>`
    : `<span class="trend-down">▼ ${pct}%</span>`;
}

function renderWatchlist(watches) {
  watchlistBody.innerHTML = '';
  watchlistEmpty.hidden = watches.length > 0;

  watches.forEach((watch) => {
    const tr = document.createElement('tr');

    const routeTd = document.createElement('td');
    routeTd.textContent = `${watch.origin} → ${watch.destination}${watch.tripType === 'roundtrip' ? ' (來回)' : ''}`;
    tr.appendChild(routeTd);

    const dateTd = document.createElement('td');
    dateTd.textContent = watch.tripType === 'roundtrip' ? `${watch.departDate} ~ ${watch.returnDate}` : watch.departDate;
    tr.appendChild(dateTd);

    const airlineTd = document.createElement('td');
    airlineTd.textContent = `${watch.airlineName} (${watch.airlineCode})`;
    tr.appendChild(airlineTd);

    const priceTd = document.createElement('td');
    const latest = watch.history[watch.history.length - 1];
    priceTd.className = 'price';
    priceTd.innerHTML = latest
      ? `$${latest.price.toLocaleString()}<br />${trendBadge(watch.history)}`
      : '—';
    tr.appendChild(priceTd);

    const sparkTd = document.createElement('td');
    sparkTd.innerHTML = buildSparkline(watch.history);
    tr.appendChild(sparkTd);

    const updatedTd = document.createElement('td');
    updatedTd.textContent = watch.lastUpdated ? new Date(watch.lastUpdated).toLocaleString('zh-HK') : '—';
    tr.appendChild(updatedTd);

    const actionsTd = document.createElement('td');
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'icon-btn';
    refreshBtn.textContent = '重新整理';
    refreshBtn.addEventListener('click', async () => {
      await fetch(`/api/watchlist/${watch.id}/refresh`, { method: 'POST' });
      loadWatchlist();
    });
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.textContent = '刪除';
    deleteBtn.addEventListener('click', async () => {
      await fetch(`/api/watchlist/${watch.id}`, { method: 'DELETE' });
      loadWatchlist();
    });
    actionsTd.appendChild(refreshBtn);
    actionsTd.appendChild(deleteBtn);
    tr.appendChild(actionsTd);

    watchlistBody.appendChild(tr);
  });
}

async function loadWatchlist() {
  const res = await fetch('/api/watchlist');
  const data = await res.json();
  renderWatchlist(data.watches || []);
}

refreshAllBtn.addEventListener('click', async () => {
  refreshAllBtn.disabled = true;
  await fetch('/api/watchlist/refresh-all', { method: 'POST' });
  await loadWatchlist();
  refreshAllBtn.disabled = false;
});

loadWatchlist();
