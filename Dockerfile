# Reproducible dev environment for Wartlock.
#
# Use this image to run typecheck, lint, and any non-Electron tooling in
# isolation — e.g. as part of a multi-repo monorepo build, or for pre-push
# checks on a non-Windows workstation.
#
# NOTE: we deliberately do NOT build the Windows installer from here.
# Wartlock ships native modules (better-sqlite3, keytar) that need the
# Windows SDK + MSVC toolchain, and Wine-based electron-builder cross
# compilation doesn't rebuild those for the Windows ABI cleanly. For the
# real Windows installer, use the GitHub Actions workflow at
# `.github/workflows/release-windows.yml` (runs on `windows-latest`).

FROM node:22-bookworm-slim

WORKDIR /app

# Deps needed by electron-builder's install-app-deps rebuild on Linux,
# plus the system libsecret headers that `keytar` links against.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    libsecret-1-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# --ignore-scripts skips electron-builder install-app-deps so we don't try
# to rebuild native modules for Linux. They're only needed at runtime.
RUN npm install --ignore-scripts

COPY . .

# Default: typecheck. Override with any npm script you like:
#   docker run --rm -v ${PWD}:/app wartlock npm run lint
CMD ["npm", "run", "typecheck"]
