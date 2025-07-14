# Multi-stage build cho production
FROM oven/bun:latest as builder

# Đặt working directory
WORKDIR /app

# Copy package.json và bun.lock
COPY package.json ./
COPY bun.lock* ./

# Cài đặt dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Chạy type check
RUN bun run type-check

# Production stage
FROM oven/bun:latest as production

# Cài đặt curl cho health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Đặt working directory
WORKDIR /app

# Copy package.json và bun.lock
COPY package.json ./
COPY bun.lock* ./

# Cài đặt chỉ production dependencies
RUN bun install --frozen-lockfile --production

# Copy source code từ builder stage
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/types.ts ./
COPY --from=builder /app/default ./
# COPY --from=builder /app/default ./default/

# Tạo non-root user để chạy application
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
# Đảm bảo data directory có permissions đúng
RUN chmod 755 /app
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Chạy ứng dụng
CMD ["bun", "run", "server.ts"]
