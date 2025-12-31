#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTENT_DIR="$ROOT_DIR/content"
STATIC_IMG_DIR="$ROOT_DIR/static/images"

echo "Scanning content for referenced /images/* entries..."
found=0
while IFS= read -r -d '' file; do
  # Search for /images/... occurrences in the file
  while IFS= read -r img; do
    # Normalize and extract basename
    base=$(basename "$img")
    src="$STATIC_IMG_DIR/$base"
    dest_dir=$(dirname "$file")
    dest="$dest_dir/$base"

    if [ -f "$src" ]; then
      echo "-> Found $img in $file; copying $base to $dest_dir"
      mkdir -p "$dest_dir"
      cp -n "$src" "$dest"
      # Replace occurrences of the absolute path with the basename
      # Works for YAML/TOML front matter lines like image: "/images/abc.png"
      sed -i "s|/images/$base|$base|g" "$file" || true
      found=1
    else
      echo "-> Referenced image $img not found in static images; skipping"
    fi
  done < <(grep -Po "/images/[A-Za-z0-9_\-\.]+" "$file" | sort -u | sed -e '/^$/d' -z | tr '\n' '\0')
done < <(find "$CONTENT_DIR" -type f -name '*.md' -print0)

if [ "$found" -eq 1 ]; then
  echo "Done: moved or copied content images into page bundles. Please review the changed files under content/."
else
  echo "No content images found referencing /images/ to move."
fi
