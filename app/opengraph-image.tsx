import { ImageResponse } from "next/og";
import { loadOgMonoFont } from "@/lib/og/og-mono-font";
import { OgShareCard } from "@/lib/og/share-card";

export const alt = "Website feedback automation that opens GitHub pull requests";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default async function Image() {
  const fontData = await loadOgMonoFont();

  return new ImageResponse(<OgShareCard />, {
    ...size,
    fonts: [
      {
        name: "JetBrains Mono",
        data: fontData,
        style: "normal",
        weight: 700,
      },
    ],
  });
}
