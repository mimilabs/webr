# WebR API - Quick Start

## 🚀 Base URL
```
https://webr.mimilabs.org
```

## 📡 Endpoints

### Health Check
```bash
GET /api/health
```

### Execute R Code
```bash
POST /api/execute
Content-Type: application/json

{
  "code": "library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()",
  "data": [{"id": 1, "value": 10}]  // optional
}
```

## 📦 Pre-installed Packages
✅ ggplot2, dplyr, tidyr, survey, srvyr, broom

## ⚡ Quick Examples

### JavaScript
```javascript
const response = await fetch('https://webr.mimilabs.org/api/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()'
  })
});

const result = await response.json();
// result.plots[0] = base64 PNG
```

### Python
```python
import requests

response = requests.post(
    'https://webr.mimilabs.org/api/execute',
    json={'code': 'library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()'}
)

result = response.json()
# result['plots'][0] = base64 PNG
```

### cURL
```bash
curl -X POST https://webr.mimilabs.org/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(1 + 1)"}'
```

## 📊 Response Format
```json
{
  "success": true,
  "output": "console output",
  "plots": ["base64-png-1", "base64-png-2"],
  "error": null,
  "executionTime": 1234
}
```

## 💡 Tips
- **First request**: Takes 2-5 min (initialization)
- **Subsequent**: 100-500ms
- **Timeout**: 60 seconds max
- **Data size**: Keep under 1000 rows
- **Plots**: Automatically captured, returned as base64

## 📚 Full Documentation
See `INTEGRATION.md` for complete examples and best practices.

## 🆘 Support
- **Status**: `GET /api/health`
- **Email**: admin@mimilabs.ai
- **Docs**: https://webr.mimilabs.org
