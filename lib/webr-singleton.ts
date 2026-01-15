// WebR singleton for reuse across requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webrInstance: any = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

const REQUIRED_PACKAGES = [
  'ggplot2',
  'dplyr',
  'tidyr',
  'survey',
  'srvyr',
  'broom'
];

// Initialize WebR (singleton pattern for warm starts)
export async function getWebRInstance() {
  if (webrInstance) {
    return webrInstance;
  }

  if (isInitializing && initPromise) {
    await initPromise;
    return webrInstance;
  }

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

      // Install required packages
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

export function isWebRInitialized(): boolean {
  return !!webrInstance;
}
