#!/bin/bash

# QC Grant Website Testing & Validation Script
# Tests: HTML validity, accessibility, security headers, SEO, performance

echo "==================================="
echo "QC Grant Website Testing Suite"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counters
PASS=0
WARN=0
FAIL=0

# Function to print test results
print_result() {
    if [ "$1" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASS++))
    elif [ "$1" = "WARN" ]; then
        echo -e "${YELLOW}⚠ WARN${NC}: $2"
        ((WARN++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAIL++))
    fi
}

cd /home/hugo/qcgrant-website-build

echo "1. BUILD & STRUCTURE TESTS"
echo "-----------------------------------"

# Test Hugo build
if hugo --gc --minify > /dev/null 2>&1; then
    print_result "PASS" "Hugo builds without errors"
else
    print_result "FAIL" "Hugo build failed"
fi

# Test page count
PAGE_COUNT=$(find public/ -name "*.html" | wc -l)
if [ "$PAGE_COUNT" -gt 50 ]; then
    print_result "PASS" "Generated $PAGE_COUNT HTML pages"
else
    print_result "WARN" "Only $PAGE_COUNT pages generated (expected 60+)"
fi

echo ""
echo "2. SEO & META TAG TESTS"
echo "-----------------------------------"

# Test Open Graph tags
OG_COUNT=$(grep -o 'property="og:' public/index.html 2>/dev/null | wc -l)
if [ "$OG_COUNT" -ge 5 ]; then
    print_result "PASS" "Open Graph meta tags present ($OG_COUNT tags)"
else
    print_result "FAIL" "Missing Open Graph tags (found $OG_COUNT, need 5+)"
fi

# Test structured data
JSON_LD=$(grep -o 'type=application/ld+json' public/index.html 2>/dev/null | wc -l)
if [ "$JSON_LD" -ge 1 ]; then
    print_result "PASS" "Structured data (JSON-LD) present ($JSON_LD schemas)"
else
    print_result "FAIL" "Missing structured data"
fi

# Test canonical URLs
if grep -q 'rel=canonical' public/index.html; then
    print_result "PASS" "Canonical URLs implemented"
else
    print_result "WARN" "Canonical URLs missing"
fi

# Test meta description
if grep -q 'name=description content=' public/index.html; then
    print_result "PASS" "Meta description present"
else
    print_result "FAIL" "Meta description missing"
fi

echo ""
echo "3. ACCESSIBILITY TESTS"
echo "-----------------------------------"

# Test image alt attributes
IMG_COUNT=$(grep -o '<img[^>]*>' public/index.html | wc -l)
ALT_COUNT=$(grep -o '<img[^>]*>' public/index.html | grep -c 'alt=')
if [ "$IMG_COUNT" -eq "$ALT_COUNT" ] && [ "$IMG_COUNT" -gt 0 ]; then
    print_result "PASS" "All $IMG_COUNT images have alt attributes"
elif [ "$IMG_COUNT" -eq 0 ]; then
    print_result "WARN" "No images found on homepage"
else
    print_result "FAIL" "Missing alt attributes on $(($IMG_COUNT - $ALT_COUNT)) images"
fi

# Test heading structure
H1_COUNT=$(grep -c '<h1' public/index.html 2>/dev/null || echo "0")
if [ "$H1_COUNT" -eq 1 ]; then
    print_result "PASS" "Single H1 heading on homepage"
elif [ "$H1_COUNT" -eq 0 ]; then
    print_result "FAIL" "No H1 heading found"
else
    print_result "WARN" "Multiple H1 headings ($H1_COUNT) - should be 1"
fi

# Test lang attribute
if grep -q '<html lang=' public/index.html; then
    print_result "PASS" "HTML lang attribute present"
else
    print_result "FAIL" "HTML lang attribute missing"
fi

echo ""
echo "4. PWA & MOBILE TESTS"
echo "-----------------------------------"

# Test manifest
if [ -f "public/manifest.webmanifest" ]; then
    print_result "PASS" "PWA manifest exists"
else
    print_result "FAIL" "PWA manifest missing"
fi

# Test service worker
if [ -f "public/service-worker.js" ]; then
    print_result "PASS" "Service worker exists"
else
    print_result "FAIL" "Service worker missing"
fi

# Test viewport meta tag
if grep -q 'name=viewport content=' public/index.html; then
    print_result "PASS" "Viewport meta tag present"
else
    print_result "FAIL" "Viewport meta tag missing"
fi

# Test theme color
if grep -q 'theme-color' public/index.html; then
    print_result "PASS" "Theme color meta tag present"
else
    print_result "WARN" "Theme color meta tag missing"
fi

echo ""
echo "5. PERFORMANCE TESTS"
echo "-----------------------------------"

# Test total size
SITE_SIZE=$(du -sh public/ | cut -f1)
print_result "PASS" "Site size: $SITE_SIZE"

# Test image optimization
WEBP_COUNT=$(find static/images -name "*.webp" | wc -l)
if [ "$WEBP_COUNT" -gt 10 ]; then
    print_result "PASS" "WebP images available ($WEBP_COUNT files)"
else
    print_result "WARN" "Limited WebP images ($WEBP_COUNT files)"
fi

# Test CDN usage
if grep -q 'cdn.jsdelivr.net' public/index.html; then
    print_result "PASS" "Using CDN for external assets"
else
    print_result "WARN" "Not using CDN"
fi

echo ""
echo "6. SECURITY TESTS"
echo "-----------------------------------"

# Test SRI on CDN resources
SRI_COUNT=$(grep -c 'integrity=' public/index.html 2>/dev/null || echo "0")
if [ "$SRI_COUNT" -ge 2 ]; then
    print_result "PASS" "Subresource Integrity (SRI) implemented ($SRI_COUNT resources)"
else
    print_result "WARN" "Limited SRI implementation ($SRI_COUNT resources)"
fi

# Test HTTPS links
HTTP_LINKS=$(grep -o 'href="http://' public/index.html | wc -l)
if [ "$HTTP_LINKS" -eq 0 ]; then
    print_result "PASS" "No insecure HTTP links"
else
    print_result "WARN" "Found $HTTP_LINKS HTTP links (should use HTTPS)"
fi

echo ""
echo "7. CONTENT VALIDATION"
echo "-----------------------------------"

# Test critical pages exist
CRITICAL_PAGES=("about/index.html" "contact/index.html" "services/cybersecurity/index.html" "privacy-policy/index.html")
MISSING=0
for page in "${CRITICAL_PAGES[@]}"; do
    if [ -f "public/$page" ]; then
        print_result "PASS" "Page exists: $page"
    else
        print_result "FAIL" "Missing page: $page"
        ((MISSING++))
    fi
done

echo ""
echo "==================================="
echo "TEST SUMMARY"
echo "==================================="
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

TOTAL=$((PASS + WARN + FAIL))
SCORE=$((PASS * 100 / TOTAL))
echo "Overall Score: $SCORE%"

if [ $SCORE -ge 90 ]; then
    echo -e "${GREEN}Status: EXCELLENT ✓${NC}"
elif [ $SCORE -ge 75 ]; then
    echo -e "${YELLOW}Status: GOOD (needs minor improvements)${NC}"
else
    echo -e "${RED}Status: NEEDS WORK${NC}"
fi

echo "==================================="
