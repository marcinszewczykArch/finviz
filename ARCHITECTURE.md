# FinViz — Architecture & Technical Documentation

## 1. Overview

FinViz is a browser-only SPA data visualization engine. Users paste TOML data + TOML chart definitions into textareas, and a dashboard of interactive charts is rendered via Plotly.js. No backend, no database, no login — everything runs in the browser and resets on page refresh.

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Language | TypeScript | ~6.0.2 | Strict mode, ES2023 target |
| Bundler | Vite | 5.4.21 | Dev server + production build |
| Charting | plotly.js-dist-min | 3.7.0 | Interactive chart rendering |
| Math engine | expr-eval | 2.0.2 | Expression parsing/evaluation |
| TOML parser | smol-toml | 1.7.0 | TOML → JS objects |
| Date library | luxon | 3.7.2 | Declared but currently unused |
| Framework | None | — | Vanilla DOM manipulation |

## 3. Project Structure

```
finviz/
├── data/
│   ├── example.toml              # Sample financial data (26 months)
│   └── example-charts.toml       # Sample chart definitions (14 charts)
├── public/
│   ├── favicon.svg               # App icon
│   └── icons.svg                 # SVG sprite sheet
├── src/
│   ├── main.ts                   # Entry point — bootstraps the app
│   ├── plotly.d.ts               # Ambient type declarations for plotly.js-dist-min
│   ├── style.css                 # Global styles (responsive grid, light theme)
│   │
│   ├── models/
│   │   └── types.ts              # All interfaces (DataRecord, ChartDefinition, etc.)
│   │
│   ├── parser/
│   │   ├── dataParser.ts         # TOML → ParsedData
│   │   ├── chartParser.ts        # TOML → ParsedCharts
│   │   └── registry.ts           # DataParserRegistry (extensible to YAML/JSON)
│   │
│   ├── engine/
│   │   ├── engine.ts             # DataEngine facade
│   │   ├── expression.ts         # ExpressionEvaluator (expr-eval + custom functions)
│   │   └── functions/
│   │       ├── registry.ts       # FunctionRegistry (12 built-in functions)
│   │       ├── aggregateRegistry.ts  # AggregatedFunctionRegistry (2 functions)
│   │       ├── delta.ts          # delta(series)
│   │       ├── rollingMean.ts    # rollingMean(series, window)
│   │       ├── rollingSum.ts     # rollingSum(series, window)
│   │       ├── abs.ts            # abs(series)
│   │       ├── pct.ts            # pct(series)
│   │       ├── trend.ts          # trend(series)
│   │       ├── forecast.ts       # forecast(series, periods)
│   │       ├── mean.ts           # mean(series)
│   │       ├── sum.ts            # sum(series)
│   │       ├── last.ts           # last(series)
│   │       ├── sumSlice.ts       # sumSlice(series, start, end)
│   │       ├── meanSlice.ts      # meanSlice(series, start, end)
│   │       └── aggregate.ts      # aggSum, aggMean
│   │
│   ├── charts/
│   │   ├── registry.ts           # ChartRendererRegistry (swappable renderers)
│   │   └── plotly/
│   │       ├── PlotlyRenderer.ts # Core rendering class
│   │       └── traces/
│   │           ├── registry.ts   # TraceRegistry (6 trace types)
│   │           ├── line.ts       # line → scatter (lines+markers)
│   │           ├── bar.ts        # bar → bar
│   │           ├── scatter.ts    # scatter → scatter (markers)
│   │           ├── area.ts       # area → scatter (filled)
│   │           ├── trend.ts      # trend → scatter (dashed)
│   │           └── forecast.ts   # forecast → scatter (dotted)
│   │
│   ├── ui/
│   │   ├── app.ts                # Main orchestrator (UI layout, event handlers)
│   │   ├── dashboard.ts          # Dashboard container (grid of chart cards)
│   │   └── textarea.ts           # Textarea/button UI components
│   │
│   └── utils/
│       ├── dom.ts                # el() helper, clearElement()
│       └── math.ts               # linearRegression(), extrapolate()
│
├── dist/                         # Production build output
├── index.html                    # SPA entry point
├── package.json
├── tsconfig.json
├── README.md                     # User-facing documentation
└── ARCHITECTURE.md               # This file
```

