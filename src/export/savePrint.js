import { getPhotos, hasPhoto, getResolvedQty, measUnit } from "../helpers/index.js";

// ═══════════════════════════════════════════════════════════════
// PRINT OVERLAY — displays HTML in an iframe with print/save
// ═══════════════════════════════════════════════════════════════

const PRINT_OVERLAY_ID = "print-overlay";
const DASH = "\u2014";
const CHECK = "\u2611";
const UNCHECK = "\u2610";

const PRINT_STYLE =
  "@media print{@page{margin:0}html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:0;padding:0.4in}}";

function cleanupOverlay() {
  const existing = document.getElementById(PRINT_OVERLAY_ID);
  if (existing) document.body.removeChild(existing);
}

export function savePrint(html) {
  // Remove any existing overlay first
  cleanupOverlay();

  const overlay = document.createElement("div");
  overlay.id = PRINT_OVERLAY_ID;
  overlay.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;display:flex;flex-direction:column;background:#1e293b";

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.style.cssText =
    "display:flex;gap:8px;padding:8px 12px;background:#0f172a;justify-content:flex-end;align-items:center;flex-shrink:0";

  const printBtn = document.createElement("button");
  printBtn.textContent = "\uD83D\uDCBE Save as PDF / Print";
  printBtn.style.cssText =
    "padding:8px 16px;background:#1E3A8A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial,sans-serif";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "\u2715 Close";
  closeBtn.style.cssText =
    "padding:8px 16px;background:#64748b;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial,sans-serif";

  toolbar.appendChild(printBtn);
  toolbar.appendChild(closeBtn);

  // Iframe for content
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "flex:1;border:none;background:#fff";

  overlay.appendChild(toolbar);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);

  // Detect if html is already a full document or just a fragment
  const trimmed = html.trim().toLowerCase();
  const isFullDoc = trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
  let finalHTML;
  if (isFullDoc) {
    finalHTML = html.replace("</head>", "<style>" + PRINT_STYLE + "</style></head>");
  } else {
    finalHTML =
      "<html><head><style>" + PRINT_STYLE + "</style></head><body style='margin:0'>" + html + "</body></html>";
  }
  iframe.contentDocument.write(finalHTML);
  iframe.contentDocument.close();

  // Event handlers
  printBtn.addEventListener("click", () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.warn("Iframe print failed, falling back to window.print:", e);
      window.print();
    }
  });

  closeBtn.addEventListener("click", cleanupOverlay);

  // Escape key to close
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      cleanupOverlay();
      document.removeEventListener("keydown", onKeyDown);
    }
  };
  document.addEventListener("keydown", onKeyDown);
}

// ═══════════════════════════════════════════════════════════════
// FORMAT HELPERS — shared by printScope and other print functions
// ═══════════════════════════════════════════════════════════════

function formatValue(x) {
  return x != null && x !== "" ? String(x) : DASH;
}

function formatYesNo(x) {
  if (x === true) return "Yes";
  if (x === false) return "No";
  return DASH;
}

function formatCheck(x) {
  if (x === true) return CHECK;
  if (x === false) return UNCHECK;
  return DASH;
}

function calcAge(year) {
  if (!year) return null;
  return new Date().getFullYear() - Number(year) + " yrs";
}

// ═══════════════════════════════════════════════════════════════
// HTML BUILDER — accumulates section/row HTML for scope print
// ═══════════════════════════════════════════════════════════════

