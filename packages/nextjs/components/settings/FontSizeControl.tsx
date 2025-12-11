'use client';

import { useState } from 'react';

export const FontSizeControl = () => {
  const [fontSize, setFontSize] = useState(16);

  const changeFontSize = (size: number) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}px`;
  };

  return (
    <div role="group" aria-labelledby="font-size-label">
      <label id="font-size-label" className="block font-semibold mb-2">
        Font Size
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => changeFontSize(14)}
          aria-label="Small font size"
          className="px-4 py-2 rounded border"
        >
          A
        </button>
        <button
          onClick={() => changeFontSize(16)}
          aria-label="Medium font size (default)"
          className="px-4 py-2 rounded border"
        >
          A
        </button>
        <button
          onClick={() => changeFontSize(20)}
          aria-label="Large font size"
          className="px-4 py-2 rounded border text-lg"
        >
          A
        </button>
      </div>
    </div>
  );
};