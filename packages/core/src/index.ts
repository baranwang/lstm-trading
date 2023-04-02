import ora from 'ora';
import { createLogger } from './logger';
import type { FetchDataOptions } from './processed-data';
import { getProcessedData } from './processed-data';
import { tf } from './tf';

export * from './utils';
export { tf, FetchDataOptions };
export type ProcessedData = Awaited<ReturnType<typeof getProcessedData>>;

export class Core {
  public model!: tf.LayersModel;

  public logger = createLogger(this.instId);

  public ora = ora();

  public constructor(public readonly instId: string) {}

  public getModelPath() {
    return `file://../models/${this.instId}`;
  }
  public getModelFilePath() {
    return `${this.getModelPath()}/model.json`;
  }

  public getProcessedData(options?: FetchDataOptions) {
    this.logger.info('Fetching data');
    try {
      return getProcessedData(this.instId, options);
    } catch (error) {
      this.logger.error(error, 'Error during data fetching:');
      throw error;
    }
  }
}
