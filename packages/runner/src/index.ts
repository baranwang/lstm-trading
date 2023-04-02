import { Trading } from '@lstm-trading/trading';
import { Training } from '@lstm-trading/training';
import { delay } from '@lstm-trading/core';

const trading = new Trading('BTC-USDT');
// const training = new Training('BTC-USDT');

(async () => {
  // training.train({ start: '2022-04-01' });
  // training.train();
  while (true) {
    trading.main().catch((error) => {
      console.error('Error during main:', error);
    });
    await delay(1000 * 60);
  }
})();
