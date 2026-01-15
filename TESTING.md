# Testing the WebR API Server

Quick guide to test your WebR API server.

## Prerequisites

Make sure the server is running:

```bash
# Development
npm run dev

# OR Production with PM2
pm2 start ecosystem.config.js
pm2 logs webr-api
```

**Important**: First startup takes 2-5 minutes to initialize WebR and install packages. Wait until you see:
```
[WebR] All packages installed successfully
```

## Test 1: Health Check

Test if the server is responding:

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "webrInitialized": true,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 123.456
}
```

If `webrInitialized` is `false`, wait a few more minutes for initialization to complete.

## Test 2: Simple R Execution

Test basic R code execution:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1 + 1)\nprint(\"Hello from R!\")"}'
```

**Expected Response:**
```json
{
  "success": true,
  "output": "[1] 2\n[1] \"Hello from R!\"\n",
  "plots": [],
  "error": null,
  "executionTime": 150
}
```

## Test 3: ggplot2 Visualization

Test plot generation with ggplot2:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point() + theme_minimal() + labs(title=\"Weight vs MPG\")"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "output": "",
  "plots": ["iVBORw0KGgoAAAANSUhEUg..."],
  "error": null,
  "executionTime": 450
}
```

The `plots` array will contain base64-encoded PNG images.

### Save Plot to File

To save and view the plot:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point() + theme_minimal()"
  }' | jq -r '.plots[0]' | base64 -d > plot.png

# View the plot
# On Ubuntu with desktop: xdg-open plot.png
# Or download plot.png to your local machine
```

## Test 4: Data Manipulation with dplyr

Test dplyr functionality:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(dplyr)\nmtcars %>% group_by(cyl) %>% summarise(mean_mpg = mean(mpg), count = n())"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "output": "# A tibble: 3 × 3\n    cyl mean_mpg count\n  <dbl>    <dbl> <int>\n1     4     26.7    11\n2     6     19.7     7\n3     8     15.1    14\n",
  "plots": [],
  "error": null,
  "executionTime": 200
}
```

## Test 5: Data Injection

Test injecting data as an R data frame:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(dplyr)\ncat(\"Data received:\\n\")\nprint(query_result)\ncat(\"\\nSummary:\\n\")\nquery_result %>% summarise(mean_value = mean(value), total = sum(value))",
    "data": [
      {"id": 1, "value": 10, "category": "A"},
      {"id": 2, "value": 20, "category": "A"},
      {"id": 3, "value": 30, "category": "B"},
      {"id": 4, "value": 40, "category": "B"}
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "output": "Data received:\n  id value category\n1  1    10        A\n2  2    20        A\n3  3    30        B\n4  4    40        B\n\nSummary:\n  mean_value total\n1       25   100\n",
  "plots": [],
  "error": null,
  "executionTime": 180
}
```

## Test 6: Multiple Plots

Test generating multiple plots:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(ggplot2)\n\n# Plot 1: Scatter\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point() + theme_minimal() + labs(title=\"Scatter Plot\")\n\n# Plot 2: Histogram\nggplot(mtcars, aes(x=mpg)) + geom_histogram(bins=10, fill=\"steelblue\") + theme_minimal() + labs(title=\"Histogram\")"
  }'
```

The response will have 2 base64 strings in the `plots` array.

## Test 7: Survey Analysis

Test the survey packages:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(survey)\nlibrary(srvyr)\n\n# Create sample survey data\ndata <- data.frame(\n  id = 1:5,\n  income = c(30000, 40000, 50000, 60000, 70000),\n  weight = c(1.2, 1.0, 0.8, 1.1, 0.9)\n)\n\n# Survey design\nsvy <- data %>% as_survey_design(weights = weight)\n\n# Calculate weighted mean\nresult <- svy %>% summarise(mean_income = survey_mean(income))\nprint(result)"
  }'
```

## Test 8: Statistical Modeling with broom

Test broom for tidy model outputs:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(broom)\n\n# Fit a linear model\nmodel <- lm(mpg ~ wt + hp, data=mtcars)\n\n# Tidy output\ncat(\"Model Coefficients:\\n\")\nprint(tidy(model))\n\ncat(\"\\nModel Summary:\\n\")\nprint(glance(model))"
  }'
```

## Test 9: Complex Analysis with Plot

Combined data manipulation and visualization:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "library(ggplot2)\nlibrary(dplyr)\n\n# Data manipulation\nsummary_data <- mtcars %>%\n  group_by(cyl) %>%\n  summarise(\n    mean_mpg = mean(mpg),\n    mean_hp = mean(hp),\n    count = n()\n  )\n\ncat(\"Summary by Cylinder:\\n\")\nprint(summary_data)\n\n# Visualization\nggplot(summary_data, aes(x=factor(cyl), y=mean_mpg, fill=factor(cyl))) +\n  geom_col() +\n  theme_minimal() +\n  labs(title=\"Average MPG by Cylinder Count\", x=\"Cylinders\", y=\"Average MPG\", fill=\"Cylinders\")"
  }'
```

## Test 10: Error Handling

Test how errors are handled:

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "nonexistent_function()"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "output": "Error:  could not find function \"nonexistent_function\"\n",
  "plots": [],
  "error": null,
  "executionTime": 50
}
```

## Test from Remote Machine

If testing from another machine (not localhost):

```bash
# Replace with your EC2 public IP or DNS
export SERVER_URL="http://ec2-3-18-225-234.us-east-2.compute.amazonaws.com:3000"

# Health check
curl $SERVER_URL/api/health

# Execute R code
curl -X POST $SERVER_URL/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1 + 1)"}'
```

## Test with CORS (from browser)

If testing from a browser (mimilabs.ai domain):

```javascript
// JavaScript fetch example
fetch('http://your-server:3000/api/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: 'library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Output:', data.output);
  console.log('Plots:', data.plots.length);

  // Display plot
  if (data.plots.length > 0) {
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,' + data.plots[0];
    document.body.appendChild(img);
  }
});
```

## Troubleshooting

### Server not responding
```bash
# Check if running
pm2 status

# Check logs
pm2 logs webr-api

# Restart
pm2 restart webr-api
```

### WebR not initialized
```bash
# Check initialization logs
pm2 logs webr-api | grep WebR

# Wait for: [WebR] All packages installed successfully
```

### Plots not generating
- Ensure ggplot2 code is correct
- Check output for R errors
- Verify `/tmp` is writable: `ls -la /tmp`

### Timeout errors
- Long-running code may timeout (60s default)
- Simplify the R code or increase timeout in Next.js config

## Performance Testing

Test response times:

```bash
# Measure execution time
time curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"}'
```

**Expected times:**
- First request after startup: 2-5 minutes (initialization)
- Subsequent requests: 100-500ms (depending on complexity)
- Health check: <50ms

## Success Checklist

- [ ] Health endpoint returns `webrInitialized: true`
- [ ] Simple R code executes and returns output
- [ ] ggplot2 generates plots (base64 in response)
- [ ] dplyr operations work correctly
- [ ] Data injection creates `query_result` data frame
- [ ] Multiple plots are captured
- [ ] Survey packages work
- [ ] broom tidying works
- [ ] Errors are captured gracefully
- [ ] Response times are reasonable (<500ms after warmup)

All tests passing? Your WebR API server is ready for production!
