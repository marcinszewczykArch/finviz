# FinViz — Data Visualization Engine

A browser-only SPA for visualizing tabular data using text-based chart definitions. No backend, no database, no login. Everything runs in the browser and resets on page refresh.

## How It Works

1. Paste your data (TOML format) into the **DATA** textarea
2. Paste chart definitions (TOML format) into the **CHART DEFINITIONS** textarea
3. Click **Generate Dashboard**
4. Charts appear below

## Data Format (TOML)

Data is an array of records. Each `[[month]]` block is one record. Every record must have a `date` field. All other fields become numeric data series.

```toml
[[month]]
date="2026-01"
salary=2400
cash=25
etf=68
note="First ETF purchase"

[[month]]
date="2026-02"
salary=2400
cash=30
etf=72
note=["Transfer 10k to ETF", "Rebalanced portfolio"]
```

Key points:
- The section name (`[[month]]`) is arbitrary — use any name
- `date` is always a string, used as the X axis
- All other fields are numeric series
- Series names can contain letters and numbers (e.g., `cash`, `etf`, `mortgage`)
- Series with value `0` are valid (e.g., `carLoan=0`)
- `note` field is optional — a string or array of strings for annotations
- Multiple notes per month: `note=["note1", "note2"]`

## Computed Series (`[[series]]`)

Define reusable computed series to avoid duplicating long expressions across charts. Computed series become ordinary fields available everywhere — just like original data fields.

### Format

```toml
[[series]]
name="portfolio"
expr="cash+etf+crypto+bonds+stocks+retirement+stocks2"

[[series]]
name="totalDebt"
expr="abs(mortgage)+abs(carLoan)"

[[series]]
name="debtRatio"
expr="totalDebt/portfolio"
```

Key points:
- `name` — the series name (becomes a new field in the dataset)
- `expr` — any expression the engine supports (fields, functions, operators)
- Series can reference other computed series (dependencies are resolved automatically)
- Dependencies are topologically sorted — declaration order does not matter
- Circular dependencies are detected with a clear error message

### Using Computed Series in Charts

Once defined, computed series work exactly like original fields:

```toml
[[chart]]
title="Portfolio"
type="line"
y="portfolio"

[[chart]]
title="Debt Ratio"
type="line"
y="debtRatio"

[[chart]]
title="Portfolio Change"
type="bar"
y="delta(portfolio)"

[[chart]]
title="Portfolio Forecast"
[[chart.layer]]
type="line"
y="portfolio"
[[chart.layer]]
type="forecast"
source="portfolio"
by="12"
```

### Dependency Resolution

The engine builds a dependency graph and evaluates series in topological order:

```toml
[[series]]
name="a"
expr="cash+etf"

[[series]]
name="b"
expr="a*2"

[[series]]
name="c"
expr="delta(b)"
```

Evaluation order: `a` → `b` → `c`. Circular dependencies throw an error:

```
Circular dependency detected: a → b → c → a
```

## Chart Definitions Format (TOML)

Each `[[chart]]` block defines one chart. There are two forms: **simple** and **layered**.

### Simple Form

One series, one chart type:

```toml
[[chart]]
title="Net Worth"
type="line"
y="netWorth"
```

### Layered Form

Multiple series (layers) on one chart:

```toml
[[chart]]
title="Assets Breakdown"
[[chart.layer]]
type="bar"
y="cash"
[[chart.layer]]
type="bar"
y="etf"
[[chart.layer]]
type="bar"
y="bonds"
```

### Chart Properties

| Property | Required | Description |
|----------|----------|-------------|
| `title`  | yes      | Chart title displayed above |
| `type`   | no       | Default type for layers (e.g., `line`, `bar`) |
| `x`      | no       | X axis field (default: `date`) |
| `x_tick` | no       | X axis tick mode: `"month"` (default), `"year"`, or `"auto"` |
| `x_labels` | no     | Categorical X axis labels (array of strings) |
| `barmode` | no      | Bar layout mode: `"stack"` (default for 2+ bar layers) or `"group"` |
| `hover`  | no       | Field name to display on hover (e.g., `hover="note"`) |
| `show_values` | no  | Show data values on chart: `true` or `false` (default) |
| `start`  | no       | Skip first N data points (e.g., `start=12` to start from month 12) |

### Layer Properties

| Property | Required | Description |
|----------|----------|-------------|
| `type`   | yes      | Chart type (see below) |
| `y`      | yes      | Formula or series name for Y values |
| `source` | no       | Source series for `trend` and `forecast` types |
| `by`     | no       | Parameter for `forecast` (number of periods) |
| `title`  | no       | Layer label (defaults to `y` formula) |

### Layer Inheritance

If you set `type` on the `[[chart]]` level, all layers without their own `type` will use it:

