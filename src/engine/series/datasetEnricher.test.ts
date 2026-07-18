import { describe, it, expect } from "vitest";
import { DatasetEnricher } from "./datasetEnricher.ts";
import type { ParsedData } from "../../models/types.ts";

describe("DatasetEnricher", () => {
  const enricher = new DatasetEnricher();

  it("injects computed values into records", () => {
    const data: ParsedData = {
      records: [
        { date: "2024-01", cash: 10, etf: 20 },
        { date: "2024-02", cash: 15, etf: 25 },
      ],
      seriesNames: ["cash", "etf"],
    };
    const computed = new Map([
      ["portfolio", [30, 40]],
    ]);

    const result = enricher.enrich(data, computed);

    expect(result.records[0].portfolio).toBe(30);
    expect(result.records[1].portfolio).toBe(40);
  });

  it("adds computed names to seriesNames", () => {
    const data: ParsedData = {
      records: [{ date: "2024-01", cash: 10 }],
      seriesNames: ["cash"],
    };
    const computed = new Map([
      ["portfolio", [10]],
    ]);

    const result = enricher.enrich(data, computed);

    expect(result.seriesNames).toContain("cash");
    expect(result.seriesNames).toContain("portfolio");
  });

  it("does not mutate original data", () => {
    const data: ParsedData = {
      records: [{ date: "2024-01", cash: 10 }],
      seriesNames: ["cash"],
    };
    const computed = new Map([
      ["portfolio", [10]],
    ]);

    enricher.enrich(data, computed);

    expect(data.records[0]).not.toHaveProperty("portfolio");
    expect(data.seriesNames).not.toContain("portfolio");
  });

  it("preserves existing fields", () => {
    const data: ParsedData = {
      records: [
        { date: "2024-01", cash: 10, note: "test" },
      ],
      seriesNames: ["cash"],
    };
    const computed = new Map([
      ["portfolio", [10]],
    ]);

    const result = enricher.enrich(data, computed);

    expect(result.records[0].cash).toBe(10);
    expect(result.records[0].note).toBe("test");
  });

  it("returns original data when computed is empty", () => {
    const data: ParsedData = {
      records: [{ date: "2024-01", cash: 10 }],
      seriesNames: ["cash"],
    };
    const computed = new Map<string, number[]>();

    const result = enricher.enrich(data, computed);

    expect(result).toBe(data);
  });

  it("enriches multiple computed series", () => {
    const data: ParsedData = {
      records: [
        { date: "2024-01", cash: 10, etf: 20, bonds: 30 },
      ],
      seriesNames: ["bonds", "cash", "etf"],
    };
    const computed = new Map([
      ["liquid", [30]],
      ["total", [60]],
    ]);

    const result = enricher.enrich(data, computed);

    expect(result.records[0].liquid).toBe(30);
    expect(result.records[0].total).toBe(60);
    expect(result.seriesNames).toEqual(["bonds", "cash", "etf", "liquid", "total"]);
  });
});
