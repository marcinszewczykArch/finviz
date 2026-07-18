export function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }

  if (den === 0) return { slope: 0, intercept: yMean };

  const slope = num / den;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

export function extrapolate(values: number[], count: number, window?: number): number[] {
  const series = window ? values.slice(-window) : values;
  const { slope } = linearRegression(series);
  const lastValue = values[values.length - 1] ?? 0;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(lastValue + slope * (i + 1));
  }
  return result;
}