```toml
[[chart]]
title="Portfolio"
type="bar"
[[chart.layer]]
y="cash"
[[chart.layer]]
y="etf"
[[chart.layer]]
y="bonds"
```

## Available Chart Types

| Type | Plotly Type | Description |
|------|-------------|-------------|
| `line` | scatter (lines) | Line chart with markers |
| `bar` | bar | Bar chart |
| `scatter` | scatter (markers) | Scatter plot with dots |
| `area` | scatter (filled) | Area chart (filled to zero) |
| `trend` | scatter (dashed) | Linear regression trend line. Use `source` to specify series |
| `forecast` | scatter (dotted) | Extrapolation of trend. Use `source` for series, `by` for forecast periods |

## Formulas

The `y` field accepts formulas. There are two kinds:

### 1. Expressions (evaluated per data point)

You can use field names and math operators directly:

```toml
y="cash"
y="cash+etf"
y="etf/(etf+cash)"
y="abs(mortgage)"
y="salary-delta(netWorth)"
```

Operators: `+`, `-`, `*`, `/`, `%`, `^`, parentheses `()`.

**Compound expressions with functions** are supported:

```toml
y="salary-delta(netWorth)"
```

This evaluates `delta(netWorth)` first, then subtracts from `salary` point-by-point.

### 2. Functions (applied to the whole series)

Functions operate on an entire series and return a series of the same length (or longer for forecast).

## Built-in Functions

### `delta(series)`
Returns the difference between consecutive values.

```toml
y="delta(netWorth)"
```
Result: `[0, v1-v0, v2-v1, v3-v2, ...]`

### `rollingMean(series, window)`
Returns the rolling average over `window` data points.

```toml
y="rollingMean(netWorth, 3)"
```
A 3-month moving average.

### `rollingSum(series, window)`
Returns the rolling sum over `window` data points.

```toml
y="rollingSum(cash, 6)"
```
A 6-month rolling total.

### `abs(series)`
Returns the absolute value of every data point.

```toml
y="abs(mortgage)"
```
Converts negative loan values to positive.

### `pct(series)`
Returns the percentage change between consecutive values.

```toml
y="pct(netWorth)"
```
Result: `[0, change%, change%, ...]`

### `trend(series)`
Returns a linear regression trend line (projected values across existing data range).

```toml
y="trend(netWorth)"
```
Use as a layer alongside the actual data to see the trend.

### `forecast(series, periods)`
Returns a linear extrapolation beyond the data range.

```toml
y="forecast(netWorth, 12)"
```
Extends the trend by 12 periods into the future. Use this as a standalone layer or combined with the source series.

### `mean(series)`
Returns the mean of the entire series, repeated for every data point.

```toml
y="mean(netWorth)"
```
Useful as a horizontal reference line.

### `sum(series)`
Returns the sum of the entire series, repeated for every data point.

```toml
y="sum(cash)"
```

### `last(series)`
Returns the last value of the series, repeated for every data point. Useful for showing the latest value across all months.

```toml
y="last(cash/(cash+etf+bonds+stocks)*100)"
```

### `sumSlice(series, start, end)`
Returns the sum of the series from index `start` to `end` (inclusive). Returns a single value.

```toml
y="sumSlice(salary, 14, 25)"
```
Sum of salary from month 14 to month 25 (last 12 months).

### `meanSlice(series, start, end)`
Returns the mean of the series from index `start` to `end` (inclusive). Returns a single value.

```toml
y="meanSlice(salary, 2, 13)"
```
Mean of salary from month 2 to month 13 (previous 12 months).

## Aggregation Functions

Aggregation functions group data into time periods and compute summaries. Unlike standard functions, they return **fewer data points** than the input (e.g., 24 months → 4 six-month periods).

### `aggSum(series, periodMonths)`
Groups data into periods of `periodMonths` months and returns the sum of each period.

```toml
y="aggSum(salary, 6)"
```
Sums salary every 6 months. Result: one value per 6-month period.

### `aggMean(series, periodMonths)`
Groups data into periods of `periodMonths` months and returns the average of each period.

```toml
y="aggMean(salary, 6)"
```
Averages salary every 6 months.

### Aggregation Examples

**6-month aggregation with sum and mean:**

```toml
[[chart]]
title="Assets - 6 Month Aggregation"
[[chart.layer]]
type="bar"
y="aggSum(cash, 6)"
[[chart.layer]]
type="scatter"
y="aggMean(cash, 6)"
```

**Yearly aggregation:**

```toml
[[chart]]
title="Net Worth - Yearly"
[[chart.layer]]
type="bar"
y="aggSum(netWorth, 12)"
[[chart.layer]]
type="scatter"
y="aggMean(netWorth, 12)"
x_tick="year"
```

