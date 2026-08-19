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
          background: "#101113",
          padding: "76px 84px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#1a1b1e",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative", width: 38, height: 38, display: "flex" }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, border: "6px solid #f4f3ee" }} />
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  left: 13,
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: "#c2954f",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -0.5 }}>
            <span style={{ color: "#eceae2" }}>OOH</span>
            <span style={{ color: "#8a8d94" }}>source</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: 56, height: 3, background: "#c2954f", marginBottom: 30 }} />
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              color: "#eceae2",
              letterSpacing: -3,
              lineHeight: 1.04,
              maxWidth: 900,
            }}
          >
            The whole out-of-home industry, in one place.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 27,
              color: "#adafb5",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Media owners · Agencies · Printers · Installers · DOOH tech
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#7a7d84",
            letterSpacing: 3,
            textTransform: "uppercase",
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
