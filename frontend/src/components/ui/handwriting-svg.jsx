"use client";

import React from "react";
import { cn } from "../../lib/utils";

export function HandwritingSvg({
  text,
  className,
}) {
  return (
    <span className={cn("font-serif text-[#00B386] italic text-4xl md:text-6xl font-extrabold tracking-wide drop-shadow-[0_0_25px_rgba(0,179,134,0.4)] px-2 select-none", className)}>
      {text || ""}
    </span>
  );
}

export default HandwritingSvg;
