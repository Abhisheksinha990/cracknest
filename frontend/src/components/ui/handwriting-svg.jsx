"use client";

import { motion } from "framer-motion";
import * as opentype from "opentype.js";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

const DEFAULT_FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/indieflower/IndieFlower-Regular.ttf";

export function HandwritingSvg({
  path: pathProp,
  text,
  fontUrl = DEFAULT_FONT_URL,
  className,
  strokeClassName,
  duration = 2.5,
  delay = 0.3,
  strokeWidth = 2.5,
  width: widthProp,
  height: heightProp = 90,
  fontSize = 48,
  ease = "easeInOut",
}) {
  const [path, setPath] = useState(pathProp ?? null);
  const [viewBox, setViewBox] = useState(`0 0 ${widthProp || 400} ${heightProp}`);
  const [svgDimensions, setSvgDimensions] = useState({
    width: widthProp || 400,
    height: heightProp,
  });
  const [loading, setLoading] = useState(!!text && !pathProp);

  useEffect(() => {
    if (!text || pathProp) {
      setPath(pathProp ?? null);
      const initialW = widthProp || 400;
      setViewBox(`0 0 ${initialW} ${heightProp}`);
      setSvgDimensions({ width: initialW, height: heightProp });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(fontUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        if (cancelled) return;
        const font = opentype.parse(buffer);
        const p = font.getPath(text, 0, fontSize, fontSize);
        const bbox = p.getBoundingBox();
        const pad = 12;
        const vx = Math.floor(bbox.x1) - pad;
        const vy = Math.floor(bbox.y1) - pad;
        const vw = Math.ceil(bbox.x2 - bbox.x1) + pad * 2;
        const vh = Math.ceil(bbox.y2 - bbox.y1) + pad * 2;

        setViewBox(`${vx} ${vy} ${vw} ${vh}`);
        setPath(p.toPathData(2));

        // Use calculated text width so full text string is NEVER truncated or cropped
        const finalW = widthProp ? Math.max(widthProp, vw) : vw;
        const finalH = heightProp ? Math.max(heightProp, vh) : vh;
        setSvgDimensions({ width: finalW, height: finalH });
      })
      .catch((err) => {
        console.warn("[HandwritingSvg] Font parse error, falling back to styled text:", err);
        if (!cancelled) setPath(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [text, fontUrl, pathProp, fontSize, widthProp, heightProp]);

  if (loading) {
    return (
      <span className={cn("font-serif text-[#00B386] italic text-3xl animate-pulse px-2", className)}>
        {text}
      </span>
    );
  }

  const d = path ?? "";
  if (!d) {
    return (
      <span className={cn("font-serif text-[#00B386] italic text-3xl md:text-5xl tracking-tight px-2", className)}>
        {text || ""}
      </span>
    );
  }

  const svgViewBox = pathProp ? `0 0 ${svgDimensions.width} ${svgDimensions.height}` : viewBox;

  return (
    <div className="inline-flex justify-center items-center overflow-visible max-w-full">
      <svg
        width={svgDimensions.width}
        height={svgDimensions.height}
        viewBox={svgViewBox}
        className={cn("text-[#00B386] inline-block overflow-visible max-w-full h-auto", className)}
        aria-hidden={true}
      >
        <title>{text || "Handwriting SVG"}</title>
        <motion.path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={strokeClassName}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay, duration, ease }}
        />
      </svg>
    </div>
  );
}

export default HandwritingSvg;
