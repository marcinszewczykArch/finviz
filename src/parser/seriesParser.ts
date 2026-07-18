import { parse } from "smol-toml";
import type { SeriesDefinition } from "../models/types.ts";

interface TomlSeriesRaw {
  name?: string;
  expr?: string;
}

export class SeriesParser {
  parse(input: string): SeriesDefinition[] {
    const parsed = parse(input) as Record<string, unknown>;
    const seriesEntries = parsed["series"] as
      | TomlSeriesRaw
      | TomlSeriesRaw[]
      | undefined;

    if (!seriesEntries) {
      return [];
    }

    const rawSeries = Array.isArray(seriesEntries)
      ? seriesEntries
      : [seriesEntries];

    const result: SeriesDefinition[] = [];

    for (const raw of rawSeries) {
      if (!raw.name || typeof raw.name !== "string") {
        throw new Error("Each [[series]] must have a 'name' field (string)");
      }
      if (!raw.expr || typeof raw.expr !== "string") {
        throw new Error(
          `Series '${raw.name}' must have an 'expr' field (string)`,
        );
      }
      result.push({ name: raw.name, expr: raw.expr });
    }

    return result;
  }
}
