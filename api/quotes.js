// Market ticker data for the home page.
// Reads delayed quotes from Yahoo Finance's public chart endpoint (unofficial, no key,
// no SLA) and returns a small JSON list. The page falls back to "unavailable" if this fails.

const SYMBOLS = [
  { label: 'SENSEX', symbol: '^BSESN', rupee: false },
  { label: 'NIFTY 50', symbol: '^NSEI', rupee: false },
  { label: 'RELIANCE', symbol: 'RELIANCE.NS', rupee: true },
  { label: 'TCS', symbol: 'TCS.NS', rupee: true },
  { label: 'HDFC BANK', symbol: 'HDFCBANK.NS', rupee: true },
  { label: 'INFOSYS', symbol: 'INFY.NS', rupee: true },
  { label: 'WIPRO', symbol: 'WIPRO.NS', rupee: true },
  { label: 'BAJFINANCE', symbol: 'BAJFINANCE.NS', rupee: true },
];

async function quote({ label, symbol, rupee }) {
  const url =
    'https://query1.finance.yahoo.com/v8/finance/chart/' +
    encodeURIComponent(symbol) +
    '?interval=1d&range=5d';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(symbol + ' ' + res.status);
  const result = (await res.json()).chart.result[0];
  const price = result.meta.regularMarketPrice;
  const closes = (result.indicators.quote[0].close || []).filter((c) => c != null);
  // Last entry is the latest session (today's, or the last close); the one before is the previous close.
  const prev = closes.length >= 2 ? closes[closes.length - 2] : null;
  if (typeof price !== 'number' || !prev) throw new Error(symbol + ' no data');
  return {
    label,
    rupee,
    price,
    change: ((price - prev) / prev) * 100,
    time: result.meta.regularMarketTime,
  };
}

module.exports = async (req, res) => {
  const settled = await Promise.allSettled(SYMBOLS.map(quote));
  const quotes = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
  if (quotes.length === 0) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'quotes unavailable' });
    return;
  }
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).json({ quotes });
};
