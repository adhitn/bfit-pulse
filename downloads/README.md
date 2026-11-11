# Mac app downloads

These are the universal Apple silicon + Intel prototype binaries built on November 10, 2026. They load the hosted BFit Pulse website, including subsequent website updates. Native source changes require rebuilding these downloads.

- [DMG installer](BFit-Pulse-Mac.dmg): open and drag the app into Applications.
- [ZIP archive](BFit-Pulse-Mac.zip): extract and move the app into Applications.
- [Build and usage instructions](../macos/README.md).

Requires macOS 13+ and an internet connection. The application has a local ad hoc signature; it is not Apple-notarized or Developer ID signed. No system security settings are changed.

Verify a downloaded file from this folder with:

```sh
shasum -a 256 -c SHA256SUMS
```
