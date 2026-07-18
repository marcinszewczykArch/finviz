import type { AggregatedFunction, AggregatedResult, DataContext } from "../../models/types.ts";

function groupByPeriod(
  series: number[],
  periodMonths: number,
  dates: string[]
): { groups: number[][]; startDates: string[] } {
  const groups: number[][] = [];
  const startDates: string[] = [];

  for (let i = 0; i < series.length; i += periodMonths) {
    const group = series.slice(i, i + periodMonths);
    groups.push(group);
    startDates.push(dates[i] ?? "");
  }

  return { groups, startDates };
}

export const aggSumFunction: AggregatedFunction = {
  name: "aggSum",
  minArgs: 2,
  maxArgs: 2,
  evaluate(args: number[][], context: DataContext): AggregatedResult {
    const series = args[0];
    const periodMonths = Math.max(1, Math.round(args[1][0]));
    const dates = context.records.map((r) => r.date);
    const { groups, startDates } = groupByPeriod(series, periodMonths, dates);

    return {
      x: startDates,
      y: groups.map((g) => g.reduce((a, b) => a + b, 0)),
    };
  },
};

export const aggMeanFunction: AggregatedFunction = {
  name: "aggMean",
  minArgs: 2,
  maxArgs: 2,
  evaluate(args: number[][], context: DataContext): AggregatedResult {
    const series = args[0];
    const periodMonths = Math.max(1, Math.round(args[1][0]));
    const dates = context.records.map((r) => r.date);
    const { groups, startDates } = groupByPeriod(series, periodMonths, dates);

    return {
      x: startDates,
      y: groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length),
    };
  },
};
