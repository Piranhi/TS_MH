/**
 * Treat any `*.html?raw` import as a plain string.
 * Vite (and most bundlers) already supply the actual runtime loader –
 * this file is only for the TS type‑checker.
 */
declare module '*.html?raw' {
    const source: string;
    export default source;
  }
  