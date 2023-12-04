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
