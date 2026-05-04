import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0F766E",
          color: "#F8FAF7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        RT
      </div>
    ),
    size
  );
}
