export const chunks = <T>(array: T[], size: number) =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, (i + 1) * size));

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
