/**
 * WebR Singleton Manager
 *
 * Maintains a single WebR instance across all API requests to avoid
 * expensive reinitialization (2-5 minutes). The instance stays warm
 * in memory with all packages pre-loaded.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webrInstance: any = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

/**
 * R packages installed automatically on first startup
 * These packages are specifically chosen for charting and data analysis in LLM operations
 *
 * NOTE: Package installation can take 30-60 seconds. Only essential packages are included.
 */
const REQUIRED_PACKAGES = [
  'ggplot2',  // Data visualization - most critical for charting
  // Commented out to speed up initialization - can be added back if needed:
  // 'dplyr',    // Data manipulation
  // 'tidyr',    // Data tidying
  // 'survey',   // Survey statistics
  // 'srvyr',    // dplyr-style survey analysis
  // 'broom'     // Tidy model outputs
];

/**
 * Get or initialize the WebR instance (singleton pattern)
 *
 * @returns The WebR instance, ready for R code execution
 * @throws Error if initialization fails
 */
export async function getWebRInstance() {
  // Return existing instance if available (fast path)
  if (webrInstance) {
    return webrInstance;
  }

  // If another request is already initializing, wait for it
  if (isInitializing && initPromise) {
    await initPromise;
    return webrInstance;
  }

  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      const startTime = Date.now();
      console.log('[WebR] Initializing WebR instance...');

      // Dynamic import for Node.js compatibility
      const { WebR } = await import('webr');
      const webR = new WebR();
      await webR.init();

      console.log(`[WebR] Core initialized in ${Date.now() - startTime}ms`);

      // Install required packages from WebAssembly package repository
      // This happens only once per server lifetime
      console.log('[WebR] Installing R packages from repo.r-wasm.org...');
      for (const pkg of REQUIRED_PACKAGES) {
        console.log(`[WebR] Installing package: ${pkg}`);
        try {
          await webR.installPackages([pkg], {
            repos: 'https://repo.r-wasm.org/',
            quiet: false
          });
          console.log(`[WebR] Package ${pkg} installed successfully`);
        } catch (error) {
          console.error(`[WebR] Failed to install package ${pkg}:`, error);
          // Continue installing other packages even if one fails
        }
      }

      console.log(`[WebR] Fully initialized in ${Date.now() - startTime}ms`);
      webrInstance = webR;
    } catch (error) {
      console.error('[WebR] Initialization failed:', error);
      isInitializing = false;
      initPromise = null;
      throw error;
    }
  })();

  await initPromise;
  isInitializing = false;
  return webrInstance;
}

/**
 * Check if WebR is initialized and ready for use
 *
 * @returns true if WebR is ready, false if still initializing or not started
 */
export function isWebRInitialized(): boolean {
  return !!webrInstance;
}
