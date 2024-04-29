import { TelegramCycle } from './entities/Telegram/TelegramCycle';
import { connect } from './db/sequelize';

const cycle = new TelegramCycle();

cycle.start();

const run = async () => {
  await connect();

  // Написать покупку ордера и обработать ошибку cancelOrder
  // await OperationService.sell('BNBUSDT', 0.9);
  //   console.log(await BinanceRepository.cancelOrder('BTCUSDT', 4276536));
};

run();
