import { TelegramCycle } from './entities/Telegram/TelegramCycle';
import { connect } from './db/sequelize';

const cycle = new TelegramCycle();

cycle.start();

const run = async () => {
  await connect();
};

run();
