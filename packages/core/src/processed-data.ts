import dayjs from 'dayjs';
import ora from 'ora';
import { chunks, delay } from './utils';

const MAX_MINUTES = 300;
const QPS = 10;

const SMA_PERIOD = 10;
const WINDOW_SIZE = 50;

export interface FetchDataOptions {
  start?: dayjs.ConfigType;
  end?: dayjs.ConfigType;
}

type Kline = [string, string, string, string, string, string, string, string, string];

async function fetchData(instId: string, { start, end }: FetchDataOptions = {}) {
  const spinner = ora('Fetching data').start();

  const buildURL = (before?: number) => {
    const url = new URL('/api/v5/market/candles', 'https://www.okx.com/');
    url.searchParams.append('instId', instId);
    url.searchParams.append('bar', '1m');
    url.searchParams.append('limit', '300');
    if (before) {
      url.searchParams.append('before', before.toString());
    }
    return url;
  };

  const request = async (url: URL) => {
    spinner.text = `Fetching data from ${url}`;
    const response = await fetch(url).then((res) => res.json());
    if (response.code !== '0') {
      throw new Error(response.msg);
    }
    return response.data as Kline[];
  };

  if (!start && !end) {
    spinner.succeed('Data fetched');
    return request(buildURL());
  }

  const generateTimestampArray = (start: dayjs.Dayjs, end: dayjs.Dayjs) => {
    const timestamps = [undefined, start.valueOf()];
    let current = start;

    while (current.isBefore(end)) {
      current = current.add(MAX_MINUTES, 'minute');
      timestamps.push(current.valueOf());
    }

    return timestamps;
  };

  const mergeResults = (results: Kline[][]) => {
    return results
      .flat(1)
      .filter(Boolean)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  };

  start ??= dayjs().subtract(MAX_MINUTES, 'minute');
  end ??= dayjs();
  const startDayjs = dayjs(start);
  const endDayjs = dayjs(end);
  const timestamps = generateTimestampArray(startDayjs, endDayjs);

  const results: Kline[][] = [];
  for (const chunk of chunks(timestamps, QPS)) {
    const [, ...res] = await Promise.all([delay(1000), ...chunk.map((timestamp) => request(buildURL(timestamp)))]);
    results.push(...res);
  }

  const mergedResult = mergeResults(results);
  spinner.succeed('Data fetched');
  return mergedResult;
}

function prepareData(rawData: Kline[]) {
  const closePrices = rawData.map((candle) => parseFloat(candle[4]));

  const sma: number[] = [];
  for (let i = 0; i < closePrices.length - SMA_PERIOD + 1; i++) {
    const avg = closePrices.slice(i, i + SMA_PERIOD).reduce((a, b) => a + b) / SMA_PERIOD;
    sma.push(avg);
  }

  const {
    scaledArray: normalizedClosePrices,
    min: minPrice,
    max: maxPrice,
  } = normalize(closePrices.slice(SMA_PERIOD - 1));
  const { scaledArray: normalizedSMA } = normalize(sma);

  const features: number[][][] = [];
  const labels: number[] = [];

  for (let i = 0; i < normalizedClosePrices.length - WINDOW_SIZE; i++) {
    features.push([normalizedClosePrices.slice(i, i + WINDOW_SIZE), normalizedSMA.slice(i, i + WINDOW_SIZE)]);
    labels.push(normalizedClosePrices[i + WINDOW_SIZE]);
  }

  return { features, labels, minPrice, maxPrice };
}

function normalize(data: number[]) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const scaledArray = data.map((value) => (value - min) / (max - min));
  return { scaledArray, min, max };
}

export async function getProcessedData(instId: string, options?: FetchDataOptions) {
  const rawData = await fetchData(instId, options);
  return prepareData(rawData);
}
