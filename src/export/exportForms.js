import { STAGES, EE_MEASURES, HS_MEASURES, PHOTO_SECTIONS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK } from "../constants/index.js";
import { getPhotos, hasPhoto, getResolvedQty, measUnit } from "../helpers/index.js";
import { formPrintHTML, savePrint } from "../export/savePrint.js";

export function exportData(projects) {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `hes-retrofits-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

export async function exportPhotos(projects) {
    if (typeof JSZip === "undefined") { alert("JSZip not loaded"); return; }
    const zip = new window.JSZip();
    let count = 0;
    projects.forEach(p => {
      const name = (p.customerName||"unnamed").replace(/[^a-zA-Z0-9]/g,"_");
      const folder = zip.folder(`${name}_${p.id.slice(0,6)}`);
      Object.entries(p.photos||{}).forEach(([key, val]) => {
        const arr = Array.isArray(val) ? val : (val ? [val] : []);
        arr.forEach((ph, i) => {
          const d = ph?.d || ph;
          if (!d || typeof d !== "string" || !d.startsWith("data:")) return;
          const ext = d.startsWith("data:image/png") ? "png" : d.startsWith("data:image/gif") ? "gif" : "jpg";
          const b64 = d.split(",")[1];
          if (b64) { folder.file(`${key}${arr.length>1?`_${i+1}`:""}.${ext}`, b64, {base64:true}); count++; }
        });
      });
    });
    if (count === 0) { alert("No photos to export"); return; }
    const blob = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `hes-photos-${new Date().toISOString().slice(0,10)}.zip`;
    a.click(); URL.revokeObjectURL(url);
  }

export async function exportProjectPhotos(proj) {
    if (typeof JSZip === "undefined") { alert("JSZip not loaded"); return; }
    const zip = new window.JSZip();
    const name = (proj.customerName||"unnamed").replace(/[^a-zA-Z0-9]/g,"_");
    let count = 0;
    Object.entries(proj.photos||{}).forEach(([key, val]) => {
      const arr = Array.isArray(val) ? val : (val ? [val] : []);
      arr.forEach((ph, i) => {
        const d = ph?.d || ph;
        if (!d || typeof d !== "string" || !d.startsWith("data:")) return;
        const ext = d.startsWith("data:image/png") ? "png" : d.startsWith("data:image/gif") ? "gif" : "jpg";
        const b64 = d.split(",")[1];
        if (b64) { zip.file(`${key}${arr.length>1?`_${i+1}`:""}.${ext}`, b64, {base64:true}); count++; }
      });
    });
    if (count === 0) { alert("No photos in this project"); return; }
    const blob = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}_photos.zip`;
    a.click(); URL.revokeObjectURL(url);
  }

