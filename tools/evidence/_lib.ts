// Cert Studio — capture helpers (minimal subset of the Landing repo's tools/evidence/_lib.ts)
// (c) 2026 IchiSieben (iC7) · https://ichisieben.dev
// Apache-2.0
//
// Tool paths come from the environment or PATH; no machine-specific path lives in this repo.

import { chromium } from 'playwright-core';

export const CHROME_PATH = process.env.CHROME_PATH || chromium.executablePath();
export const FFMPEG = process.env.FFMPEG || 'ffmpeg';
export const FFPROBE = process.env.FFPROBE || 'ffprobe';
