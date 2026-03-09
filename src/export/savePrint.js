export function savePrint(html) {
  // Create overlay container in React app
  const overlay = document.createElement("div");
  overlay.id = "print-overlay";
  overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;display:flex;flex-direction:column;background:#1e293b";

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.style.cssText = "display:flex;gap:8px;padding:8px 12px;background:#0f172a;justify-content:flex-end;align-items:center;flex-shrink:0";

  const printBtn = document.createElement("button");
  printBtn.textContent = "💾 Save as PDF / Print";
  printBtn.style.cssText = "padding:8px 16px;background:#1E3A8A;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial,sans-serif";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕ Close";
  closeBtn.style.cssText = "padding:8px 16px;background:#64748b;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial,sans-serif";

  toolbar.appendChild(printBtn);
  toolbar.appendChild(closeBtn);

  // Iframe for content
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "flex:1;border:none;background:#fff";

  overlay.appendChild(toolbar);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);

  // Detect if html is already a full document or just a fragment
  const isFullDoc = html.trim().toLowerCase().startsWith("<!doctype") || html.trim().toLowerCase().startsWith("<html");
  const printStyle = "@media print{@page{margin:0}html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:0;padding:0.4in}}";
  let finalHTML;
  if (isFullDoc) {
    // Inject print styles into existing document
    finalHTML = html.replace("</head>", "<style>" + printStyle + "</style></head>");
  } else {
    finalHTML = "<html><head><style>" + printStyle + "</style></head><body style='margin:0'>" + html + "</body></html>";
  }
  iframe.contentDocument.write(finalHTML);
  iframe.contentDocument.close();

  printBtn.addEventListener("click", () => {
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    catch(e) { window.print(); }
  });
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
}

