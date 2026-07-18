import type { EngineFunction, DataContext } from "../../models/types.ts";

export const sumFunction: EngineFunction = {
  name: "sum",
  minArgs: 1,
  maxArgs: 1,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    const total = series.reduce((a, b) => a + b, 0);
    return series.map(() => total);
  },
};
