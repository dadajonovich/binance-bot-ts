import path from 'path';
import { fileURLToPath } from 'url';
import { FileReader } from './includes/FileReader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Config = {
  BINANCE_API_KEY: string;
  BINANCE_SECRET_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
};

const getEnvConfig = (): Config => {
  const dataEnv = FileReader.read(path.join(__dirname, '../', '.env'));

  console.log(
    Object.fromEntries(dataEnv.split('\n').map((item) => item.split('='))),
  );
  return Object.fromEntries(dataEnv.split('\n').map((item) => item.split('=')));
};

export const config = getEnvConfig();

export const telegramUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

export const binanceUrl = 'https://testnet.binance.vision/api/v3';

export const pairs = [
  'BTCUSDT',
  'ETHUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'SOLUSDT',
  'DOGEUSDT',
  'TRXUSDT',
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
