import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#be2826",
          borderRadius: "8px",
          color: "white",
          fontWeight: 900,
          fontSize: "18px",
          fontFamily: "system-ui, sans-serif",
          transform: "rotate(-6deg)",
          border: "2px solid #ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        DB
      </div>
    ),
    {
      ...size,
    }
  );
}
