import { PROGRAM, EE_MEASURES, STAGES } from '../constants/index.js';

// ═══════════════════════════════════════════════════════════════
// GENERAL UTILITIES
// ═══════════════════════════════════════════════════════════════

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const fmts = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

// ═══════════════════════════════════════════════════════════════
// PHOTO HELPERS
// ═══════════════════════════════════════════════════════════════

export function getPhotos(photos, id) {
  const v = photos?.[id];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (v.d) return [v];
  return [];
}

export function hasPhoto(photos, id) {
  return getPhotos(photos, id).length > 0;
}

export function photoCount(photos, id) {
  return getPhotos(photos, id).length;
}

// ═══════════════════════════════════════════════════════════════
// INSULATION CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export function calcRtoAdd(section, preR) {
  const rule = PROGRAM[section];
  if (!rule) return null;
  const pre = Number(preR) || 0;

  if (pre > rule.threshold && section !== "kneeWall" && section !== "extWall1" && section !== "extWall2" && section !== "fnd") return null;
  if (section === "kneeWall" && pre >= 20) return null;
  if ((section === "extWall1" || section === "extWall2") && pre > 0) return null;
  if (section === "fnd" && pre >= 10) return null;

  return Math.max(0, rule.target - pre);
}

// ═══════════════════════════════════════════════════════════════
// MEASURE QUANTITY RESOLUTION
// ═══════════════════════════════════════════════════════════════

export function getResolvedQty(project, measure) {
  const scope = project.scope2026 || {};
  const autoQty = calcAutoQuantities(scope);
  const manualQty = project.measureQty || {};

  // Manual override takes precedence over auto-calculated
  if (manualQty[measure] !== undefined) return manualQty[measure];
  if (autoQty[measure] !== undefined) return String(autoQty[measure]);
  return "";
}

function calcAutoQuantities(scope) {
  const qty = {};
  const fnd = scope.fnd || {};

  // Attic insulation — bucket by pre-existing R-value
  const atticAdd = Number(scope.attic?.addR || 0);
  const atticPre = Number(scope.attic?.preR || 0);
  if (atticAdd > 0 && scope.attic?.sqft) {
    if (atticPre <= 11) qty["Attic Insulation (0-R11)"] = Number(scope.attic.sqft);
    else if (atticPre <= 19) qty["Attic Insulation (R12-19)"] = Number(scope.attic.sqft);
  }

  // Collar beam and outer ceiling joists contribute to attic R12-19 bucket
  if (Number(scope.collar?.addR || 0) > 0 && scope.collar?.sqft) {
    qty["Attic Insulation (R12-19)"] = (qty["Attic Insulation (R12-19)"] || 0) + Number(scope.collar.sqft);
  }
  if (Number(scope.outerCeiling?.addR || 0) > 0 && scope.outerCeiling?.sqft) {
    qty["Attic Insulation (R12-19)"] = (qty["Attic Insulation (R12-19)"] || 0) + Number(scope.outerCeiling.sqft);
  }

  // Basement wall insulation
  const fndAdd = Number(fnd.addR || 0);
  const fndPre = Number(fnd.preR || 0);
  const basementSqft = Number(fnd.aboveSqft || 0) + Number(fnd.belowSqft || 0);
  if ((fndAdd > 0 || (fnd.preR !== undefined && fndPre === 0 && basementSqft > 0)) && basementSqft > 0) {
    qty["Basement Wall Insulation"] = basementSqft;
  }

  // Crawl space wall insulation
  if (fnd.crawlR !== undefined && Number(fnd.crawlR || 0) === 0) {
    const crawlSqft = Number(fnd.crawlAbove || 0) + Number(fnd.crawlBelow || 0);
    if (crawlSqft > 0) qty["Crawl Space Wall Insulation"] = crawlSqft;
  }

  // Knee wall insulation
  if (Number(scope.kneeWall?.addR || 0) > 0 && scope.kneeWall?.sqft) {
    qty["Knee Wall Insulation"] = Number(scope.kneeWall.sqft);
  }

  // Injection foam walls — net of window/door area (~16% 1st floor, ~14% 2nd floor)
  const wall1Net = Number(scope.extWall1?.addR || 0) > 0 && scope.extWall1?.sqft
    ? Math.round(Number(scope.extWall1.sqft) * 0.84) : 0;
  const wall2Net = Number(scope.extWall2?.addR || 0) > 0 && scope.extWall2?.sqft
    ? Math.round(Number(scope.extWall2.sqft) * 0.86) : 0;
  if (wall1Net + wall2Net > 0) qty["Injection Foam Walls"] = wall1Net + wall2Net;

  // Rim joist insulation — basement + crawl
  if (fnd.bandAccess && Number(fnd.bandR || 0) === 0 && fnd.bandLnft) {
    qty["Rim Joist Insulation"] = Number(fnd.bandLnft);
  }
  if (fnd.crawlBandAccess && Number(fnd.crawlBandR || 0) === 0 && fnd.crawlBandLnft) {
    qty["Rim Joist Insulation"] = (qty["Rim Joist Insulation"] || 0) + Number(fnd.crawlBandLnft);
  }

  // Mechanical replacements
  if (scope.htg?.replaceRec) {
    qty[scope.htg?.system === "Boiler" ? "Boiler Replacement" : "Furnace Replacement"] = 1;
  }
  if (scope.dhw?.replaceRec) qty["Water Heater Replacement"] = 1;
  if (scope.clg?.replaceRec) qty["Central AC Replacement"] = 1;

  // Air sealing is always included
  qty["Air Sealing"] = 1;

  // Health & safety items from scope
  if (scope.coNeeded && Number(scope.coNeeded) > 0) {
    qty["CO Detector (Hardwired)"] = Number(scope.coNeeded);
  }
  if (scope.smokeNeeded && Number(scope.smokeNeeded) > 0) {
    qty["Smoke Detector (Hardwired)"] = Number(scope.smokeNeeded);
  }
  if (scope.doorSweeps && Number(scope.doorSweeps) > 0) {
    qty["Door Sweeps"] = Number(scope.doorSweeps);
  }
  if (scope.dhw?.flueRepair) qty["Flue Repairs"] = 1;

  return qty;
}

