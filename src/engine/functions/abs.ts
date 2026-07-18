import type { EngineFunction, DataContext } from "../../models/types.ts";

export const absFunction: EngineFunction = {
  name: "abs",
  minArgs: 1,
  maxArgs: 1,
  evaluate(args: number[][], _context: DataContext): number[] {
    return args[0].map((v) => Math.abs(v));
  },
};
