import type { TraceFactory } from "../../../models/types.ts";

export const areaTraceFactory: TraceFactory = {
  type: "area",
  create(layer, x, y, text) {
    return {
      type: "scatter",
      mode: "lines",
      x,
      y,
      name: layer.title ?? layer.y,
      fill: "tozeroy",
      line: { width: 1 },
      hovertext: text,
      hovertemplate: text ? "%{x|%m/%y}: %{y}<br>%{hovertext}<extra></extra>" : undefined,
    };
  },
};
