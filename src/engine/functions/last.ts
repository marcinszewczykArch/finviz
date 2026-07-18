import type { EngineFunction, DataContext } from "../../models/types.ts";

export const lastFunction: EngineFunction = {
  name: "last",
  minArgs: 1,
  maxArgs: 1,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    if (series.length === 0) return [];
    const lastVal = series[series.length - 1];
    return series.map(() => lastVal);
  },
};