## 4. Data Flow

```
┌─────────────────────────────────────────────────────┐
│  User Input (TOML strings from textareas)           │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐     ┌──────────────────┐
│  TomlDataParser  │     │   ChartParser    │
│  dataParser.ts   │     │  chartParser.ts  │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
   ParsedData              ParsedCharts
   {records[],             {charts[]}
    seriesNames[]}               │
         │                       │
         ▼                       │
┌──────────────────┐             │
│   SeriesParser   │             │
│ seriesParser.ts  │             │
└────────┬─────────┘             │
         │                       │
         ▼                       │
  SeriesDefinition[]             │
         │                       │
         ▼                       │
┌──────────────────┐             │
│ DependencyResolver│            │
└────────┬─────────┘             │
         │                       │
         ▼                       │
┌──────────────────┐             │
│ SeriesEvaluator  │             │
└────────┬─────────┘             │
         │                       │
         ▼                       │
┌──────────────────┐             │
│ DatasetEnricher  │             │
└────────┬─────────┘             │
         │                       │
         ▼                       │
   Enriched ParsedData           │
   (original + computed          │
    series as fields)            │
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌────────────────┐
            │   DataEngine   │  (facade)
            │   engine.ts    │
            └───────┬────────┘
                    │
                    ▼
            ┌────────────────┐     ┌──────────────────┐
            │   Expression   │────▶│  FunctionRegistry │
            │   Evaluator    │     │  (12 functions)   │
            │ expression.ts  │     └──────────────────┘
            └───────┬────────┘
                    │
                    ▼
            number[] per layer
                    │
                    ▼
          ┌──────────────────┐     ┌──────────────────┐
          │  PlotlyRenderer  │────▶│  TraceRegistry   │
          │  PlotlyRenderer  │     │  (6 trace types) │
          └────────┬─────────┘     └──────────────────┘
                   │
                   ▼
          Plotly.newPlot(container, traces, layout)
                   │
                   ▼
          ┌──────────────────┐
       │  Rendered Charts │
       │  (interactive)   │
       └──────────────────┘
```

## 5. Core Interfaces

All defined in `src/models/types.ts`:

### Data Layer

```typescript
interface DataRecord {
  date: string;
  [key: string]: string | number | string[];  // numeric series, notes, etc.
}

interface ParsedData {
  records: DataRecord[];
  seriesNames: string[];
}

interface SeriesDefinition {
  name: string;
  expr: string;
}
```

### Chart Definition Layer

```typescript
interface LayerDefinition {
  type: string;       // "line" | "bar" | "scatter" | "area" | "trend" | "forecast"
  y: string;          // formula or series name
  source?: string;    // for trend/forecast: which series to base on
  by?: string;        // for forecast: number of periods to extrapolate
  title?: string;     // legend label
}

interface ChartDefinition {
  title: string;
  type?: string;       // default type for layers without their own type
  x?: string;          // X axis field (default: "date")
  x_tick?: string;     // "month" | "year" | "auto"
  x_labels?: string[]; // categorical X axis labels
  barmode?: string;    // "stack" | "group" (overrides auto-detection)
  hover?: string;      // field name for hover annotations (e.g., "note")
  show_values?: boolean; // display values on chart points/bars
  start?: number;      // skip first N data points
  y?: string;          // simple form: single series
  layers: LayerDefinition[];
}
```

### Engine Layer

```typescript
interface EngineFunction {
  name: string;
  minArgs: number;
  maxArgs: number;
  evaluate(args: number[][], context: DataContext): number[];
}

interface AggregatedFunction {
  name: string;
  minArgs: number;
  maxArgs: number;
  evaluate(args: number[][], context: DataContext): AggregatedResult;
}

interface AggregatedResult {
  x: string[];   // date labels for each group
  y: number[];   // aggregated values
}
```

### Rendering Layer

```typescript
interface TraceFactory {
  type: string;
  create(layer: LayerDefinition, x: string[], y: number[], hovertext?: string[], displayText?: string[]): Partial<Plotly.Data>;
}

interface ChartRenderer {
  render(container: HTMLElement, chart: ChartDefinition, data: ParsedData): void;
  clear(container: HTMLElement): void;
}
```

