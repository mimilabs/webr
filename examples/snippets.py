"""
WebR API - Python Code Snippets
Base URL: https://webr.mimilabs.org
"""

import requests
import base64
import json
from typing import Optional, Dict, List, Any
from io import BytesIO
from PIL import Image


# ============================================
# 1. Simple Function
# ============================================
def execute_r(code: str, data: Optional[List[Dict]] = None) -> Dict:
    """Execute R code on WebR server."""
    url = "https://webr.mimilabs.org/api/execute"
    payload = {"code": code}

    if data:
        payload["data"] = data

    response = requests.post(url, json=payload)
    response.raise_for_status()

    return response.json()


# Usage:
result = execute_r("""
library(ggplot2)
ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
""")

print(f"Generated {len(result['plots'])} plots")


# ============================================
# 2. Save Plots to Files
# ============================================
def save_plots(result: Dict, prefix: str = "plot"):
    """Save plots from result to PNG files."""
    if not result.get("success"):
        raise Exception(f"R execution failed: {result.get('error')}")

    for i, base64_plot in enumerate(result["plots"]):
        # Decode base64 to image
        plot_data = base64.b64decode(base64_plot)
        img = Image.open(BytesIO(plot_data))

        # Save to file
        filename = f"{prefix}_{i+1}.png"
        img.save(filename)
        print(f"Saved {filename}")


# Usage:
result = execute_r("""
library(ggplot2)
ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
""")
save_plots(result)


# ============================================
# 3. With SQL Data
# ============================================
def analyze_sql_data(sql_results: List[Dict]) -> Dict:
    """Run R analysis on SQL query results."""
    r_code = """
    library(ggplot2)
    library(dplyr)

    # query_result is automatically available
    summary_data <- query_result %>%
      group_by(category) %>%
      summarise(
        total = sum(value),
        average = mean(value),
        count = n()
      )

    print(summary_data)

    ggplot(query_result, aes(x=category, y=value, fill=category)) +
      geom_boxplot() +
      theme_minimal()
    """

    return execute_r(r_code, sql_results)


# Usage:
sql_data = [
    {"category": "A", "value": 10},
    {"category": "A", "value": 15},
    {"category": "B", "value": 20},
    {"category": "B", "value": 25},
]

result = analyze_sql_data(sql_data)
print(result["output"])


# ============================================
# 4. Check Server Status
# ============================================
def check_server_status() -> bool:
    """Check if WebR server is ready."""
    try:
        response = requests.get("https://webr.mimilabs.org/api/health")
        status = response.json()

        if not status.get("webrInitialized"):
            print("WebR is still initializing. Please wait...")
            return False

        print(f"Server ready! Uptime: {status.get('uptime')}s")
        return True
    except Exception as e:
        print(f"Server unavailable: {e}")
        return False


# ============================================
# 5. Error Handling
# ============================================
def execute_r_safe(code: str, data: Optional[List[Dict]] = None) -> Dict:
    """Execute R code with error handling."""
    try:
        result = execute_r(code, data)

        if not result.get("success"):
            raise Exception(f"R Error: {result.get('error')}")

        return result

    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        raise
    except Exception as e:
        print(f"Execution error: {e}")
        raise


# ============================================
# 6. Multiple Plots
# ============================================
def generate_multiple_plots() -> List[str]:
    """Generate multiple plots in one request."""
    code = """
    library(ggplot2)

    # Plot 1: Scatter
    p1 <- ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
    ggsave("/tmp/plot1.png", p1, width=10, height=6)

    # Plot 2: Histogram
    p2 <- ggplot(mtcars, aes(x=mpg)) + geom_histogram(bins=10)
    ggsave("/tmp/plot2.png", p2, width=10, height=6)
    """

    result = execute_r(code)
    return result["plots"]  # Returns list of base64 strings


# ============================================
# 7. Statistical Analysis
# ============================================
def run_regression(data: List[Dict]) -> str:
    """Run linear regression and get results."""
    code = """
    library(broom)

    # Run regression
    model <- lm(value ~ category + age, data=query_result)

    # Get tidy output
    results <- tidy(model)
    print(results)

    # Model summary
    summary_stats <- glance(model)
    print(summary_stats)
    """

    result = execute_r(code, data)
    return result["output"]


# ============================================
# 8. Survey Analysis
# ============================================
def analyze_survey(survey_data: List[Dict]) -> Dict:
    """Perform survey analysis with weights."""
    code = """
    library(survey)
    library(srvyr)

    # Create survey design
    svy <- query_result %>%
      as_survey_design(weights = weight)

    # Calculate weighted statistics
    results <- svy %>%
      summarise(
        mean_income = survey_mean(income),
        median_age = survey_median(age)
      )

    print(results)
    """

    return execute_r(code, survey_data)


