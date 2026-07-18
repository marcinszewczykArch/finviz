import type { EngineFunction, DataContext } from "../../models/types.ts";

export const pctFunction: EngineFunction = {
  name: "pct",
  minArgs: 1,
  maxArgs: 1,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    const result: number[] = [0];
    for (let i = 1; i < series.length; i++) {
      if (series[i - 1] !== 0) {
        result.push(((series[i] - series[i - 1]) / Math.abs(series[i - 1])) * 100);
      } else {
        result.push(0);
      }
    }
    return result;
  },
};
