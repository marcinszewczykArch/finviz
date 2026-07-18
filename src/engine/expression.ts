import { Parser } from "expr-eval";
import type { AggregatedResult, DataContext } from "../models/types.ts";
import { functionRegistry } from "./functions/registry.ts";
import { aggregatedFunctionRegistry } from "./functions/aggregateRegistry.ts";

export class ExpressionEvaluator {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();

    for (const [name, fn] of functionRegistry.getAll()) {
      this.parser.functions[name] = (...args: unknown[]): number => {
        const resolvedArgs = args.map((arg) => {
          if (Array.isArray(arg)) return arg as number[];
          return [arg as number];
        });
        while (resolvedArgs.length < fn.minArgs) {
          resolvedArgs.push([0]);
        }
        const result = fn.evaluate(resolvedArgs as number[][], {} as DataContext);
        return result[0] ?? 0;
      };
    }
  }

  resolveExpression(expression: string, data: DataContext): number[] {
    const seriesMap = new Map<string, number[]>();

    for (const name of data.seriesNames) {
      seriesMap.set(
        name,
        data.records.map((r) => (typeof r[name] === "number" ? (r[name] as number) : 0))
      );
    }

    const hasCustomFunction = this.detectCustomFunction(expression);

    if (hasCustomFunction) {
      return this.evaluateWithCustomFunctions(expression, seriesMap, data);
    }

    return this.evaluateExpression逐点(expression, seriesMap);
  }

  resolveAggregated(expression: string, data: DataContext): AggregatedResult | null {
    const fnMatch = expression.match(/^(\w+)\((\w+),\s*(\d+)\)$/);
    if (!fnMatch) return null;

    const [, fnName, seriesName, periodStr] = fnMatch;
    const fn = aggregatedFunctionRegistry.get(fnName);
    if (!fn) return null;

    const series = data.records.map((r) =>
      typeof r[seriesName] === "number" ? (r[seriesName] as number) : 0
    );
    const period = parseInt(periodStr, 10);

    return fn.evaluate([series, [period]], data);
  }

  private detectCustomFunction(expr: string): boolean {
    const customFnNames = ["delta", "rollingMean", "rollingSum", "trend", "forecast", "sumSlice", "meanSlice"];
    return customFnNames.some((name) => expr.includes(`${name}(`));
  }

  private evaluateWithCustomFunctions(
    expression: string,
    seriesMap: Map<string, number[]>,
    data: DataContext
  ): number[] {
    const customFnNames = ["delta", "rollingMean", "rollingSum", "trend", "forecast", "sumSlice", "meanSlice"];
    const fnPattern = new RegExp(
      `\\b(${customFnNames.join("|")})\\(\\s*(\\w+)\\s*(?:,\\s*(\\d+))?(?:,\\s*(\\d+))?\\s*\\)`,
      "g"
    );

    const expandedMap = new Map(seriesMap);
    let modifiedExpr = expression;
    let counter = 0;

    let match: RegExpExecArray | null;
    while ((match = fnPattern.exec(expression)) !== null) {
      const [fullMatch, fnName, seriesName, arg1Str, arg2Str] = match;
      const series = expandedMap.get(seriesName);
      if (!series) continue;

      const fn = functionRegistry.get(fnName);
      if (!fn) continue;

      const args: number[][] = [series];
      if (arg1Str) args.push([parseInt(arg1Str, 10)]);
      if (arg2Str) args.push([parseInt(arg2Str, 10)]);

      const resolved = fn.evaluate(args, data);
      const tempName = `__fn_${counter++}`;
      expandedMap.set(tempName, resolved);
      modifiedExpr = modifiedExpr.replaceAll(fullMatch, tempName);
    }

    if (counter === 0) {
      return this.evaluateExpression逐点(expression, seriesMap);
    }

    return this.evaluateExpression逐点(modifiedExpr, expandedMap);
  }

  private evaluateExpression逐点(expression: string, seriesMap: Map<string, number[]>): number[] {
    const length = this.getSeriesLength(seriesMap);
    const result: number[] = [];

    for (let i = 0; i < length; i++) {
      const scope: Record<string, number> = {};
      for (const [name, values] of seriesMap) {
        scope[name] = values[i] ?? 0;
      }
      try {
        result.push(this.parser.evaluate(expression, scope));
      } catch {
        result.push(0);
      }
    }

    return result;
  }

  private getSeriesLength(seriesMap: Map<string, number[]>): number {
    for (const values of seriesMap.values()) {
      return values.length;
    }
    return 0;
  }
}