## 6. Parser Layer

### TomlDataParser (`src/parser/dataParser.ts`)

- Uses `smol-toml` to parse TOML input
- Iterates over all array-of-tables sections (e.g., `[[month]]`)
- Extracts `date` as string, all other fields as their native types
- Supports `string`, `number`, and `string[]` field values
- Returns `ParsedData` with `records[]` and `seriesNames[]`
- The `note` field (string or array) is preserved in `DataRecord` for hover annotations

### ChartParser (`src/parser/chartParser.ts`)

- Parses TOML chart definitions
- Handles two forms:
  - **Simple**: single `y` field → one layer
  - **Layered**: multiple `[[chart.layer]]` entries → multiple layers
- Implements **type inheritance**: chart-level `type` applies to layers without their own `type`
- Supported properties: `x_tick`, `x_labels`, `barmode`, `hover`, `show_values`, `start`

## 7. Engine Layer

### DataEngine (`src/engine/engine.ts`)

Facade that wraps `ExpressionEvaluator`. Three main methods:

| Method | Returns | Description |
|--------|---------|-------------|
| `resolveSeries(formula, data)` | `number[]` | Evaluates a formula across all data points |
| `resolveAggregated(formula, data)` | `AggregatedResult \| null` | For `aggSum`/`aggMean`: returns grouped data |
| `resolveX(chart, data)` | `string[]` | Returns date strings for X axis |

### ExpressionEvaluator (`src/engine/expression.ts`)

The core computational engine:

1. **Simple expressions** (no functions): evaluated point-by-point using `expr-eval`. For each data record, a scope object is created with all series values at that index.
2. **Function calls**: detected via regex. Custom functions (`delta`, `rollingMean`, etc.) are routed through the `FunctionRegistry`.
3. **Compound expressions**: functions mixed with operators (e.g., `salary-delta(netWorth)`) are resolved by extracting function calls into temporary variables, then evaluating the remaining expression point-by-point.
4. **Aggregated functions**: `aggSum(series, period)` and `aggMean(series, period)` are detected via regex and routed through the `AggregatedFunctionRegistry`. These return `AggregatedResult` (shorter arrays with different X labels).
5. **Nested functions**: supported. E.g., `rollingMean(delta(netWorth), 6)` first resolves `delta(netWorth)`, then applies `rollingMean` to the result.

### Built-in Functions

#### Standard Functions (return `number[]`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `delta` | `delta(series)` | Consecutive differences: `[0, v1-v0, v2-v1, ...]` |
| `rollingMean` | `rollingMean(series, window)` | Sliding window average |
| `rollingSum` | `rollingSum(series, window)` | Sliding window sum |
| `abs` | `abs(series)` | Absolute value of each point |
| `pct` | `pct(series)` | Percentage change: `((v[i]-v[i-1])/|v[i-1]|)*100` |
| `trend` | `trend(series)` | Linear regression trend line across data range |
| `forecast` | `forecast(series, periods)` | Linear extrapolation beyond data range |
| `mean` | `mean(series)` | Mean of entire series (constant line) |
| `sum` | `sum(series)` | Sum of entire series (constant line) |
| `last` | `last(series)` | Last value of series (constant line) |
| `sumSlice` | `sumSlice(series, start, end)` | Sum of slice from index start to end (single value) |
| `meanSlice` | `meanSlice(series, start, end)` | Mean of slice from index start to end (single value) |

#### Aggregation Functions (return `AggregatedResult`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `aggSum` | `aggSum(series, periodMonths)` | Sum per time period |
| `aggMean` | `aggMean(series, periodMonths)` | Mean per time period |

### Expression Operators

`+`, `-`, `*`, `/`, `%` (modulo), `^` (power), `()` parentheses.

### Example Expressions

```toml
y="cash"                                              # simple series
y="cash+etf+bonds"                                    # sum of series
y="etf/(etf+cash+bonds+stocks)*100"                   # percentage
y="abs(mortgage)"                                     # absolute value
y="delta(netWorth)"                                   # monthly change
y="rollingMean(netWorth, 3)"                          # 3-month moving average
y="last(cash/(cash+etf+bonds+stocks+retirement)*100)" # latest % value
y="aggSum(cash, 6)"                                   # 6-month sum
y="rollingMean(delta(netWorth), 6)"                   # nested functions
y="salary-delta(netWorth)"                            # compound expression
y="sumSlice(salary, 14, 25)"                          # sum of specific range
```

