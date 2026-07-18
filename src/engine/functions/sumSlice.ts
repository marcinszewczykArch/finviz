import type { EngineFunction, DataContext } from "../../models/types.ts";

export const sumSliceFunction: EngineFunction = {
  name: "sumSlice",
  minArgs: 3,
  maxArgs: 3,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    const start = Math.max(0, Math.round(args[1][0] ?? 0));
    const end = Math.min(series.length - 1, Math.round(args[2][0] ?? series.length - 1));
    let sum = 0;
    for (let i = start; i <= end; i++) {
      sum += series[i] ?? 0;
    }
    return [sum];
  },
};
