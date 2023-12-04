import path from 'path';
import { FileReader } from './includes/FileReader';

type Config = {
  BINANCE_API_KEY: string;
  BINANCE_SECRET_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
};

const getEnvConfig = (): Config => {
  const dataEnv = FileReader.read(path.join(__dirname, '.env'));
  //   console.log(
  //     Object.fromEntries(dataEnv.split('\n').map((item) => item.split('='))),
  //   );
  return Object.fromEntries(dataEnv.split('\n').map((item) => item.split('=')));
};

export const config = getEnvConfig();

export const telegramUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

export const binanceUrl = 'https://api.binance.com';

export const pairs = [
  'BTCUSDT',
  'ETHUSDT',
  // 'XRPUSDT',
  // 'ADAUSDT',
  // 'SOLUSDT',
  'DOGEUSDT',
  // 'TRXUSDT',
  // 'MATICUSDT',
  // 'DOTUSDT',
  // 'SHIBUSDT',
  // 'LTCUSDT',
  // 'AVAXUSDT',
  // 'XLMUSDT',
  // 'LINKUSDT',
  // 'UNIUSDT',
  // 'XMRUSDT',
  // 'ATOMUSDT',
  // 'HBARUSDT',
  // 'FILUSDT',
  // 'VETUSDT',
  // 'NEARUSDT',
  // 'ALGOUSDT',
  // 'STXUSDT',
  // 'EOSUSDT',
  // 'SANDUSDT',
  // 'FTMUSDT',
  // 'MANAUSDT',
  // 'NEOUSDT',
  // 'PEPEUSDT',
] as const;
