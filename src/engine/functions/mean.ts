import type { EngineFunction, DataContext } from "../../models/types.ts";

export const meanFunction: EngineFunction = {
  name: "mean",
  minArgs: 1,
  maxArgs: 1,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    if (series.length === 0) return [];
    const avg = series.reduce((a, b) => a + b, 0) / series.length;
    return series.map(() => avg);
  },
};
