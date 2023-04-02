import { Core, tf } from '@lstm-trading/core';

export class Trading extends Core {
  private async predictNextPrice(...args: Parameters<typeof tf.tensor3d>) {
    if (!this.model) {
      throw new Error('Model not loaded');
    }
    const predict = this.model.predict(tf.tensor3d(...args));
    if (Array.isArray(predict)) {
      return predict[0].dataSync()[0];
    }
    return predict.dataSync()[0];
  }

  public async main() {
    if (!this.model) {
      this.model = await tf.loadLayersModel(this.getModelFilePath());
    }

    // 获取实时数据并准备输入
    const processedData = await this.getProcessedData();
    if (!processedData) {
      throw new Error('No features');
    }
    const { features, maxPrice, minPrice } = processedData;

    // 使用最后一个窗口进行预测
    const lastFeature = features.slice(-1);

    // 预测下一个价格
    const prediction = await this.predictNextPrice(lastFeature);

    // 将预测的价格转换为实际价格
    const actualPrediction = prediction * (maxPrice - minPrice) + minPrice;

    this.logger.info(`Prediction: ${actualPrediction}`);
  }
}
