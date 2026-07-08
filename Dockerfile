# Aurex — production image (Next.js + Socket.io custom server)
#
# Deploy this on any host that runs a long-lived container and supports
# WebSockets: Railway, Render, Koyeb, Fly.io, or a VPS.
# (Vercel will NOT work — it can't hold the websocket connection.)

FROM node:22-alpine

WORKDIR /app

# Install ALL dependencies. NODE_ENV is intentionally left unset here so that
# devDependencies (typescript, tailwindcss, etc.) are installed — they are
# required by `next build`.
COPY package*.json ./
RUN npm ci

# Copy source and build the production bundle.
COPY . .
RUN npm run build

# Runtime configuration (only set AFTER the build).
ENV NODE_ENV=production
# Hosts inject PORT automatically; default to 3002 for local `docker run`.
ENV PORT=3002
EXPOSE 3002

# Starts the custom server (Next.js + Socket.io) — see server.js.
CMD ["node", "server.js"]
