import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #010E24 0%, #0c4a6e 45%, #0284c7 100%)",
          borderRadius: 36,
          fontSize: 96,
          lineHeight: 1,
        }}
      >
        {String.fromCodePoint(0x1f988)}
      </div>
    ),
    { ...size }
  );
}