export function printScope(p, s) {
  var h = "";
  var htg = s.htg || {};
  var clg = s.clg || {};
  var dhw = s.dhw || {};
  var int2 = s.int || {};
  var exh = s.exh || {};
  var att = s.attic || {};
  var col = s.collar || {};
  var oCJ = s.outerCeiling || {};
  var kw = s.kneeWall || {};
  var ew1 = s.extWall1 || {};
  var ew2 = s.extWall2 || {};
  var fnd = s.fnd || {};
  var a = p.audit || {};
  var yr = new Date().getFullYear();

  function V(x) { return (x != null && x !== "") ? String(x) : "\u2014"; }
  function YN(x) { return x === true ? "Yes" : x === false ? "No" : "\u2014"; }
  function CK(x) { return x === true ? "\u2611" : x === false ? "\u2610" : "\u2014"; }
  function sec(title) { h += "<div style='margin:8px 0 4px;font-weight:bold;font-size:13px;border-bottom:2px solid #333;padding-bottom:2px'>" + title + "</div>"; }
  function row(label, val) { h += "<div style='display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #eee;font-size:11px'><span style='color:#555'>" + label + "</span><span style='font-weight:600'>" + V(val) + "</span></div>"; }

  var afue = (htg.btuIn && htg.btuOut) ? (Number(htg.btuOut) / Number(htg.btuIn) * 100).toFixed(1) + "%" : "\u2014";

  sec("Customer Information");
  row("Customer", p.customerName); row("Address", p.address); row("RISE PID", p.riseId);
  row("Sq Ft", p.sqft); row("Volume", Number(p.sqft) ? (Number(p.sqft)*8).toLocaleString() + " ft\u00b3" : null);
  row("Stories", p.stories); row("Bedrooms", s.bedrooms); row("Year Built", p.yearBuilt);
  row("Home Age", p.yearBuilt ? (yr - Number(p.yearBuilt)) + " yrs" : null); row("Occupants", p.occupants);

  sec("Building Property Type");
  row("Style", s.style); row("Tenant Type", s.tenantType);
  row("Gutters Exist", CK(s.gutterExist)); row("Downspouts", CK(s.downspouts)); row("Gutter Repairs", CK(s.gutterRepair));
  row("Roof Condition", s.roofCondition); row("Roof Type", s.roofType); row("Roof Age", s.roofAge); row("Roof Repairs", CK(s.roofRepair));

  sec("Interior Conditions");
  row("Ceiling Condition", s.ceilingCond); row("Wall Condition", s.wallCond); row("Walls Need Insulation", s.wallsNeedInsul);

  sec("Smoke / CO / Weatherization");
  row("Smoke \u2014 present", s.smokePresent); row("Smoke \u2014 to install", s.smokeNeeded);
  row("CO \u2014 present", s.coPresent); row("CO \u2014 to install", s.coNeeded);
  row("Tenmats Needed", s.tenmats); row("Door Sweeps Needed", s.doorSweeps);

  sec("Heating System Info");
  row("Thermostat", htg.thermostat); row("Fuel Type", htg.fuel); row("System Type", htg.system); row("Flue Condition", htg.flue);
  row("Manufacturer", htg.mfg); row("Install Year", htg.year);
  row("Age", htg.year ? (yr - Number(htg.year)) + " yrs" : null); row("Condition", htg.condition);
  row("BTU Input", htg.btuIn); row("BTU Output", htg.btuOut); row("AFUE", afue); row("Draft", htg.draft);
  row("Gas Shut Off", CK(htg.gasShutoff)); row("Asbestos Pipes", CK(htg.asbestosPipes));
  row("Replacement Rec", CK(htg.replaceRec)); row("Clean & Tune", CK(htg.cleanTuneOverride !== undefined ? htg.cleanTuneOverride : htg.cleanTune));
  if (htg.notes) row("Notes", htg.notes);

  sec("Cooling System Info");
  row("Type", clg.type); row("Manufacturer", clg.mfg); row("Install Year", clg.year);
  row("Age", clg.year ? (yr - Number(clg.year)) + " yrs" : null);
  row("SEER", clg.seer); row("Condition", clg.condition); row("BTU Size", clg.btu);
  row("Replacement Rec", CK(clg.replaceRec));
  if (clg.replaceReason) row("Reason", clg.replaceReason);

  sec("Domestic Hot Water");
  row("Fuel", dhw.fuel); row("System Type", dhw.system); row("Manufacturer", dhw.mfg);
  row("Install Year", dhw.year); row("Age", dhw.year ? (yr - Number(dhw.year)) + " yrs" : null);
  row("Condition", dhw.condition); row("Input BTU", dhw.btuIn);
  row("Insulated Pipes", CK(dhw.insulPipes)); row("Flue Repair", CK(dhw.flueRepair));
  row("Replacement Rec", CK(dhw.replaceRec)); row("Ducts Need Sealing", CK(dhw.ductsSealed));

  sec("Interior Inspection");
  row("Mold", CK(int2.mold)); row("Moisture", CK(int2.moisture)); row("Knob & Tube", CK(int2.knobTube));
  row("Electrical Issues", CK(int2.electrical)); row("Broken Glass", CK(int2.brokenGlass));
  row("Vermiculite/Asbestos", CK(int2.vermiculite)); row("Water Leaks", CK(int2.waterLeaks));
  row("Roof Leaks", CK(int2.roofLeaks));
  if (int2.waterLoc) row("Water Leak Loc", int2.waterLoc);
  if (int2.roofLoc) row("Roof Leak Loc", int2.roofLoc);
  row("Ceiling Cond", int2.ceiling); row("Wall Cond", int2.wall);
  row("Dropped Ceiling", CK(int2.droppedCeiling)); row("Drywall Repair", CK(int2.drywallRepair));
  row("Recessed Lighting", CK(int2.recessedLight)); row("CO Detector", CK(int2.coDetector));
  row("Smoke Detector", CK(int2.smokeDetector));

  sec("Door Types / Exhaust");
  row("Front \u2014 Existing", CK(s.doors && s.doors.Front)); row("Back \u2014 Existing", CK(s.doors && s.doors.Back));
  row("Basement \u2014 Existing", CK(s.doors && s.doors.Basement)); row("Attic \u2014 Existing", CK(s.doors && s.doors.Attic));
  row("Strips/Sweeps Needed", s.totalSweeps);
  row("Exhaust Fan Replace", CK(exh.fanReplace)); row("Bath Fan w/ Light", CK(exh.bathFanLight));
  row("Vent Kit", CK(exh.ventKit)); row("Term Cap", CK(exh.termCap));
  row("Dryer Vented Properly", CK(exh.dryerProper)); row("Dryer Vent Repair", CK(exh.dryerRepair));
  row("BD In", exh.bdIn); row("BD Out", exh.bdOut); row("No BD (estimated)", CK(exh.noBD));
  if (exh.notes) row("Notes", exh.notes);

  sec("Attic");
  row("Finished", CK(att.finished)); row("Unfinished", CK(att.unfinished)); row("Flat", CK(att.flat));
  row("Sq Ft", att.sqft); row("Pre-Existing R", att.preR); row("R to Add", att.addR);
  row("Total R", (att.preR || att.addR) ? "R-" + (Number(att.preR||0) + Number(att.addR||0)) : null);
  row("Recessed Qty", att.recessQty); row("Storage", att.storage);
  row("Ductwork", CK(att.ductwork)); row("Floor Boards", CK(att.floorBoards));
  row("Mold", CK(att.moldPresent)); row("Vermiculite", CK(att.vermPresent)); row("Knob & Tube", CK(att.knobTube));
  if (att.ductwork) { row("Duct Condition", att.condition); row("Ln Ft Air Seal", att.lnftAirSeal); }
  row("Existing Ventilation", att.existVent); row("Needed Ventilation", att.needVent); row("Access Location", att.accessLoc);
  if (att.notes) row("Attic Notes", att.notes);

  sec("Collar Beam");
  row("Sq Ft", col.sqft); row("Pre-Existing R", col.preR); row("R to Add", col.addR);
  row("Accessible", CK(col.accessible)); row("Cut In", CK(col.cutIn)); row("Ductwork", CK(col.ductwork));

  sec("Outer Ceiling Joists");
  row("Sq Ft", oCJ.sqft); row("Pre-Existing R", oCJ.preR); row("R to Add", oCJ.addR);
  row("Accessible", CK(oCJ.accessible)); row("Cut In", CK(oCJ.cutIn)); row("Floor Boards", CK(oCJ.floorBoards));
  row("Ductwork", CK(oCJ.ductwork));

  sec("Knee Walls");
  row("Sq Ft", kw.sqft); row("Pre-Existing R", kw.preR); row("R to Add", kw.addR);
  row("Dense Pack", YN(kw.densePack)); row("Rigid Foam", YN(kw.rigidFoam)); row("Tyvek", YN(kw.tyvek));
  row("FG Batts", YN(kw.fgBatts)); row("Wall Type", kw.wallType);

  sec("Exterior Walls \u2014 1st Floor");
  row("Sq Ft", ew1.sqft); row("Pre-Existing R", ew1.preR); row("R to Add", ew1.addR);
  row("Win/Door SqFt", ew1.sqft ? Math.round(Number(ew1.sqft) * 0.16) : null);
  row("Net Insul SqFt", ew1.sqft ? Math.round(Number(ew1.sqft) * 0.84) : null);
  row("Dense Pack", YN(ew1.densePack)); row("Cladding", ew1.cladding);
  row("Insulate From", ew1.insulFrom); row("Wall Type", ew1.wallType); row("Phenolic Foam", YN(ew1.phenolic));

  sec("Exterior Walls \u2014 2nd Floor");
  row("Sq Ft", ew2.sqft); row("Pre-Existing R", ew2.preR); row("R to Add", ew2.addR);
  row("Dense Pack", YN(ew2.densePack)); row("Cladding", ew2.cladding);

  sec("Foundation / Crawl");
  row("Type", fnd.type); row("Above Grade SqFt", fnd.aboveSqft); row("Below Grade SqFt", fnd.belowSqft);
  row("Pre-Existing R", fnd.preR); row("Insulation Type", fnd.insulType);
  row("Band Joist Access", CK(fnd.bandAccess)); row("Band LnFt", fnd.bandLnft);
  row("Band R", fnd.bandR); row("Band Insulation", fnd.bandInsul);
  row("Vented", CK(fnd.vented)); row("Vapor Barrier", YN(fnd.vaporBarrier)); row("Water Issues", YN(fnd.waterIssues));
  row("Crawl Ductwork", CK(fnd.crawlDuct)); row("Crawl Floor", fnd.crawlFloor);
  row("Crawl Above SqFt", fnd.crawlAbove); row("Crawl Below SqFt", fnd.crawlBelow);
  row("Crawl R", fnd.crawlR); row("Crawl Band Access", CK(fnd.crawlBandAccess));

  sec("Diagnostics");
  row("Pre CFM50", p.preCFM50); row("Ext Temp", s.extTemp); row("BD Location", p.bdLoc);
  if (s.diagNotes) row("Notes", s.diagNotes);

  // ASHRAE 62.2 calc
  sec("ASHRAE 62.2-2016 Ventilation");
  var baseSq = Number(p.sqft) || 0;
  var finBsmt = (fnd.type === "Finished") ? (Number(fnd.aboveSqft)||0) + (Number(fnd.belowSqft)||0) : 0;
  var sq = baseSq + finBsmt;
  var Nbr = Number(s.bedrooms) || 0;
  var preQ50 = Number(p.preCFM50) || 0;
  var sqft2 = Number(p.sqft) || 0;
  var canAS = s.ashrae?.canAirSeal !== undefined ? s.ashrae.canAirSeal : (preQ50 > 0 && sqft2 > 0 && preQ50 >= sqft2 * 1.1);
  var Q50 = canAS ? Math.round(preQ50 * 0.75) : preQ50;
  var st = Number(p.stories) || 1;
  var H2 = st >= 2 ? 16 : st >= 1.5 ? 14 : 8;
  var wsf = 0.56;
  var ash = s.ashrae || {};
  var kCFM = Number(ash.kitchenCFM || a.kitchenFan || 0);
  var b1CFM = Number(ash.bath1CFM || a.bathFan1 || 0);
  var b2CFM = Number(ash.bath2CFM || a.bathFan2 || 0);
  var b3CFM = Number(ash.bath3CFM || a.bathFan3 || 0);
  var kWin = ash.kWin; var b1Win = ash.b1Win; var b2Win = ash.b2Win; var b3Win = ash.b3Win;
  var qi2 = Q50 > 0 ? 0.052 * Q50 * wsf * Math.pow(H2 / 8.2, 0.4) : 0;
  var qt2 = (sq > 0 && Nbr >= 0) ? 0.03 * sq + 7.5 * (Nbr + 1) : 0;
  var kD = kCFM > 0 ? Math.max(0, 100 - (kWin ? 20 : kCFM)) : 0;
  var b1D = b1CFM > 0 ? Math.max(0, 50 - (b1Win ? 20 : b1CFM)) : 0;
  var b2D = b2CFM > 0 ? Math.max(0, 50 - (b2Win ? 20 : b2CFM)) : 0;
  var b3D = b3CFM > 0 ? Math.max(0, 50 - (b3Win ? 20 : b3CFM)) : 0;
  var totalDef = kD + b1D + b2D + b3D;
  var supp = totalDef * 0.25;
  var qf = qt2 + supp - qi2;
  var RND = function(x) { return Math.round(x * 100) / 100; };
  var fanSet = Number(ash.fanSetting) || 0;
  var minHr = fanSet > 0 ? RND(qf / fanSet * 60) : 0;

  row("Floor Area", sq + " ft\u00b2" + (finBsmt > 0 ? " (incl fin bsmt)" : ""));
  row("Nbr (bedrooms)", Nbr);
  row("Occupants (Nbr + 1)", Nbr + 1);
  row("Height", H2 + " ft"); row("Q50 (est. post)", Q50 + " CFM" + (canAS ? " (" + preQ50 + "\u00d70.75)" : " (no air seal)"));
  row("Kitchen Fan", kCFM > 0 ? kCFM + " CFM" + (kWin ? " (window)" : "") : null);
  row("Bath #1", b1CFM > 0 ? b1CFM + " CFM" + (b1Win ? " (window)" : "") : null);
  row("Bath #2", b2CFM > 0 ? b2CFM + " CFM" + (b2Win ? " (window)" : "") : null);
  row("Bath #3", b3CFM > 0 ? b3CFM + " CFM" + (b3Win ? " (window)" : "") : null);
  row("Total Deficit (intermittent)", Math.round(totalDef) + " CFM");
  h += "<div style='margin:6px 0;padding:6px;background:#EFF6FF;border:1px solid #DBEAFE;border-radius:4px;font-size:11px'>";
  h += "<div style='font-weight:700;color:#1E3A8A;margin-bottom:4px'>Ventilation Results</div>";
  row("Infiltration Credit (Qinf)", RND(qi2) + " CFM");
  row("Qtot (0.03\u00d7" + sq + " + 7.5\u00d7(" + Nbr + "+1))", RND(qt2) + " CFM");
  row("Supplement (" + Math.round(totalDef) + "\u00d70.25)", RND(supp) + " CFM");
  h += "<div style='border-top:2px solid #1E3A8A;padding-top:4px;margin-top:4px;display:flex;justify-content:space-between'>";
  h += "<span style='font-weight:700'>Qfan = " + RND(qt2) + " + " + RND(supp) + " \u2212 " + RND(qi2) + "</span>";
  h += "<span style='font-weight:700;color:#1E3A8A;font-size:14px'>" + RND(qf) + " CFM</span></div>";
  if (fanSet > 0) row("Fan: " + fanSet + " CFM", "Run-time: " + minHr + " min/hr");
  h += "</div>";

  // Measures
  sec("Measures \u2014 Energy Efficiency (" + (p.measures || []).length + ")");
  (p.measures || []).forEach(function(m) {
    row(m, (getResolvedQty(p, m) || "\u2014") + " " + measUnit(m));
  });
  if (!(p.measures || []).length) h += "<div style='color:#999;font-size:11px;padding:4px 0'>None selected</div>";

  sec("Measures \u2014 Health & Safety (" + (p.healthSafety || []).length + ")");
  (p.healthSafety || []).forEach(function(m) {
    row(m, (getResolvedQty(p, m) || "\u2014") + " ea");
  });
  if (!(p.healthSafety || []).length) h += "<div style='color:#999;font-size:11px;padding:4px 0'>None selected</div>";

  sec("Notes");
  row("Work Notes", p.measureNotes);
  row("H&S Notes", s.hsNotes);

  // Build final document
  var css = "@page{margin:.3in} *{box-sizing:border-box} body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:12px;color:#000;background:#fff}";
  var title = "2026 HEA / IE Retrofit Form";
  var sub = (p.customerName || "") + " \u00b7 " + (p.address || "") + " \u00b7 RISE: " + (p.riseId || "\u2014") + " \u00b7 " + new Date().toLocaleDateString();
  var doc = "<html><head><style>" + css + "</style></head><body>";
  doc += "<div style='font-size:16px;font-weight:bold;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:4px'>" + title + "</div>";
  doc += "<div style='font-size:11px;color:#666;margin-bottom:10px'>" + sub + "</div>";
  doc += h;
  doc += "</body></html>";

  savePrint(doc);
}

