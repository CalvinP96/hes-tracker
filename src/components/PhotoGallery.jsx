import React, { useState, useRef, useEffect } from "react";

export function PhotoGallery({
  photos,
  sections,
  onUpload,
  onDelete,
  onReorder,
  role,
  userName,
}) {
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const filteredPhotos = filter
    ? photos.filter((p) => p.section === filter)
    : photos;

  const getSectionColor = (section) => {
    const colors = {
      pre: "#2563EB",
      post: "#22c55e",
      hvac: "#f59e0b",
      replacement: "#ef4444",
    };
    return colors[section] || "#64748b";
  };

  const handleSelectPhoto = (photoId) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === filteredPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(filteredPhotos.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPhotos.size === 0) return;
    if (window.confirm(`Delete ${selectedPhotos.size} photo(s)?`)) {
      selectedPhotos.forEach((id) => onDelete(id));
      setSelectedPhotos(new Set());
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onUpload(files);
    }
    e.target.value = "";
  };

  const calculateCompletion = (section) => {
    const sectionPhotos = photos.filter((p) => p.section === section);
    return sectionPhotos.length > 0 ? 100 : 0;
  };

  const openLightbox = (photo) => {
    setLightboxPhoto(photo);
    setCurrentIndex(filteredPhotos.findIndex((p) => p.id === photo.id));
  };

  const closeLightbox = () => {
    setLightboxPhoto(null);
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setLightboxPhoto(filteredPhotos[newIndex]);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredPhotos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setLightboxPhoto(filteredPhotos[newIndex]);
    }
  };

  const canDelete =
    role === "admin" || (role === "user" && !userName) || userName === "self";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Section Progress Bars */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ color: "#e2e8f0", marginBottom: "16px", fontSize: "14px" }}>
          Section Status
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
          {sections.map((section) => (
            <div key={section}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "#e2e8f0", textTransform: "capitalize" }}>
                  {section}
                </span>
                <span style={{ color: "#64748b" }}>
                  {calculateCompletion(section)}%
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "rgba(100, 116, 139, 0.2)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${calculateCompletion(section)}%`,
                    background: getSectionColor(section),
                    transition: "width 0.3s ease-out",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={() => setFilter(null)}
          style={{
            padding: "8px 16px",
            background:
              filter === null
                ? "rgba(37, 99, 235, 0.2)"
                : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${filter === null ? "#2563EB" : "rgba(255, 255, 255, 0.1)"}`,
            borderRadius: "6px",
            color: filter === null ? "#2563EB" : "#e2e8f0",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (filter !== null) {
              e.target.style.background = "rgba(37, 99, 235, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== null) {
              e.target.style.background = "rgba(255, 255, 255, 0.05)";
            }
          }}
        >
          All ({photos.length})
        </button>
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setFilter(section)}
            style={{
              padding: "8px 16px",
              background:
                filter === section
                  ? `rgba(${getSectionColor(section).slice(1).match(/.{2}/g).map((x) => parseInt(x, 16)).join(", ")}, 0.2)`
                  : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${
                filter === section
                  ? getSectionColor(section)
                  : "rgba(255, 255, 255, 0.1)"
              }`,
              borderRadius: "6px",
              color: filter === section ? getSectionColor(section) : "#e2e8f0",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              transition: "all 0.2s",
              textTransform: "capitalize",
            }}
            onMouseEnter={(e) => {
              if (filter !== section) {
                e.target.style.background =
                  `rgba(${getSectionColor(section).slice(1).match(/.{2}/g).map((x) => parseInt(x, 16)).join(", ")}, 0.1)`;
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== section) {
                e.target.style.background = "rgba(255, 255, 255, 0.05)";
              }
            }}
          >
            {section} ({photos.filter((p) => p.section === section).length})
          </button>
        ))}
      </div>

      {/* Batch Actions */}
      {selectedPhotos.size > 0 && (
        <div
          style={{
            background: "rgba(37, 99, 235, 0.1)",
            border: "1px solid rgba(37, 99, 235, 0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <span style={{ color: "#e2e8f0", fontSize: "14px" }}>
            {selectedPhotos.size} selected
          </span>
          {canDelete && (
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: "6px 16px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                color: "#ef4444",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(239, 68, 68, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(239, 68, 68, 0.2)";
              }}
            >
              Delete Selected
            </button>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? "#2563EB" : "rgba(255, 255, 255, 0.1)"}`,
          borderRadius: "8px",
          padding: "24px",
          textAlign: "center",
          marginBottom: "24px",
          cursor: "pointer",
          transition: "all 0.2s",
          background: isDragging ? "rgba(37, 99, 235, 0.05)" : "transparent",
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ color: "#64748b", marginBottom: "8px", fontSize: "32px" }}>
          📷
        </div>
        <div style={{ color: "#e2e8f0", fontSize: "14px", marginBottom: "4px" }}>
          Drag photos here or click to browse
        </div>
        <div style={{ color: "#64748b", fontSize: "12px" }}>
          PNG, JPG, WebP supported. Multi-file upload available.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ color: "#64748b", fontSize: "13px" }}>
          {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? "s" : ""}
        </div>
        {filteredPhotos.length > 0 && (
          <button
            onClick={handleSelectAll}
            style={{
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              color: "#e2e8f0",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "12px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(37, 99, 235, 0.2)";
              e.target.style.borderColor = "#2563EB";
              e.target.style.color = "#2563EB";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.05)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.target.style.color = "#e2e8f0";
            }}
          >
            {selectedPhotos.size === filteredPhotos.length
              ? "Deselect All"
              : "Select All"}
          </button>
        )}
      </div>

      {/* Photo Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "16px",
          "@media (max-width: 768px)": {
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          },
        }}
      >
        {filteredPhotos.map((photo, index) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            isSelected={selectedPhotos.has(photo.id)}
            onSelect={() => handleSelectPhoto(photo.id)}
            onClick={() => openLightbox(photo)}
            sectionColor={getSectionColor(photo.section)}
            canDelete={canDelete && role === "admin"}
            onDelete={() => {
              if (window.confirm("Delete this photo?")) {
                onDelete(photo.id);
              }
            }}
          />
        ))}
      </div>

      {filteredPhotos.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🖼️</div>
          <div style={{ fontSize: "14px" }}>No photos yet</div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex < filteredPhotos.length - 1}
        />
      )}
    </div>
  );
}

function PhotoThumbnail({
  photo,
  isSelected,
  onSelect,
  onClick,
  sectionColor,
  canDelete,
  onDelete,
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "8px",
        overflow: "hidden",
        border: isSelected
          ? `2px solid #2563EB`
          : `2px solid rgba(255, 255, 255, 0.08)`,
        cursor: "pointer",
        transition: "all 0.2s",
        background: "#1e293b",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#2563EB";
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isSelected
          ? "#2563EB"
          : "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Image */}
      <img
        src={photo.url}
        alt={photo.label}
        onClick={onClick}
        style={{
          width: "100%",
          height: "150px",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Section Badge */}
      <div
        style={{
          position: "absolute",
          top: "6px",
          left: "6px",
          background: sectionColor,
          color: "#0b0e18",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {photo.section}
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          width: "18px",
          height: "18px",
          cursor: "pointer",
          accentColor: "#2563EB",
        }}
      />

      {/* Hover Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onClick}
            style={{
              width: "36px",
              height: "36px",
              background: "rgba(37, 99, 235, 0.9)",
              border: "none",
              borderRadius: "50%",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#2563EB")}
            onMouseLeave={(e) =>
              (e.target.style.background = "rgba(37, 99, 235, 0.9)")
            }
          >
            🔍
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(239, 68, 68, 0.9)",
                border: "none",
                borderRadius: "50%",
                color: "#e2e8f0",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#ef4444")}
              onMouseLeave={(e) =>
                (e.target.style.background = "rgba(239, 68, 68, 0.9)")
              }
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)",
          padding: "12px 8px 8px",
          fontSize: "11px",
          color: "#e2e8f0",
        }}
      >
        <div style={{ fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {photo.label}
        </div>
        {photo.photographer && (
          <div style={{ color: "#64748b", fontSize: "10px" }}>
            by {photo.photographer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    if (touchStart - touchEnd > 50) {
      onNext();
    } else if (touchEnd - touchStart > 50) {
      onPrev();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.95)",
          zIndex: 5000,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5001,
          padding: "20px",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "40px",
            height: "40px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            color: "#e2e8f0",
            cursor: "pointer",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            zIndex: 5002,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(239, 68, 68, 0.3)";
            e.target.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.1)";
            e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
          }}
        >
          ✕
        </button>

        {/* Image Container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "90vw",
            maxHeight: "70vh",
            animation: "zoomIn 0.3s ease-out",
          }}
        >
          <img
            src={photo.url}
            alt={photo.label}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px",
              userSelect: "none",
            }}
          />
        </div>

        {/* Navigation Buttons */}
        {hasPrev && (
          <button
            onClick={onPrev}
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "44px",
              height: "44px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "50%",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              zIndex: 5002,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(37, 99, 235, 0.3)";
              e.target.style.borderColor = "#2563EB";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            ←
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "44px",
              height: "44px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "50%",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              zIndex: 5002,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(37, 99, 235, 0.3)";
              e.target.style.borderColor = "#2563EB";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            →
          </button>
        )}

        {/* Info Bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(to top, rgba(11, 14, 24, 0.95), transparent)",
            padding: "40px 20px 20px",
            textAlign: "center",
            color: "#e2e8f0",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "8px" }}>
            {photo.label}
          </div>
          {photo.timestamp && (
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
              {new Date(photo.timestamp).toLocaleDateString()} at{" "}
              {new Date(photo.timestamp).toLocaleTimeString()}
            </div>
          )}
          {photo.photographer && (
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Photographer: {photo.photographer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
