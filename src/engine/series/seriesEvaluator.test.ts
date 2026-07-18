import { describe, it, expect } from "vitest";
import { SeriesEvaluator } from "./seriesEvaluator.ts";
import type { DataRecord, ParsedData } from "../../models/types.ts";

function makeData(records: DataRecord[]): ParsedData {
  const seriesNamesSet = new Set<string>();
  for (const r of records) {
    for (const key of Object.keys(r)) {
      if (key !== "date" && key !== "note") {
        seriesNamesSet.add(key);
      }
    }
  }
  return {
    records,
    seriesNames: Array.from(seriesNamesSet).sort(),
  };
}

describe("SeriesEvaluator", () => {
  const evaluator = new SeriesEvaluator();

  it("evaluates simple addition", () => {
    const data = makeData([
      { date: "2024-01", cash: 10, etf: 20 },
      { date: "2024-02", cash: 15, etf: 25 },
    ]);
    const defs = [{ name: "portfolio", expr: "cash+etf" }];
    const result = evaluator.evaluate(defs, data);
    expect(result.get("portfolio")).toEqual([30, 40]);
  });

  it("evaluates expression with abs()", () => {
    const data = makeData([
      { date: "2024-01", mortgage: -200, carLoan: -50 },
      { date: "2024-02", mortgage: -190, carLoan: -45 },
    ]);
    const defs = [
      { name: "totalDebt", expr: "abs(mortgage)+abs(carLoan)" },
    ];
    const result = evaluator.evaluate(defs, data);
    expect(result.get("totalDebt")).toEqual([250, 235]);
  });

  it("evaluates series referencing another computed series", () => {
    const data = makeData([
      { date: "2024-01", cash: 10, etf: 20, bonds: 30 },
      { date: "2024-02", cash: 15, etf: 25, bonds: 35 },
    ]);
    const defs = [
      { name: "liquid", expr: "cash+etf" },
      { name: "total", expr: "liquid+bonds" },
    ];
    const result = evaluator.evaluate(defs, data);
    expect(result.get("liquid")).toEqual([30, 40]);
    expect(result.get("total")).toEqual([60, 75]);
  });

  it("evaluates expression with delta()", () => {
    const data = makeData([
      { date: "2024-01", netWorth: 100 },
      { date: "2024-02", netWorth: 120 },
      { date: "2024-03", netWorth: 115 },
    ]);
    const defs = [
      { name: "growth", expr: "delta(netWorth)" },
    ];
    const result = evaluator.evaluate(defs, data);
    expect(result.get("growth")).toEqual([0, 20, -5]);
  });

  it("evaluates compound expression with function", () => {
    const data = makeData([
      { date: "2024-01", salary: 10, netWorth: 100 },
      { date: "2024-02", salary: 12, netWorth: 120 },
      { date: "2024-03", salary: 11, netWorth: 115 },
    ]);
    const defs = [
      { name: "salaryMinusGrowth", expr: "salary-delta(netWorth)" },
    ];
    const result = evaluator.evaluate(defs, data);
    expect(result.get("salaryMinusGrowth")).toEqual([10, -8, 16]);
  });

  it("evaluates chain: a → b → c", () => {
    const data = makeData([
      { date: "2024-01", cash: 10, etf: 20 },
      { date: "2024-02", cash: 15, etf: 25 },
    ]);
    const defs = [
      { name: "a", expr: "cash+etf" },
      { name: "b", expr: "a*2" },
      { name: "c", expr: "b+100" },
    ];
    const result = evaluator.evaluate(defs, data);
    expect(result.get("a")).toEqual([30, 40]);
    expect(result.get("b")).toEqual([60, 80]);
    expect(result.get("c")).toEqual([160, 180]);
  });
});
