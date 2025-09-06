# Bitcoin Transaction Price Calculator

Bitcoin Transaction Price Calculator is a web application that allows you to look up any Bitcoin transaction and instantly discover the price of Bitcoin in your preferred currency at the exact time the transaction was confirmed. You can paste up to 5 transaction IDs, to see the price difference between the transaction time and now.

## 📰 Story

This project started as a vibe coding experiment because of the frustration to find nothing close online apart from the transaction-calculator on bitcoinaverage, but their website was down.

## 🌟 Features

- **Transaction Lookup:** Enter any valid Bitcoin transaction ID (TxID) to fetch its details.
- **Historical Price Calculation:** See the price of Bitcoin at the time the transaction was confirmed, not just the current price.
- **Multi-Currency Support:** Choose from 30+ world currencies (USD, EUR, GBP, JPY, INR, ZAR, and more) for price conversion.
- **Detailed Transaction Outputs:** View all transaction outputs, their value in BTC, and their equivalent fiat value at the transaction time.
- **Total Output Calculation:** Instantly see the total output value in both BTC and your selected currency.
- **Transaction Details:** Get confirmation status, transaction fee, and timestamp in a human-readable format.
- **Modern UI:** Clean, responsive, and user-friendly interface built with React and Tailwind CSS.
- **API Powered:** Uses [Mempool.space](https://mempool.space/) for transaction data and [CoinGecko](https://coingecko.com/) for historical price data.

## 🚀 How It Works

1. **Enter a Bitcoin Transaction ID:**  
   Paste one or more (up to 5) valid 64-character Bitcoin transaction·s ID into the input field.
```
e95dc5c889149ecfc81af1f079b574278b264b11d67e3920a57accfff11e8b5c
7c260b399c403678ba8cc52d0b8f41fe529e5ae9acd4997a69637bc1168d9ad8
```

2. **Select Your Currency:**  
   Choose your preferred fiat currency from the dropdown.

3. **Get Results:**  
   - The app fetches the transaction details and the historical Bitcoin price at the block confirmation time.
   - All outputs are displayed with their BTC value and fiat equivalent.
   - Additional details like transaction fee, confirmation status, and timestamp are shown.

## 🖥️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Build Tool:** Vite
- **APIs:** Mempool.space, CoinGecko

## 📦 Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/jinformatique/BitcoinTransactionPriceCalculator.git
   cd BitcoinTransactionPriceCalculator
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Run the development server:**
   ```sh
   npm run dev
   ```

4. **Open your browser:**  
   Visit [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).
   If you get a blank screen, try opening a private window or deactivate your adblock extension.

## 📄 License

This project is licensed under the [GNU GPL v3](LICENSE).

## 📋 Contributing

Any help testing, fixing bugs, implementing new features, is of course welcome.

## 💌 Donation

- Tips accepted via Lightning Network:  
    jinformatique@rizful.com  
    jinformatique@coinos.io  
- Nostr: npub1y7lu0h04p2ls4qjfc4auurdukg2fsrxppspamd53lv0efjmuhrgsklqs2u



---

_Data provided by [Mempool.space](https://mempool.space/) and [CoinGecko](https://coingecko.com/)._
