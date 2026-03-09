import React from "react";

const pulseKeyframes = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

export function SkeletonCard() {
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        padding: "16px",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }}
    >
      <style>{pulseKeyframes}</style>
      <div
        style={{
          height: "20px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
      />
      <div
        style={{
          height: "16px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          marginBottom: "8px",
          width: "80%",
        }}
      />
      <div
        style={{
          height: "16px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          width: "60%",
        }}
      />
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        padding: "20px",
        textAlign: "center",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }}
    >
      <style>{pulseKeyframes}</style>
      <div
        style={{
          height: "14px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          marginBottom: "12px",
          width: "70%",
          margin: "0 auto 12px",
        }}
      />
      <div
        style={{
          height: "32px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
      />
      <div
        style={{
          height: "12px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          width: "50%",
          margin: "0 auto",
        }}
      />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div>
      <style>{pulseKeyframes}</style>
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            height: "24px",
            background: "#1e293b",
            borderRadius: "4px",
            width: "200px",
            marginBottom: "16px",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonKPI key={i} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            height: "24px",
            background: "#1e293b",
            borderRadius: "4px",
            width: "200px",
            marginBottom: "16px",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div>
      <style>{pulseKeyframes}</style>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ marginBottom: "20px" }}>
          <div
            style={{
              height: "16px",
              background: "#1e293b",
              borderRadius: "4px",
              width: "120px",
              marginBottom: "8px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          <div
            style={{
              height: "40px",
              background: "#1e293b",
              borderRadius: "6px",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        </div>
      ))}
      <div
        style={{
          height: "44px",
          background: "#1e293b",
          borderRadius: "6px",
          marginTop: "24px",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      />
    </div>
  );
}
