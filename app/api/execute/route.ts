/**
 * WebR Execution Endpoint
 *
 * POST /api/execute
 *
 * Executes R code in WebAssembly and returns results including:
 * - Console output
 * - Generated plots (as base64-encoded PNG images)
 * - Execution metrics
 *
 * Features:
 * - API key authentication
 * - JSON data injection as R data frames
 * - Automatic plot capture and encoding
 * - Request isolation using WebR shelters
 * - CORS support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWebRInstance } from '@/lib/webr-singleton';
import { verifyApiKey, unauthorizedResponse } from '@/lib/auth';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

// Force Node.js runtime (required for WebR)
export const runtime = 'nodejs';
export const maxDuration = 60; // R code execution can take time

/**
 * Convert JSON data to R data frame code
 *
 * Transforms a JSON array into R code that creates a data.frame.
 * Handles type conversion for strings, numbers, booleans, and null values.
 *
 * @param data - Array of objects to convert
 * @param varName - Name of the R variable to create (default: 'query_result')
 * @returns R code string that creates the data frame
 */
function jsonToRDataFrame(data: Record<string, unknown>[], varName: string = 'query_result'): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const columns: string[] = [];

  for (const header of headers) {
    const values = data.map(row => {
      const val = row[header];
      if (val === null || val === undefined) return 'NA';
      if (typeof val === 'string') {
        const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `"${escaped}"`;
      }
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      return 'NA';
    });
    const safeHeader = header.replace(/[^a-zA-Z0-9_]/g, '_');
    columns.push(`  ${safeHeader} = c(${values.join(', ')})`);
  }

  return `${varName} <- data.frame(\n${columns.join(',\n')},\n  stringsAsFactors = FALSE\n)`;
}

/**
 * CORS configuration for cross-origin requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Set dynamically per request
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Get CORS headers for the request origin
 *
 * Only allows requests from configured domains.
 * Modify allowedOrigins array to add/remove domains.
 *
 * @param origin - Request origin from headers
 * @returns CORS headers object
 */
function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'https://www.mimilabs.ai',
    'https://mimilabs.ai'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin,
    };
  }

  return corsHeaders;
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

