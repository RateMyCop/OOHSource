import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// OOHsource mark: dark tile, thin paper ring (the "O"), single bronze marker
// dot — the premium-minimal identity, drawn with primitives so it renders
// through Satori without a rasterizer.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1a1b1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", width: 104, height: 104, display: "flex" }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: 999,
              border: "16px solid #f4f3ee",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -6,
              left: 35,
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#c2954f",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
