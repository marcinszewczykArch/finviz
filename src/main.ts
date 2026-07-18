import "./style.css";
import { buildApp } from "./ui/app.ts";
import { PlotlyRenderer } from "./charts/plotly/PlotlyRenderer.ts";
import { chartRendererRegistry } from "./charts/registry.ts";

const renderer = new PlotlyRenderer();
chartRendererRegistry.register("plotly", renderer);

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root element #app not found");
}

buildApp(root, renderer);
