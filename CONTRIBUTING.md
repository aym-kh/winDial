# Contributing

Thanks for helping build WinDial. This project is a Windows-first desktop utility built with Tauri, Angular, and Rust, and the roadmap in [.ai/roadmap.md](./.ai/roadmap.md) is the main source of truth for product scope and sequencing.

## Development setup

### Prerequisites

- [Node.js](https://nodejs.org/) 22 LTS
- [Rust toolchain](https://www.rust-lang.org/tools/install)
- [Visual Studio C++ build tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) for Windows native compilation

### Local setup

1. Clone the repository:

```bash
git clone https://github.com/aym-kh/windial.git
cd windial
```

2. Install dependencies:

```bash
npm install
```

3. Start the app in development mode:

```bash
npm run tauri dev
```

4. Build the desktop app for release:

```bash
npm run tauri build
```

## Repository layout

- `src/` — Angular frontend UI
- `src-tauri/` — Rust backend and Tauri configuration
- `docs/` — RFCs and release notes
- `.ai/roadmap.md` — product and engineering roadmap
- `scripts/release.mjs` — release automation helper

## Pull request workflow

1. Create a feature branch from `main`.
2. Keep the work scoped to a single theme or issue.
3. Update documentation when the behavior or release flow changes.
4. Open a PR with a clear title and a short summary of the changes.
5. Include screenshots, GIFs, or a short note if the change affects UI behavior.

## Release workflow

Maintainers use the release helper:

```bash
# Dry run to preview the next release
npm run release -- patch --dry-run

# Create the next release
npm run release -- patch
# or: minor / major
```

The helper will:

1. Validate the repo state and version bump intent
2. Run the repository test script
3. Update the package version and fold `[Unreleased]` entries into `CHANGELOG.md`
4. Commit, tag the release, and push the `v*` tag to trigger the GitHub Actions build

The actual build pipeline is defined in `.github/workflows/release.yml`.