function createHtmlBuilder() {
  let html = "";

  return {
    section(title) {
      html +=
        "<div style='margin:8px 0 4px;font-weight:bold;font-size:13px;border-bottom:2px solid #333;padding-bottom:2px'>" +
        title +
        "</div>";
    },
    row(label, val) {
      html +=
        "<div style='display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #eee;font-size:11px'>" +
        "<span style='color:#555'>" + label + "</span>" +
        "<span style='font-weight:600'>" + formatValue(val) + "</span></div>";
    },
    raw(str) {
      html += str;
    },
    toString() {
      return html;
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// SCOPE PRINT — generates full scope-of-work HTML
// ═══════════════════════════════════════════════════════════════

function buildScopeHTML(project, scope) {
  const b = createHtmlBuilder();
  const heating = scope.htg || {};
  const cooling = scope.clg || {};
  const hotWater = scope.dhw || {};
  const interior = scope.int || {};
  const exhaust = scope.exh || {};
  const attic = scope.attic || {};
  const collar = scope.collar || {};
  const outerCeiling = scope.outerCeiling || {};
  const kneeWall = scope.kneeWall || {};
  const extWall1 = scope.extWall1 || {};
  const extWall2 = scope.extWall2 || {};
  const foundation = scope.fnd || {};
  const audit = project.audit || {};

  const afue =
    heating.btuIn && heating.btuOut
      ? (Number(heating.btuOut) / Number(heating.btuIn) * 100).toFixed(1) + "%"
      : DASH;

  // --- Customer Information ---
  b.section("Customer Information");
  b.row("Customer", project.customerName);
  b.row("Address", project.address);
  b.row("RISE PID", project.riseId);
  b.row("Sq Ft", project.sqft);
  b.row("Volume", Number(project.sqft) ? (Number(project.sqft) * 8).toLocaleString() + " ft\u00b3" : null);
  b.row("Stories", project.stories);
  b.row("Bedrooms", scope.bedrooms);
  b.row("Year Built", project.yearBuilt);
  b.row("Home Age", calcAge(project.yearBuilt));
  b.row("Occupants", project.occupants);

  // --- Building Property Type ---
  b.section("Building Property Type");
  b.row("Style", scope.style);
  b.row("Tenant Type", scope.tenantType);
  b.row("Gutters Exist", formatCheck(scope.gutterExist));
  b.row("Downspouts", formatCheck(scope.downspouts));
  b.row("Gutter Repairs", formatCheck(scope.gutterRepair));
  b.row("Roof Condition", scope.roofCondition);
  b.row("Roof Type", scope.roofType);
  b.row("Roof Age", scope.roofAge);
  b.row("Roof Repairs", formatCheck(scope.roofRepair));

  // --- Interior Conditions ---
  b.section("Interior Conditions");
  b.row("Ceiling Condition", scope.ceilingCond);
  b.row("Wall Condition", scope.wallCond);
  b.row("Walls Need Insulation", scope.wallsNeedInsul);

  // --- Smoke / CO / Weatherization ---
  b.section("Smoke / CO / Weatherization");
  b.row("Smoke \u2014 present", scope.smokePresent);
  b.row("Smoke \u2014 to install", scope.smokeNeeded);
  b.row("CO \u2014 present", scope.coPresent);
  b.row("CO \u2014 to install", scope.coNeeded);
  b.row("Tenmats Needed", scope.tenmats);
  b.row("Door Sweeps Needed", scope.doorSweeps);

  // --- Heating System ---
  b.section("Heating System Info");
  b.row("Thermostat", heating.thermostat);
  b.row("Fuel Type", heating.fuel);
  b.row("System Type", heating.system);
  b.row("Flue Condition", heating.flue);
  b.row("Manufacturer", heating.mfg);
  b.row("Install Year", heating.year);
  b.row("Age", calcAge(heating.year));
  b.row("Condition", heating.condition);
  b.row("BTU Input", heating.btuIn);
  b.row("BTU Output", heating.btuOut);
  b.row("AFUE", afue);
  b.row("Draft", heating.draft);
  b.row("Gas Shut Off", formatCheck(heating.gasShutoff));
  b.row("Asbestos Pipes", formatCheck(heating.asbestosPipes));
  b.row("Replacement Rec", formatCheck(heating.replaceRec));
  b.row("Clean & Tune", formatCheck(heating.cleanTuneOverride !== undefined ? heating.cleanTuneOverride : heating.cleanTune));
  if (heating.notes) b.row("Notes", heating.notes);

  // --- Cooling System ---
  b.section("Cooling System Info");
  b.row("Type", cooling.type);
  b.row("Manufacturer", cooling.mfg);
  b.row("Install Year", cooling.year);
  b.row("Age", calcAge(cooling.year));
  b.row("SEER", cooling.seer);
  b.row("Condition", cooling.condition);
  b.row("BTU Size", cooling.btu);
  b.row("Replacement Rec", formatCheck(cooling.replaceRec));
  if (cooling.replaceReason) b.row("Reason", cooling.replaceReason);

  // --- Domestic Hot Water ---
  b.section("Domestic Hot Water");
  b.row("Fuel", hotWater.fuel);
  b.row("System Type", hotWater.system);
  b.row("Manufacturer", hotWater.mfg);
  b.row("Install Year", hotWater.year);
  b.row("Age", calcAge(hotWater.year));
  b.row("Condition", hotWater.condition);
  b.row("Input BTU", hotWater.btuIn);
  b.row("Insulated Pipes", formatCheck(hotWater.insulPipes));
  b.row("Flue Repair", formatCheck(hotWater.flueRepair));
  b.row("Replacement Rec", formatCheck(hotWater.replaceRec));
  b.row("Ducts Need Sealing", formatCheck(hotWater.ductsSealed));

  // --- Interior Inspection ---
  b.section("Interior Inspection");
  b.row("Mold", formatCheck(interior.mold));
  b.row("Moisture", formatCheck(interior.moisture));
  b.row("Knob & Tube", formatCheck(interior.knobTube));
  b.row("Electrical Issues", formatCheck(interior.electrical));
  b.row("Broken Glass", formatCheck(interior.brokenGlass));
  b.row("Vermiculite/Asbestos", formatCheck(interior.vermiculite));
  b.row("Water Leaks", formatCheck(interior.waterLeaks));
  b.row("Roof Leaks", formatCheck(interior.roofLeaks));
  if (interior.waterLoc) b.row("Water Leak Loc", interior.waterLoc);
  if (interior.roofLoc) b.row("Roof Leak Loc", interior.roofLoc);
  b.row("Ceiling Cond", interior.ceiling);
  b.row("Wall Cond", interior.wall);
  b.row("Dropped Ceiling", formatCheck(interior.droppedCeiling));
  b.row("Drywall Repair", formatCheck(interior.drywallRepair));
  b.row("Recessed Lighting", formatCheck(interior.recessedLight));
  b.row("CO Detector", formatCheck(interior.coDetector));
  b.row("Smoke Detector", formatCheck(interior.smokeDetector));

  // --- Door Types / Exhaust ---
  b.section("Door Types / Exhaust");
  b.row("Front \u2014 Existing", formatCheck(scope.doors && scope.doors.Front));
  b.row("Back \u2014 Existing", formatCheck(scope.doors && scope.doors.Back));
  b.row("Basement \u2014 Existing", formatCheck(scope.doors && scope.doors.Basement));
  b.row("Attic \u2014 Existing", formatCheck(scope.doors && scope.doors.Attic));
  b.row("Strips/Sweeps Needed", scope.totalSweeps);
  b.row("Exhaust Fan Replace", formatCheck(exhaust.fanReplace));
  b.row("Bath Fan w/ Light", formatCheck(exhaust.bathFanLight));
  b.row("Vent Kit", formatCheck(exhaust.ventKit));
  b.row("Term Cap", formatCheck(exhaust.termCap));
  b.row("Dryer Vented Properly", formatCheck(exhaust.dryerProper));
  b.row("Dryer Vent Repair", formatCheck(exhaust.dryerRepair));
  b.row("BD In", exhaust.bdIn);
  b.row("BD Out", exhaust.bdOut);
  b.row("No BD (estimated)", formatCheck(exhaust.noBD));
  if (exhaust.notes) b.row("Notes", exhaust.notes);

  // --- Attic ---
  b.section("Attic");
  b.row("Finished", formatCheck(attic.finished));
  b.row("Unfinished", formatCheck(attic.unfinished));
  b.row("Flat", formatCheck(attic.flat));
  b.row("Sq Ft", attic.sqft);
  b.row("Pre-Existing R", attic.preR);
  b.row("R to Add", attic.addR);
  b.row("Total R", (attic.preR || attic.addR) ? "R-" + (Number(attic.preR || 0) + Number(attic.addR || 0)) : null);
  b.row("Recessed Qty", attic.recessQty);
  b.row("Storage", attic.storage);
  b.row("Ductwork", formatCheck(attic.ductwork));
  b.row("Floor Boards", formatCheck(attic.floorBoards));
  b.row("Mold", formatCheck(attic.moldPresent));
  b.row("Vermiculite", formatCheck(attic.vermPresent));
  b.row("Knob & Tube", formatCheck(attic.knobTube));
  if (attic.ductwork) {
    b.row("Duct Condition", attic.condition);
    b.row("Ln Ft Air Seal", attic.lnftAirSeal);
  }
  b.row("Existing Ventilation", attic.existVent);
  b.row("Needed Ventilation", attic.needVent);
  b.row("Access Location", attic.accessLoc);
  if (attic.notes) b.row("Attic Notes", attic.notes);

  // --- Collar Beam ---
  b.section("Collar Beam");
  b.row("Sq Ft", collar.sqft);
  b.row("Pre-Existing R", collar.preR);
  b.row("R to Add", collar.addR);
  b.row("Accessible", formatCheck(collar.accessible));
  b.row("Cut In", formatCheck(collar.cutIn));
  b.row("Ductwork", formatCheck(collar.ductwork));

  // --- Outer Ceiling Joists ---
  b.section("Outer Ceiling Joists");
  b.row("Sq Ft", outerCeiling.sqft);
  b.row("Pre-Existing R", outerCeiling.preR);
  b.row("R to Add", outerCeiling.addR);
  b.row("Accessible", formatCheck(outerCeiling.accessible));
  b.row("Cut In", formatCheck(outerCeiling.cutIn));
  b.row("Floor Boards", formatCheck(outerCeiling.floorBoards));
  b.row("Ductwork", formatCheck(outerCeiling.ductwork));

  // --- Knee Walls ---
  b.section("Knee Walls");
  b.row("Sq Ft", kneeWall.sqft);
  b.row("Pre-Existing R", kneeWall.preR);
  b.row("R to Add", kneeWall.addR);
  b.row("Dense Pack", formatYesNo(kneeWall.densePack));
  b.row("Rigid Foam", formatYesNo(kneeWall.rigidFoam));
  b.row("Tyvek", formatYesNo(kneeWall.tyvek));
  b.row("FG Batts", formatYesNo(kneeWall.fgBatts));
  b.row("Wall Type", kneeWall.wallType);

  // --- Exterior Walls 1st Floor ---
  b.section("Exterior Walls \u2014 1st Floor");
  b.row("Sq Ft", extWall1.sqft);
  b.row("Pre-Existing R", extWall1.preR);
  b.row("R to Add", extWall1.addR);
  b.row("Win/Door SqFt", extWall1.sqft ? Math.round(Number(extWall1.sqft) * 0.16) : null);
  b.row("Net Insul SqFt", extWall1.sqft ? Math.round(Number(extWall1.sqft) * 0.84) : null);
  b.row("Dense Pack", formatYesNo(extWall1.densePack));
  b.row("Cladding", extWall1.cladding);
  b.row("Insulate From", extWall1.insulFrom);
  b.row("Wall Type", extWall1.wallType);
  b.row("Phenolic Foam", formatYesNo(extWall1.phenolic));

  // --- Exterior Walls 2nd Floor ---
  b.section("Exterior Walls \u2014 2nd Floor");
  b.row("Sq Ft", extWall2.sqft);
  b.row("Pre-Existing R", extWall2.preR);
  b.row("R to Add", extWall2.addR);
  b.row("Dense Pack", formatYesNo(extWall2.densePack));
  b.row("Cladding", extWall2.cladding);

  // --- Foundation / Crawl ---
  b.section("Foundation / Crawl");
  b.row("Type", foundation.type);
  b.row("Above Grade SqFt", foundation.aboveSqft);
  b.row("Below Grade SqFt", foundation.belowSqft);
  b.row("Pre-Existing R", foundation.preR);
  b.row("Insulation Type", foundation.insulType);
  b.row("Band Joist Access", formatCheck(foundation.bandAccess));
  b.row("Band LnFt", foundation.bandLnft);
  b.row("Band R", foundation.bandR);
  b.row("Band Insulation", foundation.bandInsul);
  b.row("Vented", formatCheck(foundation.vented));
  b.row("Vapor Barrier", formatYesNo(foundation.vaporBarrier));
  b.row("Water Issues", formatYesNo(foundation.waterIssues));
  b.row("Crawl Ductwork", formatCheck(foundation.crawlDuct));
  b.row("Crawl Floor", foundation.crawlFloor);
  b.row("Crawl Above SqFt", foundation.crawlAbove);
  b.row("Crawl Below SqFt", foundation.crawlBelow);
  b.row("Crawl R", foundation.crawlR);
  b.row("Crawl Band Access", formatCheck(foundation.crawlBandAccess));

  // --- Diagnostics ---
  b.section("Diagnostics");
  b.row("Pre CFM50", project.preCFM50);
  b.row("Ext Temp", scope.extTemp);
  b.row("BD Location", project.bdLoc);
  if (scope.diagNotes) b.row("Notes", scope.diagNotes);

  // --- ASHRAE 62.2 Ventilation ---
  buildASHRAESection(b, project, scope, foundation, audit);

  // --- Measures ---
  const measures = project.measures || [];
  b.section("Measures \u2014 Energy Efficiency (" + measures.length + ")");
  measures.forEach((m) => {
    b.row(m, (getResolvedQty(project, m) || DASH) + " " + measUnit(m));
  });
  if (!measures.length) {
    b.raw("<div style='color:#999;font-size:11px;padding:4px 0'>None selected</div>");
  }

  const healthSafety = project.healthSafety || [];
  b.section("Measures \u2014 Health & Safety (" + healthSafety.length + ")");
  healthSafety.forEach((m) => {
    b.row(m, (getResolvedQty(project, m) || DASH) + " ea");
  });
  if (!healthSafety.length) {
    b.raw("<div style='color:#999;font-size:11px;padding:4px 0'>None selected</div>");
  }

  b.section("Notes");
  b.row("Work Notes", project.measureNotes);
  b.row("H&S Notes", scope.hsNotes);

  return b.toString();
}

function buildASHRAESection(b, project, scope, foundation, audit) {
  b.section("ASHRAE 62.2-2016 Ventilation");

  const baseSqft = Number(project.sqft) || 0;
  const finishedBasement =
    foundation.type === "Finished"
      ? (Number(foundation.aboveSqft) || 0) + (Number(foundation.belowSqft) || 0)
      : 0;
  const totalSqft = baseSqft + finishedBasement;
  const bedrooms = Number(scope.bedrooms) || 0;
  const preCFM50 = Number(project.preCFM50) || 0;

  const canAirSeal =
    scope.ashrae?.canAirSeal !== undefined
      ? scope.ashrae.canAirSeal
      : preCFM50 > 0 && baseSqft > 0 && preCFM50 >= baseSqft * 1.1;
  const estPostQ50 = canAirSeal ? Math.round(preCFM50 * 0.75) : preCFM50;

  const stories = Number(project.stories) || 1;
  const height = stories >= 2 ? 16 : stories >= 1.5 ? 14 : 8;
  const wsf = 0.56;

  const ashrae = scope.ashrae || {};
  const kitchenCFM = Number(ashrae.kitchenCFM || audit.kitchenFan || 0);
  const bath1CFM = Number(ashrae.bath1CFM || audit.bathFan1 || 0);
  const bath2CFM = Number(ashrae.bath2CFM || audit.bathFan2 || 0);
  const bath3CFM = Number(ashrae.bath3CFM || audit.bathFan3 || 0);

  const infiltration = estPostQ50 > 0 ? 0.052 * estPostQ50 * wsf * Math.pow(height / 8.2, 0.4) : 0;
  const totalRequired = totalSqft > 0 && bedrooms >= 0 ? 0.03 * totalSqft + 7.5 * (bedrooms + 1) : 0;

  const kitchenDeficit = kitchenCFM > 0 ? Math.max(0, 100 - (ashrae.kWin ? 20 : kitchenCFM)) : 0;
  const bath1Deficit = bath1CFM > 0 ? Math.max(0, 50 - (ashrae.b1Win ? 20 : bath1CFM)) : 0;
  const bath2Deficit = bath2CFM > 0 ? Math.max(0, 50 - (ashrae.b2Win ? 20 : bath2CFM)) : 0;
  const bath3Deficit = bath3CFM > 0 ? Math.max(0, 50 - (ashrae.b3Win ? 20 : bath3CFM)) : 0;
  const totalDeficit = kitchenDeficit + bath1Deficit + bath2Deficit + bath3Deficit;
  const supplement = totalDeficit * 0.25;
  const qfan = totalRequired + supplement - infiltration;

  const round2 = (x) => Math.round(x * 100) / 100;
  const fanSetting = Number(ashrae.fanSetting) || 0;
  const minPerHour = fanSetting > 0 ? round2(qfan / fanSetting * 60) : 0;

  b.row("Floor Area", totalSqft + " ft\u00b2" + (finishedBasement > 0 ? " (incl fin bsmt)" : ""));
  b.row("Nbr (bedrooms)", bedrooms);
  b.row("Occupants (Nbr + 1)", bedrooms + 1);
  b.row("Height", height + " ft");
  b.row("Q50 (est. post)", estPostQ50 + " CFM" + (canAirSeal ? " (" + preCFM50 + "\u00d70.75)" : " (no air seal)"));
  b.row("Kitchen Fan", kitchenCFM > 0 ? kitchenCFM + " CFM" + (ashrae.kWin ? " (window)" : "") : null);
  b.row("Bath #1", bath1CFM > 0 ? bath1CFM + " CFM" + (ashrae.b1Win ? " (window)" : "") : null);
  b.row("Bath #2", bath2CFM > 0 ? bath2CFM + " CFM" + (ashrae.b2Win ? " (window)" : "") : null);
  b.row("Bath #3", bath3CFM > 0 ? bath3CFM + " CFM" + (ashrae.b3Win ? " (window)" : "") : null);
  b.row("Total Deficit (intermittent)", Math.round(totalDeficit) + " CFM");

  b.raw("<div style='margin:6px 0;padding:6px;background:#EFF6FF;border:1px solid #DBEAFE;border-radius:4px;font-size:11px'>");
  b.raw("<div style='font-weight:700;color:#1E3A8A;margin-bottom:4px'>Ventilation Results</div>");
  b.row("Infiltration Credit (Qinf)", round2(infiltration) + " CFM");
  b.row("Qtot (0.03\u00d7" + totalSqft + " + 7.5\u00d7(" + bedrooms + "+1))", round2(totalRequired) + " CFM");
  b.row("Supplement (" + Math.round(totalDeficit) + "\u00d70.25)", round2(supplement) + " CFM");
  b.raw("<div style='border-top:2px solid #1E3A8A;padding-top:4px;margin-top:4px;display:flex;justify-content:space-between'>");
  b.raw("<span style='font-weight:700'>Qfan = " + round2(totalRequired) + " + " + round2(supplement) + " \u2212 " + round2(infiltration) + "</span>");
  b.raw("<span style='font-weight:700;color:#1E3A8A;font-size:14px'>" + round2(qfan) + " CFM</span></div>");
  if (fanSetting > 0) b.row("Fan: " + fanSetting + " CFM", "Run-time: " + minPerHour + " min/hr");
  b.raw("</div>");
}

export function printScope(project, scope) {
  const body = buildScopeHTML(project, scope);

  const css =
    "@page{margin:.3in} *{box-sizing:border-box} body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:12px;color:#000;background:#fff}";
  const title = "2026 HEA / IE Retrofit Form";
  const subtitle =
    (project.customerName || "") +
    " \u00b7 " +
    (project.address || "") +
    " \u00b7 RISE: " +
    (project.riseId || DASH) +
    " \u00b7 " +
    new Date().toLocaleDateString();

  const doc =
    "<html><head><style>" + css + "</style></head><body>" +
    "<div style='font-size:16px;font-weight:bold;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:4px'>" + title + "</div>" +
    "<div style='font-size:11px;color:#666;margin-bottom:10px'>" + subtitle + "</div>" +
    body +
    "</body></html>";

  savePrint(doc);
}

// ═══════════════════════════════════════════════════════════════
// PHOTO / FORM HTML GENERATORS
// ═══════════════════════════════════════════════════════════════

export function photoPageHTML(title, photos, items, project) {
  const rows = items
    .filter((i) => hasPhoto(photos, i.id))
    .map((i) => {
      return getPhotos(photos, i.id)
        .map(
          (ph, idx) =>
            `<div style="break-inside:avoid;margin-bottom:12px;border:1px solid #ddd;border-radius:6px;overflow:hidden">
      <div style="padding:6px 10px;background:#f5f5f5;font-size:12px;font-weight:600">${i.l}${idx > 0 ? " (" + (idx + 1) + ")" : ""} <span style="font-weight:400;color:#888">(${i.cat})</span></div>
      <img src="${ph.d}" style="width:100%;max-height:500px;object-fit:contain;display:block"/>
      <div style="padding:4px 10px;font-size:10px;color:#999">${ph.by || ""} · ${ph.at ? new Date(ph.at).toLocaleString() : ""}</div>
    </div>`
        )
        .join("");
    })
    .join("");

  return `<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:16px}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:12px;color:#666;margin-bottom:16px}</style></head><body>
    <h1>${title}</h1><h2>${project.customerName} · ${project.address} · ${new Date().toLocaleDateString()}</h2>${rows}</body></html>`;
}

export function sideBySideHTML(photos, allItems, project) {
  const preItems = allItems.filter((i) => i.p === "pre" && hasPhoto(photos, i.id));
  const postItems = allItems.filter((i) => i.p === "post" && hasPhoto(photos, i.id));
  const pairs = [];
  const usedPost = new Set();

  preItems.forEach((pre) => {
    const catBase = pre.cat.replace(/ \(Pre\)| \(Post\)/g, "");
    const post = postItems.find(
      (po) => !usedPost.has(po.id) && po.cat.replace(/ \(Pre\)| \(Post\)/g, "") === catBase
    );
    if (post) usedPost.add(post.id);
    pairs.push({ pre, post: post || null });
  });
  postItems.filter((po) => !usedPost.has(po.id)).forEach((po) => pairs.push({ pre: null, post: po }));

  const rows = pairs
    .map(({ pre, post }) => {
      const preArr = pre ? getPhotos(photos, pre.id) : [];
      const postArr = post ? getPhotos(photos, post.id) : [];
      const noPhotoPlaceholder = `<div style="height:150px;display:flex;align-items:center;justify-content:center;color:#ccc;background:#f9f9f9">No photo</div>`;
      const preImg = preArr.length
        ? preArr.map((ph) => `<img src="${ph.d}" style="width:100%;max-height:300px;object-fit:contain;margin-bottom:2px"/>`).join("")
        : noPhotoPlaceholder;
      const postImg = postArr.length
        ? postArr.map((ph) => `<img src="${ph.d}" style="width:100%;max-height:300px;object-fit:contain;margin-bottom:2px"/>`).join("")
        : noPhotoPlaceholder;
      const label = (pre?.cat || post?.cat || "").replace(/ \(Pre\)| \(Post\)/g, "");
      return `<div style="break-inside:avoid;margin-bottom:14px;border:1px solid #ddd;border-radius:6px;overflow:hidden">
      <div style="padding:6px 10px;background:#f5f5f5;font-size:12px;font-weight:600">${label} — ${pre?.l || ""} / ${post?.l || ""}</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed"><tr>
        <td style="width:50%;vertical-align:top;border-right:1px solid #eee;padding:4px;text-align:center"><div style="font-size:10px;font-weight:700;padding:2px;background:#DBEAFE;color:#1E3A8A">PRE</div>${preImg}</td>
        <td style="width:50%;vertical-align:top;padding:4px;text-align:center"><div style="font-size:10px;font-weight:700;padding:2px;background:#dcfce7;color:#166534">POST</div>${postImg}</td>
      </tr></table></div>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><title>Pre vs Post</title><style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:16px}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:12px;color:#666;margin-bottom:16px}</style></head><body>
    <h1>Pre / Post Photo Comparison</h1><h2>${project.customerName} · ${project.address} · ${new Date().toLocaleDateString()}</h2>${rows}</body></html>`;
}

export function formPrintHTML(title, project, bodyHTML, sigData, custSig) {
  const sigBlock =
    sigData === false
      ? ""
      : sigData
        ? `<div style="margin-top:24px;border-top:1px solid #ccc;padding-top:12px"><p style="font-size:11px;color:#666;margin:0 0 4px">Inspector / Technician Signature:</p><img src="${sigData}" style="max-width:280px;height:70px;object-fit:contain"/><p style="font-size:10px;color:#999;margin:4px 0 0">Digitally signed in HES Tracker</p></div>`
        : `<div style="margin-top:30px;border-top:1px solid #ccc;padding-top:8px"><p style="font-size:11px;color:#666">Inspector Signature: _______________________________ &nbsp;&nbsp; Date: _______________</p></div>`;

  const custBlock = custSig
    ? `<div style="margin-top:16px;border-top:1px solid #ccc;padding-top:12px"><p style="font-size:11px;color:#666;margin:0 0 4px">Customer Signature:</p><img src="${custSig}" style="max-width:280px;height:70px;object-fit:contain"/><p style="font-size:10px;color:#999;margin:4px 0 0">Digitally signed in HES Tracker</p></div>`
    : `<div style="margin-top:16px;border-top:1px solid #ccc;padding-top:8px"><p style="font-size:11px;color:#666">Customer Signature: _______________________________ &nbsp;&nbsp; Date: _______________</p></div>`;

  return `<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:.5in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:16px;font-size:12px}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:12px;color:#666;margin-bottom:16px}.sec{margin-bottom:12px;border:1px solid #ddd;border-radius:6px;padding:10px}.sec h3{font-size:13px;margin:0 0 6px;border-bottom:1px solid #eee;padding-bottom:4px}.row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f5f5f5}.lbl{color:#666}.val{font-weight:600}.pass{color:#16a34a;font-weight:600}.fail{color:#dc2626;font-weight:600}.na{color:#999}</style></head><body>
    <h1>${title}</h1><h2>${project.customerName} · ${project.address} · ${new Date().toLocaleDateString()}</h2>${bodyHTML}${sigBlock}${custBlock}</body></html>`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
