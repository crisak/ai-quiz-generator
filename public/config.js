/**
 * Runtime Configuration - Loaded BEFORE React mounts
 * This file is NOT compiled by Vite - it's served as-is
 * This prevents API keys from being hardcoded in the JavaScript bundle
 */

(function() {
  // Try to read API key from various sources (in priority order)
  var apiKey = '';

  // 1. Check if injected by server/deployment (e.g., via HTML attribute or env var)
  if (window.__GEMINI_API_KEY__) {
    apiKey = window.__GEMINI_API_KEY__;
  }

  // 2. For development: Try to read from a separate .env config (if available)
  // This won't work in pure SPA, but useful for some deployment scenarios
  else if (window.__ENV_CONFIG__?.VITE_GEMINI_API_KEY) {
    apiKey = window.__ENV_CONFIG__.VITE_GEMINI_API_KEY;
  }

  // 3. Try to read from sessionStorage (user might have pasted it)
  else if (typeof sessionStorage !== 'undefined') {
    apiKey = sessionStorage.getItem('GEMINI_API_KEY') || '';
  }

  // Set the config
  if (window.__QUIZ_IA_CONFIG__) {
    window.__QUIZ_IA_CONFIG__.GEMINI_API_KEY = apiKey;
  }

  // Log status (for debugging)
  if (!apiKey) {
    console.warn('[Quiz IA] ⚠️ GEMINI_API_KEY not configured. App will not work until you set it.');
    console.warn('[Quiz IA] How to configure:');
    console.warn('  1. Development: Create .env.local with VITE_GEMINI_API_KEY=your_key');
    console.warn('  2. Production: Set VITE_GEMINI_API_KEY environment variable on your server');
    console.warn('  3. Or inject window.__GEMINI_API_KEY__ = "your_key" before loading the app');
  }
})();