# ============================================
# 9. Class-Based Interface
# ============================================
class WebRClient:
    """Client for WebR API."""

    def __init__(self, base_url: str = "https://webr.mimilabs.org"):
        self.base_url = base_url

    def health(self) -> Dict:
        """Check server health."""
        response = requests.get(f"{self.base_url}/api/health")
        return response.json()

    def execute(self, code: str, data: Optional[List[Dict]] = None) -> Dict:
        """Execute R code."""
        url = f"{self.base_url}/api/execute"
        payload = {"code": code}

        if data:
            payload["data"] = data

        response = requests.post(url, json=payload, timeout=65)
        response.raise_for_status()

        result = response.json()

        if not result.get("success"):
            raise Exception(f"R Error: {result.get('error')}")

        return result

    def save_plots(self, result: Dict, output_dir: str = ".") -> List[str]:
        """Save plots from result to files."""
        import os

        filenames = []
        for i, base64_plot in enumerate(result["plots"]):
            plot_data = base64.b64decode(base64_plot)
            img = Image.open(BytesIO(plot_data))

            filename = os.path.join(output_dir, f"plot_{i+1}.png")
            img.save(filename)
            filenames.append(filename)

        return filenames


# Usage:
client = WebRClient()

# Check status
status = client.health()
print(f"Server ready: {status['webrInitialized']}")

# Execute code
result = client.execute("""
library(ggplot2)
ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
""")

# Save plots
files = client.save_plots(result)
print(f"Saved plots: {files}")


# ============================================
# 10. Full Workflow Example
# ============================================
def full_workflow_example():
    """Complete example: Database → R → Results."""
    import sqlite3

    # Step 1: Check server
    if not check_server_status():
        print("Server not ready. Exiting.")
        return

    # Step 2: Get data from database
    conn = sqlite3.connect('mydata.db')
    cursor = conn.execute("SELECT category, value FROM sales WHERE year = 2024")
    columns = [desc[0] for desc in cursor.description]
    data = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()

    # Step 3: Run R analysis
    code = """
    library(ggplot2)
    library(dplyr)

    # Analyze data
    summary <- query_result %>%
      group_by(category) %>%
      summarise(
        total = sum(value),
        average = mean(value),
        count = n()
      ) %>%
      arrange(desc(total))

    print(summary)

    # Visualize
    ggplot(query_result, aes(x=reorder(category, value), y=value, fill=category)) +
      geom_boxplot() +
      coord_flip() +
      theme_minimal() +
      labs(title="Sales by Category", x="Category", y="Value")
    """

    result = execute_r(code, data)

    # Step 4: Process results
    if result["success"]:
        print("Analysis Output:")
        print(result["output"])

        print(f"\nExecution time: {result['executionTime']}ms")
        print(f"Generated {len(result['plots'])} plots")

        # Save plots
        save_plots(result, prefix="sales_analysis")

        return result
    else:
        print(f"Error: {result['error']}")
        return None


# ============================================
# 11. Async Version (with aiohttp)
# ============================================
import asyncio
import aiohttp


async def execute_r_async(code: str, data: Optional[List[Dict]] = None) -> Dict:
    """Execute R code asynchronously."""
    url = "https://webr.mimilabs.org/api/execute"
    payload = {"code": code}

    if data:
        payload["data"] = data

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, timeout=65) as response:
            response.raise_for_status()
            return await response.json()


# Usage:
async def main():
    result = await execute_r_async("""
    library(ggplot2)
    ggplot(mtcars, aes(x=wt, y=mpg)) + geom_point()
    """)
    print(f"Generated {len(result['plots'])} plots")


# asyncio.run(main())


# ============================================
# 12. Pandas Integration
# ============================================
import pandas as pd


def analyze_dataframe(df: pd.DataFrame, r_code: str) -> Dict:
    """Execute R code on a pandas DataFrame."""
    # Convert DataFrame to list of dicts
    data = df.to_dict('records')

    return execute_r(r_code, data)


# Usage:
df = pd.DataFrame({
    'category': ['A', 'A', 'B', 'B'],
    'value': [10, 15, 20, 25]
})

result = analyze_dataframe(df, """
library(ggplot2)
ggplot(query_result, aes(x=category, y=value)) + geom_boxplot()
""")


if __name__ == "__main__":
    # Run examples
    print("Testing WebR API...")

    # Check status
    if check_server_status():
        # Simple test
        result = execute_r("print(1 + 1)")
        print("Output:", result["output"])
        print("Test passed!")
