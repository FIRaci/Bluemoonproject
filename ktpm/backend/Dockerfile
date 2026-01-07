# Sử dụng Bun image với Debian (có OpenSSL)
FROM oven/bun:1-debian as base
WORKDIR /app

# Cài đặt OpenSSL cho Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy package files và cài đặt dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Expose port 3000
EXPOSE 3000

# Chạy migration khi start (để tự động tạo bảng nếu DB trống)
CMD bunx prisma migrate deploy && bun run src/index.ts
