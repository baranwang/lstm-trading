import type { FetchDataOptions, ProcessedData } from '@lstm-trading/core';
import { Core, tf } from '@lstm-trading/core';

const SPLIT_RATIO = 0.8;

export class Training extends Core {
  public async train(options?: FetchDataOptions) {
    try {
      const processedData = await this.getProcessedData(options);

      const { X_train, y_train, X_val, y_val } = this.splitData(processedData);

      const inputShape = [X_train.shape[1], X_train.shape[2]];
      this.model = await this.loadOrCreateModel(inputShape);

      const epochs = 100;
      await this.trainModel(X_train, y_train, X_val, y_val, epochs);

      await this.model.save(this.getModelPath());
      this.logger.info('Model saved');
    } catch (error) {
      this.logger.error(error, 'Error during data fetching or model training:');
    }
  }

  private createModel(inputShape: number[]) {
    const model = tf.sequential();

    model.add(
      tf.layers.lstm({
        units: 50,
        inputShape,
        returnSequences: true,
      })
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.lstm({ units: 50 }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

    return model;
  }

  private async loadOrCreateModel(inputShape: number[]) {
    try {
      this.logger.info('Loading existing model');
      return await tf.loadLayersModel(this.getModelFilePath());
    } catch (error) {
      this.logger.info('No existing model found, creating new one');
      return this.createModel(inputShape);
    }
  }

  private async trainModel(X_train: tf.Tensor, y_train: tf.Tensor, X_val: tf.Tensor, y_val: tf.Tensor, epochs: number) {
    this.model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    await this.model.fit(X_train, y_train, {
      batchSize: 32,
      epochs,
      validationData: [X_val, y_val],
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.ora.text = `Training model, epoch ${epoch}%, loss: ${logs?.loss}, val_loss: ${logs?.val_loss}`;
        },
        onTrainBegin: () => {
          this.ora.start('Training model');
        },
        onTrainEnd: () => {
          this.ora.stopAndPersist({ symbol: '🚀', text: 'Training completed' });
        },
      },
    });
  }

  private splitData(processedData: ProcessedData) {
    if (!processedData) {
      throw new Error('No data to split');
    }
    const { features, labels } = processedData;

    if (!features?.length || !labels?.length) {
      throw new Error('No data to split');
    }

    const splitIndex = Math.floor(features.length * SPLIT_RATIO);

    const X_train = tf.tensor3d(features.slice(0, splitIndex));
    const y_train = tf.tensor1d(labels.slice(0, splitIndex));

    const X_val = tf.tensor3d(features.slice(splitIndex));
    const y_val = tf.tensor1d(labels.slice(splitIndex));

    return { X_train, y_train, X_val, y_val };
  }
}
