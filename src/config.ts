import 'dotenv/config';

type Config = {
  BINANCE_API_KEY: string;
  BINANCE_SECRET_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
};

export const config: Config = {
  BINANCE_API_KEY: process.env.BINANCE_API_KEY!,
  BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY!,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
};

export const telegramUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

export const binanceUrl = 'https://testnet.binance.vision/api/v3';
// export const binanceUrl = 'https://api.binance.com/api/v3';

export const assets = [
  'BTC',
  'ETH',
  'XRP',
  'ADA',
  'SOL',
  'DOGE',
  'TRX',
  'MATIC',
  'DOT',
  'SHIB',
  'LTC',
  'AVAX',
  'XLM',
  'LINK',
  'UNI',
  'ATOM',
  'HBAR',
  'FIL',
  'VET',
  'NEAR',
  'ALGO',
  'STX',
  'EOS',
  'SAND',
  'FTM',
  'MANA',
  'NEO',
  'PEPE',
] as const;

export const pairs = assets.map((asset) => `${asset}USDT` as const);

export type Asset = (typeof assets)[number];
export type Pair = (typeof pairs)[number];
export type AssetOrUSDT = Asset | 'USDT';
