import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface ProcessingResult {
  input: string;
  output: string;
  success: boolean;
  hasIncludes: boolean;
}

interface ProcessingError {
  file: string;
  error: string;
}

interface ProcessingResults {
  processed: ProcessingResult[];
  errors: ProcessingError[];
  total: number;
}

/**
 * Extracts the content under a markdown heading (excluding the heading line).
 * @param content - The markdown content.
 * @param anchor - The header text (case-insensitive).
 * @returns The extracted section content.
 */
function extractSection(content: string, anchor: string): string {
  const lines = content.split('\n');
  const anchorRegex = new RegExp(`^#{1,6}\\s+${anchor.replace(/-/g, '[\\s\\-]?')}$`, 'i');
  const startIdx = lines.findIndex(line => anchorRegex.test(line.trim()));

  if (startIdx === -1) {
    throw new Error(`Section "${anchor}" not found`);
  }

  let endIdx = startIdx + 1;
  while (endIdx < lines.length && !/^#{1,6}\s+/.test(lines[endIdx])) {
    endIdx++;
  }

  return lines
    .slice(startIdx + 1, endIdx)
    .join('\n')
    .trim();
}

/**
 * Recursively resolves @include directives in a markdown file.
 * @param filePath - Path to the base markdown file.
 * @param seen - Tracks already processed files to prevent loops.
 * @returns The processed content with includes resolved.
 */
function resolveIncludes(filePath: string, seen: Set<string> = new Set()): string {
  if (seen.has(filePath)) throw new Error(`Circular include: ${filePath}`);
  seen.add(filePath);

  const content = fs.readFileSync(filePath, 'utf-8');

  return content.replace(/<!--\s*@include:\s*(.+?)\s*-->/g, (_, rawPath: string) => {
    let [includePath, anchor] = rawPath.trim().split('#');
    const fullPath = path.resolve(path.dirname(filePath), includePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const includedContent = fs.readFileSync(fullPath, 'utf-8');
    const section = anchor ? extractSection(includedContent, anchor.trim()) : includedContent;

    return resolveIncludesFromString(section, fullPath, new Set(seen));
  });
}

/**
 * Resolves includes within already-included string content.
 * @param content - Markdown content.
 * @param basePath - Path to base file (for relative resolving).
 * @param seen - Tracks visited files.
 * @returns The processed content with includes resolved.
 */
function resolveIncludesFromString(content: string, basePath: string, seen: Set<string>): string {
  return content.replace(/<!--\s*@include:\s*(.+?)\s*-->/g, (_, rawPath: string) => {
    let [includePath, anchor] = rawPath.trim().split('#');
    const fullPath = path.resolve(path.dirname(basePath), includePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const includedContent = fs.readFileSync(fullPath, 'utf-8');
    const section = anchor ? extractSection(includedContent, anchor.trim()) : includedContent;

    return resolveIncludesFromString(section, fullPath, new Set(seen));
  });
}

/**
 * Process all markdown files in the current directory
 * @param baseDir - Base directory to search for markdown files
 * @returns Processing results
 */
function processAllMarkdownFiles(baseDir: string = process.cwd()): ProcessingResults {
  const results: ProcessingResults = {
    processed: [],
    errors: [],
    total: 0
  };

  try {
    // Find all markdown files, excluding .vitepress and node_modules
    const markdownFiles = glob.sync('**/*.md', {
      cwd: baseDir,
      ignore: ['.vitepress/**', 'node_modules/**', 'dist/**', 'processed/**']
    });

    results.total = markdownFiles.length;

    for (const file of markdownFiles) {
      const filePath = path.join(baseDir, file);
      const outputPath = path.join(baseDir, 'processed', file);

      try {
        // Read the original content
        const originalContent = fs.readFileSync(filePath, 'utf-8');

        // Check if file contains @include directives
        const hasIncludes = /<!--\s*@include:\s*(.+?)\s*-->/g.test(originalContent);

        if (hasIncludes) {
          // Only process files that actually have includes
          const processedContent = resolveIncludes(filePath);

          // Create output directory if it doesn't exist
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          fs.writeFileSync(outputPath, processedContent, 'utf-8');
          results.processed.push({
            input: file,
            output: `processed/${file}`,
            success: true,
            hasIncludes: true
          });
        } else {
          // Skip files without includes but still count them as processed
          results.processed.push({
            input: file,
            output: 'skipped (no includes)',
            success: true,
            hasIncludes: false
          });
        }
      } catch (error) {
        results.errors.push({
          file: file,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  } catch (error) {
    results.errors.push({
      file: 'global',
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return results;
}

export { extractSection, resolveIncludes, processAllMarkdownFiles };
export type { ProcessingResult, ProcessingError, ProcessingResults };
