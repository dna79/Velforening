"use client";

import { useMemo, useState } from "react";

type QrCodeProps = {
  className?: string;
  value: string;
};

const version = 5;
const size = version * 4 + 17;
const dataCodewords = 108;
const eccCodewords = 26;

export function AppQrCode({ className = "", value }: QrCodeProps) {
  const modules = useMemo(() => createQrModules(value), [value]);

  if (!modules) {
    return (
      <div
        className={`flex aspect-square items-center justify-center rounded-[24px] bg-white p-6 text-center text-sm font-bold text-red-700 ring-1 ring-red-100 ${className}`}
      >
        App-lenken er for lang for denne QR-koden.
      </div>
    );
  }

  const cells = modules.flatMap((row, y) =>
    row.map((isDark, x) =>
      isDark ? (
        <rect height="1" key={`${x}-${y}`} width="1" x={x} y={y} />
      ) : null,
    ),
  );

  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-[24px] bg-white p-3 shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5] ${className}`}
    >
      <svg
        aria-label="QR-kode til Reistadlia Vel bookingapp"
        className="h-full w-full"
        role="img"
        viewBox={`0 0 ${size} ${size}`}
      >
        <rect fill="#fff" height={size} width={size} />
        <g fill="#07122F">{cells}</g>
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[18px] bg-white shadow-md ring-4 ring-white">
        <span className="flex h-[78%] w-[78%] items-center justify-center rounded-full bg-blue-50 text-[clamp(12px,4vw,20px)] font-black text-blue-600 ring-1 ring-blue-100">
          RV
        </span>
      </div>
    </div>
  );
}

export function AppQrPanel({ onClose }: { onClose: () => void }) {
  const [appUrl] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );

  return (
    <div className="absolute right-0 top-14 z-30 w-[min(20rem,calc(100vw-2.5rem))] rounded-[28px] bg-white p-4 shadow-2xl shadow-slate-900/15 ring-1 ring-[#DDE8F5]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#07122F]">QR-kode til appen</p>
          <p className="mt-1 text-xs font-semibold leading-4 text-[#53657D]">
            Skann for å åpne bookingsiden.
          </p>
        </div>
        <button
          aria-label="Lukk QR-kode"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-black text-blue-700"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>

      {appUrl ? <AppQrCode className="mt-4" value={appUrl} /> : null}

      <p className="mt-3 break-all rounded-[18px] bg-blue-50 p-3 text-center text-xs font-bold text-blue-800">
        {appUrl || "Laster lenke..."}
      </p>
    </div>
  );
}

function createQrModules(text: string) {
  const data = encodeText(text);

  if (!data) {
    return null;
  }

  const ecc = reedSolomonComputeRemainder(data, reedSolomonComputeDivisor());
  const codewords = [...data, ...ecc];
  const modules = createEmptyMatrix();
  const reserved = createReservedMatrix();

  drawFunctionPatterns(modules, reserved);
  drawCodewords(modules, reserved, codewords);
  applyMask(modules, reserved);
  drawFormatBits(modules, reserved);

  return modules;
}

function encodeText(text: string) {
  const bytes = Array.from(new TextEncoder().encode(text));

  if (bytes.length > dataCodewords - 3) {
    return null;
  }

  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const capacityBits = dataCodewords * 8;
  appendBits(bits, 0, Math.min(4, capacityBits - bits.length));

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const data: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    data.push(bitsToByte(bits.slice(index, index + 8)));
  }

  for (let pad = 0xec; data.length < dataCodewords; pad ^= 0xec ^ 0x11) {
    data.push(pad);
  }

  return data;
}

function appendBits(bits: number[], value: number, length: number) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

function bitsToByte(bits: number[]) {
  return bits.reduce((value, bit) => (value << 1) | bit, 0);
}

function createEmptyMatrix() {
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

function createReservedMatrix() {
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

function setModule(
  modules: boolean[][],
  reserved: boolean[][],
  x: number,
  y: number,
  isDark: boolean,
) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  modules[y][x] = isDark;
  reserved[y][x] = true;
}

function drawFunctionPatterns(modules: boolean[][], reserved: boolean[][]) {
  drawFinderPattern(modules, reserved, 3, 3);
  drawFinderPattern(modules, reserved, size - 4, 3);
  drawFinderPattern(modules, reserved, 3, size - 4);
  drawAlignmentPattern(modules, reserved, 30, 30);

  for (let i = 0; i < size; i += 1) {
    if (!reserved[6][i]) {
      setModule(modules, reserved, i, 6, i % 2 === 0);
    }
    if (!reserved[i][6]) {
      setModule(modules, reserved, 6, i, i % 2 === 0);
    }
  }

  setModule(modules, reserved, 8, 29, true);

  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i += 1) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
}

function drawFinderPattern(
  modules: boolean[][],
  reserved: boolean[][],
  centerX: number,
  centerY: number,
) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setModule(modules, reserved, x, y, distance !== 2 && distance !== 4);
    }
  }
}

function drawAlignmentPattern(
  modules: boolean[][],
  reserved: boolean[][],
  centerX: number,
  centerY: number,
) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setModule(
        modules,
        reserved,
        centerX + dx,
        centerY + dy,
        Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
      );
    }
  }
}

function drawCodewords(
  modules: boolean[][],
  reserved: boolean[][],
  codewords: number[],
) {
  const bits = codewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => (codeword >>> (7 - index)) & 1),
  );
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1;
    }

    for (let vert = 0; vert < size; vert += 1) {
      const y = upward ? size - 1 - vert : vert;

      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;

        if (!reserved[y][x]) {
          modules[y][x] = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
          bitIndex += 1;
        }
      }
    }

    upward = !upward;
  }
}

function applyMask(modules: boolean[][], reserved: boolean[][]) {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!reserved[y][x] && (x + y) % 2 === 0) {
        modules[y][x] = !modules[y][x];
      }
    }
  }
}

function drawFormatBits(modules: boolean[][], reserved: boolean[][]) {
  const bits = getFormatBits();

  for (let i = 0; i <= 5; i += 1) {
    setModule(modules, reserved, 8, i, getBit(bits, i));
  }
  setModule(modules, reserved, 8, 7, getBit(bits, 6));
  setModule(modules, reserved, 8, 8, getBit(bits, 7));
  setModule(modules, reserved, 7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i += 1) {
    setModule(modules, reserved, 14 - i, 8, getBit(bits, i));
  }

  for (let i = 0; i < 8; i += 1) {
    setModule(modules, reserved, size - 1 - i, 8, getBit(bits, i));
  }
  for (let i = 8; i < 15; i += 1) {
    setModule(modules, reserved, 8, size - 15 + i, getBit(bits, i));
  }
}

function getBit(value: number, index: number) {
  return ((value >>> index) & 1) === 1;
}

function getFormatBits() {
  const data = 0b01000;
  let value = data << 10;

  for (let i = 14; i >= 10; i -= 1) {
    if (((value >>> i) & 1) !== 0) {
      value ^= 0x537 << (i - 10);
    }
  }

  return ((data << 10) | value) ^ 0x5412;
}

function reedSolomonComputeDivisor() {
  const result = Array<number>(eccCodewords).fill(0);
  result[eccCodewords - 1] = 1;
  let root = 1;

  for (let index = 0; index < eccCodewords; index += 1) {
    for (let j = 0; j < eccCodewords; j += 1) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < eccCodewords) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }

  return result;
}

function reedSolomonComputeRemainder(data: number[], divisor: number[]) {
  const result = Array<number>(eccCodewords).fill(0);

  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    divisor.forEach((coefficient, index) => {
      result[index] ^= reedSolomonMultiply(coefficient, factor);
    });
  }

  return result;
}

function reedSolomonMultiply(x: number, y: number) {
  let product = 0;

  for (let index = 7; index >= 0; index -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((y >>> index) & 1) * x;
  }

  return product & 0xff;
}
