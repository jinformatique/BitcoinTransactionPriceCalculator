import React, { useState } from 'react';
import { Bitcoin, Search, Clock, Euro, AlertCircle, Loader2, TrendingUp, Globe } from 'lucide-react';

interface TransactionData {
  txid: string;
  status: {
    confirmed: boolean;
    block_time: number;
  };
  fee: number;
  vsize: number;
  vout: Array<{
    scriptpubkey_address?: string;
    value: number;
  }>;
}

interface PriceData {
  market_data: {
    current_price: {
      [key: string]: number;
    };
  };
}

interface CurrentPriceData {
  bitcoin: {
    [key: string]: number;
  };
}

const CURRENCIES = [
  { code: 'chf', name: 'CHF - Swiss Franc', symbol: 'CHF' },
  { code: 'eur', name: 'EUR - Euro', symbol: '€' },
  { code: 'gbp', name: 'GBP - British Pound', symbol: '£' },
  { code: 'usd', name: 'USD - US Dollar', symbol: '$' },
  { code: 'aed', name: 'AED - UAE Dirham', symbol: 'د.إ' },
  { code: 'aud', name: 'AUD - Australian Dollar', symbol: 'A$' },
  { code: 'brl', name: 'BRL - Brazilian Real', symbol: 'R$' },
  { code: 'cad', name: 'CAD - Canadian Dollar', symbol: 'C$' },
  { code: 'cny', name: 'CNY - Chinese Yuan', symbol: '¥' },
  { code: 'czk', name: 'CZK - Czech Koruna', symbol: 'Kč' },
  { code: 'dkk', name: 'DKK - Danish Krone', symbol: 'kr' },
  { code: 'hkd', name: 'HKD - Hong Kong Dollar', symbol: 'HK$' },
  { code: 'huf', name: 'HUF - Hungarian Forint', symbol: 'Ft' },
  { code: 'idr', name: 'IDR - Indonesian Rupiah', symbol: 'Rp' },
  { code: 'ils', name: 'ILS - Israeli Shekel', symbol: '₪' },
  { code: 'inr', name: 'INR - Indian Rupee', symbol: '₹' },
  { code: 'jpy', name: 'JPY - Japanese Yen', symbol: '¥' },
  { code: 'krw', name: 'KRW - South Korean Won', symbol: '₩' },
  { code: 'mxn', name: 'MXN - Mexican Peso', symbol: '$' },
  { code: 'myr', name: 'MYR - Malaysian Ringgit', symbol: 'RM' },
  { code: 'mur', name: 'MUR - Mauritius Rupee', symbol: '₨' },
  { code: 'nok', name: 'NOK - Norwegian Krone', symbol: 'kr' },
  { code: 'nzd', name: 'NZD - New Zealand Dollar', symbol: 'NZ$' },
  { code: 'php', name: 'PHP - Philippine Peso', symbol: '₱' },
  { code: 'pln', name: 'PLN - Polish Złoty', symbol: 'zł' },
  { code: 'rub', name: 'RUB - Russian Ruble', symbol: '₽' },
  { code: 'sar', name: 'SAR - Saudi Riyal', symbol: 'ر.س' },
  { code: 'sek', name: 'SEK - Swedish Krona', symbol: 'kr' },
  { code: 'sgd', name: 'SGD - Singapore Dollar', symbol: 'S$' },
  { code: 'thb', name: 'THB - Thai Baht', symbol: '฿' },
  { code: 'try', name: 'TRY - Turkish Lira', symbol: '₺' },
  { code: 'zar', name: 'ZAR - South African Rand', symbol: 'R' }
];

