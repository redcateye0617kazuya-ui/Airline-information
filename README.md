# Airline-information — 機票票價追蹤網

跟出發日期、來回程比較各航空公司機票票價，並可以將心水航班加入監察名單，追蹤價格隨時間嘅走勢。

## 功能

- 揀單程 / 來回，輸入出發地、目的地（IATA 機場代碼）同日期
- 一次過比較全部航空公司嘅票價、航班編號、飛行時長、經停次數
- 可以多選航空公司，加入監察名單
- 監察名單會記錄每次查詢/自動更新嘅價錢歷史，用 sparkline 顯示走勢，同標示升跌幅
- 伺服器每 15 分鐘自動幫全部監察項目更新一次價錢（server 持續運行先會生效）

## 執行方法

```bash
npm install
npm start
```

然後開 http://localhost:3000

開發時可以用 `npm run dev`（會用 `node --watch` 自動 reload）。

## 資料來源

而家用**模擬資料**（`src/dataSource/mockProvider.js`）—— 價錢係根據航線、日期（愈近出發愈貴、週末出發偏貴）、航空公司同一個隨時間輕微波動嘅隨機因子計算出嚟，確保同一條航線每次查詢價錢相近但唔死板。

### 想換做真實票價 API

推薦用 **[Amadeus for Developers](https://developers.amadeus.com)** 嘅 Self-Service Flight Offers Search API：

1. 開一個免費開發者帳戶，建立一個 App 攞到 `Client ID` / `Client Secret`（test 環境每月約 2000 次免費 call）
2. 將 key 存做環境變數 `AMADEUS_CLIENT_ID` / `AMADEUS_CLIENT_SECRET`
3. 喺 `src/dataSource/amadeusProvider.js` 入面實作 `searchQuotes()` / `getQuoteFor()`，回傳值格式要同 `mockProvider.js` 一致
4. 將 `src/dataSource/index.js` 嘅 `export * from './mockProvider.js'` 改做 `'./amadeusProvider.js'`

因為 routes 同前端只透過 `src/dataSource/index.js` 呢個 adapter 攞資料，換 provider 唔使改任何其他地方。

其他真實資料來源可以考慮：Skyscanner（partner API，需要商業審批）、Kiwi.com Tequila API（需要 partner apply）。

## 專案結構

```
src/
  server.js              Express app + 自動更新監察名單
  store.js               監察名單 JSON 檔案儲存
  dataSource/
    index.js             資料來源 adapter（換 provider 淨係改呢個檔）
    mockProvider.js       模擬票價邏輯
    amadeusProvider.js    真實 API 範本（未實作）
    airlines.js           支援嘅航空公司清單
  routes/
    search.js             GET /api/search
    watchlist.js           /api/watchlist CRUD + refresh
public/
  index.html / style.css / app.js   前端（純 HTML/JS，冇 build step）
data/
  watchlist.json          監察名單持久化資料（唔會 commit）
```