export function measUnit(measure) {
  if (measure.includes("Insulation") && !measure.includes("Rim")) return "sqft";
  if (measure.includes("Rim Joist")) return "lnft";
  if (measure.includes("Foam Walls")) return "sqft";
  return "ea";
}

// ═══════════════════════════════════════════════════════════════
// PROJECT LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function blank() {
  return {
    id: uid(), created: new Date().toISOString(), customerName: "", address: "",
    phone: "", email: "", riseId: "", stId: "", utility: "",
    sqft: "", stories: "", yearBuilt: "", homeType: "", occupants: "",
    currentStage: 0, stageHistory: [{ s: 0, at: new Date().toISOString() }],
    assessmentDate: "", installDate: "", tuneCleanDate: "", finalInspDate: "",
    assessmentScheduled: false, installScheduled: false, scheduleNotes: "",
    audit: { interior: {}, heating: {}, cooling: {}, dhw: {}, attic: {}, foundation: {}, doors: {}, notes: "" },
    preCFM50: "", postCFM50: "", preCFM25: "", postCFM25: "", bdLoc: "", extTemp: "",
    ventReq: "", ventMethod: "", ventResult: "", fanAdj: "", cazResults: {},
    measures: [], healthSafety: [], measureQty: {}, measureUnchecked: {}, hsUnchecked: {}, measureNotes: "", scopeVariances: "",
    riseStatus: "", scopeApproved: false, scopeDate: "", scopeNotes: "",
    mechNeeded: false, mechStatus: "", mechDate: "", mechNotes: "",
    fi: { safety: {}, blowerPre: "", blowerPost: "", ductPre: "", ductPost: "", thermoInstalled: "", followupNeeded: "", followupNotes: "" },
    qaqc: { scheduled: false, date: "", inspector: "", results: {}, notes: "", passed: null },
    scope2026: {},
    hvac: { furnace: {}, waterHeater: {}, condenser: {}, systemNotes: "", techName: "", completed: false, completedDate: "" },
    finalPassed: false, customerSignoff: false, installNotes: "",
    invoiceAmt: "", paymentSubmitted: false, paymentDate: "",
    docsChecklist: {}, photos: {}, activityLog: [], internalNotes: "",
    flagged: false, flagReason: "", changeOrders: [],
  };
}

export function calcStage(p) {
  // 7 Closeout — final passed + signed + payment
  if (p.finalPassed && p.customerSignoff && p.paymentSubmitted) return 7;
  // 6 Post-QC — post readings exist (work done, verifying)
  if (p.postCFM50) return 6;
  // 5 Install — install confirmed + date set
  if (p.installScheduled && p.installDate) return 5;
  // 4 Approve — RISE approved + mech sorted
  if (p.scopeApproved || p.riseStatus === "approved") {
    if (p.mechNeeded && p.mechStatus !== "approved") return 4;
    return 4;
  }
  // 3 Scope — has measures or CFM50 or RISE pending
  if (p.riseStatus === "pending" || p.measures.length > 0 || p.preCFM50 || Object.keys(p.photos || {}).filter(k => hasPhoto(p.photos, k)).length > 5) return 3;
  // 2 Assess — assessment scheduled/dated
  if (p.assessmentScheduled || p.assessmentDate) return 2;
  // 1 Schedule — has name + address
  if (p.customerName && p.address) return 1;
  // 0 Intake
  return 0;
}

export function getAlerts(p) {
  const alerts = [];
  const calculatedStage = calcStage(p);

  if (calculatedStage > p.currentStage) {
    alerts.push({ type: "advance", msg: `Ready \u2192 ${STAGES[calculatedStage].label}`, stage: calculatedStage });
  }
  if (p.customerName && p.address && !p.assessmentScheduled && !p.assessmentDate && p.currentStage < 2) {
    alerts.push({ type: "schedule", msg: "Needs assessment scheduling" });
  }
  if (p.scopeApproved && !p.installScheduled && !p.installDate && p.currentStage < 5) {
    alerts.push({ type: "schedule", msg: "Needs install scheduling" });
  }
  if (p.riseStatus === "corrections") {
    alerts.push({ type: "warn", msg: "RISE corrections requested" });
  }
  if (p.mechNeeded && !p.mechStatus) {
    alerts.push({ type: "warn", msg: "Mech replacement needs approval" });
  }

  const replStatus = (p.hvac || {}).replaceRequestStatus;
  if (replStatus === "pending") {
    alerts.push({ type: "repl", msg: "\uD83D\uDD04 Replacement request pending" });
  }
  if (replStatus === "approved" || replStatus === "denied") {
    const replBy = (p.hvac || {}).replaceRequestBy;
    if (replBy) alerts.push({ type: "repl_done", msg: `\uD83D\uDD04 Replacement ${replStatus}` });
  }

  const pendingCO = (p.changeOrders || []).filter(c => c.status === "pending").length;
  if (pendingCO > 0) {
    alerts.push({ type: "co", msg: `${pendingCO} COR${pendingCO > 1 ? "s" : ""} pending` });
  }

  return alerts;
}
