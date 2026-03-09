import React, { useState, useEffect } from "react";

export function BottomNav({ tabs, activeTab, onTabChange, tabMeta }) {
  const [isVisible, setIsVisible] = useState(window.innerWidth < 768);
  const [moreOpen, setMoreOpen] = useState(false);
  const MAX_VISIBLE_TABS = 5;
  const visibleTabs = tabs.slice(0, MAX_VISIBLE_TABS);
  const hiddenTabs = tabs.slice(MAX_VISIBLE_TABS);

  useEffect(() => {
    const handleResize = () => {
      setIsVisible(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isVisible) {
    return null;
  }

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setMoreOpen(false);
  };

  const getTabIcon = (tabId) => {
    const icons = {
      dashboard: "📊",
      projects: "🏗️",
      inspections: "🔍",
      timeline: "📅",
      reports: "📋",
      settings: "⚙️",
      team: "👥",
      documents: "📄",
      analytics: "📈",
      help: "❓",
    };
    return icons[tabId] || "•";
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: max(70px, calc(70px + env(safe-area-inset-bottom)));
          }
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(11, 14, 24, 0.98)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: "70px",
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
          zIndex: 100,
          boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.2)",
        }}
      >
        {visibleTabs.map((tabId) => (
          <NavItem
            key={tabId}
            tabId={tabId}
            isActive={activeTab === tabId}
            label={tabMeta?.[tabId]?.label || tabId}
            icon={getTabIcon(tabId)}
            onClick={() => handleTabChange(tabId)}
          />
        ))}

        {hiddenTabs.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              style={{
                background: "transparent",
                border: "none",
                color: moreOpen ? "#2563EB" : "#64748b",
                cursor: "pointer",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontSize: "24px",
                transition: "color 0.2s",
                borderRadius: "8px",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#2563EB")}
              onMouseLeave={(e) =>
                (e.target.style.color = moreOpen ? "#2563EB" : "#64748b")
              }
            >
              <span>⋮</span>
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                More
              </span>
            </button>

            {moreOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  right: 0,
                  background: "#1e293b",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  minWidth: "150px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                  overflow: "hidden",
                  animation: "slideUp 0.2s ease-out",
                }}
              >
                <style>{`
                  @keyframes slideUp {
                    from {
                      opacity: 0;
                      transform: translateY(10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
                {hiddenTabs.map((tabId) => (
                  <button
                    key={tabId}
                    onClick={() => handleTabChange(tabId)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background:
                        activeTab === tabId
                          ? "rgba(37, 99, 235, 0.1)"
                          : "transparent",
                      border: "none",
                      borderBottom:
                        tabId !== hiddenTabs[hiddenTabs.length - 1]
                          ? "1px solid rgba(255, 255, 255, 0.04)"
                          : "none",
                      color: activeTab === tabId ? "#2563EB" : "#e2e8f0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "14px",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background =
                        "rgba(37, 99, 235, 0.1)";
                      e.target.style.color = "#2563EB";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background =
                        activeTab === tabId
                          ? "rgba(37, 99, 235, 0.1)"
                          : "transparent";
                      e.target.style.color =
                        activeTab === tabId ? "#2563EB" : "#e2e8f0";
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>
                      {getTabIcon(tabId)}
                    </span>
                    {tabMeta?.[tabId]?.label || tabId}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {moreOpen && (
        <div
          onClick={() => setMoreOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
          }}
        />
      )}
    </>
  );
}

function NavItem({ tabId, isActive, label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        color: isActive ? "#2563EB" : "#64748b",
        cursor: "pointer",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        fontSize: "12px",
        fontFamily: "'DM Sans', sans-serif",
        transition: "color 0.2s, transform 0.2s",
        borderRadius: "8px",
        flex: 1,
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.target.style.color = "#2563EB";
        e.target.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.target.style.color = isActive ? "#2563EB" : "#64748b";
        e.target.style.transform = "scale(1)";
      }}
    >
      <span style={{ fontSize: "24px" }}>{icon}</span>
      <span style={{ textTransform: "capitalize", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}
