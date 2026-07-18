import { describe, it, expect } from "vitest";
import { DependencyResolver } from "./dependencyResolver.ts";

describe("DependencyResolver", () => {
  const resolver = new DependencyResolver();

  it("returns same order when no dependencies", () => {
    const defs = [
      { name: "a", expr: "cash+etf" },
      { name: "b", expr: "bonds+stocks" },
    ];
    const result = resolver.resolve(defs);
    expect(result.map((d) => d.name)).toEqual(["a", "b"]);
  });

  it("resolves A depends on B (B first)", () => {
    const defs = [
      { name: "a", expr: "b*2" },
      { name: "b", expr: "cash+etf" },
    ];
    const result = resolver.resolve(defs);
    expect(result.map((d) => d.name)).toEqual(["b", "a"]);
  });

  it("resolves long dependency chain", () => {
    const defs = [
      { name: "d", expr: "c+1" },
      { name: "b", expr: "a+1" },
      { name: "c", expr: "b+1" },
      { name: "a", expr: "cash" },
    ];
    const result = resolver.resolve(defs);
    expect(result.map((d) => d.name)).toEqual(["a", "b", "c", "d"]);
  });

  it("detects direct circular dependency", () => {
    const defs = [
      { name: "a", expr: "b" },
      { name: "b", expr: "a" },
    ];
    expect(() => resolver.resolve(defs)).toThrow("Circular dependency");
  });

  it("detects indirect circular dependency", () => {
    const defs = [
      { name: "a", expr: "b" },
      { name: "b", expr: "c" },
      { name: "c", expr: "a" },
    ];
    expect(() => resolver.resolve(defs)).toThrow("Circular dependency");
  });

  it("ignores original data fields as dependencies", () => {
    const defs = [
      { name: "portfolio", expr: "cash+etf+bonds" },
    ];
    const result = resolver.resolve(defs);
    expect(result.map((d) => d.name)).toEqual(["portfolio"]);
  });

  it("ignores function names in expressions", () => {
    const defs = [
      { name: "x", expr: "delta(cash)" },
      { name: "y", expr: "rollingMean(etf, 6)" },
    ];
    const result = resolver.resolve(defs);
    expect(result.map((d) => d.name)).toEqual(["x", "y"]);
  });

  it("handles mixed dependencies and original fields", () => {
    const defs = [
      { name: "totalDebt", expr: "abs(mortgage)+abs(carLoan)" },
      { name: "debtRatio", expr: "totalDebt/portfolio" },
      { name: "portfolio", expr: "cash+etf+bonds" },
    ];
    const result = resolver.resolve(defs);
    const order = result.map((d) => d.name);
    // portfolio and totalDebt are independent — either can come first
    // debtRatio depends on both, so it must come last
    expect(order[2]).toBe("debtRatio");
    expect(order.slice(0, 2).sort()).toEqual(["portfolio", "totalDebt"]);
  });

  it("handles complex chain with functions", () => {
    const defs = [
      { name: "d", expr: "delta(c)" },
      { name: "c", expr: "rollingMean(b, 3)" },
      { name: "b", expr: "abs(a)" },
      { name: "a", expr: "cash+etf" },
    ];
    const result = resolver.resolve(defs);
    expect(result.map((d) => d.name)).toEqual(["a", "b", "c", "d"]);
  });
});
