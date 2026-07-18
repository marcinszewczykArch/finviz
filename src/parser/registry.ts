import type { DataParser } from "../models/types.ts";

export class DataParserRegistry {
  private parsers = new Map<string, DataParser>();

  register(format: string, parser: DataParser): void {
    this.parsers.set(format, parser);
  }

  get(format: string): DataParser | undefined {
    return this.parsers.get(format);
  }
}

export const dataParserRegistry = new DataParserRegistry();
