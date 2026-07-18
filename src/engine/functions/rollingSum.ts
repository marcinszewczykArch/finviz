import type { EngineFunction, DataContext } from "../../models/types.ts";

export const rollingSumFunction: EngineFunction = {
  name: "rollingSum",
  minArgs: 2,
  maxArgs: 2,
  evaluate(args: number[][], _context: DataContext): number[] {
    const series = args[0];
    const window = Math.max(1, Math.round(args[1][0]));
    const result: number[] = [];

    for (let i = 0; i < series.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = series.slice(start, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0));
    }

    return result;
  },
};
