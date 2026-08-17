// 真實資料來源範本 —— 未實作，留返畀你申請到 Amadeus API key 之後填寫。
//
// 申請步驟：
//   1. 去 https://developers.amadeus.com 開一個免費帳戶
//   2. 開一個 App，攞到 API Key + API Secret（test 環境每月約 2000 次免費 call）
//   3. 將 key/secret 存入環境變數 AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET
//   4. 實作低面 searchQuotes()，行為要同 mockProvider.js 嗰個一樣（同一個 shape 嘅回傳值），
//      咁樣先至唔使改前端／routes 任何嘢
//   5. 將 src/dataSource/index.js 入面嘅 import 由 './mockProvider.js' 轉做 './amadeusProvider.js'
//
// Amadeus 主要用到嘅 endpoint：
//   POST https://test.api.amadeus.com/v1/security/oauth2/token   (攞 access token)
//   GET  https://test.api.amadeus.com/v2/shopping/flight-offers  (查詢航班報價)

export async function searchQuotes(/* { origin, destination, departDate, returnDate, tripType } */) {
  throw new Error(
    'amadeusProvider 未實作。請參考本檔案頂部註解接駁 Amadeus Flight Offers Search API，' +
      '或者暫時繼續用 mockProvider.js。'
  );
}

export async function getQuoteFor(/* { origin, destination, departDate, returnDate, tripType, airlineCode } */) {
  throw new Error('amadeusProvider 未實作，請見檔案頂部註解。');
}
