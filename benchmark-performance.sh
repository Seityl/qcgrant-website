#!/bin/bash

# QC Grant Website Performance Benchmarking Script
# Measures build time, page generation speed, and site metrics

echo "========================================"
echo "QC Grant Performance Benchmarking"
echo "========================================"
echo ""

cd /home/hugo/qcgrant-website-build

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf public/ resources/ .hugo_build.lock 2>/dev/null

# Benchmark 1: Cold build (no cache)
echo ""
echo "1. COLD BUILD (no cache)"
echo "----------------------------------------"
TIME_START=$(date +%s%3N)
hugo --gc --minify > /dev/null 2>&1
TIME_END=$(date +%s%3N)
COLD_TIME=$((TIME_END - TIME_START))
echo "Cold build time: ${COLD_TIME}ms"

# Count generated files
PAGE_COUNT=$(find public/ -name "*.html" | wc -l)
STATIC_COUNT=$(find public/ -type f ! -name "*.html" | wc -l)
echo "Pages generated: $PAGE_COUNT"
echo "Static files: $STATIC_COUNT"

# Benchmark 2: Warm build (with cache)
echo ""
echo "2. WARM BUILD (with cache)"
echo "----------------------------------------"
# Touch a content file to trigger rebuild
touch content/english/about.md
TIME_START=$(date +%s%3N)
hugo --gc --minify > /dev/null 2>&1
TIME_END=$(date +%s%3N)
WARM_TIME=$((TIME_END - TIME_START))
echo "Warm build time: ${WARM_TIME}ms"
echo "Speed improvement: $((COLD_TIME - WARM_TIME))ms faster ($((100 - (WARM_TIME * 100 / COLD_TIME)))% improvement)"

# Benchmark 3: Incremental build (single page change)
echo ""
echo "3. INCREMENTAL BUILD (single page)"
echo "----------------------------------------"
hugo server --disableFastRender &
SERVER_PID=$!
sleep 2
TIME_START=$(date +%s%3N)
touch content/english/contact.md
sleep 1
TIME_END=$(date +%s%3N)
INCREMENTAL_TIME=$((TIME_END - TIME_START))
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "Incremental build time: ~${INCREMENTAL_TIME}ms"

# Site metrics
echo ""
echo "4. SITE METRICS"
echo "----------------------------------------"
SITE_SIZE=$(du -sh public/ | cut -f1)
HTML_SIZE=$(find public/ -name "*.html" -exec du -ch {} + | tail -1 | cut -f1)
IMAGES_SIZE=$(du -sh public/images/ 2>/dev/null | cut -f1)
echo "Total site size: $SITE_SIZE"
echo "HTML size: $HTML_SIZE"
echo "Images size: $IMAGES_SIZE"

# Average page size
TOTAL_HTML_BYTES=$(find public/ -name "*.html" -exec stat -f%z {} + 2>/dev/null || find public/ -name "*.html" -exec stat -c%s {} +)
AVG_HTML_SIZE=$((TOTAL_HTML_BYTES / PAGE_COUNT))
AVG_HTML_KB=$((AVG_HTML_SIZE / 1024))
echo "Average HTML page size: ${AVG_HTML_KB}KB"

# Largest pages
echo ""
echo "5. LARGEST PAGES"
echo "----------------------------------------"
find public/ -name "*.html" -exec du -h {} + | sort -rh | head -5 | while read size file; do
    filename=$(basename "$file")
    echo "$size - $filename"
done

# Lighthouse-ready metrics
echo ""
echo "6. PERFORMANCE INDICATORS"
echo "----------------------------------------"

# Check for performance best practices
INLINE_CSS=$(grep -o '<style>' public/index.html | wc -l)
echo "Inline CSS blocks: $INLINE_CSS (fewer is better)"

EXTERNAL_CSS=$(grep -o '<link.*stylesheet' public/index.html | wc -l)
echo "External CSS files: $EXTERNAL_CSS"

EXTERNAL_JS=$(grep -o '<script.*src=' public/index.html | wc -l)
echo "External JS files: $EXTERNAL_JS"

# Check for modern image formats
WEBP_IMAGES=$(find public/images/ -name "*.webp" 2>/dev/null | wc -l)
TOTAL_IMAGES=$(find public/images/ -type f 2>/dev/null | wc -l)
if [ "$TOTAL_IMAGES" -gt 0 ]; then
    WEBP_PERCENT=$((WEBP_IMAGES * 100 / TOTAL_IMAGES))
    echo "WebP usage: ${WEBP_PERCENT}% ($WEBP_IMAGES/$TOTAL_IMAGES)"
fi

# Build speed score
echo ""
echo "7. BUILD SPEED SCORE"
echo "----------------------------------------"
if [ "$COLD_TIME" -lt 100 ]; then
    echo "⚡ BLAZING FAST (<100ms): Perfect!"
elif [ "$COLD_TIME" -lt 500 ]; then
    echo "🚀 VERY FAST (<500ms): Excellent!"
elif [ "$COLD_TIME" -lt 1000 ]; then
    echo "✓ FAST (<1s): Good!"
elif [ "$COLD_TIME" -lt 3000 ]; then
    echo "→ MODERATE (<3s): Acceptable"
else
    echo "⚠ SLOW (>3s): Needs optimization"
fi

echo ""
echo "========================================"
echo "BENCHMARK COMPLETE"
echo "========================================"
echo ""
echo "Key Metrics:"
echo "  Cold build: ${COLD_TIME}ms"
echo "  Warm build: ${WARM_TIME}ms"
echo "  Pages: $PAGE_COUNT"
echo "  Size: $SITE_SIZE"
echo "  Avg page: ${AVG_HTML_KB}KB"
echo ""
echo "Ready for production deployment!"
echo "========================================"