/**
 * Handle POST requests to execute R code
 *
 * Request body:
 * {
 *   "code": "library(ggplot2)\nggplot(...)",  // Required: R code to execute
 *   "data": [{"col1": "val1"}]                 // Optional: JSON data to inject as query_result
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "output": "...",           // R console output
 *   "plots": ["base64..."],    // Array of base64-encoded PNG images
 *   "error": null,             // Error message if failed
 *   "executionTime": 234       // Execution time in milliseconds
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  // Step 1: Verify API key
  const authResult = verifyApiKey(request);
  if (!authResult.valid) {
    return unauthorizedResponse(authResult.error || 'Invalid credentials', headers);
  }

  try {
    // Step 2: Parse and validate request body
    const body = await request.json();
    const { code, data } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid "code" parameter',
          output: '',
          plots: [],
          executionTime: Date.now() - startTime
        },
        { status: 400, headers }
      );
    }

    // Step 3: Get WebR instance (initializes on first use)
    const webR = await getWebRInstance();

    // Step 4: Create isolated execution environment (shelter)
    // Shelters provide request isolation and automatic cleanup
    const shelter = await new webR.Shelter();

    try {
      // Step 5: Clean up old plot files from previous executions
      const tmpDir = '/tmp';
      const existingFiles = readdirSync(tmpDir);
      existingFiles.forEach(file => {
        if (file.startsWith('Rplot') || file.endsWith('.png') || file.endsWith('.pdf')) {
          try {
            unlinkSync(join(tmpDir, file));
          } catch (e) {
            // Ignore errors when cleaning up
          }
        }
      });

      // Step 6: Build the R code to execute
      let codeToRun = '';

      // Optional: Inject JSON data as R data frame named 'query_result'
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('[WebR] Injecting data as query_result data frame');
        const dataFrameCode = jsonToRDataFrame(data, 'query_result');
        if (dataFrameCode) {
          codeToRun += `# Auto-loaded data (${data.length} rows)\n${dataFrameCode}\n\n`;
        }
      }

      // Step 7: Wrap user code with automatic plot capture logic
      // This ensures plots are saved to /tmp and returned as base64
      codeToRun += `
# Clean up old plot files from previous executions
.old_plots <- list.files("/tmp", pattern = "\\\\.(png|jpg|jpeg)$", full.names = TRUE)
if (length(.old_plots) > 0) file.remove(.old_plots)

# Execute user code and capture result
.result <- {
  ${code}
}

# If result is a ggplot, save it automatically
if (inherits(.result, "ggplot")) {
  .plot_file <- "/tmp/Rplot001.png"
  ggsave(.plot_file, .result, width = 10, height = 6, dpi = 150)
}

# Close any remaining devices
while(dev.cur() > 1) dev.off()

# Return list of plot files created
list.files("/tmp", pattern = "\\\\.(png|jpg|jpeg)$", full.names = TRUE)
`;

      console.log('[WebR] Executing R code');

      // Step 8: Execute R code in isolated shelter
      // captureR returns console output, conditions (errors/warnings), and result
      const result = await shelter.captureR(codeToRun, {
        withAutoprint: true,           // Print last expression automatically
        captureStreams: true,           // Capture stdout/stderr
        captureConditions: true,        // Capture errors/warnings
        captureGraphics: false,         // File-based capture instead (Node.js compatible)
      });

      // Step 9: Process console output (stdout/stderr)
      let outputText = '';
      if (result.output) {
        for (const item of result.output) {
          if (item.type === 'stdout') {
            outputText += item.data + '\n';
          } else if (item.type === 'stderr') {
            outputText += '[stderr] ' + item.data + '\n';
          }
        }
      }

      // Step 10: Check for R errors and warnings
      let errorMessage = '';
      if (result.conditions) {
        for (const cond of result.conditions) {
          if (cond.type === 'error') {
            errorMessage += cond.message + '\n';
          } else if (cond.type === 'warning') {
            outputText += '[Warning] ' + cond.message + '\n';
          }
        }
      }

      if (errorMessage) {
        await shelter.purge();
        return NextResponse.json({
          success: false,
          output: outputText.trim(),
          plots: [],
          error: errorMessage.trim(),
          executionTime: Date.now() - startTime,
        }, { status: 500, headers });
      }

      // Step 11: Extract plot files and convert to base64
      const plots: string[] = [];

      if (result.result) {
        try {
          // Get list of plot file paths from R execution result
          const plotFilesResult = await result.result.toJs();

          // Extract file paths from R character vector
          let files: string[] = [];
          if (plotFilesResult && typeof plotFilesResult === 'object' && 'values' in plotFilesResult) {
            files = plotFilesResult.values || [];
          } else if (Array.isArray(plotFilesResult)) {
            files = plotFilesResult;
          }

          // Read each plot file and convert to base64
          for (let i = 0; i < files.length; i++) {
            const filename = files[i];
            if (typeof filename === 'string' && filename.startsWith('/tmp/')) {
              try {
                // Use R's readBin to read file as raw bytes
                const readResult = await webR.evalR(`
                  .f <- "${filename}"
                  if (file.exists(.f)) {
                    .raw <- readBin(.f, "raw", file.info(.f)$size)
                    .raw
                  } else {
                    raw(0)
                  }
                `);
                const rawData = await readResult.toJs();

                // Convert R raw vector to Node.js Buffer
                let bytes: number[] = [];
                if (rawData && typeof rawData === 'object' && 'values' in rawData) {
                  bytes = rawData.values || [];
                } else if (Array.isArray(rawData)) {
                  bytes = rawData;
                }

                if (bytes.length > 0) {
                  const buffer = Buffer.from(bytes);
                  const base64 = buffer.toString('base64');
                  plots.push(base64);
                  console.log(`[WebR] Captured plot: ${filename}`);
                }
              } catch (readErr) {
                console.warn(`[WebR] Failed to read ${filename}:`, readErr);
              }
            }
          }
        } catch (err) {
          console.warn('[WebR] Failed to extract plot files:', err);
        }
      }

      const executionTime = Date.now() - startTime;
      console.log(`[WebR] Request completed in ${executionTime}ms`);

      // Step 12: Clean up shelter (release R objects)
      await shelter.purge();

      // Step 13: Return successful response
      return NextResponse.json(
        {
          success: true,
          output: outputText.trim(),
          plots,
          error: null,
          executionTime
        },
        { headers }
      );
    } catch (execError: any) {
      // Clean up shelter even on error
      await shelter.purge();
      throw execError;
    }

  } catch (error: any) {
    // Handle any errors during request processing
    const executionTime = Date.now() - startTime;
    console.error('[WebR] Execution error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred',
        output: '',
        plots: [],
        executionTime
      },
      { status: 500, headers }
    );
  }
}
