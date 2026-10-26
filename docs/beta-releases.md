# Beta releases

WinDial uses tag-based release automation to build desktop installers from versioned source snapshots. The GitHub Actions workflow in `.github/workflows/release.yml` triggers on tags that match `v*` and packages the Windows app as a release asset.

## Current release model

- The release flow is tied to Git tags such as `v0.1.0` or `v0.2.0-beta.1`.
- The tag push triggers the Tauri build pipeline and publishes the generated installer.
- The app is currently focused on Windows, so the release packaging targets the desktop experience described in the roadmap.

## Publish a beta or prerelease

1. Update the version metadata in the project files that define the app version.
2. Add a concise summary to `CHANGELOG.md` under `[Unreleased]`.
3. Create and push a tag matching the desired version:

```bash
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```

4. Watch the GitHub Actions run for the release build to finish.
5. Open the repository's Releases page to download the generated installer and verify the generated metadata.

## Notes

- This project is still in active development; the exact release cadence and artifact set may change as the Windows product matures.
- The canonical product direction remains the phased roadmap in [.ai/roadmap.md](../.ai/roadmap.md).
