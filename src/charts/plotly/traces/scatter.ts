import type { TraceFactory } from "../../../models/types.ts";

export const scatterTraceFactory: TraceFactory = {
  type: "scatter",
  create(layer, x, y, text) {
    return {
      type: "scatter",
      mode: "markers",
      x,
      y,
      name: layer.title ?? layer.y,
      marker: { size: 6 },
      hovertext: text,
      hovertemplate: text ? "%{x|%m/%y}: %{y}<br>%{hovertext}<extra></extra>" : undefined,
    };
  },
};
