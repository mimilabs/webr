# WebR API Integration Guide

Quick guide for integrating the WebR API into your project.

## Base URL

```
https://webr.mimilabs.org
```

## Authentication

Currently **no authentication required**. CORS is enabled for:
- `https://www.mimilabs.ai`
- `https://mimilabs.ai`

If you need access from other domains, contact the admin to update CORS settings.

---

## API Endpoints

### 1. Health Check

Check if the server is ready.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "webrInitialized": true,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 123.456
}
```

---

### 2. Execute R Code

Execute R code and get results with plots.

**Endpoint:** `POST /api/execute`

**Request Body:**
```json
{
  "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()",
  "data": [
    {"id": 1, "value": 10},
    {"id": 2, "value": 20}
  ]
}
```

**Parameters:**
- `code` (string, required): R code to execute
- `data` (array, optional): JSON data to inject as R data frame named `query_result`

**Response:**
```json
{
  "success": true,
  "output": "console output from R",
  "plots": ["base64-encoded-png-1", "base64-encoded-png-2"],
  "error": null,
  "executionTime": 1234
}
```

**Response Fields:**
- `success` (boolean): Whether execution succeeded
- `output` (string): Console output from R (print statements, summaries, etc.)
- `plots` (array): Base64-encoded PNG images (800x600, 150 DPI)
- `error` (string|null): Error message if failed
- `executionTime` (number): Execution time in milliseconds

---

## Pre-installed R Packages

The following packages are always available:
- **ggplot2** - Data visualization
- **dplyr** - Data manipulation
- **tidyr** - Data tidying
- **survey** - Survey statistics
- **srvyr** - dplyr-style survey analysis
- **broom** - Tidy model outputs

Built-in packages like `stats`, `graphics`, `utils` are also available.

---

## Integration Examples

### JavaScript / TypeScript

```typescript
async function executeR(code: string, data?: any[]) {
  const response = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, data }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Output:', result.output);
    console.log('Generated', result.plots.length, 'plots');

    // Display plots as images
    result.plots.forEach((base64Plot: string) => {
      const img = document.createElement('img');
      img.src = `data:image/png;base64,${base64Plot}`;
      document.body.appendChild(img);
    });
  } else {
    console.error('Error:', result.error);
  }

  return result;
}

// Usage
await executeR(`
  library(ggplot2)
  ggplot(mtcars, aes(x=wt, y=mpg)) +
    geom_point() +
    theme_minimal()
`);
```

### Python

```python
import requests
import base64
from PIL import Image
from io import BytesIO

def execute_r(code: str, data: list = None):
    url = "https://webr.mimilabs.org/api/execute"
    payload = {"code": code}

    if data:
        payload["data"] = data

    response = requests.post(url, json=payload)
    result = response.json()

    if result["success"]:
        print("Output:", result["output"])

        # Save plots
        for i, base64_plot in enumerate(result["plots"]):
            plot_data = base64.b64decode(base64_plot)
            img = Image.open(BytesIO(plot_data))
            img.save(f"plot_{i+1}.png")
            print(f"Saved plot_{i+1}.png")
    else:
        print("Error:", result["error"])

    return result

# Usage
execute_r("""
library(ggplot2)
ggplot(mtcars, aes(x=wt, y=mpg)) +
  geom_point() +
  theme_minimal()
""")
```

### cURL

```bash
curl -X POST https://webr.mimilabs.org/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"
  }'
```

### Node.js / Express Backend

```javascript
const express = require('express');
const app = express();

app.post('/analyze', async (req, res) => {
  const { sqlData, analysisType } = req.body;

  // Build R code based on analysis type
  let rCode = '';
  if (analysisType === 'summary') {
    rCode = `
      library(dplyr)
      query_result %>%
        group_by(category) %>%
        summarise(
          mean_value = mean(value),
          count = n()
        )
    `;
  } else if (analysisType === 'plot') {
    rCode = `
      library(ggplot2)
      ggplot(query_result, aes(x=category, y=value)) +
        geom_boxplot() +
        theme_minimal()
    `;
  }

  // Execute on WebR server
  const response = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: rCode,
      data: sqlData
    })
  });

  const result = await response.json();
  res.json(result);
});
```

### React Component

```tsx
import { useState } from 'react';

