# WebR API - Quick Start

## 🚀 Base URL
```
https://webr.mimilabs.org
```

## 🔐 Authentication Required

All requests require an API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

**Get your API key**: Contact admin@mimilabs.ai

See `AUTH.md` for detailed authentication guide.

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
const API_KEY = process.env.WEBR_API_KEY; // Store in .env.local

const response = await fetch('https://webr.mimilabs.org/api/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
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
import os

API_KEY = os.getenv('WEBR_API_KEY')  # Store in .env

response = requests.post(
    'https://webr.mimilabs.org/api/execute',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={'code': 'library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()'}
)

result = response.json()
# result['plots'][0] = base64 PNG
```

### cURL
```bash
curl -X POST https://webr.mimilabs.org/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
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
- **Authentication**: See `AUTH.md` for API key usage
- **Integration**: See `INTEGRATION.md` for complete examples
- **Code Snippets**: See `examples/snippets.js` or `examples/snippets.py`

## 🆘 Support
- **Get API Key**: admin@mimilabs.ai
- **Status**: `GET /api/health` (requires API key)
- **Docs**: https://webr.mimilabs.org
