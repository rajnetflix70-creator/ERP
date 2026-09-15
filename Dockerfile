# Stage 1: Build Frontend and Backend
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Install backend production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production
COPY backend/ ./backend/

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend ./backend

EXPOSE 3001

CMD ["node", "backend/src/server.js"]