export function photoPageHTML(title, photos, items, p) {
  const rows = items.filter(i => hasPhoto(photos,i.id)).map(i => {
    return getPhotos(photos, i.id).map((ph,idx) => `<div style="break-inside:avoid;margin-bottom:12px;border:1px solid #ddd;border-radius:6px;overflow:hidden">
      <div style="padding:6px 10px;background:#f5f5f5;font-size:12px;font-weight:600">${i.l}${idx>0?" ("+(idx+1)+")":""} <span style="font-weight:400;color:#888">(${i.cat})</span></div>
      <img src="${ph.d}" style="width:100%;max-height:500px;object-fit:contain;display:block"/>
      <div style="padding:4px 10px;font-size:10px;color:#999">${ph.by||""} · ${ph.at?new Date(ph.at).toLocaleString():""}</div>
    </div>`).join("");
  }).join("");
  return `<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:16px}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:12px;color:#666;margin-bottom:16px}</style></head><body>
    <h1>${title}</h1><h2>${p.customerName} · ${p.address} · ${new Date().toLocaleDateString()}</h2>${rows}</body></html>`;
}

export function sideBySideHTML(photos, allItems, p) {
  const preItems = allItems.filter(i => i.p === "pre" && hasPhoto(photos,i.id));
  const postItems = allItems.filter(i => i.p === "post" && hasPhoto(photos,i.id));
  const pairs = [];
  const usedPost = new Set();
  preItems.forEach(pre => {
    const catBase = pre.cat.replace(/ \(Pre\)| \(Post\)/g,"");
    const post = postItems.find(po => !usedPost.has(po.id) && po.cat.replace(/ \(Pre\)| \(Post\)/g,"") === catBase);
    if (post) usedPost.add(post.id);
    pairs.push({ pre, post: post || null });
  });
  postItems.filter(po => !usedPost.has(po.id)).forEach(po => pairs.push({ pre: null, post: po }));
  const rows = pairs.map(({pre,post}) => {
    const preArr = pre ? getPhotos(photos, pre.id) : [];
    const postArr = post ? getPhotos(photos, post.id) : [];
    const preImg = preArr.length ? preArr.map(ph=>`<img src="${ph.d}" style="width:100%;max-height:300px;object-fit:contain;margin-bottom:2px"/>`).join("") : `<div style="height:150px;display:flex;align-items:center;justify-content:center;color:#ccc;background:#f9f9f9">No photo</div>`;
    const postImg = postArr.length ? postArr.map(ph=>`<img src="${ph.d}" style="width:100%;max-height:300px;object-fit:contain;margin-bottom:2px"/>`).join("") : `<div style="height:150px;display:flex;align-items:center;justify-content:center;color:#ccc;background:#f9f9f9">No photo</div>`;
    const label = (pre?.cat || post?.cat || "").replace(/ \(Pre\)| \(Post\)/g,"");
    return `<div style="break-inside:avoid;margin-bottom:14px;border:1px solid #ddd;border-radius:6px;overflow:hidden">
      <div style="padding:6px 10px;background:#f5f5f5;font-size:12px;font-weight:600">${label} — ${pre?.l||""} / ${post?.l||""}</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed"><tr>
        <td style="width:50%;vertical-align:top;border-right:1px solid #eee;padding:4px;text-align:center"><div style="font-size:10px;font-weight:700;padding:2px;background:#DBEAFE;color:#1E3A8A">PRE</div>${preImg}</td>
        <td style="width:50%;vertical-align:top;padding:4px;text-align:center"><div style="font-size:10px;font-weight:700;padding:2px;background:#dcfce7;color:#166534">POST</div>${postImg}</td>
      </tr></table></div>`;
  }).join("");
  return `<!DOCTYPE html><html><head><title>Pre vs Post</title><style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:16px}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:12px;color:#666;margin-bottom:16px}</style></head><body>
    <h1>Pre / Post Photo Comparison</h1><h2>${p.customerName} · ${p.address} · ${new Date().toLocaleDateString()}</h2>${rows}</body></html>`;
}