**Aggregation with expressions:**

```toml
[[chart]]
title="Loans - 6 Month Aggregation"
[[chart.layer]]
type="bar"
y="aggSum(abs(mortgage), 6)"
[[chart.layer]]
type="scatter"
y="aggMean(abs(mortgage), 6)"
```

### Aggregation Behavior

- Data is grouped sequentially from the start
- The last period may be shorter if data doesn't divide evenly
- Each period's X-axis label is the date of the first record in that period
- Use `x_tick="year"` for yearly aggregations to show year labels

## Combining Functions with Expressions

You can use function results inside expressions:

```toml
y="rollingMean(delta(netWorth), 6)"
```
6-month moving average of the monthly change.

```toml
y="abs(rollingMean(mortgage, 3))"
```
3-month moving average of the loan, displayed as positive.

```toml
y="salary-delta(netWorth)"
```
Compound expression: salary minus the monthly net worth change.

## Hover & Annotations

### Hover Text

Display annotations on hover by setting `hover` on the chart:

```toml
[[chart]]
title="Net Worth"
type="line"
y="netWorth"
hover="note"
```

In your data, add `note` fields:

```toml
[[month]]
date="2024-11"
cash=31
netWorth=-56.2
note="Took out 50k car loan"
```

- **Line charts**: hover shows date + value + note
- **Bar charts**: hover shows value + note (no text labels on bars)

Multiple notes per month (array):

```toml
note=["Transfer 10k to ETF", "Rebalanced portfolio"]
```

### Show Values on Chart

Display data values on every point/bar:

```toml
[[chart]]
title="Net Worth"
type="line"
show_values=true
y="netWorth"
```

- **Line charts**: values displayed above each marker
- **Bar charts**: values displayed above each bar
- All example charts have `show_values=true` enabled by default

### Categorical X Axis

Use custom labels instead of dates:

```toml
[[chart]]
title="Salary Comparison"
barmode="group"
x_labels=["Last 12m", "Prev 12m"]
[[chart.layer]]
type="bar"
y="sumSlice(salary, 14, 25)"
[[chart.layer]]
type="bar"
y="sumSlice(salary, 2, 13)"
```

## Examples

### Net Worth Over Time with Trend and Forecast

```toml
[[chart]]
title="Net Worth with Trend"
hover="note"
[[chart.layer]]
type="line"
y="netWorth"
[[chart.layer]]
type="trend"
source="netWorth"
```

```toml
[[chart]]
title="Net Worth Forecast"
[[chart.layer]]
type="line"
y="netWorth"
[[chart.layer]]
type="forecast"
source="netWorth"
by="12"
```

### Chart with Start Offset

Skip the first 12 months (useful when rolling mean needs full window):

```toml
[[chart]]
title="Salary vs Net Worth Change"
type="bar"
y="salary-delta(netWorth)"
```

### Stacked Assets

```toml
[[chart]]
title="Asset Allocation"
[[chart.layer]]
type="bar"
y="cash"
[[chart.layer]]
type="bar"
y="etf"
[[chart.layer]]
type="bar"
y="bonds"
[[chart.layer]]
type="bar"
y="stocks"
[[chart.layer]]
type="bar"
y="retirement"
```

### Loans Payoff Progress

```toml
[[chart]]
title="Loan Balances"
hover="note"
[[chart.layer]]
type="line"
y="abs(mortgage)"
[[chart.layer]]
type="line"
y="abs(carLoan)"
[[chart.layer]]
type="line"
y="abs(mortgage)+abs(carLoan)"
title="Total"
```

### Monthly Changes

```toml
[[chart]]
title="Monthly Net Worth Change"
hover="note"
type="bar"
y="delta(netWorth)"
```

### Percentage Growth

```toml
[[chart]]
title="Net Worth Growth %"
type="line"
y="pct(netWorth)"
```

### Salary Comparison (Sum & Mean)

```toml
[[chart]]
title="Salary - Sum Comparison"
barmode="group"
x_labels=["Last 12m", "Prev 12m"]
[[chart.layer]]
type="bar"
y="sumSlice(salary, 14, 25)"
[[chart.layer]]
type="bar"
y="sumSlice(salary, 2, 13)"
```

## Tips for AI-Generated Chart Definitions

When asking an AI to generate chart definitions, provide:
1. The list of available series names from your data
2. What you want to visualize (trend, comparison, breakdown, etc.)
3. Preferred chart types

Example prompt:
> "Given these series: cash, etf, crypto, bonds, stocks, retirement, stocks2, carLoan, mortgage, netWorth, salary — generate chart definitions for a financial dashboard showing net worth over time, asset allocation as stacked bars, loan payoff progress, salary comparison, and a 12-month forecast."
