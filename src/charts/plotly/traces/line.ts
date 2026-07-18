import type { TraceFactory } from "../../../models/types.ts";

export const lineTraceFactory: TraceFactory = {
  type: "line",
  create(layer, x, y, hovertext, displayText) {
    return {
      type: "scatter",
      mode: displayText ? "text+lines+markers" : "lines+markers",
      x,
      y,
      name: layer.title ?? layer.y,
      line: { width: 2 },
      marker: { size: 5 },
      text: displayText,
      textposition: "top center",
      textfont: { size: 10 },
      hovertext,
      hovertemplate: hovertext ? "%{x|%m/%y}: %{y}<br>%{hovertext}<extra></extra>" : undefined,
    };
  },
};
