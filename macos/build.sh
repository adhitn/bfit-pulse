#!/bin/bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")" && pwd)"
build_dir="${BFIT_BUILD_DIR:-$project_dir/.build}"
app_dir="$project_dir/BFit Pulse.app"
mkdir -p "$build_dir" "$app_dir/Contents/MacOS" "$app_dir/Contents/Resources"
sdk_path="$(xcrun --show-sdk-path)"
for architecture in arm64 x86_64; do
  xcrun swiftc -swift-version 5 -O -target "$architecture-apple-macos13.0" -sdk "$sdk_path" -module-name BFitPulse -framework Cocoa -framework WebKit "$project_dir/Source/Main.swift" -o "$build_dir/BFitPulse-$architecture"
done
xcrun lipo -create "$build_dir/BFitPulse-arm64" "$build_dir/BFitPulse-x86_64" -output "$app_dir/Contents/MacOS/BFitPulse"
xcrun swiftc -swift-version 5 -O -framework Cocoa "$project_dir/Source/Icon.swift" -o "$build_dir/MakeBFitIcon"
"$build_dir/MakeBFitIcon" "$build_dir/AppIcon.iconset"
iconutil -c icns "$build_dir/AppIcon.iconset" -o "$app_dir/Contents/Resources/AppIcon.icns"
cp "$project_dir/Info.plist" "$app_dir/Contents/Info.plist"
printf 'APPL????' > "$app_dir/Contents/PkgInfo"
# Finder may attach display-only metadata while the app bundle is being built.
# Remove only the signing-incompatible resource-fork/Finder metadata on our output.
xattr -dr com.apple.FinderInfo "$app_dir" 2>/dev/null || true
xattr -dr com.apple.ResourceFork "$app_dir" 2>/dev/null || true
codesign --force --sign - --timestamp=none "$app_dir"
codesign --verify --deep --strict "$app_dir"
printf 'Built %s\n' "$app_dir"
