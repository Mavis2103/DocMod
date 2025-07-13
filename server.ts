import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import type { DeployResponse, ErrorResponse, HealthResponse, NotFoundResponse, ApiResponse } from './types';

const PORT: number = 3000;

// Hàm copy folder recursively
function copyFolderRecursive(source: string, target: string): void {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  const files: string[] = readdirSync(source);

  for (const file of files) {
    const sourcePath: string = join(source, file);
    const targetPath: string = join(target, file);

    if (statSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

// Hàm replace file .md trong folder
async function replaceMarkdownFiles(targetFolder: string, markdownFiles: Record<string, string>): Promise<void> {
  for (const [filePath, content] of Object.entries(markdownFiles)) {
    const fullPath: string = join(targetFolder, filePath);

    // Tạo thư mục parent nếu chưa tồn tại
    const parentDir: string = dirname(fullPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // Ghi file
    await Bun.write(fullPath, content);
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/deploy' && request.method === 'POST') {
      try {
        const contentType: string | null = request.headers.get('content-type');

        if (!contentType || !contentType.includes('multipart/form-data')) {
          const errorResponse: ErrorResponse = {
            error: 'Content-Type phải là multipart/form-data'
          };
          return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const formData: FormData = await request.formData();
        const commitHash: FormDataEntryValue | null = formData.get('commitHash');

        if (!commitHash || typeof commitHash !== 'string') {
          const errorResponse: ErrorResponse = { error: 'Thiếu commit hash' };
          return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Lấy tất cả file .md từ form data
        const markdownFiles: Record<string, string> = {};
        let fileCount: number = 0;

        for (const [key, value] of formData.entries()) {
          if (key.startsWith('file_') && value && typeof value === 'object' && 'text' in value) {
            const fileName: string = key.substring(5); // Remove 'file_' prefix
            if (extname(fileName) === '.md') {
              markdownFiles[fileName] = await (value as File).text();
              fileCount++;
            }
          }
        }

        if (fileCount === 0) {
          const errorResponse: ErrorResponse = { error: 'Không tìm thấy file .md nào' };
          return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Tạo folder với tên commit hash
        const targetFolder: string = join(process.cwd(), commitHash);

        // Kiểm tra xem folder đã tồn tại chưa
        if (existsSync(targetFolder)) {
          const errorResponse: ErrorResponse = { error: `Folder ${commitHash} đã tồn tại` };
          return new Response(JSON.stringify(errorResponse), {
            status: 409,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Tạo folder và save các file .md theo đường dẫn của chúng
        await replaceMarkdownFiles(targetFolder, markdownFiles);

        const successResponse: DeployResponse = {
          success: true,
          message: `Đã tạo thành công folder ${commitHash} với ${fileCount} file .md`,
          folder: commitHash,
          filesProcessed: fileCount
        };

        return new Response(JSON.stringify(successResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error: any) {
        console.error('Error:', error);
        const errorResponse: ErrorResponse = {
          error: 'Internal server error: ' + error.message
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      const healthResponse: HealthResponse = {
        status: 'OK',
        timestamp: new Date().toISOString()
      };
      return new Response(JSON.stringify(healthResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Default response
    const notFoundResponse: NotFoundResponse = {
      error: 'Not found',
      availableEndpoints: ['POST /deploy - Deploy markdown files with commit hash', 'GET /health - Health check']
    };

    return new Response(JSON.stringify(notFoundResponse), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
console.log('📋 Endpoints:');
console.log('  POST /deploy - Deploy markdown files');
console.log('  GET /health - Health check');
