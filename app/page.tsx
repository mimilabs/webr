export default function Home() {
  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '100px auto',
      padding: '20px'
    }}>
      <h1>WebR API Server</h1>
      <p>This is an API-only server for executing R code using WebR.</p>

      <h2>Available Endpoints:</h2>
      <ul>
        <li><code>GET /api/health</code> - Health check</li>
        <li><code>POST /api/execute</code> - Execute R code</li>
      </ul>

      <h2>Documentation:</h2>
      <p>
        See <a href="https://github.com/anthropics/webr-api" style={{color: '#0070f3'}}>API documentation</a> for usage examples.
      </p>

      <h2>Quick Example:</h2>
      <pre style={{
        background: '#f5f5f5',
        padding: '15px',
        borderRadius: '5px',
        overflow: 'auto'
      }}>
{`curl -X POST https://webr.mimilabs.org/api/execute \\
  -H "Content-Type: application/json" \\
  -d '{"code": "library(ggplot2)\\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()"}'`}
      </pre>
    </div>
  );
}
