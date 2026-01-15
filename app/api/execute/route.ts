import { NextRequest, NextResponse } from 'next/server';
import { getWebRInstance } from '@/lib/webr-singleton';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

// Force Node.js runtime (required for WebR)
export const runtime = 'nodejs';
export const maxDuration = 60; // R code execution can take time

// Convert JSON data to R data frame code
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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Will be set dynamically
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  try {
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

    // Get WebR instance (will initialize if needed)
    const webR = await getWebRInstance();

    // Create shelter for this execution
    const shelter = await new webR.Shelter();

    try {
      // Clear any existing plots in /tmp
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

      // Build the code to execute
      let codeToRun = '';

      // Inject SQL data if provided
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('[WebR] Injecting data as query_result data frame');
        const dataFrameCode = jsonToRDataFrame(data, 'query_result');
        if (dataFrameCode) {
          codeToRun += `# Auto-loaded SQL data (${data.length} rows)\n${dataFrameCode}\n\n`;
        }
      }

      // User code with automatic plot capture
      // Wrap user code in expression that captures the last value and prints it if it's a plot
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

      // Execute the code using shelter.captureR
      const result = await shelter.captureR(codeToRun, {
        withAutoprint: true,
        captureStreams: true,
        captureConditions: true,
        captureGraphics: false, // Disabled for Node.js - using file-based capture
      });

      // Extract output
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

      // Check for errors first
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

      // Extract plot files and convert to base64
      const plots: string[] = [];

      if (result.result) {
        try {
          const plotFilesResult = await result.result.toJs();

          // Extract file paths from R character vector
          let files: string[] = [];
          if (plotFilesResult && typeof plotFilesResult === 'object' && 'values' in plotFilesResult) {
            files = plotFilesResult.values || [];
          } else if (Array.isArray(plotFilesResult)) {
            files = plotFilesResult;
          }

          // Read and convert each plot file
          for (let i = 0; i < files.length; i++) {
            const filename = files[i];
            if (typeof filename === 'string' && filename.startsWith('/tmp/')) {
              try {
                // Read file using R's readBin
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

                // Convert raw vector to buffer
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

      await shelter.purge();

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
      await shelter.purge();
      throw execError;
    }

  } catch (error: any) {
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
