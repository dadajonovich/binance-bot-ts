import path from 'path';
import { FileEditor } from './includes/FileEditor';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.join(__dirname, '..');

type Config = {
  BINANCE_API_KEY: string;
  BINANCE_SECRET_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
};

const getEnvConfig = (): Config => {
  const dataEnv = FileEditor.read(path.join(rootDir, '.env'));

  console.log(
    Object.fromEntries(dataEnv.split('\n').map((item) => item.split('='))),
  );
  return Object.fromEntries(dataEnv.split('\n').map((item) => item.split('=')));
};

export const config = getEnvConfig();

export const telegramUrl = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;

export const binanceUrl = 'https://testnet.binance.vision/api/v3';
// export const binanceUrl = 'https://api.binance.com/api/v3';

export const pairs = [
  'BTCUSDT',
  'ETHUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'SOLUSDT',
  'DOGEUSDT',
  'TRXUSDT',
  'MATICUSDT',
  'DOTUSDT',
  'SHIBUSDT',
  'LTCUSDT',
  'AVAXUSDT',
  'XLMUSDT',
  'LINKUSDT',
  'UNIUSDT',
  'ATOMUSDT',
  'HBARUSDT',
  'FILUSDT',
  'VETUSDT',
  'NEARUSDT',
  'ALGOUSDT',
  'STXUSDT',
  'EOSUSDT',
  'SANDUSDT',
  'FTMUSDT',
  'MANAUSDT',
  'NEOUSDT',
  'PEPEUSDT',
] as const;

export type Pair = (typeof pairs)[number];
