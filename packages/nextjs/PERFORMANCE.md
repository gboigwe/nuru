# Performance Optimization Guide

## Bundle Size Optimizations Implemented

### 1. Bundle Analyzer
- Installed `@next/bundle-analyzer`
- Run `yarn analyze` to visualize bundle composition
- Helps identify large dependencies and optimization opportunities

### 2. Dynamic Imports
Dynamic imports implemented for heavy components:
- Debug contracts page (`/debug`)
- Analytics dashboard components (`/analytics`)
- Receipt gallery (`/receipts`)
- XMTP chat components (`/messages`)

Benefits:
- Reduces initial JavaScript bundle size
- Components loaded only when needed
- Faster First Contentful Paint (FCP)

### 3. Tree Shaking & Package Optimization
Configured `optimizePackageImports` for:
- `@heroicons/react`
- `wagmi`
- `viem`
- `@tanstack/react-query`
- `react-hot-toast`

### 4. Webpack Vendor Splitting
Custom chunk splitting strategy:
- **Vendor chunk**: Stable dependencies from node_modules
- **Common chunk**: Shared code across routes
- **Web3 chunk**: Web3 libraries (wagmi, viem, @reown, @coinbase)

Benefits:
- Better caching (vendor chunks change less frequently)
- Parallel loading of chunks
- Reduced main bundle size

### 5. Compression & Caching Middleware
Middleware adds:
- Compression hint headers (gzip, deflate, br)
- Static asset caching (1 year for immutable assets)
- Preload hints for critical resources

### 6. Service Worker Optimization
Enhanced caching strategies:
- Cache size limits (images: 30, static: 50, api: 20)
- Cache age expiration (7 days)
- Automatic cache trimming
- Stale-while-revalidate for static assets
- Cache-first for images
- Network-first for API calls

### 7. Web Vitals Monitoring
Tracks Core Web Vitals:
- **FCP** (First Contentful Paint) - Target: <1.5s
- **LCP** (Largest Contentful Paint) - Target: <2.5s
- **FID** (First Input Delay) - Target: <100ms
- **CLS** (Cumulative Layout Shift) - Target: <0.1
- **TTFB** (Time to First Byte) - Target: <600ms
- **INP** (Interaction to Next Paint) - Target: <200ms

Long task detection (>50ms) and layout shift warnings included.

### 8. Image Optimization
Created optimized image components:
- `OptimizedImage`: Next.js Image with lazy loading, blur placeholder
- `LazyImage`: Native lazy loading with Intersection Observer fallback
- Quality set to 75 for optimal size/quality balance
- Responsive sizing with `sizes` attribute

### 9. Production Build Settings
- Compression enabled
- ETag generation for caching
- Powered-by header removed for security
- React strict mode for better performance warnings

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Bundle Size (gzipped) | <200KB | Run `yarn analyze` |
| FCP | <1.5s | Monitor with WebVitals |
| TTI | <3.5s | Monitor with WebVitals |
| Lighthouse Score | >90 | Test with Chrome DevTools |

## How to Measure Performance

### 1. Bundle Analysis
```bash
yarn analyze
```
Opens webpack bundle analyzer to visualize bundle composition.

### 2. Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for Performance, Accessibility, Best Practices, SEO

### 3. Web Vitals
Check browser console for Web Vitals metrics during development.

### 4. Real User Monitoring
Web Vitals are automatically sent to analytics endpoint (configure `NEXT_PUBLIC_ANALYTICS_ENDPOINT`).

## Optimization Checklist

- [x] Bundle analyzer configured
- [x] Dynamic imports for heavy components
- [x] Tree shaking configured
- [x] Webpack vendor splitting
- [x] Compression middleware
- [x] Service worker cache optimization
- [x] Web Vitals monitoring
- [x] Optimized image components
- [x] Production build optimizations

## Future Optimizations

1. **Route-based preloading**: Preload routes based on user behavior
2. **Component lazy loading**: Implement visibility-based loading for below-fold components
3. **Image CDN**: Integrate with image CDN for automatic optimization
4. **Critical CSS**: Extract and inline critical CSS
5. **Font optimization**: Subset fonts and use font-display: swap
6. **Third-party script optimization**: Lazy load analytics and third-party scripts

## Debugging Performance Issues

### Slow Initial Load
1. Check bundle size with analyzer
2. Identify large dependencies
3. Consider dynamic imports for non-critical code
4. Enable compression on server

### Slow Interactions
1. Check for long tasks in Performance tab
2. Reduce JavaScript execution time
3. Optimize React re-renders with React.memo
4. Use requestIdleCallback for non-critical work

### Poor Web Vitals
- **High FCP**: Reduce critical CSS, defer non-critical resources
- **High LCP**: Optimize largest image, use CDN, preload critical resources
- **High CLS**: Set explicit dimensions for images/videos, reserve space for dynamic content
- **High INP**: Reduce JavaScript execution, debounce event handlers

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