## 8. Computed Series Pipeline

Computed series (`[[series]]`) are evaluated before any chart expression. They become ordinary fields in the dataset.

### Pipeline

```
SeriesParser → DependencyResolver → SeriesEvaluator → DatasetEnricher
```

1. **SeriesParser** (`src/parser/seriesParser.ts`): Parses `[[series]]` blocks from TOML → `SeriesDefinition[]`
2. **DependencyResolver** (`src/engine/series/dependencyResolver.ts`): Topological sort, detects cycles
3. **SeriesEvaluator** (`src/engine/series/seriesEvaluator.ts`): Evaluates each series in dependency order using `ExpressionEvaluator`
4. **DatasetEnricher** (`src/engine/series/datasetEnricher.ts`): Injects computed values into records, adds names to `seriesNames`

### Key Properties

- Computed series are **indistinguishable** from original fields
- No special namespace — `portfolio` works exactly like `cash`
- All functions (`delta`, `rollingMean`, `forecast`, etc.) work with computed series automatically
- Dependencies resolved by topological sort — declaration order does not matter
- Circular dependencies throw a clear error

### Files

```
src/engine/series/
├── dependencyResolver.ts    # DAG + topological sort
├── seriesEvaluator.ts       # Evaluate expressions in order
├── datasetEnricher.ts       # Inject into ParsedData
└── seriesPipeline.ts        # Orchestrate the 3 steps
```

## 9. Rendering Layer

### PlotlyRenderer (`src/charts/plotly/PlotlyRenderer.ts`)

The core rendering class. For each chart definition:

1. **Categorical X axis**: if `x_labels` is set, renders bars with category labels instead of dates
2. **Layer resolution**: iterates over layers, resolves formulas via `DataEngine`
3. **Special layer handling**:
   - `trend`: computes linear regression, returns projected values across data range
   - `forecast`: computes extrapolation, generates future date labels, prepends `null` for historical range
   - Regular: tries `resolveAggregated()` first, falls back to `resolveSeries()`
4. **Hover text**: if `chart.hover` is set, extracts the specified field from records and passes as `hovertext` to trace factories
5. **Display values**: if `chart.show_values` is set, formats Y values and passes as `displayText` to trace factories
6. **Start offset**: if `chart.start` is set, slices X and Y arrays from that index
7. **Trace creation**: delegates to `TraceRegistry` to get Plotly trace objects
8. **Layout building**:
   - `barmode`: uses `chart.barmode` if set, otherwise auto-detects `"stack"` for 2+ bar layers
   - X-axis formatting: `tickformat: "%m/%y"` (MM/YY), linear ticks by default
   - `x_tick="year"` → yearly ticks, `x_tick="auto"` → auto-scaled
   - `x_labels` → categorical X axis with `type: "category"`
   - Legend: horizontal below chart (`orientation: "h", y: -0.15`)
   - Font: `Arial, Helvetica, sans-serif`, 12px, `#333`

### Trace Factories (`src/charts/plotly/traces/`)

All trace factories accept `hovertext` (annotations) and `displayText` (values to show on chart).

| Type | Plotly Type | Mode/Config | Hover | Display Values |
|------|------------|-------------|-------|----------------|
| `line` | scatter | `lines+markers` (or `+text` if show_values) | `%{x}: %{y}<br>%{hovertext}` | `textposition: "top center"` |
| `bar` | bar | default | `%{y}<br>%{hovertext}` | `textposition: "outside"` |
| `scatter` | scatter | `markers` | `%{x}: %{y}<br>%{hovertext}` | none |
| `area` | scatter | `lines`, `fill: "tozeroy"` | `%{x}: %{y}<br>%{hovertext}` | none |
| `trend` | scatter | `lines`, `dash: "dash"` | `%{x}: %{y}<br>%{hovertext}` | none |
| `forecast` | scatter | `lines`, `dash: "dot"` | `%{x}: %{y}<br>%{hovertext}` | none |

