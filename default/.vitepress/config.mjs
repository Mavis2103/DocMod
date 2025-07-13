import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import { includeMarkdownSections } from './plugins/vitepress-plugin-include-section.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitepress.dev/reference/site-config
export default defineConfig({
  markdown: {
    math: true
  },
  // Vite configuration
  vite: {
    plugins: [
      includeMarkdownSections(),
      // Custom plugin for markdown processing API
      {
        name: 'docmod-api',
        configureServer(server) {
          server.middlewares.use('/api/process-markdown', async (req, res, next) => {
            if (req.method === 'POST') {
              try {
                // Handle CORS preflight
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                // Dynamic import for ES modules
                const { processAllMarkdownFiles } = await import('./plugins/docmod-processor.ts');
                const result = processAllMarkdownFiles(path.dirname(__dirname));

                res.writeHead(200, {
                  'Content-Type': 'application/json'
                });
                res.end(JSON.stringify(result));
              } catch (error) {
                console.error('DocMod API Error:', error);
                res.writeHead(500, {
                  'Content-Type': 'application/json'
                });
                res.end(
                  JSON.stringify({
                    error: error.message,
                    total: 0,
                    processed: [],
                    errors: [{ file: 'global', error: error.message }]
                  })
                );
              }
            } else if (req.method === 'OPTIONS') {
              // Handle preflight request
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
              res.writeHead(200);
              res.end();
            } else {
              next();
            }
          });
        }
      }
    ]
  }
});
