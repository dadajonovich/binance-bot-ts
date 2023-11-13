import path from 'path';
import { FileReader } from './includes/FileReader';

const getEnvConfig = async () => {
  const dataEnv = await FileReader.read(path.join(__dirname, '.env'));
  console.log(
    Object.fromEntries(dataEnv.split('\n').map((item) => item.split('='))),
  );
};

getEnvConfig();