### Auto-Stacking

When a chart has 2+ layers of type `"bar"`, PlotlyRenderer automatically sets `barmode: "stack"` in the layout. This makes Plotly stack the bars vertically (each layer is a segment of the total). Single bar charts remain unstacked. Override with `barmode="group"`.

## 10. UI Layer

### app.ts (`src/ui/app.ts`)

The main orchestrator. Constructs:

- **Header** with title
- **Two textareas**: Data (TOML) and Chart Definitions (TOML), pre-filled with defaults
- **Generate Dashboard** button
- **Period range selector**: dropdown (All / 3m / 6m / 12m / 24m / Custom) with optional custom input
- **Error display** area
- **Dashboard** container

Flow:
1. User clicks "Generate Dashboard"
2. `TomlDataParser.parse(dataText)` → `ParsedData`
3. `SeriesParser.parse(chartsText)` → `SeriesDefinition[]`
4. `ChartParser.parse(chartsText)` → `ParsedCharts`
5. `processSeries(seriesDefs, data)` → enriched `ParsedData` with computed fields
6. Each formula is validated via `DataEngine.resolveSeries()`
7. `Dashboard.render(charts, enrichedData, renderer)` creates the grid
8. Period filter: `filterData(data, months)` slices the records array

### dashboard.ts (`src/ui/dashboard.ts`)

- Creates a responsive grid of chart cards
- Each card: container div + `renderer.render(card, chart, data)`
- `clear()` removes all chart containers

### DOM Utilities (`src/utils/dom.ts`)

```typescript
el(tag, attrs?, ...children)  // creates DOM elements programmatically
clearElement(element)          // removes all children
```

No framework — all DOM manipulation is vanilla JavaScript.

## 11. Registry Pattern

Every extensible subsystem uses a registry:

| Registry | Location | Purpose |
|----------|----------|---------|
| `DataParserRegistry` | `src/parser/registry.ts` | Data format parsers (currently: TOML only) |
| `FunctionRegistry` | `src/engine/functions/registry.ts` | Standard engine functions (12) |
| `AggregatedFunctionRegistry` | `src/engine/functions/aggregateRegistry.ts` | Aggregation functions (2) |
| `TraceRegistry` | `src/charts/plotly/traces/registry.ts` | Plotly trace factories (6) |
| `ChartRendererRegistry` | `src/charts/registry.ts` | Chart renderer backends (currently: Plotly only) |

**Adding a new component:**
- New chart type → implement `TraceFactory` in one file, add to `TraceRegistry`
- New engine function → implement `EngineFunction` in one file, add to `FunctionRegistry`
- New data format → implement `DataParser`, add to `DataParserRegistry`
- New renderer → implement `ChartRenderer`, add to `ChartRendererRegistry`

## 12. Type Declarations

`src/plotly.d.ts` provides ambient type declarations for `plotly.js-dist-min`, which does not ship its own TypeScript types. It re-exports the `Plotly` namespace from `@types/plotly.js`.

## 13. Build & Deploy

### Commands

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc && vite build → dist/
npm run preview    # Preview production build
```

### Build Pipeline

1. `tsc --noEmit` — strict type checking
2. `vite build` — bundles to `dist/` (ES modules, tree-shaken)

### CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Triggers on push to `main` or manual dispatch
2. Node 20, `npm ci`, `npm run build`
3. Uploads `dist/` as GitHub Pages artifact
4. Deploys to GitHub Pages

## 14. TypeScript Configuration

```json
{
  "target": "es2023",
  "module": "esnext",
  "moduleResolution": "bundler",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noEmit": true,
  "verbatimModuleSyntax": true
}
```

Key points:
- **Strict mode** — all strict checks enabled
- **No emit** — TypeScript only type-checks; Vite/esbuild handles transpilation
- **Bundler resolution** — compatible with Vite's module resolution
- **ES2023 target** — modern JavaScript output

## 15. Styling

`src/style.css` — global styles:
- Light theme, `Inter` font family
- Responsive grid layout (`grid-template-columns: repeat(auto-fill, minmax(600px, 1fr))`)
- Monospace textareas
- Chart cards with subtle shadows and rounded corners
- Mobile-friendly breakpoints
