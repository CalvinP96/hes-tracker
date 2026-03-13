import { STAGES, EE_MEASURES, HS_MEASURES, PHOTO_SECTIONS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK } from "../constants/index.js";
import { getPhotos, hasPhoto, getResolvedQty, measUnit } from "../helpers/index.js";
import { formPrintHTML, savePrint } from "../export/savePrint.js";

// ═══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════

function sanitizeName(name) {
  return (name || "unnamed").replace(/[^a-zA-Z0-9]/g, "_");
}

function getPhotoExtension(dataUri) {
  if (dataUri.startsWith("data:image/png")) return "png";
  if (dataUri.startsWith("data:image/gif")) return "gif";
  return "jpg";
}

function addPhotosToZip(target, photos) {
  let count = 0;
  Object.entries(photos || {}).forEach(([key, val]) => {
    const arr = Array.isArray(val) ? val : val ? [val] : [];
    arr.forEach((ph, i) => {
      const d = ph?.d || ph;
      if (!d || typeof d !== "string" || !d.startsWith("data:")) return;
      const ext = getPhotoExtension(d);
      const b64 = d.split(",")[1];
      if (b64) {
        target.file(`${key}${arr.length > 1 ? `_${i + 1}` : ""}.${ext}`, b64, { base64: true });
        count++;
      }
    });
  });
  return count;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
// DATA EXPORT
// ═══════════════════════════════════════════════════════════════

export function exportData(projects) {
  const data = JSON.stringify(projects, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  triggerDownload(blob, `hes-retrofits-export-${todayISO()}.json`);
}

// ═══════════════════════════════════════════════════════════════
// PHOTO EXPORTS
// ═══════════════════════════════════════════════════════════════

export async function exportPhotos(projects) {
  if (typeof JSZip === "undefined") { alert("JSZip not loaded"); return; }
  const zip = new window.JSZip();
  let totalCount = 0;

  projects.forEach((p) => {
    const name = sanitizeName(p.customerName);
    const folder = zip.folder(`${name}_${p.id.slice(0, 6)}`);
    totalCount += addPhotosToZip(folder, p.photos);
  });

  if (totalCount === 0) { alert("No photos to export"); return; }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `hes-photos-${todayISO()}.zip`);
}

export async function exportProjectPhotos(proj) {
  if (typeof JSZip === "undefined") { alert("JSZip not loaded"); return; }
  const zip = new window.JSZip();
  const count = addPhotosToZip(zip, proj.photos);

  if (count === 0) { alert("No photos in this project"); return; }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${sanitizeName(proj.customerName)}_photos.zip`);
}

// ═══════════════════════════════════════════════════════════════
// FULL PROJECT FORMS EXPORT (PDF ZIP)
// ═══════════════════════════════════════════════════════════════

export async function exportProjectForms(proj) {
  if (typeof JSZip === "undefined" || typeof jspdf === "undefined") {
    alert("Libraries not loaded — refresh");
    return;
  }

  const zip = new window.JSZip();
  const nm = sanitizeName(proj.customerName);
  const p = proj;

  // Progress overlay
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;background:#0f172a;z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font-family:Arial;color:#e2e8f0";
  overlay.innerHTML =
    '<div style="font-size:16px;font-weight:bold">Generating PDFs\u2026</div><div id="pdf-step" style="font-size:13px;color:#94a3b8"></div>';
  document.body.appendChild(overlay);
  const stepEl = overlay.querySelector("#pdf-step");

  const { jsPDF } = window.jspdf;

  // ── PDF Builder ──────────────────────────────────────────
  function buildPDF(title, sections) {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const W = 612, H = 792, ML = 40, MR = 40, MT = 40, MB = 40;
    const CW = W - ML - MR;
    let y = MT;
    const black = [0, 0, 0], gray = [100, 100, 100], green = [22, 163, 74], red = [220, 38, 38], ltgray = [180, 180, 180];

    const checkPage = (need) => {
      if (y + need > H - MB) { doc.addPage(); y = MT; }
    };

    // Title
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
    doc.text(title, ML, y + 14); y += 20;
    doc.setDrawColor(...black); doc.setLineWidth(1.5); doc.line(ML, y, W - MR, y); y += 6;

    // Subtitle
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...gray);
    doc.text((p.customerName || "") + " \u00b7 " + (p.address || "") + " \u00b7 " + new Date().toLocaleDateString(), ML, y + 9);
    y += 18;

    sections.forEach((sec) => {
      checkPage(40);
      // Section header
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
      doc.text(sec.title, ML, y + 11); y += 14;
      doc.setDrawColor(...ltgray); doc.setLineWidth(0.5); doc.line(ML, y, W - MR, y); y += 6;

      if (sec.table) {
        const cols = sec.table.cols;
        const rows = sec.table.rows;
        const colW = cols.map((c) => c.w || CW / cols.length);
        // Header row
        checkPage(18);
        doc.setFillColor(235, 235, 235);
        doc.rect(ML, y, CW, 16, "F");
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...black);
        let cx = ML;
        cols.forEach((c, ci) => { doc.text(c.label, cx + 3, y + 11, { maxWidth: colW[ci] - 6 }); cx += colW[ci]; });
        y += 16;
        // Data rows
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        rows.forEach((row) => {
          checkPage(16);
          cx = ML;
          row.forEach((cell, ci) => {
            const isObj = cell && typeof cell === "object";
            const txt = String(isObj ? (cell.t || "\u2014") : (cell != null ? cell : "\u2014"));
            if (isObj && cell.c === "g") doc.setTextColor(...green);
            else if (isObj && cell.c === "r") doc.setTextColor(...red);
            else doc.setTextColor(...black);
            doc.text(txt, cx + 3, y + 10, { maxWidth: colW[ci] - 6 });
            cx += colW[ci];
          });
          doc.setDrawColor(240, 240, 240); doc.line(ML, y + 14, W - MR, y + 14);
          y += 15;
        });
        y += 4;
      }

      if (sec.rows) {
        doc.setFontSize(9);
        sec.rows.forEach((row) => {
          checkPage(16);
          doc.setFont("helvetica", "normal"); doc.setTextColor(...gray);
          const lbl = String(row[0] != null ? row[0] : "\u2014");
          const val = String(row[1] != null ? row[1] : "\u2014");
          doc.text(lbl, ML, y + 10, { maxWidth: CW * 0.55 });
          if (row[2] === "g") doc.setTextColor(...green);
          else if (row[2] === "r") doc.setTextColor(...red);
          else { doc.setFont("helvetica", "bold"); doc.setTextColor(...black); }
          doc.text(val, W - MR, y + 10, { align: "right", maxWidth: CW * 0.42 });
          doc.setDrawColor(245, 245, 245); doc.line(ML, y + 14, W - MR, y + 14);
          y += 15;
        });
        y += 4;
      }

      if (sec.text) {
        checkPage(20);
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...gray);
        const lines = doc.splitTextToSize(sec.text, CW);
        lines.forEach((line) => { checkPage(12); doc.text(line, ML, y + 10); y += 12; });
        y += 4;
      }

      if (sec.sig) {
        checkPage(60);
        doc.setDrawColor(...ltgray); doc.line(ML, y, ML + 200, y);
        doc.setFontSize(8); doc.setTextColor(...gray); doc.text("Signature (digitally signed)", ML, y + 10);
        y += 16;
      }
    });

    return doc.output("blob");
  }

  // ── Format helpers for PDF scope sections ────────────────
  const CK = (b) => b === true ? "\u2611" : b === false ? "\u2610" : "\u2014";
  const YN = (b) => b === true ? "Yes" : b === false ? "No" : "\u2014";
  const RND = (x) => Math.round(x * 100) / 100;

  try {
    const audit = p.audit || {};
    const fi = p.qaqc?.fi || {};
    const qaqc = p.qaqc || {};

    // ── 1. Customer Authorization ──────────────────────────
    stepEl.textContent = "1/10 Customer Authorization\u2026";
    if (audit.customerAuthSig) {
      const loadImg = (src) => new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.width; c.height = img.height;
          c.getContext("2d").drawImage(img, 0, 0);
          res(c.toDataURL("image/jpeg", 0.92));
        };
        img.onerror = rej;
        img.src = src;
      });
      try {
        const pg1 = await loadImg("/auth-form-page1.jpg");
        const pg2 = await loadImg("/auth-form-page2.jpg");
        const adoc = new jsPDF({ unit: "pt", format: "letter" });
        adoc.addImage(pg1, "JPEG", 0, 0, 612, 792);
        if (audit.customerAuthSig) {
          adoc.addImage(audit.customerAuthSig, "PNG", 260, 340, 160, 14);
          adoc.setFontSize(7); adoc.setFont("helvetica", "bold");
          adoc.text(audit.customerAuthName || p.customerName || "", 260, 365);
          const authDt = audit.authDate ? new Date(audit.authDate).toLocaleDateString("en-US") : "";
          adoc.setFont("helvetica", "normal");
          adoc.text(authDt, 260, 377);
          adoc.text(p.address || "", 260, 389);
        }
        adoc.addPage();
        adoc.addImage(pg2, "JPEG", 0, 0, 612, 792);
        zip.file(nm + "_customer_auth.pdf", adoc.output("blob"));
      } catch (e) { console.warn("Auth form images not available", e); }
    }

    // ── 2. Assessment ──────────────────────────────────────
    stepEl.textContent = "2/10 Assessment\u2026";
    zip.file(nm + "_assessment.pdf", buildPDF("Data Collection Tool \u2014 Assessment", [
      { title: "Project Info", rows: [
        ["RISE PID", p.riseId], ["Stage", STAGES[p.currentStage]?.label],
        ["Bedrooms", audit.bedrooms], ["Bathrooms", audit.bathrooms],
        ["Year Built", audit.yearBuilt || p.yearBuilt], ["Sq Ft", audit.sqft || p.sqft], ["Stories", audit.stories],
      ]},
      { title: "Blower Door", rows: [["Pre CFM50", p.preCFM50], ["Post CFM50", p.postCFM50]] },
      { title: "CAZ Testing", rows: [
        ["Ambient CO", audit.ambientCO], ["Heat Spillage", audit.heatSpill], ["WH Spillage", audit.whSpill],
        ["Heating CO", audit.heatCO], ["WH CO", audit.whCO], ["Oven CO", audit.ovenCO],
      ].filter((r) => r[1]) },
      ...(audit.assessorSig ? [{ title: "Assessor", sig: true }] : []),
    ]));

    // ── 3. Scope ───────────────────────────────────────────
    stepEl.textContent = "3/10 Scope\u2026";
    {
      const scope = p.scope2026 || {};
      const heating = scope.htg || {};
      const cooling = scope.clg || {};
      const hotWater = scope.dhw || {};
      const interior = scope.int || {};
      const exhaust = scope.exh || {};
      const attic = scope.attic || {};
      const collarBeam = scope.collar || {};
      const outerCeiling = scope.outerCeiling || {};
      const kneeWall = scope.kneeWall || {};
      const extWall1 = scope.extWall1 || {};
      const extWall2 = scope.extWall2 || {};
      const foundation = scope.fnd || {};
      const yr = new Date().getFullYear();
      const afue = (heating.btuIn && heating.btuOut) ? (Number(heating.btuOut) / Number(heating.btuIn) * 100).toFixed(1) + "%" : "\u2014";

      const secs = [];
      secs.push({ title: "Customer Information", rows: [
        ["Customer", p.customerName], ["Address", p.address], ["RISE PID", p.riseId],
        ["Sq Ft", p.sqft], ["Volume", Number(p.sqft) ? (Number(p.sqft) * 8).toLocaleString() + " ft\u00b3" : null],
        ["Stories", p.stories], ["Bedrooms", scope.bedrooms], ["Year Built", p.yearBuilt],
        ["Home Age", p.yearBuilt ? (yr - Number(p.yearBuilt)) + " yrs" : null], ["Occupants", p.occupants],
      ]});
      secs.push({ title: "Building Property Type", rows: [
        ["Style", scope.style], ["Tenant Type", scope.tenantType],
        ["Gutters Exist", CK(scope.gutterExist)], ["Downspouts", CK(scope.downspouts)], ["Gutter Repairs", CK(scope.gutterRepair)],
        ["Roof Condition", scope.roofCondition], ["Roof Type", scope.roofType], ["Roof Age", scope.roofAge], ["Roof Repairs", CK(scope.roofRepair)],
      ]});
      secs.push({ title: "Interior Conditions", rows: [
        ["Ceiling Condition", scope.ceilingCond], ["Wall Condition", scope.wallCond], ["Walls Need Insulation", scope.wallsNeedInsul],
      ]});
      secs.push({ title: "Smoke / CO / Weatherization", rows: [
        ["Smoke \u2014 present", scope.smokePresent], ["Smoke \u2014 to install", scope.smokeNeeded],
        ["CO \u2014 present", scope.coPresent], ["CO \u2014 to install", scope.coNeeded],
        ["Tenmats Needed", scope.tenmats], ["Door Sweeps", scope.doorSweeps],
      ]});
      secs.push({ title: "Heating System", rows: [
        ["Thermostat", heating.thermostat], ["Fuel", heating.fuel], ["System", heating.system], ["Flue", heating.flue],
        ["Manufacturer", heating.mfg], ["Install Year", heating.year],
        ["Age", heating.year ? (yr - Number(heating.year)) + " yrs" : null],
        ["Condition", heating.condition], ["BTU In", heating.btuIn], ["BTU Out", heating.btuOut],
        ["AFUE", afue], ["Draft", heating.draft],
        ["Gas Shut Off", CK(heating.gasShutoff)], ["Asbestos Pipes", CK(heating.asbestosPipes)],
        ["Replace Rec", CK(heating.replaceRec)],
        ["Clean & Tune", CK(heating.cleanTuneOverride !== undefined ? heating.cleanTuneOverride : heating.cleanTune)],
      ]});
      if (heating.notes) secs[secs.length - 1].rows.push(["Notes", heating.notes]);
      secs.push({ title: "Cooling System", rows: [
        ["Type", cooling.type], ["Manufacturer", cooling.mfg], ["Install Year", cooling.year],
        ["Age", cooling.year ? (yr - Number(cooling.year)) + " yrs" : null], ["SEER", cooling.seer],
        ["Condition", cooling.condition], ["BTU Size", cooling.btu], ["Replace Rec", CK(cooling.replaceRec)],
      ]});
      secs.push({ title: "Domestic Hot Water", rows: [
        ["Fuel", hotWater.fuel], ["System", hotWater.system], ["Manufacturer", hotWater.mfg],
        ["Install Year", hotWater.year], ["Age", hotWater.year ? (yr - Number(hotWater.year)) + " yrs" : null],
        ["Condition", hotWater.condition], ["Input BTU", hotWater.btuIn],
        ["Insulated Pipes", CK(hotWater.insulPipes)], ["Flue Repair", CK(hotWater.flueRepair)],
        ["Replace Rec", CK(hotWater.replaceRec)], ["Ducts Sealing", CK(hotWater.ductsSealed)],
      ]});
      secs.push({ title: "Interior Inspection", rows: [
        ["Mold", CK(interior.mold)], ["Moisture", CK(interior.moisture)], ["Knob & Tube", CK(interior.knobTube)],
        ["Electrical", CK(interior.electrical)], ["Broken Glass", CK(interior.brokenGlass)],
        ["Vermiculite", CK(interior.vermiculite)], ["Water Leaks", CK(interior.waterLeaks)], ["Roof Leaks", CK(interior.roofLeaks)],
        ["Ceiling", interior.ceiling], ["Wall", interior.wall],
        ["Dropped Ceiling", CK(interior.droppedCeiling)], ["Drywall Repair", CK(interior.drywallRepair)],
        ["Recessed Light", CK(interior.recessedLight)], ["CO Detector", CK(interior.coDetector)], ["Smoke Detector", CK(interior.smokeDetector)],
      ]});
      secs.push({ title: "Door Types / Exhaust", rows: [
        ["Front", CK(scope.doors?.Front)], ["Back", CK(scope.doors?.Back)],
        ["Basement", CK(scope.doors?.Basement)], ["Attic", CK(scope.doors?.Attic)],
        ["Sweeps Needed", scope.totalSweeps],
        ["Fan Replace", CK(exhaust.fanReplace)], ["Bath Fan Light", CK(exhaust.bathFanLight)],
        ["Vent Kit", CK(exhaust.ventKit)], ["Term Cap", CK(exhaust.termCap)],
        ["Dryer Proper", CK(exhaust.dryerProper)], ["Dryer Repair", CK(exhaust.dryerRepair)],
        ["BD In", exhaust.bdIn], ["BD Out", exhaust.bdOut],
      ]});
      secs.push({ title: "Attic", rows: [
        ["Finished", CK(attic.finished)], ["Unfinished", CK(attic.unfinished)], ["Flat", CK(attic.flat)],
        ["Sq Ft", attic.sqft], ["Pre R", attic.preR], ["R to Add", attic.addR],
        ["Total R", (attic.preR || attic.addR) ? "R-" + (Number(attic.preR || 0) + Number(attic.addR || 0)) : null],
        ["Ductwork", CK(attic.ductwork)], ["Floor Boards", CK(attic.floorBoards)],
        ["Mold", CK(attic.moldPresent)], ["Vermiculite", CK(attic.vermPresent)], ["Knob & Tube", CK(attic.knobTube)],
        ["Existing Vent", attic.existVent], ["Needed Vent", attic.needVent], ["Access", attic.accessLoc],
      ]});
      secs.push({ title: "Collar Beam", rows: [
        ["Sq Ft", collarBeam.sqft], ["Pre R", collarBeam.preR], ["R to Add", collarBeam.addR],
        ["Accessible", CK(collarBeam.accessible)], ["Cut In", CK(collarBeam.cutIn)], ["Ductwork", CK(collarBeam.ductwork)],
      ]});
      secs.push({ title: "Outer Ceiling Joists", rows: [
        ["Sq Ft", outerCeiling.sqft], ["Pre R", outerCeiling.preR], ["R to Add", outerCeiling.addR],
        ["Accessible", CK(outerCeiling.accessible)], ["Cut In", CK(outerCeiling.cutIn)], ["Ductwork", CK(outerCeiling.ductwork)],
      ]});
      secs.push({ title: "Knee Walls", rows: [
        ["Sq Ft", kneeWall.sqft], ["Pre R", kneeWall.preR], ["R to Add", kneeWall.addR],
        ["Dense Pack", YN(kneeWall.densePack)], ["Rigid Foam", YN(kneeWall.rigidFoam)],
        ["Tyvek", YN(kneeWall.tyvek)], ["Wall Type", kneeWall.wallType],
      ]});
      secs.push({ title: "Ext Walls \u2014 1st Floor", rows: [
        ["Sq Ft", extWall1.sqft], ["Pre R", extWall1.preR], ["R to Add", extWall1.addR],
        ["Dense Pack", YN(extWall1.densePack)], ["Cladding", extWall1.cladding],
        ["Insulate From", extWall1.insulFrom], ["Wall Type", extWall1.wallType], ["Phenolic", YN(extWall1.phenolic)],
      ]});
      secs.push({ title: "Ext Walls \u2014 2nd Floor", rows: [
        ["Sq Ft", extWall2.sqft], ["Pre R", extWall2.preR], ["R to Add", extWall2.addR],
        ["Dense Pack", YN(extWall2.densePack)], ["Cladding", extWall2.cladding],
      ]});
      secs.push({ title: "Foundation / Crawl", rows: [
        ["Type", foundation.type], ["Above SqFt", foundation.aboveSqft], ["Below SqFt", foundation.belowSqft],
        ["Pre R", foundation.preR], ["Insul Type", foundation.insulType],
        ["Band Access", CK(foundation.bandAccess)], ["Band LnFt", foundation.bandLnft],
        ["Vented", CK(foundation.vented)], ["Vapor Barrier", YN(foundation.vaporBarrier)], ["Water Issues", YN(foundation.waterIssues)],
        ["Crawl Duct", CK(foundation.crawlDuct)], ["Crawl Floor", foundation.crawlFloor],
        ["Crawl Above", foundation.crawlAbove], ["Crawl Below", foundation.crawlBelow], ["Crawl R", foundation.crawlR],
      ]});
      secs.push({ title: "Diagnostics", rows: [
        ["Pre CFM50", p.preCFM50], ["Ext Temp", scope.extTemp], ["BD Location", p.bdLoc],
      ]});

      // ASHRAE calculation
      const baseSqft = Number(p.sqft) || 0;
      const finBasement = foundation.type === "Finished" ? (Number(foundation.aboveSqft) || 0) + (Number(foundation.belowSqft) || 0) : 0;
      const totalSqft = baseSqft + finBasement;
      const bedrooms = Number(scope.bedrooms) || 0;
      const preCFM50 = Number(p.preCFM50) || 0;
      const canAirSeal = scope.ashrae?.canAirSeal !== undefined ? scope.ashrae.canAirSeal : (preCFM50 > 0 && baseSqft > 0 && preCFM50 >= baseSqft * 1.1);
      const estQ50 = canAirSeal ? Math.round(preCFM50 * 0.75) : preCFM50;
      const stories = Number(p.stories) || 1;
      const height = stories >= 2 ? 16 : stories >= 1.5 ? 14 : 8;
      const infiltration = estQ50 > 0 ? 0.052 * estQ50 * 0.56 * Math.pow(height / 8.2, 0.4) : 0;
      const totalReq = totalSqft > 0 ? 0.03 * totalSqft + 7.5 * (bedrooms + 1) : 0;
      const ashrae = scope.ashrae || {};
      const auditData = p.audit || {};
      const kCFM = Number(ashrae.kitchenCFM || auditData.kitchenFan || 0);
      const b1CFM = Number(ashrae.bath1CFM || auditData.bathFan1 || 0);
      const b2CFM = Number(ashrae.bath2CFM || auditData.bathFan2 || 0);
      const b3CFM = Number(ashrae.bath3CFM || auditData.bathFan3 || 0);
      const kDef = kCFM > 0 ? Math.max(0, 100 - (ashrae.kWin ? 20 : kCFM)) : 0;
      const b1Def = b1CFM > 0 ? Math.max(0, 50 - (ashrae.b1Win ? 20 : b1CFM)) : 0;
      const b2Def = b2CFM > 0 ? Math.max(0, 50 - (ashrae.b2Win ? 20 : b2CFM)) : 0;
      const b3Def = b3CFM > 0 ? Math.max(0, 50 - (ashrae.b3Win ? 20 : b3CFM)) : 0;
      const totalDeficit = kDef + b1Def + b2Def + b3Def;
      const supplement = totalDeficit * 0.25;
      const qfan = totalReq + supplement - infiltration;
      const fanSetting = Number(ashrae.fanSetting) || 0;

      secs.push({ title: "ASHRAE 62.2-2016 Ventilation", rows: [
        ["Floor Area", totalSqft + " ft\u00b2"], ["Nbr (bedrooms)", bedrooms], ["Occupants (Nbr+1)", bedrooms + 1], ["Height", height + " ft"],
        ["Q50 (est. post)", estQ50 + " CFM" + (canAirSeal ? " (" + preCFM50 + "\u00d70.75)" : " (no air seal)")],
        ["Kitchen Fan", kCFM > 0 ? kCFM + " CFM" : null], ["Bath #1", b1CFM > 0 ? b1CFM + " CFM" : null],
        ["Bath #2", b2CFM > 0 ? b2CFM + " CFM" : null], ["Bath #3", b3CFM > 0 ? b3CFM + " CFM" : null],
        ["Total Deficit", Math.round(totalDeficit) + " CFM"],
        ["Infiltration (Qinf)", RND(infiltration) + " CFM"],
        ["Qtot", RND(totalReq) + " CFM"], ["Supplement", RND(supplement) + " CFM"],
        ["Qfan Required", RND(qfan) + " CFM", qfan > 0 ? "r" : "g"],
      ]});
      if (fanSetting > 0) secs[secs.length - 1].rows.push(["Fan Setting", fanSetting + " CFM"], ["Run-time", RND(qfan / fanSetting * 60) + " min/hr"]);

      // Measures
      if (p.measures?.length) secs.push({ title: "EE Measures (" + p.measures.length + ")", table: {
        cols: [{ label: "Measure", w: 380 }, { label: "Qty", w: 60 }, { label: "Unit", w: 92 }],
        rows: p.measures.map((m) => [m, getResolvedQty(p, m) || "\u2014", measUnit(m)]),
      }});
      if (p.healthSafety?.length) secs.push({ title: "H&S Measures (" + p.healthSafety.length + ")", table: {
        cols: [{ label: "Measure", w: 432 }, { label: "Qty", w: 100 }],
        rows: p.healthSafety.map((m) => [m, getResolvedQty(p, m) || "\u2014"]),
      }});

      secs.push({ title: "Notes", rows: [["Work Notes", p.measureNotes], ["H&S Notes", scope.hsNotes]] });
      zip.file(nm + "_scope.pdf", buildPDF("2026 HEA/IE Retrofit Form \u2014 Scope of Work", secs));
    }

    // ── 4. Pre-Work Scope ──────────────────────────────────
    stepEl.textContent = "4/10 Pre-Work Scope\u2026";
    {
      const scope = p.scope2026 || {};
      const insulQty = scope.insulQty || {};
      const secs = [];
      secs.push({ title: "Property Information", rows: [
        ["Customer", p.customerName], ["Address", p.address], ["RISE PID", p.riseId],
        ["Sq Footage", (p.sqft || "") + " ft\u00b2"], ["Year Built", p.yearBuilt], ["Stories", p.stories], ["Pre CFM50", p.preCFM50],
      ]});
      if (p.measures.length) secs.push({ title: "Energy Efficiency Measures", table: {
        cols: [{ label: "Measure", w: 260 }, { label: "Qty", w: 80 }, { label: "Unit", w: 80 }],
        rows: p.measures.map((m) => [m, getResolvedQty(p, m) || "\u2014", measUnit(m)]),
      }});
      if (p.healthSafety.length) secs.push({ title: "Health & Safety Measures", table: {
        cols: [{ label: "Measure", w: 310 }, { label: "Qty", w: 80 }],
        rows: p.healthSafety.map((m) => [m, getResolvedQty(p, m) || "1"]),
      }});
      const iqRows = Object.entries(insulQty).filter(([, v]) => v);
      if (iqRows.length) secs.push({ title: "Insulation Specifications", table: {
        cols: [{ label: "Location", w: 260 }, { label: "Qty", w: 80 }, { label: "Unit", w: 80 }],
        rows: iqRows.map(([l, v]) => [l, String(v), l.includes("Rim Joist") ? "LnFt" : "SqFt"]),
      }});
      if (p.measureNotes) secs.push({ title: "Scope Notes", text: p.measureNotes });
      secs.push({ title: "Authorization", text: "By signing below, the customer acknowledges and authorizes the scope of work described above. Work shall not commence until this authorization is obtained." });
      if (fi.preScopeSig) secs.push({ title: "Customer Pre-Work Authorization", sig: true });
      zip.file(nm + "_pre_work_scope.pdf", buildPDF("Pre-Work Scope of Work \u2014 Authorization", secs));
    }

    // ── 5. Post-Work Scope ─────────────────────────────────
    stepEl.textContent = "5/10 Post-Work Scope\u2026";
    {
      const scope = p.scope2026 || {};
      const insulQty = scope.insulQty || {};
      const changeOrders = p.changeOrders || [];
      const approved = changeOrders.filter((c) => c.status === "approved");
      const addNames = approved.flatMap((c) => (c.adds || []).map((a) => a.m || a));
      const remNames = approved.flatMap((c) => c.removes || []);
      const postMeasures = [...p.measures.filter((m) => !remNames.includes(m)), ...addNames.filter((m) => !p.measures.includes(m) && EE_MEASURES.includes(m))];
      const postHS = [...p.healthSafety.filter((m) => !remNames.includes(m)), ...addNames.filter((m) => !p.healthSafety.includes(m) && HS_MEASURES.includes(m))];
      const coQtyMap = {};
      approved.forEach((c) => (c.adds || []).forEach((a) => { if (a.qty) coQtyMap[a.m] = a.qty; }));
      const getQty = (m) => coQtyMap[m] || getResolvedQty(p, m) || "1";

      const secs = [];
      secs.push({ title: "Property Information", rows: [
        ["Customer", p.customerName], ["Address", p.address], ["RISE PID", p.riseId],
        ["Sq Footage", (p.sqft || "") + " ft\u00b2"], ["Year Built", p.yearBuilt], ["Stories", p.stories],
        ["Pre CFM50", p.preCFM50], ["Post CFM50", p.postCFM50],
      ]});
      if (postMeasures.length) secs.push({ title: "Energy Efficiency Measures (Final)", table: {
        cols: [{ label: "Measure", w: 220 }, { label: "Qty", w: 60 }, { label: "Unit", w: 60 }, { label: "Status", w: 80 }],
        rows: [
          ...postMeasures.map((m) => [addNames.includes(m) ? "\uD83D\uDD36 " + m : m, getQty(m), measUnit(m), addNames.includes(m) ? "COR Added" : "Approved"]),
          ...remNames.filter((m) => EE_MEASURES.includes(m)).map((m) => [{ t: m, c: "r" }, "\u2014", "\u2014", { t: "COR Removed", c: "r" }]),
        ],
      }});
      if (postHS.length) secs.push({ title: "Health & Safety Measures (Final)", table: {
        cols: [{ label: "Measure", w: 280 }, { label: "Qty", w: 60 }, { label: "Status", w: 80 }],
        rows: [
          ...postHS.map((m) => [addNames.includes(m) ? "\uD83D\uDD36 " + m : m, getQty(m), addNames.includes(m) ? "COR Added" : "Approved"]),
          ...remNames.filter((m) => HS_MEASURES.includes(m)).map((m) => [{ t: m, c: "r" }, "\u2014", { t: "COR Removed", c: "r" }]),
        ],
      }});
      const iqRows = Object.entries(insulQty).filter(([, v]) => v);
      if (iqRows.length) secs.push({ title: "Insulation Specifications", table: {
        cols: [{ label: "Location", w: 260 }, { label: "Qty", w: 80 }, { label: "Unit", w: 80 }],
        rows: iqRows.map(([l, v]) => [l, String(v), l.includes("Rim Joist") ? "LnFt" : "SqFt"]),
      }});
      if (approved.length) secs.push({ title: "Approved Scope Modifications (" + approved.length + ")", rows:
        approved.map((c) => [c.text, (c.adds || []).map((a) => "+ " + (a.m || a)).concat((c.removes || []).map((r) => "\u2212 " + r)).join(", ") || "No changes"]),
      });
      secs.push({ title: "Acceptance", text: "By signing below, the customer acknowledges that the work described above has been completed to their satisfaction and accepts the work as performed." });
      if (fi.postScopeSig) secs.push({ title: "Customer Post-Work Acceptance", sig: true });
      zip.file(nm + "_post_work_scope.pdf", buildPDF("Post-Work Scope of Work \u2014 Completion", secs));
    }

    // ── 6. Final Inspection ────────────────────────────────
    stepEl.textContent = "6/10 Final Inspection\u2026";
    {
      const secs = [];
      secs.push({ title: "Inspection Info", rows: [
        ["Homeowner name", p.customerName], ["Home address", p.address],
        ["Date of final inspection", fi.date], ["Installation Contractor", fi.contractor || "Assured Energy Solutions"],
      ]});
      secs.push({ title: "Health & Safety", table: {
        cols: [{ label: "Item", w: 240 }, { label: "Reading", w: 80 }, { label: "Pass/Fail", w: 60 }, { label: "Follow-up", w: 60 }],
        rows: FI_SAFETY.map((item) => {
          const d = fi[item.k] || {};
          return [
            (item.sub ? "   " : "") + item.l,
            d.reading ? d.reading + " " + (item.u || "") : (d.yn || "\u2014"),
            { t: d.pf === "P" ? "Pass" : d.pf === "F" ? "Fail" : "N/A", c: d.pf === "P" ? "g" : d.pf === "F" ? "r" : "" },
            d.fu === "Y" ? "Yes" : d.fu === "N" ? "No" : "N/A",
          ];
        }),
      }});
      secs.push({ title: "Detectors & Ventilation", rows: [
        ["Smoke detectors installed", fi.smokeQty || "\u2014"],
        ["CO detectors installed", fi.coQty || "\u2014"],
        ["Required ventilation ASHRAE 62.2", (fi.ventCFM || "\u2014") + " CFM"],
        ["New exhaust fan installed?", fi.newFan || "\u2014"],
        ["All H&S issues addressed?", fi.hsAddressed || "\u2014", fi.hsAddressed === "Yes" ? "g" : "r"],
        ...(fi.hsWhyNot ? [["If no, why not", fi.hsWhyNot]] : []),
      ]});
      secs.push({ title: "Insulation", table: {
        cols: [{ label: "Area", w: 170 }, { label: "Pre R-value", w: 90 }, { label: "Post R-value", w: 90 }, { label: "Insulated?", w: 90 }],
        rows: FI_INSUL.map((ins) => { const d = fi[ins.k] || {}; return [ins.l, d.preR || "\u2014", d.postR || "\u2014", d.done || "\u2014"]; }),
      }});
      secs.push({ title: "Combustion Appliances \u2014 Space Heating and DHW", table: {
        cols: [{ label: "#", w: 25 }, { label: "Equipment Type", w: 180 }, { label: "Vent Type", w: 120 }, { label: "Replaced?", w: 70 }, { label: "Follow-up?", w: 70 }],
        rows: [1, 2, 3].map((n) => { const d = fi["equip" + n] || {}; return [String(n), d.type || "\u2014", d.vent || "\u2014", d.replaced || "\u2014", d.fu || "\u2014"]; }),
      }});
      secs.push({ title: "Blower Door", rows: [["Pre CFM50", p.preCFM50 || "\u2014"], ["Post CFM50", p.postCFM50 || "\u2014"]] });
      secs.push({ title: "Direct Installs", rows: [["New thermostat installed?", fi.thermostat || "\u2014"]] });
      secs.push({ title: "Follow-up Needed", text: fi.followUpNA ? "N/A" : (fi.followUp || "None") });
      secs.push({ title: "Contractor Checklist", rows: FI_CONTRACTOR_CK.map((ck) => [ck, fi.ck?.[ck] ? "\u2611 Done" : "\u2610", fi.ck?.[ck] ? "g" : ""]) });
      if (fi.inspectorSig) secs.push({ title: "Inspector", sig: true });
      zip.file(nm + "_final_inspection.pdf", buildPDF("Home Energy Savings \u2013 Retrofits Final Inspection Form", secs));
    }

    // ── 7. QAQC ────────────────────────────────────────────
    stepEl.textContent = "7/10 QAQC\u2026";
    {
      const secs = [{ title: "Inspection Info", rows: [["Date", qaqc.date || "\u2014"], ["Inspector", qaqc.inspector || "\u2014"]] }];
      Object.entries(QAQC_SECTIONS).forEach(([cat, items]) => {
        secs.push({ title: cat, rows: items.map((item, i) => {
          const r = qaqc.results?.[cat + "-" + i] || {};
          return [(i + 1) + ". " + item, (r.v || "\u2014") + (r.c ? " \u2014 " + r.c : ""), r.v === "Y" ? "g" : r.v === "N" ? "r" : ""];
        })});
      });
      secs.push({ title: "Overall Result", rows: [
        ["Result", qaqc.passed === true ? "PASS" : qaqc.passed === false ? "FAIL" : "\u2014", qaqc.passed === true ? "g" : "r"],
        ...(qaqc.notes ? [["Notes", qaqc.notes]] : []),
      ]});
      if (qaqc.inspectorSig) secs.push({ title: "Inspector", sig: true });
      zip.file(nm + "_qaqc_observation.pdf", buildPDF("QAQC Observation Form", secs));
    }

    // ── 8. Activity Log ────────────────────────────────────
    stepEl.textContent = "8/10 Activity Log\u2026";
    if (p.activityLog?.length) {
      zip.file(nm + "_activity_log.pdf", buildPDF("Activity Log", [
        { title: p.activityLog.length + " Entries", rows:
          p.activityLog.slice(0, 100).map((l) => [new Date(l.ts).toLocaleString() + " \u2014 " + l.by, l.txt]),
        },
      ]));
    }

    // ── 9. HVAC Tune-Up Report ─────────────────────────────
    stepEl.textContent = "9/10 HVAC Tune-Up\u2026";
    {
      const hvac = p.hvac || {};
      const furnace = hvac.furnace || {};
      const waterHeater = hvac.waterHeater || {};
      const condenser = hvac.condenser || {};
      if (hvac.techName || hvac.completed) {
        const secs = [];
        secs.push({ title: "Job Info", rows: [
          ["Customer", p.customerName], ["Address", p.address], ["ST#", p.stId],
          ["Technician", hvac.techName], ["Manager", hvac.managerName],
          ["Date", hvac.completedDate ? new Date(hvac.completedDate).toLocaleDateString() : "\u2014"],
          ["Status", hvac.completed ? "Completed" : "In Progress"],
        ]});
        if (furnace.make) secs.push({ title: "Furnace", rows: [
          ["Make", furnace.make], ["Model", furnace.model], ["Serial", furnace.serial],
          ["Age", furnace.age ? (furnace.age + " yrs") : "\u2014"],
          ["Heat Exchanger", furnace.heatExchanger], ["Inducer Motor", furnace.inducerMotor],
          ["Ignitor", furnace.ignitorCond], ["Burner", furnace.burnerCond],
          ["Flame Sensor", furnace.flameSensor], ["Filter Size", furnace.filterSize],
          ["Filter Changed", furnace.filterChanged], ["Blower Motor", furnace.blowerMotor],
          ["Control Board", furnace.controlBoard], ["Thermostat", furnace.thermostat],
          ["Findings", furnace.findings],
          ...(furnace.findingsNotes ? [["Notes", furnace.findingsNotes]] : []),
        ].filter((r) => r[1]) });
        if (waterHeater.make) secs.push({ title: "Water Heater", rows: [
          ["Make", waterHeater.make], ["Model", waterHeater.model], ["Serial", waterHeater.serial],
          ["Age", waterHeater.age ? (waterHeater.age + " yrs") : "\u2014"],
          ["Condition", waterHeater.condition], ["Venting", waterHeater.venting], ["Burners", waterHeater.burners],
          ["Findings", waterHeater.findings],
          ...(waterHeater.findingsNotes ? [["Notes", waterHeater.findingsNotes]] : []),
        ].filter((r) => r[1]) });
        if (condenser.make) secs.push({ title: "Air Conditioning / Condenser", rows: [
          ["Make", condenser.make], ["Model", condenser.model], ["Serial", condenser.serial],
          ["Age", condenser.age ? (condenser.age + " yrs") : "\u2014"],
          ["Condition", condenser.condition], ["Electrical", condenser.electrical], ["Line Set", condenser.lineSet],
          ["Evap Coil", condenser.evapCoil], ["Other Issues", condenser.otherIssues],
          ["Findings", condenser.findings],
          ...(condenser.findingsNotes ? [["Notes", condenser.findingsNotes]] : []),
        ].filter((r) => r[1]) });
        if (hvac.systemNotes) secs.push({ title: "System Assessment", rows: [
          ["Findings", hvac.systemNotes], ...(hvac.detailNotes ? [["Details", hvac.detailNotes]] : []),
        ]});
        if (hvac.replaceRequestStatus) secs.push({ title: "Replacement Request", rows: [
          ["Type", hvac.replaceType], ["Priority", hvac.replacePriority],
          ["Status", hvac.replaceRequestStatus?.toUpperCase()],
          ["Justification", hvac.replaceJustification],
        ].filter((r) => r[1]) });
        if (hvac.replInstallComplete) secs.push({ title: "Replacement Install", rows: [
          ["New Make", hvac.replNewMake], ["New Model", hvac.replNewModel], ["New Serial", hvac.replNewSerial],
          ["Install Date", hvac.replInstallDate ? new Date(hvac.replInstallDate).toLocaleDateString() : "\u2014"],
          ["Installed By", hvac.replInstallBy], ["Notes", hvac.replNotes],
        ].filter((r) => r[1]) });
        zip.file(nm + "_hvac_tuneup.pdf", buildPDF("AES System Tune Up Report", secs));
      }
    }

    // ── 10. HVAC + Replacement Photos ──────────────────────
    stepEl.textContent = "10/10 HVAC Photos\u2026";
    {
      const hvacPhotoItems = Object.entries(PHOTO_SECTIONS)
        .filter(([cat]) => cat.startsWith("HVAC"))
        .flatMap(([, items]) => items);
      const replPhotoItems = Object.entries(PHOTO_SECTIONS)
        .filter(([cat]) => cat.startsWith("HVAC Replacement"))
        .flatMap(([, items]) => items);
      const allHvacItems = [...hvacPhotoItems, ...replPhotoItems];

      for (const item of allHvacItems) {
        const photos = getPhotos(p.photos, item.id);
        for (let i = 0; i < photos.length; i++) {
          const ph = photos[i];
          if (ph.d) {
            const ext = getPhotoExtension(ph.d);
            const b64 = ph.d.split(",")[1];
            if (b64) {
              zip.file(`hvac_photos/${item.l.replace(/[^a-zA-Z0-9 ]/g, "_")}${photos.length > 1 ? "_" + (i + 1) : ""}.${ext}`, b64, { base64: true });
            }
          }
        }
      }
    }

    stepEl.textContent = "Compressing ZIP\u2026";
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, nm + "_forms.zip");
  } catch (err) {
    alert("Error: " + err.message);
    console.error(err);
  }
  document.body.removeChild(overlay);
}
