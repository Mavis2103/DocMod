import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function includeMarkdownSections(): Plugin {
  return {
    name: 'vitepress-include-markdown-sections',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.md')) return;

      return code.replace(/<!--\s*@include:\s*(.+?)\s*-->/g, (_, rawPath) => {
        let [includePath, anchor] = rawPath.trim().split('#');
        const fullPath = path.resolve(path.dirname(id), includePath);

        if (!fs.existsSync(fullPath)) {
          return `<!-- File not found: ${includePath} -->`;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');

        if (!anchor) return content;

        const lines = content.split('\n');
        const anchorRegex = new RegExp(`^#{1,6}\\s+${anchor.replace(/-/g, '[\\s\\-]?')}$`, 'i');
        const startIdx = lines.findIndex(line => anchorRegex.test(line.trim()));

        if (startIdx === -1) {
          return `<!-- Section not found: ${anchor} -->`;
        }

        let endIdx = startIdx + 1;
        while (endIdx < lines.length && !/^#{1,6}\s+/.test(lines[endIdx])) {
          endIdx++;
        }

        // ✅ Only return content under the heading, not the heading itself
        const section = lines
          .slice(startIdx + 1, endIdx)
          .join('\n')
          .trim();
        return section;
      });
    }
  };
}