export function formPrintHTML(title, p, bodyHTML, sigData, custSig) {
  const sigBlock = sigData === false ? "" : sigData ? `<div style="margin-top:24px;border-top:1px solid #ccc;padding-top:12px"><p style="font-size:11px;color:#666;margin:0 0 4px">Inspector / Technician Signature:</p><img src="${sigData}" style="max-width:280px;height:70px;object-fit:contain"/><p style="font-size:10px;color:#999;margin:4px 0 0">Digitally signed in HES Tracker</p></div>` : `<div style="margin-top:30px;border-top:1px solid #ccc;padding-top:8px"><p style="font-size:11px;color:#666">Inspector Signature: _______________________________ &nbsp;&nbsp; Date: _______________</p></div>`;
  const custBlock = custSig ? `<div style="margin-top:16px;border-top:1px solid #ccc;padding-top:12px"><p style="font-size:11px;color:#666;margin:0 0 4px">Customer Signature:</p><img src="${custSig}" style="max-width:280px;height:70px;object-fit:contain"/><p style="font-size:10px;color:#999;margin:4px 0 0">Digitally signed in HES Tracker</p></div>` : `<div style="margin-top:16px;border-top:1px solid #ccc;padding-top:8px"><p style="font-size:11px;color:#666">Customer Signature: _______________________________ &nbsp;&nbsp; Date: _______________</p></div>`;
  return `<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:.5in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:16px;font-size:12px}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:12px;color:#666;margin-bottom:16px}.sec{margin-bottom:12px;border:1px solid #ddd;border-radius:6px;padding:10px}.sec h3{font-size:13px;margin:0 0 6px;border-bottom:1px solid #eee;padding-bottom:4px}.row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f5f5f5}.lbl{color:#666}.val{font-weight:600}.pass{color:#16a34a;font-weight:600}.fail{color:#dc2626;font-weight:600}.na{color:#999}</style></head><body>
    <h1>${title}</h1><h2>${p.customerName} · ${p.address} · ${new Date().toLocaleDateString()}</h2>${bodyHTML}${sigBlock}${custBlock}</body></html>`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP