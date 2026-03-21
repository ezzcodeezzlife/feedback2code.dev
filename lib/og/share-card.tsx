export function OgShareCard() {
  const accent = "#ff6b00";
  const fg = "#ededed";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#000000",
        fontFamily: "JetBrains Mono",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 107, 0, 0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 0, 0.14) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 72,
          height: 72,
          borderTop: `3px solid ${accent}`,
          borderLeft: `3px solid ${accent}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 72,
          height: 72,
          borderBottom: `3px solid ${accent}`,
          borderRight: `3px solid ${accent}`,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 64,
          paddingRight: 64,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 92,
              lineHeight: 1,
              fontWeight: 700,
              color: fg,
              letterSpacing: "-0.03em",
            }}
          >
            feedback
          </span>
          <span
            style={{
              fontSize: 110,
              lineHeight: 1,
              fontWeight: 700,
              color: accent,
              letterSpacing: "-0.04em",
            }}
          >
            2
          </span>
          <span
            style={{
              fontSize: 92,
              lineHeight: 1,
              fontWeight: 700,
              color: fg,
              letterSpacing: "-0.03em",
            }}
          >
            code
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "baseline",
            fontSize: 34,
            color: "#9a9a9a",
            marginTop: 28,
            maxWidth: 1000,
            lineHeight: 1.35,
            fontWeight: 700,
          }}
        >
          <span>Turn user feedback into</span>
          <span style={{ color: fg, marginLeft: 14 }}>code changes</span>
          <span style={{ marginLeft: 14 }}>— automatically.</span>
        </div>
      </div>
    </div>
  );
}