function App() {
  const [txHashes, setTxHashes] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('eur');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Array<{
    txHash: string;
    timestamp: number;
    price: number;
    currentPrice: number;
    txData: TransactionData;
    currency: string;
    error?: string;
  }>>([]);

  const validateTxHash = (hash: string): boolean => {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  };

  const fetchTransactionData = async (hash: string): Promise<TransactionData> => {
    const response = await fetch(`https://mempool.space/api/tx/${hash}`);
    if (!response.ok) {
      throw new Error('Transaction not found or invalid hash');
    }
    return response.json();
  };

  const fetchBitcoinPrice = async (timestamp: number, currency: string): Promise<number> => {
    // Try CryptoCompare first (free, no API key required)
    try {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/pricehistorical?fsym=BTC&tsyms=${currency.toUpperCase()}&ts=${timestamp}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`CryptoCompare API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.BTC && data.BTC[currency.toUpperCase()]) {
        return data.BTC[currency.toUpperCase()];
      }
      
      throw new Error('No price data in CryptoCompare response');
    } catch (error) {
      console.error('CryptoCompare API failed:', error);
      
      // Fallback to CoinGecko (free tier, no API key)
      return await fetchBitcoinPriceFromCoinGecko(timestamp, currency);
    }
  };

  const fetchBitcoinPriceFromCoinGecko = async (timestamp: number, currency: string): Promise<number> => {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`; // Format: DD-MM-YYYY
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateStr}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`CoinGecko API access denied (401). This may be due to rate limiting. Please wait a moment and try again with fewer transactions.`);
        } else if (response.status === 429) {
          throw new Error(`CoinGecko rate limit exceeded (429). Please wait a moment before trying again.`);
        } else {
          throw new Error(`Failed to fetch price data from CoinGecko: ${response.status} ${response.statusText}`);
        }
      }
      
      const data: PriceData = await response.json();
      
      if (!data.market_data?.current_price?.[currency]) {
        throw new Error(`Price data not available for ${currency.toUpperCase()} on this date from CoinGecko. Try using USD, EUR, or other major currencies.`);
      }
      
      return data.market_data.current_price[currency];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch price data from CoinGecko');
    }
  };


  const fetchCurrentBitcoinPrice = async (currency: string): Promise<number> => {
    // Try CryptoCompare first (free, no API key required)
    try {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=${currency.toUpperCase()}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`CryptoCompare API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data[currency.toUpperCase()]) {
        return data[currency.toUpperCase()];
      }
      
      throw new Error('No price data in CryptoCompare response');
    } catch (error) {
      console.error('CryptoCompare API failed for current price:', error);
      
      // Fallback to CoinGecko
      return await fetchCurrentBitcoinPriceFromCoinGecko(currency);
    }
  };

  const fetchCurrentBitcoinPriceFromCoinGecko = async (currency: string): Promise<number> => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`CoinGecko API access denied (401). This may be due to rate limiting. Please wait a moment and try again.`);
        } else if (response.status === 429) {
          throw new Error(`CoinGecko rate limit exceeded (429). Please wait a moment before trying again.`);
        } else {
          throw new Error(`Failed to fetch current price from CoinGecko: ${response.status} ${response.statusText}`);
        }
      }
      
      const data: CurrentPriceData = await response.json();
      
      if (!data.bitcoin?.[currency]) {
        throw new Error(`Current price not available for ${currency.toUpperCase()} from CoinGecko`);
      }
      
      return data.bitcoin[currency];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch current price from CoinGecko');
    }
  };

  const handleSearch = async () => {
    const hashList = txHashes.trim().split(/\s+/).filter(hash => hash.trim() && hash.length === 64);
    
    if (hashList.length === 0) {
      setError('Please enter at least one transaction ID (TxID)');
      return;
    }


    // Validate all hashes
    const invalidHashes = hashList.filter(hash => !validateTxHash(hash.trim()));
    if (invalidHashes.length > 0) {
      setError(`Invalid transaction ID format: ${invalidHashes[0].trim()}`);
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    const processedResults: Array<{
      txHash: string;
      timestamp: number;
      price: number;
      currentPrice: number;
      txData: TransactionData;
      currency: string;
      error?: string;
    }> = [];

    // Get current price once for all transactions
    let currentPrice: number;
    try {
      currentPrice = await fetchCurrentBitcoinPrice(selectedCurrency);
    } catch (err) {
      setError(`Failed to fetch current Bitcoin price: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
      return;
    }

    // Process each transaction
    for (let i = 0; i < hashList.length; i++) {
      const hash = hashList[i];
      const trimmedHash = hash.trim();
      
      // Add delay between transactions (except for the first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      try {
        const txData = await fetchTransactionData(trimmedHash);
        
        if (!txData.status.confirmed) {
          processedResults.push({
            txHash: trimmedHash,
            timestamp: 0,
            price: 0,
            currentPrice,
            txData,
            currency: selectedCurrency,
            error: 'Transaction is not yet confirmed'
          });
          continue;
        }

        // Add delay before price fetch
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const price = await fetchBitcoinPrice(txData.status.block_time, selectedCurrency);
        
        processedResults.push({
          txHash: trimmedHash,
          timestamp: txData.status.block_time,
          price,
          currentPrice,
          txData,
          currency: selectedCurrency
        });
      } catch (err) {
        processedResults.push({
          txHash: trimmedHash,
          timestamp: 0,
          price: 0,
          currentPrice,
          txData: {} as TransactionData,
          currency: selectedCurrency,
          error: err instanceof Error ? err.message : 'An error occurred'
        });
      }
    }

    setResults(processedResults);
    setLoading(false);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('en-EU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatPrice = (price: number, currencyCode: string): string => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    
    // For currencies with symbols, use the symbol
    if (currency?.symbol && !['$', '¥', 'kr'].includes(currency.symbol)) {
      return `${currency.symbol}${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price)}`;
    }
    
    // For standard currencies, use Intl formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const calculatePercentageChange = (oldPrice: number, newPrice: number): number => {
    return ((newPrice - oldPrice) / oldPrice) * 100;
  };

  const formatPercentageChange = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-3 rounded-full shadow-lg">
              <Bitcoin className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Bitcoin Transaction Price Calculator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter a Bitcoin transaction ID to discover the price in your preferred currency at the time of the transaction
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="txHash" className="block text-sm font-semibold text-gray-700 mb-3">
                  Transaction ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="txHash"
                    value={txHashes}
                    onChange={(e) => setTxHashes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Enter Bitcoin transaction IDs, one per line (max 5)&#10;Example:&#10;abc123...def456&#10;789ghi...jkl012"
                    placeholder="Enter Bitcoin transaction IDs, one per line&#10;Example:&#10;abc123...def456&#10;789ghi...jkl012"
                    className="w-full px-4 py-4 pr-12 text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 min-h-[120px] resize-vertical whitespace-pre-wrap"
                    disabled={loading}
                    rows={6}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-3">
                  Currency
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full px-4 py-4 pr-12 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 appearance-none cursor-pointer"
                    disabled={loading}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !txHashes.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Get Transaction Price</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div key={result.txHash} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6">
                      <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                        <TrendingUp className="w-6 h-6" />
                        <span>Transaction #{index + 1} Results</span>
                      </h2>
                      <div className="text-orange-100 text-sm font-mono mt-2 break-all">
                        {result.txHash}
                      </div>
                    </div>
                    
                    {result.error ? (
                      <div className="p-8">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                            <p className="text-red-700">{result.error}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8">
                        <div className="space-y-8">
                          {/* Transaction Outputs */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                              <TrendingUp className="w-5 h-5 text-orange-500" />
                              <span>Transaction Outputs</span>
                            </h3>
                            
                            <div className="grid gap-4">
                              {result.txData.vout.map((output, outputIndex) => {
                                const btcValue = output.value / 100000000; // Convert satoshis to BTC
                                const fiatValue = btcValue * result.price;
                                const currentFiatValue = btcValue * result.currentPrice;
                                const percentageChange = calculatePercentageChange(result.price, result.currentPrice);
                                
                                return (
                                  <div key={outputIndex} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="text-sm font-medium text-gray-600">
                                        Output #{outputIndex + 1}
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-orange-600">
                                          {btcValue.toFixed(8)} BTC
                                        </div>
                                        <div className="text-sm font-semibold text-gray-700 mb-1">
                                          <span className="text-xs text-gray-500">Then: </span>
                                          {formatPrice(fiatValue, result.currency)}
                                        </div>
                                        <div className="text-sm font-semibold text-blue-600 mb-1">
                                          <span className="text-xs text-gray-500">Now: </span>
                                          {formatPrice(currentFiatValue, result.currency)}
                                        </div>
                                        <div className={`text-xs font-bold ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatPercentageChange(percentageChange)}
                                        </div>
                                      </div>
                                    </div>
                                    {output.scriptpubkey_address && (
                                      <div className="mt-2">
                                        <div className="text-xs font-medium text-gray-500 mb-1">Address</div>
                                        <div className="text-xs font-mono text-gray-700 break-all bg-white rounded px-2 py-1">
                                          {output.scriptpubkey_address}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Total Output Value */}
                            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                              <div className="flex justify-between items-start">
                                <div className="text-sm font-semibold text-gray-700">
                                  Total Output Value
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-green-600">
                                    {(result.txData.vout.reduce((sum, output) => sum + output.value, 0) / 100000000).toFixed(8)} BTC
                                  </div>
                                  <div className="text-lg font-semibold text-gray-700 mb-1">
                                    <span className="text-xs text-gray-500">Then: </span>
                                    {formatPrice(
                                      (result.txData.vout.reduce((sum, output) => sum + output.value, 0) / 100000000) * result.price,
                                      result.currency
                                    )}
                                  </div>
                                  <div className="text-lg font-semibold text-blue-600 mb-1">
                                    <span className="text-xs text-gray-500">Now: </span>
                                    {formatPrice(
                                      (result.txData.vout.reduce((sum, output) => sum + output.value, 0) / 100000000) * result.currentPrice,
                                      result.currency
                                    )}
                                  </div>
                                  <div className={`text-sm font-bold ${calculatePercentageChange(result.price, result.currentPrice) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercentageChange(calculatePercentageChange(result.price, result.currentPrice))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8">
                            {/* Transaction Info */}
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                  <Bitcoin className="w-5 h-5 text-orange-500" />
                                  <span>Transaction Details</span>
                                </h3>
                                
                                <div className="space-y-4">
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 mb-1">Transaction ID</div>
                                    <div className="text-sm font-mono text-gray-900 break-all">{result.txData.txid}</div>
                                  </div>
                                  
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-sm font-medium text-green-700">Confirmed</span>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 mb-1">Transaction Fee</div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {(result.txData.fee / 100000000).toFixed(8)} BTC
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Price Info */}
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                  <Globe className="w-5 h-5 text-orange-500" />
                                  <span>Price Information</span>
                                </h3>
                                
                                <div className="space-y-4">
                                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-100">
                                    <div className="text-sm font-medium text-gray-600 mb-2">
                                      Bitcoin Price ({CURRENCIES.find(c => c.code === result.currency)?.name})
                                    </div>
                                    <div className="text-2xl font-bold text-orange-600 mb-1">
                                      <span className="text-sm text-gray-500">Then: </span>
                                      {formatPrice(result.price, result.currency)}
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 mb-2">
                                      <span className="text-sm text-gray-500">Now: </span>
                                      {formatPrice(result.currentPrice, result.currency)}
                                    </div>
                                    <div className={`text-lg font-bold mb-1 ${calculatePercentageChange(result.price, result.currentPrice) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatPercentageChange(calculatePercentageChange(result.price, result.currentPrice))}
                                    </div>
                                    <div className="text-sm text-gray-500">at time of transaction</div>
                                  </div>
                                  
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm font-medium text-gray-500 mb-1 flex items-center space-x-2">
                                      <Clock className="w-4 h-4" />
                                      <span>Transaction Time</span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDate(result.timestamp)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary for multiple transactions */}
        {results.length > 1 && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <span>Summary ({results.length} transactions)</span>
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <div className="text-sm font-medium text-gray-600 mb-2">Total Processed</div>
                  <div className="text-3xl font-bold text-blue-600">{results.length}</div>
                  <div className="text-sm text-gray-500">transactions</div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
                  <div className="text-sm font-medium text-gray-600 mb-2">Successful</div>
                  <div className="text-3xl font-bold text-green-600">
                    {results.filter(r => !r.error).length}
                  </div>
                  <div className="text-sm text-gray-500">transactions</div>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-100">
                  <div className="text-sm font-medium text-gray-600 mb-2">Errors</div>
                  <div className="text-3xl font-bold text-red-600">
                    {results.filter(r => r.error).length}
                  </div>
                  <div className="text-sm text-gray-500">transactions</div>
                </div>
              </div>
              
              {results.filter(r => !r.error).length > 0 && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6">
                  <div className="text-sm font-medium text-orange-100 mb-2">Total Bitcoin Value (All Transactions)</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {results
                      .filter(r => !r.error)
                      .reduce((sum, r) => sum + (r.txData.vout.reduce((voutSum, output) => voutSum + output.value, 0) / 100000000), 0)
                      .toFixed(8)} BTC
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-orange-100">
                    <div>
                      <span className="text-xs">Then: </span>
                      <span className="font-semibold">
                        {formatPrice(
                          results
                            .filter(r => !r.error)
                            .reduce((sum, r) => sum + (r.txData.vout.reduce((voutSum, output) => voutSum + output.value, 0) / 100000000) * r.price, 0),
                          results[0]?.currency || 'eur'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs">Now: </span>
                      <span className="font-semibold">
                        {formatPrice(
                          results
                            .filter(r => !r.error)
                            .reduce((sum, r) => sum + (r.txData.vout.reduce((voutSum, output) => voutSum + output.value, 0) / 100000000) * r.currentPrice, 0),
                          results[0]?.currency || 'eur'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>

      {/* Footer */}
      <div className="text-center mt-12 text-gray-500 text-sm">
        <p>Data provided by <a href="https://mempool.space/" className="hover:text-orange-500">Mempool.space</a>, <a href="https://mobula.io/" className="hover:text-orange-500">Mobula</a>, and <a href="https://exchangerate-api.com/" className="hover:text-orange-500">ExchangeRate-API</a></p>
      </div>
    </div>
  );
}

export default App;