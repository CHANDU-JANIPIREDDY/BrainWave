import React from 'react';

export default function BrandMark({ size = 36 }) {
  return (
    <img
      className="brand-mark"
      src="/brainwave-logo.png"
      alt="BrainWave"
      width={size}
      height={size}
    />
  );
}
