# API Key Authentication

## Overview

The WebR API requires authentication using an API key to prevent abuse.

## Getting the API Key

Contact the administrator to receive your API key:
- **Format**: `webr_[64 hex characters]`
- **Example**: `webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525`

**Keep this key secret!** Don't commit it to version control.

## How to Use

Include the API key in the `Authorization` header of your requests.

### Format

```
Authorization: Bearer YOUR_API_KEY
```

or simply:

```
Authorization: YOUR_API_KEY
```

Both formats are supported.

## Examples

### cURL

```bash
curl -X POST https://webr.mimilabs.org/api/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525" \
  -d '{"code": "print(1 + 1)"}'
```

### JavaScript/TypeScript

```javascript
const API_KEY = 'webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525';

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
```

### Python

```python
import requests

API_KEY = 'webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525'

response = requests.post(
    'https://webr.mimilabs.org/api/execute',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={'code': 'print(1 + 1)'}
)

result = response.json()
```

## Storing the API Key

### Environment Variables (Recommended)

**Never hardcode the API key in your source code!**

#### Node.js / Next.js

Create a `.env.local` file:

```bash
WEBR_API_KEY=webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525
```

Then use it in your code:

```javascript
const response = await fetch('https://webr.mimilabs.org/api/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.WEBR_API_KEY}`
  },
  body: JSON.stringify({ code: 'print(1 + 1)' })
});
```

#### Python

Create a `.env` file:

```bash
WEBR_API_KEY=webr_969f2797540bfb185a83ec1bbeb170bfad85674d3249fe62c07c8201b7a78525
```

Use with `python-dotenv`:

```python
import os
from dotenv import load_dotenv
import requests

load_dotenv()
API_KEY = os.getenv('WEBR_API_KEY')

response = requests.post(
    'https://webr.mimilabs.org/api/execute',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={'code': 'print(1 + 1)'}
)
```

## Error Responses

### Missing API Key

```json
{
  "success": false,
  "error": "Unauthorized: Missing Authorization header",
  "message": "Please provide a valid API key in the Authorization header"
}
```

Status code: `401 Unauthorized`

### Invalid API Key

```json
{
  "success": false,
  "error": "Unauthorized: Invalid API key",
  "message": "Please provide a valid API key in the Authorization header"
}
```

Status code: `401 Unauthorized`

## Security Best Practices

1. **Never commit API keys to git**
   - Add `.env`, `.env.local` to `.gitignore`
   - Use environment variables or secret management

2. **Don't share keys publicly**
   - Don't paste keys in Slack, email, or tickets
   - Use secure sharing methods (password managers, secret vaults)

3. **Rotate keys if compromised**
   - Contact admin immediately if key is exposed
   - Keys can be regenerated

4. **Use different keys per environment**
   - Development vs Production
   - Per team/project if needed

5. **Restrict key access**
   - Only share with authorized team members
   - Document who has access

## Troubleshooting

### "Unauthorized" error

1. Check if API key is included in the request
2. Verify the key is correct (no extra spaces, quotes)
3. Ensure using `Authorization` header (not `Authentication`)
4. Try both `Bearer TOKEN` and just `TOKEN` formats

### CORS errors with authentication

Make sure your frontend includes the `Authorization` header in CORS preflight:

```javascript
fetch('https://webr.mimilabs.org/api/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  credentials: 'omit', // Don't send cookies
  body: JSON.stringify({ code: 'print(1 + 1)' })
});
```

## Getting Help

- **Request API key**: Contact admin@mimilabs.ai
- **Key not working**: Verify format and try test request
- **Key compromised**: Contact admin immediately for rotation
