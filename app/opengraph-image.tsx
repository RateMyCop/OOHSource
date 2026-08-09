import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OOHsource — The global out-of-home directory";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#101216",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 46, height: 46, background: "#E6A340", borderRadius: 6 }} />
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>
            <span style={{ color: "#ECEBE4" }}>OOH</span>
            <span style={{ color: "#E6A340" }}>source</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 74,
              fontWeight: 800,
              color: "#ECEBE4",
              letterSpacing: -3,
              lineHeight: 1.05,
              maxWidth: 940,
            }}
          >
            The whole out-of-home industry, in one place.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#ABAFB6", letterSpacing: -0.5 }}>
            Media owners · Agencies · Printers · Installers · DOOH tech
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#787D86",
            letterSpacing: 1,
          }}
        >
          <div style={{ display: "flex" }}>oohsource.com</div>
          <div style={{ display: "flex" }}>The global OOH directory</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
