"use client";

/**
 * Web Vitals Monitoring Component
 *
 * Tracks and reports Core Web Vitals metrics:
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals(metric => {
    // Log metrics to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Web Vitals]", {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Send metrics to analytics service
    // You can replace this with your analytics provider
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        event_category: "Web Vitals",
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // You can also send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
        }),
      }).catch(console.error);
    }
  });

  // Monitor performance entries
  useEffect(() => {
    if (typeof window === "undefined" || !window.performance) {
      return;
    }

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        // Log long tasks (>50ms)
        if (entry.entryType === "longtask" && entry.duration > 50) {
          console.warn("[Performance] Long task detected:", {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }

        // Log large layout shifts
        if (entry.entryType === "layout-shift" && (entry as any).hadRecentInput === false) {
          const value = (entry as any).value;
          if (value > 0.1) {
            console.warn("[Performance] Large layout shift:", value);
          }
        }
      }
    });

    // Observe long tasks and layout shifts
    try {
      observer.observe({ entryTypes: ["longtask", "layout-shift"] });
    } catch (e) {
      // Some browsers may not support all entry types
      console.log("PerformanceObserver not fully supported");
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
