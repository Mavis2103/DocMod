# DocMod BFF (Backend for Frontend)

HTTP Server với Bun + TypeScript cho việc deploy markdown files. Đây là BFF server tách riêng từ docmod project để xử lý các API endpoints.

## 🚀 Tính năng

- ✅ **TypeScript** với type safety hoàn chỉnh
- ✅ **Bun runtime** cho hiệu suất cao
- ✅ Nhận multiple file .md
- ✅ Validate commit hash
- ✅ Copy toàn bộ folder /release từ docmod
- ✅ Replace file .md vào đúng vị trí
- ✅ CORS support
- ✅ Error handling với typed responses
- ✅ Health check endpoint
- ✅ Giao diện web để test

## Cài đặt

1. Cài đặt Bun (nếu chưa có):

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Cài đặt dependencies:

```bash
bun install
```

3. Kiểm tra TypeScript (optional):

```bash
bun run type-check
```

## Chạy server

```bash
# Chạy TypeScript server
bun run server

# Hoặc chạy với watch mode (tự động restart khi code thay đổi)
bun run dev

# Chạy JavaScript server (fallback)
bun run server:js
```

Server sẽ chạy tại: `http://localhost:3000`

## API Endpoints

### POST /deploy

Deploy markdown files với commit hash

**Request:**

- Content-Type: `multipart/form-data`
- Fields:
  - `commitHash`: String - Git commit hash
  - `file_[filename]`: File - Markdown files (\*.md)

**Response:**

```json
{
  "success": true,
  "message": "Đã tạo thành công folder abc123 với 3 file .md",
  "folder": "abc123",
  "filesProcessed": 3
}
```

### GET /health

Health check endpoint

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

Mở `test.html` trong browser hoặc truy cập trực tiếp để test API endpoints.

## Project Structure

```
docmod-bff/
├── server.ts          # Main server file
├── types.ts           # TypeScript type definitions
├── test.html          # Web interface for testing
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Dependencies

- **Bun**: Runtime và package manager
- **TypeScript**: Type safety
- **@types/bun**: Type definitions cho Bun

## Environment

Server được thiết kế để hoạt động với:

- **Port**: 3000 (default)
- **Release folder**: `../docmod/release/` (relative path từ docmod project)
