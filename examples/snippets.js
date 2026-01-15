// ============================================
// WebR API - Copy-Paste Code Snippets
// Base URL: https://webr.mimilabs.org
// ============================================

// ============================================
// 1. Simple JavaScript/TypeScript Function
// ============================================
async function executeR(code, data = null) {
  const response = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, data })
  });
  return await response.json();
}

// Usage:
const result = await executeR(`
  library(ggplot2)
  ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
`);

console.log(result.plots); // Array of base64 PNGs


// ============================================
// 2. React Hook
// ============================================
import { useState, useCallback } from 'react';

function useWebR() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (code, data = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://webr.mimilabs.org/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, data })
      });

      const result = await response.json();

      if (result.success) {
        setResult(result);
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, execute };
}

// Usage in component:
function MyComponent() {
  const { result, loading, execute } = useWebR();

  const runAnalysis = () => {
    execute(`
      library(ggplot2)
      ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
    `);
  };

  return (
    <div>
      <button onClick={runAnalysis} disabled={loading}>
        Run Analysis
      </button>
      {result?.plots.map((plot, i) => (
        <img key={i} src={`data:image/png;base64,${plot}`} alt={`Plot ${i}`} />
      ))}
    </div>
  );
}


// ============================================
// 3. Node.js/Express Middleware
// ============================================
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/r-analysis', async (req, res) => {
  const { code, data } = req.body;

  try {
    const response = await fetch('https://webr.mimilabs.org/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, data })
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ============================================
// 4. With SQL Data Injection
// ============================================
async function analyzeFromDatabase() {
  // Get data from your database
  const sqlResults = await db.query('SELECT * FROM sales WHERE date > ?', ['2024-01-01']);

  // Run R analysis
  const result = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `
        library(ggplot2)
        library(dplyr)

        # query_result is automatically available
        summary_data <- query_result %>%
          group_by(category) %>%
          summarise(total = sum(amount), avg = mean(amount))

        print(summary_data)

        ggplot(query_result, aes(x=category, y=amount)) +
          geom_boxplot() +
          theme_minimal()
      `,
      data: sqlResults
    })
  });

  return await result.json();
}


// ============================================
// 5. Display Plots in HTML
// ============================================
async function displayPlot() {
  const result = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()'
    })
  }).then(r => r.json());

  if (result.success && result.plots.length > 0) {
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${result.plots[0]}`;
    img.style.maxWidth = '100%';
    document.getElementById('plot-container').appendChild(img);
  }
}


// ============================================
// 6. Download Plot as File
// ============================================
async function downloadPlot() {
  const result = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'library(ggplot2)\nggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()'
    })
  }).then(r => r.json());

  if (result.success && result.plots.length > 0) {
    // Convert base64 to blob
    const byteCharacters = atob(result.plots[0]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plot.png';
    a.click();
    URL.revokeObjectURL(url);
  }
}


// ============================================
// 7. Multiple Plots
// ============================================
async function generateMultiplePlots() {
  const result = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `
        library(ggplot2)

        # Plot 1
        p1 <- ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
        ggsave("/tmp/plot1.png", p1, width=10, height=6)

        # Plot 2
        p2 <- ggplot(mtcars, aes(x=hp, y=mpg)) + geom_point()
        ggsave("/tmp/plot2.png", p2, width=10, height=6)
      `
    })
  }).then(r => r.json());

  // result.plots[0] = first plot
  // result.plots[1] = second plot
  return result.plots;
}


// ============================================
// 8. Error Handling
// ============================================
async function executeWithErrorHandling(code, data = null) {
  try {
    const response = await fetch('https://webr.mimilabs.org/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, data })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`R Error: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('WebR API Error:', error);
    // Show user-friendly error message
    alert('Analysis failed. Please try again or contact support.');
    throw error;
  }
}


// ============================================
// 9. Check Server Status
// ============================================
async function checkServerStatus() {
  try {
    const response = await fetch('https://webr.mimilabs.org/api/health');
    const status = await response.json();

    if (!status.webrInitialized) {
      console.warn('WebR is still initializing. Please wait...');
      return false;
    }

    console.log('Server ready!', status);
    return true;
  } catch (error) {
    console.error('Server unavailable:', error);
    return false;
  }
}


// ============================================
// 10. Full Example: SQL → R → Display
// ============================================
async function fullWorkflowExample() {
  // Step 1: Check if server is ready
  const isReady = await checkServerStatus();
  if (!isReady) {
    alert('Server is initializing. Please wait a few minutes.');
    return;
  }

  // Step 2: Fetch data from your database
  const data = await fetch('/api/database/query').then(r => r.json());

  // Step 3: Run R analysis
  const result = await fetch('https://webr.mimilabs.org/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `
        library(ggplot2)
        library(dplyr)

        # Analyze SQL data
        summary <- query_result %>%
          group_by(category) %>%
          summarise(
            total = sum(value),
            average = mean(value),
            count = n()
          )

        print(summary)

        # Create visualization
        ggplot(query_result, aes(x=category, y=value, fill=category)) +
          geom_boxplot() +
          theme_minimal() +
          labs(title="Value Distribution by Category")
      `,
      data: data
    })
  }).then(r => r.json());

  // Step 4: Display results
  if (result.success) {
    // Show console output
    document.getElementById('output').textContent = result.output;

    // Display plot
    const img = document.createElement('img');
    img.src = `data:image/png;base64,${result.plots[0]}`;
    document.getElementById('plot-container').appendChild(img);

    // Show execution time
    console.log(`Analysis completed in ${result.executionTime}ms`);
  }
}