export async function exportProjectForms(proj) {
    if (typeof JSZip === "undefined" || typeof jspdf === "undefined") { alert("Libraries not loaded — refresh"); return; }
    const zip = new window.JSZip();
    const nm = (proj.customerName||"unnamed").replace(/[^a-zA-Z0-9]/g,"_");
    const p = proj;

    // Status
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:#0f172a;z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;font-family:Arial;color:#e2e8f0";
    overlay.innerHTML = '<div style="font-size:16px;font-weight:bold">Generating PDFs…</div><div id="pdf-step" style="font-size:13px;color:#94a3b8"></div>';
    document.body.appendChild(overlay);
    const stepEl = overlay.querySelector("#pdf-step");

    // Pure jsPDF text-based PDF builder — no html2canvas
    const { jsPDF } = window.jspdf;

    function buildPDF(title, sections) {
      const doc = new jsPDF({ unit:"pt", format:"letter" });
      const W = 612, H = 792, ML = 40, MR = 40, MT = 40, MB = 40;
      const CW = W - ML - MR; // content width
      let y = MT;
      const black = [0,0,0], gray = [100,100,100], green = [22,163,74], red = [220,38,38], ltgray = [180,180,180];

      const checkPage = (need) => { if (y + need > H - MB) { doc.addPage(); y = MT; } };

      // Title
      doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.setTextColor(...black);
      doc.text(title, ML, y + 14); y += 20;
      doc.setDrawColor(...black); doc.setLineWidth(1.5); doc.line(ML, y, W - MR, y); y += 6;

      // Sub
      doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(...gray);
      doc.text((p.customerName||"") + " · " + (p.address||"") + " · " + new Date().toLocaleDateString(), ML, y + 9); y += 18;

      sections.forEach(sec => {
        checkPage(40);
        // Section header
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...black);
        doc.text(sec.title, ML, y + 11); y += 14;
        doc.setDrawColor(...ltgray); doc.setLineWidth(0.5); doc.line(ML, y, W - MR, y); y += 6;

        if (sec.table) {
          // Table with columns
          const cols = sec.table.cols;
          const rows = sec.table.rows;
          const colW = cols.map(c => c.w || (CW / cols.length));
          // Header row
          checkPage(18);
          doc.setFillColor(235, 235, 235);
          doc.rect(ML, y, CW, 16, "F");
          doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...black);
          let cx = ML;
          cols.forEach((c, ci) => { doc.text(c.label, cx + 3, y + 11, { maxWidth: colW[ci] - 6 }); cx += colW[ci]; });
          y += 16;
          // Data rows
          doc.setFont("helvetica","normal"); doc.setFontSize(8);
          rows.forEach(row => {
            checkPage(16);
            cx = ML;
            row.forEach((cell, ci) => {
              const isObj = cell && typeof cell === "object";
              const txt = String(isObj ? (cell.t||"—") : (cell!=null ? cell : "—"));
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
          sec.rows.forEach(row => {
            checkPage(16);
            doc.setFont("helvetica","normal"); doc.setTextColor(...gray);
            const lbl = String(row[0]!=null ? row[0] : "—");
            const val = String(row[1]!=null ? row[1] : "—");
            doc.text(lbl, ML, y + 10, { maxWidth: CW * 0.55 });
            // Color
            if (row[2] === "g") doc.setTextColor(...green);
            else if (row[2] === "r") doc.setTextColor(...red);
            else { doc.setFont("helvetica","bold"); doc.setTextColor(...black); }
            doc.text(val, W - MR, y + 10, { align: "right", maxWidth: CW * 0.42 });
            doc.setDrawColor(245, 245, 245); doc.line(ML, y + 14, W - MR, y + 14);
            y += 15;
          });
          y += 4;
        }

        if (sec.text) {
          checkPage(20);
          doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(...gray);
          const lines = doc.splitTextToSize(sec.text, CW);
          lines.forEach(line => { checkPage(12); doc.text(line, ML, y + 10); y += 12; });
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

    try {
      const a = p.audit || {};
      const fi = p.qaqc?.fi || {};
      const q = p.qaqc || {};

      // 1. Customer Auth — use image overlay approach with jsPDF addImage
      stepEl.textContent = "1/8 Customer Authorization…";
      if (a.customerAuthSig) {
        // For auth form, load the page images and overlay sig
        const loadImg = (src) => new Promise((res, rej) => {
          const img = new Image(); img.crossOrigin = "anonymous";
          img.onload = () => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; c.getContext("2d").drawImage(img, 0, 0); res(c.toDataURL("image/jpeg", 0.92)); };
          img.onerror = rej; img.src = src;
        });
        try {
          const pg1 = await loadImg("/auth-form-page1.jpg");
          const pg2 = await loadImg("/auth-form-page2.jpg");
          const adoc = new jsPDF({ unit:"pt", format:"letter" });
          adoc.addImage(pg1, "JPEG", 0, 0, 612, 792);
          // Overlay signature data
          if (a.customerAuthSig) {
            adoc.addImage(a.customerAuthSig, "PNG", 260, 340, 160, 14);
            adoc.setFontSize(7); adoc.setFont("helvetica","bold");
            adoc.text(a.customerAuthName||p.customerName||"", 260, 365);
            const authDt = a.authDate ? new Date(a.authDate).toLocaleDateString("en-US") : "";
            adoc.setFont("helvetica","normal"); adoc.text(authDt, 260, 377);
            adoc.text(p.address||"", 260, 389);
          }
          adoc.addPage();
          adoc.addImage(pg2, "JPEG", 0, 0, 612, 792);
          zip.file(nm+"_customer_auth.pdf", adoc.output("blob"));
        } catch(e) { console.warn("Auth form images not available", e); }
      }

      // 2. Assessment
      stepEl.textContent = "2/8 Assessment…";
      zip.file(nm+"_assessment.pdf", buildPDF("Data Collection Tool — Assessment", [
        { title: "Project Info", rows: [
          ["RISE PID", p.riseId], ["Stage", STAGES[p.currentStage]?.label],
          ["Bedrooms", a.bedrooms], ["Bathrooms", a.bathrooms],
          ["Year Built", a.yearBuilt||p.yearBuilt], ["Sq Ft", a.sqft||p.sqft], ["Stories", a.stories]
        ]},
        { title: "Blower Door", rows: [["Pre CFM50", p.preCFM50], ["Post CFM50", p.postCFM50]] },
        { title: "CAZ Testing", rows: [
          ["Ambient CO", a.ambientCO], ["Heat Spillage", a.heatSpill], ["WH Spillage", a.whSpill],
          ["Heating CO", a.heatCO], ["WH CO", a.whCO], ["Oven CO", a.ovenCO]
        ].filter(r => r[1]) },
        ...(a.assessorSig ? [{ title: "Assessor", sig: true }] : [])
      ]));

      // 3. Scope
      stepEl.textContent = "3/8 Scope…";
      {
        const s2 = p.scope2026 || {};
        const htg = s2.htg||{}; const clg = s2.clg||{}; const dhw = s2.dhw||{};
        const int2 = s2.int||{}; const exh = s2.exh||{}; const att = s2.attic||{};
        const col2 = s2.collar||{}; const oCJ = s2.outerCeiling||{}; const kw = s2.kneeWall||{};
        const ew1 = s2.extWall1||{}; const ew2 = s2.extWall2||{}; const fnd = s2.fnd||{};
        const yr = new Date().getFullYear();
        const CK = b => b===true?"\u2611":b===false?"\u2610":"\u2014";
        const YN2 = b => b===true?"Yes":b===false?"No":"\u2014";
        const afue2 = (htg.btuIn && htg.btuOut) ? (Number(htg.btuOut)/Number(htg.btuIn)*100).toFixed(1)+"%" : "\u2014";

        const secs = [];
        secs.push({ title: "Customer Information", rows: [
          ["Customer", p.customerName], ["Address", p.address], ["RISE PID", p.riseId],
          ["Sq Ft", p.sqft], ["Volume", Number(p.sqft)?(Number(p.sqft)*8).toLocaleString()+" ft\u00b3":null],
          ["Stories", p.stories], ["Bedrooms", s2.bedrooms], ["Year Built", p.yearBuilt],
          ["Home Age", p.yearBuilt?(yr-Number(p.yearBuilt))+" yrs":null], ["Occupants", p.occupants]
        ]});
        secs.push({ title: "Building Property Type", rows: [
          ["Style", s2.style], ["Tenant Type", s2.tenantType],
          ["Gutters Exist", CK(s2.gutterExist)], ["Downspouts", CK(s2.downspouts)], ["Gutter Repairs", CK(s2.gutterRepair)],
          ["Roof Condition", s2.roofCondition], ["Roof Type", s2.roofType], ["Roof Age", s2.roofAge], ["Roof Repairs", CK(s2.roofRepair)]
        ]});
        secs.push({ title: "Interior Conditions", rows: [
          ["Ceiling Condition", s2.ceilingCond], ["Wall Condition", s2.wallCond], ["Walls Need Insulation", s2.wallsNeedInsul]
        ]});
        secs.push({ title: "Smoke / CO / Weatherization", rows: [
          ["Smoke \u2014 present", s2.smokePresent], ["Smoke \u2014 to install", s2.smokeNeeded],
          ["CO \u2014 present", s2.coPresent], ["CO \u2014 to install", s2.coNeeded],
          ["Tenmats Needed", s2.tenmats], ["Door Sweeps", s2.doorSweeps]
        ]});
        secs.push({ title: "Heating System", rows: [
          ["Thermostat", htg.thermostat], ["Fuel", htg.fuel], ["System", htg.system], ["Flue", htg.flue],
          ["Manufacturer", htg.mfg], ["Install Year", htg.year], ["Age", htg.year?(yr-Number(htg.year))+" yrs":null],
          ["Condition", htg.condition], ["BTU In", htg.btuIn], ["BTU Out", htg.btuOut], ["AFUE", afue2], ["Draft", htg.draft],
          ["Gas Shut Off", CK(htg.gasShutoff)], ["Asbestos Pipes", CK(htg.asbestosPipes)],
          ["Replace Rec", CK(htg.replaceRec)], ["Clean & Tune", CK(htg.cleanTuneOverride!==undefined?htg.cleanTuneOverride:htg.cleanTune)]
        ]});
        if (htg.notes) secs[secs.length-1].rows.push(["Notes", htg.notes]);
        secs.push({ title: "Cooling System", rows: [
          ["Type", clg.type], ["Manufacturer", clg.mfg], ["Install Year", clg.year],
          ["Age", clg.year?(yr-Number(clg.year))+" yrs":null], ["SEER", clg.seer],
          ["Condition", clg.condition], ["BTU Size", clg.btu], ["Replace Rec", CK(clg.replaceRec)]
        ]});
        secs.push({ title: "Domestic Hot Water", rows: [
          ["Fuel", dhw.fuel], ["System", dhw.system], ["Manufacturer", dhw.mfg],
          ["Install Year", dhw.year], ["Age", dhw.year?(yr-Number(dhw.year))+" yrs":null],
          ["Condition", dhw.condition], ["Input BTU", dhw.btuIn],
          ["Insulated Pipes", CK(dhw.insulPipes)], ["Flue Repair", CK(dhw.flueRepair)],
          ["Replace Rec", CK(dhw.replaceRec)], ["Ducts Sealing", CK(dhw.ductsSealed)]
        ]});
        secs.push({ title: "Interior Inspection", rows: [
          ["Mold", CK(int2.mold)], ["Moisture", CK(int2.moisture)], ["Knob & Tube", CK(int2.knobTube)],
          ["Electrical", CK(int2.electrical)], ["Broken Glass", CK(int2.brokenGlass)],
          ["Vermiculite", CK(int2.vermiculite)], ["Water Leaks", CK(int2.waterLeaks)], ["Roof Leaks", CK(int2.roofLeaks)],
          ["Ceiling", int2.ceiling], ["Wall", int2.wall],
          ["Dropped Ceiling", CK(int2.droppedCeiling)], ["Drywall Repair", CK(int2.drywallRepair)],
          ["Recessed Light", CK(int2.recessedLight)], ["CO Detector", CK(int2.coDetector)], ["Smoke Detector", CK(int2.smokeDetector)]
        ]});
        secs.push({ title: "Door Types / Exhaust", rows: [
          ["Front", CK(s2.doors?.Front)], ["Back", CK(s2.doors?.Back)],
          ["Basement", CK(s2.doors?.Basement)], ["Attic", CK(s2.doors?.Attic)],
          ["Sweeps Needed", s2.totalSweeps],
          ["Fan Replace", CK(exh.fanReplace)], ["Bath Fan Light", CK(exh.bathFanLight)],
          ["Vent Kit", CK(exh.ventKit)], ["Term Cap", CK(exh.termCap)],
          ["Dryer Proper", CK(exh.dryerProper)], ["Dryer Repair", CK(exh.dryerRepair)],
          ["BD In", exh.bdIn], ["BD Out", exh.bdOut]
        ]});
        secs.push({ title: "Attic", rows: [
          ["Finished", CK(att.finished)], ["Unfinished", CK(att.unfinished)], ["Flat", CK(att.flat)],
          ["Sq Ft", att.sqft], ["Pre R", att.preR], ["R to Add", att.addR],
          ["Total R", (att.preR||att.addR)?"R-"+(Number(att.preR||0)+Number(att.addR||0)):null],
          ["Ductwork", CK(att.ductwork)], ["Floor Boards", CK(att.floorBoards)],
          ["Mold", CK(att.moldPresent)], ["Vermiculite", CK(att.vermPresent)], ["Knob & Tube", CK(att.knobTube)],
          ["Existing Vent", att.existVent], ["Needed Vent", att.needVent], ["Access", att.accessLoc]
        ]});
        secs.push({ title: "Collar Beam", rows: [
          ["Sq Ft", col2.sqft], ["Pre R", col2.preR], ["R to Add", col2.addR],
          ["Accessible", CK(col2.accessible)], ["Cut In", CK(col2.cutIn)], ["Ductwork", CK(col2.ductwork)]
        ]});
        secs.push({ title: "Outer Ceiling Joists", rows: [
          ["Sq Ft", oCJ.sqft], ["Pre R", oCJ.preR], ["R to Add", oCJ.addR],
          ["Accessible", CK(oCJ.accessible)], ["Cut In", CK(oCJ.cutIn)], ["Ductwork", CK(oCJ.ductwork)]
        ]});
        secs.push({ title: "Knee Walls", rows: [
          ["Sq Ft", kw.sqft], ["Pre R", kw.preR], ["R to Add", kw.addR],
          ["Dense Pack", YN2(kw.densePack)], ["Rigid Foam", YN2(kw.rigidFoam)],
          ["Tyvek", YN2(kw.tyvek)], ["Wall Type", kw.wallType]
        ]});
        secs.push({ title: "Ext Walls \u2014 1st Floor", rows: [
          ["Sq Ft", ew1.sqft], ["Pre R", ew1.preR], ["R to Add", ew1.addR],
          ["Dense Pack", YN2(ew1.densePack)], ["Cladding", ew1.cladding],
          ["Insulate From", ew1.insulFrom], ["Wall Type", ew1.wallType], ["Phenolic", YN2(ew1.phenolic)]
        ]});
        secs.push({ title: "Ext Walls \u2014 2nd Floor", rows: [
          ["Sq Ft", ew2.sqft], ["Pre R", ew2.preR], ["R to Add", ew2.addR],
          ["Dense Pack", YN2(ew2.densePack)], ["Cladding", ew2.cladding]
        ]});
        secs.push({ title: "Foundation / Crawl", rows: [
          ["Type", fnd.type], ["Above SqFt", fnd.aboveSqft], ["Below SqFt", fnd.belowSqft],
          ["Pre R", fnd.preR], ["Insul Type", fnd.insulType],
          ["Band Access", CK(fnd.bandAccess)], ["Band LnFt", fnd.bandLnft],
          ["Vented", CK(fnd.vented)], ["Vapor Barrier", YN2(fnd.vaporBarrier)], ["Water Issues", YN2(fnd.waterIssues)],
          ["Crawl Duct", CK(fnd.crawlDuct)], ["Crawl Floor", fnd.crawlFloor],
          ["Crawl Above", fnd.crawlAbove], ["Crawl Below", fnd.crawlBelow], ["Crawl R", fnd.crawlR]
        ]});
        secs.push({ title: "Diagnostics", rows: [
          ["Pre CFM50", p.preCFM50], ["Ext Temp", s2.extTemp], ["BD Location", p.bdLoc]
        ]});

        // ASHRAE
        var baseSq2 = Number(p.sqft)||0;
        var finB = fnd.type==="Finished"?(Number(fnd.aboveSqft)||0)+(Number(fnd.belowSqft)||0):0;
        var sqA = baseSq2+finB; var NbrA = Number(s2.bedrooms)||0;
        var preQ50A = Number(p.preCFM50)||0;
        var canASA = s2.ashrae?.canAirSeal !== undefined ? s2.ashrae.canAirSeal : (preQ50A > 0 && baseSq2 > 0 && preQ50A >= baseSq2 * 1.1);
        var Q50A = canASA ? Math.round(preQ50A * 0.75) : preQ50A;
        var stA = Number(p.stories)||1; var HA = stA>=2?16:stA>=1.5?14:8;
        var qiA = Q50A>0?0.052*Q50A*0.56*Math.pow(HA/8.2,0.4):0;
        var qtA = sqA>0?0.03*sqA+7.5*(NbrA+1):0;
        var ash2 = s2.ashrae||{}; var a2 = p.audit||{};
        var kC2=Number(ash2.kitchenCFM||a2.kitchenFan||0); var b1C=Number(ash2.bath1CFM||a2.bathFan1||0);
        var b2C=Number(ash2.bath2CFM||a2.bathFan2||0); var b3C=Number(ash2.bath3CFM||a2.bathFan3||0);
        var kD2=kC2>0?Math.max(0,100-(ash2.kWin?20:kC2)):0;
        var b1D2=b1C>0?Math.max(0,50-(ash2.b1Win?20:b1C)):0;
        var b2D2=b2C>0?Math.max(0,50-(ash2.b2Win?20:b2C)):0;
        var b3D2=b3C>0?Math.max(0,50-(ash2.b3Win?20:b3C)):0;
        var tdA=kD2+b1D2+b2D2+b3D2; var suppA=tdA*0.25;
        var qfA=qtA+suppA-qiA;
        var RN=function(x){return Math.round(x*100)/100;};
        var fanA=Number(ash2.fanSetting)||0;

        secs.push({ title: "ASHRAE 62.2-2016 Ventilation", rows: [
          ["Floor Area", sqA+" ft\u00b2"], ["Nbr (bedrooms)", NbrA], ["Occupants (Nbr+1)", NbrA+1], ["Height", HA+" ft"],
          ["Q50 (est. post)", Q50A+" CFM"+(canASA?" ("+preQ50A+"\u00d70.75)":" (no air seal)")],
          ["Kitchen Fan", kC2>0?kC2+" CFM":null], ["Bath #1", b1C>0?b1C+" CFM":null],
          ["Bath #2", b2C>0?b2C+" CFM":null], ["Bath #3", b3C>0?b3C+" CFM":null],
          ["Total Deficit", Math.round(tdA)+" CFM"],
          ["Infiltration (Qinf)", RN(qiA)+" CFM"],
          ["Qtot", RN(qtA)+" CFM"], ["Supplement", RN(suppA)+" CFM"],
          ["Qfan Required", RN(qfA)+" CFM", qfA>0?"r":"g"]
        ]});
        if(fanA>0) secs[secs.length-1].rows.push(["Fan Setting", fanA+" CFM"], ["Run-time", RN(qfA/fanA*60)+" min/hr"]);

        // Measures
        if (p.measures?.length) secs.push({ title: "EE Measures ("+p.measures.length+")", table: {
          cols: [{label:"Measure",w:380},{label:"Qty",w:60},{label:"Unit",w:92}],
          rows: p.measures.map(function(m) { return [m, getResolvedQty(p,m)||"\u2014", measUnit(m)]; })
        }});
        if (p.healthSafety?.length) secs.push({ title: "H&S Measures ("+p.healthSafety.length+")", table: {
          cols: [{label:"Measure",w:432},{label:"Qty",w:100}],
          rows: p.healthSafety.map(function(m) { return [m, getResolvedQty(p,m)||"\u2014"]; })
        }});

        // Insulation quantities
        secs.push({ title: "Notes", rows: [["Work Notes", p.measureNotes], ["H&S Notes", s2.hsNotes]] });

        zip.file(nm+"_scope.pdf", buildPDF("2026 HEA/IE Retrofit Form \u2014 Scope of Work", secs));
      }

      // 4. Pre-Work Scope of Work (customer signed)
      stepEl.textContent = "4/8 Pre-Work Scope…";
      {
        const s2 = p.scope2026 || {};
        const iq2 = s2.insulQty||{};
        const secs = [];
        secs.push({ title: "Property Information", rows: [
          ["Customer", p.customerName], ["Address", p.address], ["RISE PID", p.riseId],
          ["Sq Footage", (p.sqft||"")+" ft\u00b2"], ["Year Built", p.yearBuilt], ["Stories", p.stories], ["Pre CFM50", p.preCFM50]
        ]});
        if (p.measures.length) secs.push({ title: "Energy Efficiency Measures", table: {
          cols: [{label:"Measure",w:260},{label:"Qty",w:80},{label:"Unit",w:80}],
          rows: p.measures.map(function(m) { return [m, getResolvedQty(p,m)||"\u2014", measUnit(m)]; })
        }});
        if (p.healthSafety.length) secs.push({ title: "Health & Safety Measures", table: {
          cols: [{label:"Measure",w:310},{label:"Qty",w:80}],
          rows: p.healthSafety.map(function(m) { return [m, getResolvedQty(p,m)||"1"]; })
        }});
        const iqRows = Object.entries(iq2).filter(([,v])=>v);
        if (iqRows.length) secs.push({ title: "Insulation Specifications", table: {
          cols: [{label:"Location",w:260},{label:"Qty",w:80},{label:"Unit",w:80}],
          rows: iqRows.map(([l,v])=>[l, String(v), l.includes("Rim Joist")?"LnFt":"SqFt"])
        }});
        if (p.measureNotes) secs.push({ title: "Scope Notes", text: p.measureNotes });
        secs.push({ title: "Authorization", text: "By signing below, the customer acknowledges and authorizes the scope of work described above. Work shall not commence until this authorization is obtained." });
        if (fi.preScopeSig) secs.push({ title: "Customer Pre-Work Authorization", sig: true });
        zip.file(nm+"_pre_work_scope.pdf", buildPDF("Pre-Work Scope of Work \u2014 Authorization", secs));
      }

      // 5. Post-Work Scope of Work (customer signed, with approved COs)
      stepEl.textContent = "5/8 Post-Work Scope…";
      {
        const s2 = p.scope2026 || {};
        const iq2 = s2.insulQty||{};
        const coAll = p.changeOrders||[];
        const approved = coAll.filter(c=>c.status==="approved");
        const addNames = approved.flatMap(c=>(c.adds||[]).map(a=>a.m||a));
        const remNames = approved.flatMap(c=>(c.removes||[]));
        const postM = [...p.measures.filter(m=>!remNames.includes(m)),...addNames.filter(m=>!p.measures.includes(m)&&EE_MEASURES.includes(m))];
        const postH = [...p.healthSafety.filter(m=>!remNames.includes(m)),...addNames.filter(m=>!p.healthSafety.includes(m)&&HS_MEASURES.includes(m))];
        const coQtyMap3 = {};
        approved.forEach(c=>(c.adds||[]).forEach(a=>{if(a.qty)coQtyMap3[a.m]=a.qty;}));
        const getQ3 = (m) => coQtyMap3[m]||getResolvedQty(p,m)||"1";
        const secs = [];
        secs.push({ title: "Property Information", rows: [
          ["Customer", p.customerName], ["Address", p.address], ["RISE PID", p.riseId],
          ["Sq Footage", (p.sqft||"")+" ft\u00b2"], ["Year Built", p.yearBuilt], ["Stories", p.stories],
          ["Pre CFM50", p.preCFM50], ["Post CFM50", p.postCFM50]
        ]});
        if (postM.length) secs.push({ title: "Energy Efficiency Measures (Final)", table: {
          cols: [{label:"Measure",w:220},{label:"Qty",w:60},{label:"Unit",w:60},{label:"Status",w:80}],
          rows: [...postM.map(m => [addNames.includes(m)?"\ud83d\udd36 "+m:m, getQ3(m), measUnit(m), addNames.includes(m)?"COR Added":"Approved"]),
            ...remNames.filter(m=>EE_MEASURES.includes(m)).map(m=>[{t:m,c:"r"}, "\u2014", "\u2014", {t:"COR Removed",c:"r"}])]
        }});
        if (postH.length) secs.push({ title: "Health & Safety Measures (Final)", table: {
          cols: [{label:"Measure",w:280},{label:"Qty",w:60},{label:"Status",w:80}],
          rows: [...postH.map(m => [addNames.includes(m)?"\ud83d\udd36 "+m:m, getQ3(m), addNames.includes(m)?"COR Added":"Approved"]),
            ...remNames.filter(m=>HS_MEASURES.includes(m)).map(m=>[{t:m,c:"r"}, "\u2014", {t:"COR Removed",c:"r"}])]
        }});
        const iqRows = Object.entries(iq2).filter(([,v])=>v);
        if (iqRows.length) secs.push({ title: "Insulation Specifications", table: {
          cols: [{label:"Location",w:260},{label:"Qty",w:80},{label:"Unit",w:80}],
          rows: iqRows.map(([l,v])=>[l, String(v), l.includes("Rim Joist")?"LnFt":"SqFt"])
        }});
        if (approved.length) secs.push({ title: "Approved Scope Modifications ("+approved.length+")", rows:
          approved.map(c=>[c.text, (c.adds||[]).map(a=>"+ "+(a.m||a)).concat((c.removes||[]).map(r=>"\u2212 "+r)).join(", ")||"No changes"])
        });
        secs.push({ title: "Acceptance", text: "By signing below, the customer acknowledges that the work described above has been completed to their satisfaction and accepts the work as performed." });
        if (fi.postScopeSig) secs.push({ title: "Customer Post-Work Acceptance", sig: true });
        zip.file(nm+"_post_work_scope.pdf", buildPDF("Post-Work Scope of Work \u2014 Completion", secs));
      }

      // 6. Final Inspection
      stepEl.textContent = "6/8 Final Inspection…";
      {
        const secs = [];
        secs.push({ title: "Inspection Info", rows: [
          ["Homeowner name", p.customerName], ["Home address", p.address],
          ["Date of final inspection", fi.date], ["Installation Contractor", fi.contractor||"Assured Energy Solutions"]
        ]});
        secs.push({ title: "Health & Safety", table: {
          cols: [{label:"Item",w:240},{label:"Reading",w:80},{label:"Pass/Fail",w:60},{label:"Follow-up",w:60}],
          rows: FI_SAFETY.map(item => {
            const d = fi[item.k]||{};
            return [
              (item.sub?"   ":"")+item.l,
              d.reading ? d.reading+" "+(item.u||"") : (d.yn||"—"),
              { t: d.pf==="P"?"Pass":d.pf==="F"?"Fail":"N/A", c: d.pf==="P"?"g":d.pf==="F"?"r":"" },
              d.fu==="Y"?"Yes":d.fu==="N"?"No":"N/A"
            ];
          })
        }});
        secs.push({ title: "Detectors & Ventilation", rows: [
          ["Smoke detectors installed", fi.smokeQty||"—"],
          ["CO detectors installed", fi.coQty||"—"],
          ["Required ventilation ASHRAE 62.2", (fi.ventCFM||"—")+" CFM"],
          ["New exhaust fan installed?", fi.newFan||"—"],
          ["All H&S issues addressed?", fi.hsAddressed||"—", fi.hsAddressed==="Yes"?"g":"r"],
          ...(fi.hsWhyNot ? [["If no, why not", fi.hsWhyNot]] : [])
        ]});
        secs.push({ title: "Insulation", table: {
          cols: [{label:"Area",w:170},{label:"Pre R-value",w:90},{label:"Post R-value",w:90},{label:"Insulated?",w:90}],
          rows: FI_INSUL.map(ins => { const d=fi[ins.k]||{}; return [ins.l, d.preR||"—", d.postR||"—", d.done||"—"]; })
        }});
        secs.push({ title: "Combustion Appliances — Space Heating and DHW", table: {
          cols: [{label:"#",w:25},{label:"Equipment Type",w:180},{label:"Vent Type",w:120},{label:"Replaced?",w:70},{label:"Follow-up?",w:70}],
          rows: [1,2,3].map(n => { const d=fi["equip"+n]||{}; return [String(n), d.type||"—", d.vent||"—", d.replaced||"—", d.fu||"—"]; })
        }});
        secs.push({ title: "Blower Door", rows: [["Pre CFM50", p.preCFM50||"—"], ["Post CFM50", p.postCFM50||"—"]] });
        secs.push({ title: "Direct Installs", rows: [["New thermostat installed?", fi.thermostat||"—"]] });
        secs.push({ title: "Follow-up Needed", text: fi.followUpNA?"N/A":(fi.followUp||"None") });
        secs.push({ title: "Contractor Checklist", rows: FI_CONTRACTOR_CK.map(ck => [ck, fi.ck?.[ck]?"☑ Done":"☐", fi.ck?.[ck]?"g":""]) });
        if (fi.inspectorSig) secs.push({ title: "Inspector", sig: true });
        zip.file(nm+"_final_inspection.pdf", buildPDF("Home Energy Savings – Retrofits Final Inspection Form", secs));
      }

      // 7. QAQC
      stepEl.textContent = "7/8 QAQC…";
      {
        const secs = [{ title: "Inspection Info", rows: [["Date", q.date||"—"], ["Inspector", q.inspector||"—"]] }];
        Object.entries(QAQC_SECTIONS).forEach(([cat, items]) => {
          secs.push({ title: cat, rows: items.map((item, i) => {
            const r = q.results?.[cat+"-"+i]||{};
            return [(i+1)+". "+item, (r.v||"—")+(r.c?" — "+r.c:""), r.v==="Y"?"g":r.v==="N"?"r":""];
          })});
        });
        secs.push({ title: "Overall Result", rows: [
          ["Result", q.passed===true?"PASS":q.passed===false?"FAIL":"—", q.passed===true?"g":"r"],
          ...(q.notes ? [["Notes", q.notes]] : [])
        ]});
        if (q.inspectorSig) secs.push({ title: "Inspector", sig: true });
        zip.file(nm+"_qaqc_observation.pdf", buildPDF("QAQC Observation Form", secs));
      }

      // 8. Activity Log
      stepEl.textContent = "8/10 Activity Log…";
      if (p.activityLog?.length) {
        zip.file(nm+"_activity_log.pdf", buildPDF("Activity Log", [
          { title: p.activityLog.length + " Entries", rows:
            p.activityLog.slice(0,100).map(l => [new Date(l.ts).toLocaleString()+" — "+l.by, l.txt])
          }
        ]));
      }

      // 9. HVAC Tune-Up Report
      stepEl.textContent = "9/10 HVAC Tune-Up…";
      {
        const hvac = p.hvac || {};
        const f2 = hvac.furnace||{}; const w2 = hvac.waterHeater||{}; const ac2 = hvac.condenser||{};
        if (hvac.techName || hvac.completed) {
          const secs = [];
          secs.push({ title: "Job Info", rows: [
            ["Customer", p.customerName], ["Address", p.address], ["ST#", p.stId],
            ["Technician", hvac.techName], ["Manager", hvac.managerName],
            ["Date", hvac.completedDate ? new Date(hvac.completedDate).toLocaleDateString() : "\u2014"],
            ["Status", hvac.completed ? "Completed" : "In Progress"]
          ]});
          if (f2.make) secs.push({ title: "Furnace", rows: [
            ["Make",f2.make],["Model",f2.model],["Serial",f2.serial],["Age",f2.age?(f2.age+" yrs"):"\u2014"],
            ["Heat Exchanger",f2.heatExchanger],["Inducer Motor",f2.inducerMotor],["Ignitor",f2.ignitorCond],
            ["Burner",f2.burnerCond],["Flame Sensor",f2.flameSensor],["Filter Size",f2.filterSize],
            ["Filter Changed",f2.filterChanged],["Blower Motor",f2.blowerMotor],
            ["Control Board",f2.controlBoard],["Thermostat",f2.thermostat],
            ["Findings",f2.findings],...(f2.findingsNotes?[["Notes",f2.findingsNotes]]:[])
          ].filter(r=>r[1])});
          if (w2.make) secs.push({ title: "Water Heater", rows: [
            ["Make",w2.make],["Model",w2.model],["Serial",w2.serial],["Age",w2.age?(w2.age+" yrs"):"\u2014"],
            ["Condition",w2.condition],["Venting",w2.venting],["Burners",w2.burners],
            ["Findings",w2.findings],...(w2.findingsNotes?[["Notes",w2.findingsNotes]]:[])
          ].filter(r=>r[1])});
          if (ac2.make) secs.push({ title: "Air Conditioning / Condenser", rows: [
            ["Make",ac2.make],["Model",ac2.model],["Serial",ac2.serial],["Age",ac2.age?(ac2.age+" yrs"):"\u2014"],
            ["Condition",ac2.condition],["Electrical",ac2.electrical],["Line Set",ac2.lineSet],
            ["Evap Coil",ac2.evapCoil],["Other Issues",ac2.otherIssues],
            ["Findings",ac2.findings],...(ac2.findingsNotes?[["Notes",ac2.findingsNotes]]:[])
          ].filter(r=>r[1])});
          if (hvac.systemNotes) secs.push({ title: "System Assessment", rows: [["Findings", hvac.systemNotes],...(hvac.detailNotes?[["Details",hvac.detailNotes]]:[])] });
          if (hvac.replaceRequestStatus) secs.push({ title: "Replacement Request", rows: [
            ["Type", hvac.replaceType], ["Priority", hvac.replacePriority],
            ["Status", hvac.replaceRequestStatus?.toUpperCase()],
            ["Justification", hvac.replaceJustification]
          ].filter(r=>r[1])});
          if (hvac.replInstallComplete) secs.push({ title: "Replacement Install", rows: [
            ["New Make", hvac.replNewMake], ["New Model", hvac.replNewModel], ["New Serial", hvac.replNewSerial],
            ["Install Date", hvac.replInstallDate ? new Date(hvac.replInstallDate).toLocaleDateString() : "\u2014"],
            ["Installed By", hvac.replInstallBy], ["Notes", hvac.replNotes]
          ].filter(r=>r[1])});
          zip.file(nm+"_hvac_tuneup.pdf", buildPDF("AES System Tune Up Report", secs));
        }
      }

      // 10. HVAC + Replacement Photos
      stepEl.textContent = "10/10 HVAC Photos…";
      {
        const hvacPhotoItems = Object.entries(PHOTO_SECTIONS).filter(([cat])=>cat.startsWith("HVAC")).flatMap(([,items])=>items);
        const replPhotoItems = Object.entries(PHOTO_SECTIONS).filter(([cat])=>cat.startsWith("HVAC Replacement")).flatMap(([,items])=>items);
        const allHvacItems = [...hvacPhotoItems,...replPhotoItems];
        let hvacPhotoCount2 = 0;
        for (const item of allHvacItems) {
          const photos = getPhotos(p.photos, item.id);
          for (let i = 0; i < photos.length; i++) {
            const ph = photos[i];
            if (ph.d) {
              const ext = ph.d.startsWith("data:image/png")?"png":"jpg";
              const b64 = ph.d.split(",")[1];
              if (b64) {
                zip.file(`hvac_photos/${item.l.replace(/[^a-zA-Z0-9 ]/g,"_")}${photos.length>1?"_"+(i+1):""}.${ext}`, b64, {base64:true});
                hvacPhotoCount2++;
              }
            }
          }
        }
      }

      stepEl.textContent = "Compressing ZIP…";
      const blob = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(blob);
      const dl = document.createElement("a"); dl.href = url; dl.download = nm+"_forms.zip";
      dl.click(); URL.revokeObjectURL(url);
    } catch(err) { alert("Error: "+err.message); console.error(err); }
    document.body.removeChild(overlay);
  }