interface RResult {
  success: boolean;
  output: string;
  plots: string[];
  error: string | null;
  executionTime: number;
}

function RAnalysis() {
  const [result, setResult] = useState<RResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);

    try {
      const response = await fetch('https://webr.mimilabs.org/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: `
            library(ggplot2)
            library(dplyr)

            mtcars %>%
              ggplot(aes(x=wt, y=mpg, color=factor(cyl))) +
              geom_point(size=3) +
              theme_minimal() +
              labs(title="Car Weight vs MPG", color="Cylinders")
          `
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={runAnalysis} disabled={loading}>
        {loading ? 'Running...' : 'Run R Analysis'}
      </button>

      {result?.success && (
        <div>
          <pre>{result.output}</pre>
          {result.plots.map((plot, i) => (
            <img
              key={i}
              src={`data:image/png;base64,${plot}`}
              alt={`Plot ${i + 1}`}
              style={{ maxWidth: '100%' }}
            />
          ))}
          <p>Execution time: {result.executionTime}ms</p>
        </div>
      )}

      {result?.error && (
        <div style={{ color: 'red' }}>Error: {result.error}</div>
      )}
    </div>
  );
}
```

---

## Common Use Cases

### 1. Statistical Analysis

```javascript
const code = `
library(broom)

# Run linear regression
model <- lm(mpg ~ wt + hp, data=mtcars)

# Get tidy output
tidy(model)
`;

const result = await executeR(code);
// Parse result.output for coefficients
```

### 2. Data Visualization from SQL Results

```javascript
const sqlResults = [
  { month: 'Jan', revenue: 10000, category: 'A' },
  { month: 'Feb', revenue: 15000, category: 'A' },
  { month: 'Jan', revenue: 8000, category: 'B' },
  { month: 'Feb', revenue: 12000, category: 'B' },
];

const code = `
library(ggplot2)
library(dplyr)

query_result %>%
  ggplot(aes(x=month, y=revenue, fill=category)) +
  geom_col(position="dodge") +
  theme_minimal() +
  labs(title="Revenue by Month and Category")
`;

const result = await executeR(code, sqlResults);
// result.plots[0] contains the chart
```

### 3. Survey Analysis

```javascript
const surveyData = [
  { id: 1, age: 25, income: 50000, weight: 1.2 },
  { id: 2, age: 30, income: 60000, weight: 1.0 },
  { id: 3, age: 35, income: 70000, weight: 0.8 },
];

const code = `
library(survey)
library(srvyr)

svy <- query_result %>%
  as_survey_design(weights = weight)

result <- svy %>%
  summarise(
    mean_income = survey_mean(income),
    median_age = survey_median(age)
  )

print(result)
`;

const result = await executeR(code, surveyData);
console.log(result.output); // Contains survey statistics
```

### 4. Multiple Plots

```javascript
const code = `
library(ggplot2)

# Plot 1: Scatter plot
p1 <- ggplot(mtcars, aes(x=wt, y=mpg)) +
  geom_point() +
  theme_minimal()
ggsave("/tmp/plot1.png", p1, width=10, height=6)

# Plot 2: Histogram
p2 <- ggplot(mtcars, aes(x=mpg)) +
  geom_histogram(bins=10, fill="steelblue") +
  theme_minimal()
ggsave("/tmp/plot2.png", p2, width=10, height=6)
`;

const result = await executeR(code);
// result.plots[0] = scatter plot
// result.plots[1] = histogram
```

---

## Important Considerations

### Performance
- **First request after restart**: 2-5 minutes (WebR initialization)
- **Subsequent requests**: 100-500ms for simple analyses, 1-5s for complex plots
- **Timeout**: 60 seconds maximum execution time

### Data Size Limits
- Keep data arrays under **1000 rows** for best performance
- For larger datasets, consider aggregating on your backend first
- Maximum request size: ~10MB

### Plot Generation
- **Automatic capture**: Simply create a ggplot object, it's automatically saved
- **Explicit save**: Use `ggsave("/tmp/plotname.png", plot)` for multiple plots
- **Format**: PNG images, 800x600 pixels, 150 DPI
- **Return format**: Base64-encoded strings in `plots` array

### Error Handling
- R errors are captured in the `error` field
- HTTP 400 for invalid requests (missing `code` parameter)
- HTTP 500 for server errors
- Always check `success` field before processing results

### Best Practices
1. **Test code locally first** - Use RStudio to validate R syntax
2. **Handle timeouts** - Set client timeout to 65+ seconds
3. **Cache results** - Don't re-run expensive analyses unnecessarily
4. **Validate input** - Sanitize user input before building R code
5. **Display progress** - Show loading indicators (analysis takes time)
6. **Store plots** - Save base64 images to your storage if needed long-term

---

## Rate Limits

Currently **no rate limits**, but please:
- Don't abuse the service with excessive requests
- Consider caching results
- Contact admin if you need high-volume access

---

## Support & Troubleshooting

### Common Issues

**"webrInitialized: false"**
- Server is still initializing (first 2-5 minutes after restart)
- Wait and retry in 30 seconds

**Timeout errors**
- Simplify your R code
- Reduce data size
- Contact admin if legitimate use case requires more time

**"Can't add ggsave() to ggplot"**
- Don't use `+` before `ggsave()`
- Correct: `p <- ggplot(...) + geom_point()\nggsave("/tmp/plot.png", p)`
- Wrong: `ggplot(...) + geom_point() + ggsave("/tmp/plot.png")`

**CORS errors**
- Your domain needs to be added to allowlist
- Contact admin with your domain

### Getting Help

- **API Documentation**: https://webr.mimilabs.org (or see `API.md`)
- **Contact**: admin@mimilabs.ai
- **Status**: Check `GET /api/health` endpoint

---

## Example: Complete Workflow

Here's a complete example integrating SQL → R Analysis → Display:

```typescript
// 1. Fetch data from your database
const sqlResults = await db.query(`
  SELECT category, value, date
  FROM metrics
  WHERE date >= '2024-01-01'
`);

// 2. Run R analysis with visualization
const rCode = `
library(ggplot2)
library(dplyr)

# Summarize data
summary_stats <- query_result %>%
  group_by(category) %>%
  summarise(
    mean_value = mean(value),
    median_value = median(value),
    count = n()
  )

print(summary_stats)

# Create visualization
ggplot(query_result, aes(x=category, y=value, fill=category)) +
  geom_boxplot() +
  theme_minimal() +
  labs(
    title="Value Distribution by Category",
    x="Category",
    y="Value"
  )
`;

const response = await fetch('https://webr.mimilabs.org/api/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: rCode,
    data: sqlResults
  })
});

const result = await response.json();

if (result.success) {
  // 3. Parse and display results
  console.log('Statistics:', result.output);

  // 4. Display plot
  const plotImg = document.getElementById('plot');
  plotImg.src = `data:image/png;base64,${result.plots[0]}`;

  // 5. Optionally save to your storage
  await saveToS3(result.plots[0], 'analysis-2024.png');
}
```

---

## Quick Start Checklist

- [ ] Verify health endpoint: `curl https://webr.mimilabs.org/api/health`
- [ ] Test simple execution: `curl -X POST ... {"code": "print(1+1)"}`
- [ ] Test with ggplot2: `{"code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"}`
- [ ] Test with your data: Include `data` parameter
- [ ] Handle base64 plots in your UI
- [ ] Add error handling for timeouts/failures
- [ ] Set up proper loading states
- [ ] (Optional) Cache results for repeated queries

---

**Ready to integrate? Start with the health check and simple examples above!**
