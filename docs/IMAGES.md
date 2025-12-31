# Image Processing & Page Bundles

This project supports Hugo image processing to generate responsive `srcset` sizes and WebP/optimized variants.

Key points:

- Image processing is controlled by the site param `enable_image_processing` in `config/_default/params.toml`.
- When enabled, the deploy script will sync `static/images/*` into `assets/images/` so *global* images get processed automatically during the build.
- For *page-specific* images (recommended for banners, article images, etc.), place your image file inside the same folder as the page (a page bundle). Example:

  content/english/my-article/index.md
  content/english/my-article/image-hero.jpg

- The templates use the `responsive-image.html` partial which will:
  - Prefer a page bundle resource when a `page` object is passed to the partial (e.g. `partial "responsive-image.html" (dict "src" .Params.image "page" $page)`), and
  - Fall back to asset-based processing when the resource is in `assets/images/` or to the static path if no processed resource is available.

- There is a helper script `scripts/move_content_images.sh` which scans content files for references to `/images/*` and copies the referenced file from `static/images/` into the corresponding content folder and updates the front matter to reference the local filename. The deploy script will call this when `enable_image_processing = true`.

Notes & best practices:

- Prefer page bundles for content images that are unique to a page. This makes the resource available via `.Resources` and keeps content self-contained.
- Use the `responsive-image.html` partial in templates (examples in `layouts/`) to get consistent `srcset` and `sizes` behavior.
- If you want WebP conversion enabled globally, I can add an option to the partial to generate WebP variants during build (some hosting environments may limit `.Convert`).
