'use client';

import { useState } from 'react';

/**
 * KITalent logo mark. Uses the real asset at /brand/logo-mark.png once it's
 * placed in apps/web/public/brand/; until then it falls back to a styled badge
 * so nothing breaks.
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`grid place-items-center rounded-lg bg-sidebar-accent font-black text-white ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        K
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/brand/logo-mark.png"
      alt="KITalent"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={() => setFailed(true)}
    />
  );
}
