import React, { useState } from "react";
import styles from "./BatchOps.module.css";

/**
 * Multi-project batch operations component for the dashboard
 * Allows selection and bulk actions on multiple projects
 */
export function BatchOps({
  projects = [],
  onBatchAdvance,
  onBatchExport,
  onBatchAssign,
  users = [],
  stages = [],
}) {
  const [selected, setSelected] = useState(new Set());
  const [mode, setMode] = useState(false);
  const [assignField, setAssignField] = useState("assignee");
  const [assignValue, setAssignValue] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Toggle individual project selection
  const toggleSelect = (projectId) => {
    const newSet = new Set(selected);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    setSelected(newSet);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selected.size === projects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(projects.map((p) => p.id)));
    }
  };

  // Exit batch mode
  const exitBatchMode = () => {
    setMode(false);
    setSelected(new Set());
    setShowAssignModal(false);
    setShowConfirmDelete(false);
  };

  // Handle batch advance to next stage
  const handleBatchAdvance = () => {
    if (selected.size === 0) return;
    const selectedProjects = projects.filter((p) => selected.has(p.id));
    onBatchAdvance?.(selectedProjects);
    exitBatchMode();
  };

  // Handle batch export
  const handleBatchExport = () => {
    if (selected.size === 0) return;
    const selectedProjects = projects.filter((p) => selected.has(p.id));
    onBatchExport?.(selectedProjects);
    // Don't exit batch mode - user may want to export multiple times
  };

  // Handle batch assign (field update)
  const handleBatchAssign = () => {
    if (selected.size === 0 || !assignValue) return;
    const selectedProjects = projects.filter((p) => selected.has(p.id));
    onBatchAssign?.({
      projects: selectedProjects,
      field: assignField,
      value: assignValue,
    });
    setAssignValue("");
    setShowAssignModal(false);
    exitBatchMode();
  };

  // Handle batch delete with confirmation
  const handleBatchDelete = () => {
    if (selected.size === 0) return;
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    const selectedProjects = projects.filter((p) => selected.has(p.id));
    onBatchDelete?.(selectedProjects);
    setShowConfirmDelete(false);
    exitBatchMode();
  };

  // If not in batch mode, show select button
  if (!mode) {
    return (
      <button
        className={styles.selectBtn}
        onClick={() => setMode(true)}
        title="Enter batch operations mode"
      >
        ☑ Select
      </button>
    );
  }

  return (
    <>
      {/* Batch action bar */}
      <BatchActionBar
        count={selected.size}
        total={projects.length}
        onAdvance={handleBatchAdvance}
        onExport={handleBatchExport}
        onAssign={() => setShowAssignModal(true)}
        onDelete={handleBatchDelete}
        onSelectAll={toggleSelectAll}
        allSelected={selected.size === projects.length && projects.length > 0}
        onCancel={exitBatchMode}
      />

      {/* Selection checkboxes overlay on project cards */}
      <div className={styles.batchOverlay}>
        {projects.map((project) => (
          <div
            key={project.id}
            className={styles.projectCardWrapper}
            data-batch-card={project.id}
          >
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={selected.has(project.id)}
              onChange={() => toggleSelect(project.id)}
              aria-label={`Select ${project.customerName}`}
            />
            {/* Original card content is unchanged and sits behind checkbox */}
          </div>
        ))}
      </div>

      {/* Assign field modal */}
      {showAssignModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAssignModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Reassign {selected.size} Project(s)</h3>
            <div className={styles.formGroup}>
              <label>Field</label>
              <select
                value={assignField}
                onChange={(e) => setAssignField(e.target.value)}
                className={styles.select}
              >
                <option value="assignee">Assignee</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
                <option value="stage">Stage</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Value</label>
              {assignField === "assignee" && (
                <select
                  value={assignValue}
                  onChange={(e) => setAssignValue(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select assignee...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}
              {assignField === "stage" && (
                <select
                  value={assignValue}
                  onChange={(e) => setAssignValue(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select stage...</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              )}
              {!["assignee", "stage"].includes(assignField) && (
                <input
                  type="text"
                  value={assignValue}
                  onChange={(e) => setAssignValue(e.target.value)}
                  placeholder={`Enter ${assignField}...`}
                  className={styles.input}
                />
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleBatchAssign}
                disabled={!assignValue}
              >
                Apply to {selected.size}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showConfirmDelete && (
        <div className={styles.modalBackdrop} onClick={() => setShowConfirmDelete(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete {selected.size} Project(s)?</h3>
            <p style={{ marginBottom: "20px", color: "#a0aec0" }}>
              This action cannot be undone. All project data will be permanently deleted.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
              <button className={styles.btnDanger} onClick={confirmDelete}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Floating batch action bar
 * Fixed at bottom of viewport during batch operations
 */
export function BatchActionBar({
  count = 0,
  total = 0,
  onSelectAll,
  allSelected = false,
  onAdvance,
  onExport,
  onAssign,
  onDelete,
  onCancel,
}) {
  return (
    <div className={styles.actionBar}>
      <div className={styles.actionBarContent}>
        <div className={styles.selectionInfo}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className={styles.checkboxLarge}
            title="Select all"
          />
          <span className={styles.count}>
            {count} of {total} selected
          </span>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={styles.actionBtn}
            onClick={onAdvance}
            disabled={count === 0}
            title="Advance selected projects to next stage"
          >
            ⬆ Advance
          </button>
          <button
            className={styles.actionBtn}
            onClick={onExport}
            disabled={count === 0}
            title="Export selected projects (ZIP/PDF)"
          >
            📥 Export
          </button>
          <button
            className={styles.actionBtn}
            onClick={onAssign}
            disabled={count === 0}
            title="Reassign or update fields"
          >
            ✏ Reassign
          </button>
          <button
            className={styles.actionBtn}
            onClick={onDelete}
            disabled={count === 0}
            title="Delete selected projects"
            style={{ color: "#ef4444" }}
          >
            🗑 Delete
          </button>
          <button
            className={styles.actionBtn}
            onClick={onCancel}
            title="Exit batch mode"
            style={{ marginLeft: "auto" }}
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BatchOps;
