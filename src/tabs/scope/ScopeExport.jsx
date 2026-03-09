import React from "react";
import { fmts, getResolvedQty, measUnit } from "../../helpers/index.js";

export function ScopeExport({p, s}) {
  const getScopeHTML = () => {
    const yn = v => v===true?"Yes":v===false?"No":"—";
    const v = k => s[k]||"—";
    const nv = (sec,k) => s[sec]?.[k]||"—";
    const nyn = (sec,k) => s[sec]?.[k]===true?"Yes":s[sec]?.[k]===false?"No":"—";

    const mq = p.measureQty||{};
    const measTable = p.measures.length ? `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">\n<tr style="background:#f0fdf4;"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Unit</th></tr>\n${p.measures.map(m=>`<tr><td style="padding:3px 6px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${getResolvedQty(p,m)||"—"}</td><td style="padding:3px 6px;border:1px solid #ddd">${measUnit(m)}</td></tr>`).join("")}\n</table>` : "<span style='color:#999'>None selected</span>";
    const hsTable = p.healthSafety.length ? `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">\n<tr style="background:#fffbeb;"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Unit</th></tr>\n${p.healthSafety.map(m=>`<tr><td style="padding:3px 6px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${getResolvedQty(p,m)||"—"}</td><td style="padding:3px 6px;border:1px solid #ddd">ea</td></tr>`).join("")}\n</table>` : "<span style='color:#999'>None selected</span>";

    const chk = b => b===true?"☑":b===false?"☐":"—";
    const htg = s.htg||{}; const clg = s.clg||{}; const dhw = s.dhw||{};
    const int2 = s.int||{}; const exh = s.exh||{}; const att = s.attic||{};
    const col = s.collar||{}; const oc = s.outerCeiling||{}; const kw = s.kneeWall||{};
    const ew1 = s.extWall1||{}; const ew2 = s.extWall2||{}; const fnd = s.fnd||{};
    const afue = htg.btuIn && htg.btuOut ? (Number(htg.btuOut)/Number(htg.btuIn)*100).toFixed(1)+"%" : "—";

    // Build ASHRAE HTML first (avoid nested template literals)
    const ashraeHTML = (() => {
      const a2=p.audit||{};const baseSq=Number(p.sqft)||0;const finBsmt=s.fnd?.type==="Finished"?(Number(s.fnd?.aboveSqft)||0)+(Number(s.fnd?.belowSqft)||0):0;const sq=baseSq+finBsmt;const oc2=Number(s.bedrooms)||0;
      const preC50=Number(p.preCFM50)||0;const canAS3=s.ashrae?.canAirSeal!==undefined?s.ashrae.canAirSeal:(preC50>0&&baseSq>0&&preC50>=baseSq*1.1);const c50=canAS3?Math.round(preC50*0.75):preC50;
      const st2=Number(p.stories)||1;const hh=st2>=2?16:st2>=1.5?14:8;const wsf2=0.56;
      const kRw=String(s.ashrae?.kitchenCFM??a2.kitchenFan??"");const b1Rw=String(s.ashrae?.bath1CFM??a2.bathFan1??"");
      const b2Rw=String(s.ashrae?.bath2CFM??a2.bathFan2??"");const b3Rw=String(s.ashrae?.bath3CFM??a2.bathFan3??"");
      const kP=kRw.trim()!=="";const b1P=b1Rw.trim()!=="";const b2P=b2Rw.trim()!=="";const b3P=b3Rw.trim()!=="";
      const kC=Number(kRw)||0;const b1c=Number(b1Rw)||0;const b2c=Number(b2Rw)||0;const b3c=Number(b3Rw)||0;
      const kW=s.ashrae?.kWin;const b1W=s.ashrae?.b1Win;const b2W=s.ashrae?.b2Win;const b3W=s.ashrae?.b3Win;
      const qi=c50>0?0.052*c50*wsf2*Math.pow(hh/8.2,0.4):0;
      const qt=sq>0?0.03*sq+7.5*(oc2+1):0;
      const kD=kP?Math.max(0,100-(kW?20:kC)):0;const b1D=b1P?Math.max(0,50-(b1W?20:b1c)):0;
      const b2D=b2P?Math.max(0,50-(b2W?20:b2c)):0;const b3D=b3P?Math.max(0,50-(b3W?20:b3c)):0;
      const td=kD+b1D+b2D+b3D;const supp=td*0.25;
      const qf=qt+supp-qi;
      const R2=vv=>Math.round(vv*100)/100;
      const fan=Number(s.ashrae?.fanSetting)||0;const minHr=fan>0?R2(qf/fan*60):0;
      let h = "";
      h += '<div class="grid">';
      h += '<div class="row"><span class="lbl">Floor area'+(finBsmt>0?" (incl. fin. bsmt)":"")+'</span><span class="val">'+sq+' ft\u00b2</span></div>';
      h += '<div class="row"><span class="lbl">Nbr (bedrooms)</span><span class="val">'+oc2+'</span></div>';
      h += '<div class="row"><span class="lbl">Occupants (Nbr + 1)</span><span class="val">'+(oc2+1)+'</span></div>';
      h += '<div class="row"><span class="lbl">Dwelling height</span><span class="val">'+hh+' ft ('+(st2>=2?"2":st2>=1.5?"1.5":"1")+'-story)</span></div>';
      h += '<div class="row"><span class="lbl">Q50 (est. post)</span><span class="val">'+c50+' CFM'+(canAS3?' ('+preC50+'\u00d70.75)':' (no air seal)')+'</span></div>';
      h += '<div class="row"><span class="lbl">Kitchen fan'+(kP?"":" (none)")+'</span><span class="val">'+(kP?kC+" CFM":"\u2014")+' '+(kW?"(window)":"")+" "+(kP?"(req 100)":"")+'</span></div>';
      h += '<div class="row"><span class="lbl">Bath #1'+(b1P?"":" (none)")+'</span><span class="val">'+(b1P?b1c+" CFM":"\u2014")+' '+(b1W?"(window)":"")+" "+(b1P?"(req 50)":"")+'</span></div>';
      h += '<div class="row"><span class="lbl">Bath #2'+(b2P?"":" (none)")+'</span><span class="val">'+(b2P?b2c+" CFM":"\u2014")+' '+(b2W?"(window)":"")+" "+(b2P?"(req 50)":"")+'</span></div>';
      h += '<div class="row"><span class="lbl">Bath #3'+(b3P?"":" (none)")+'</span><span class="val">'+(b3P?b3c+" CFM":"\u2014")+' '+(b3W?"(window)":"")+" "+(b3P?"(req 50)":"")+'</span></div>';
      h += '<div class="row"><span class="lbl">Total deficit (intermittent)</span><span class="val">'+Math.round(td)+' CFM</span></div>';
      h += '</div>';
      h += '<div style="margin-top:8px;padding:8px;background:#EFF6FF;border-radius:4px">';
      h += '<div style="font-weight:700;font-size:11px;color:#1E3A8A;margin-bottom:4px">Dwelling-Unit Ventilation Results</div>';
      h += '<div class="row"><span class="lbl">Eff. annual avg infiltration</span><span class="val">'+R2(qi)+' CFM</span></div>';
      h += '<div class="row"><span class="lbl">Qtot = 0.03\u00d7'+sq+' + 7.5\u00d7('+oc2+'+1)</span><span class="val">'+R2(qt)+' CFM</span></div>';
      h += '<div class="row"><span class="lbl">Alt. compliance supplement = '+Math.round(td)+'\u00d70.25</span><span class="val">'+R2(supp)+' CFM</span></div>';
      h += '<div class="row"><span class="lbl">Infiltration credit (full, existing)</span><span class="val">'+R2(qi)+' CFM</span></div>';
      h += '<div class="row" style="border-top:2px solid #1E3A8A;padding-top:4px;margin-top:4px"><span style="font-weight:700">Qfan = '+R2(qt)+' + '+R2(supp)+' \u2212 '+R2(qi)+'</span><span style="font-weight:700;color:#1E3A8A;font-size:14px">'+R2(qf)+' CFM</span></div>';
      if(fan>0) h += '<div class="row"><span class="lbl">Fan setting: '+fan+' CFM \u00b7 Run-time: '+minHr+' min/hr (continuous = 60)</span></div>';
      h += '</div>';
      return h;
    })();

    // Build body with string concatenation (no nested template literals)
    let body = "";
    const R = (l, vv) => '<div class="row"><span class="lbl">'+l+'</span><span class="val">'+(vv!=null?vv:"\u2014")+'</span></div>';

    body += '<div class="sec"><h3>Customer Information</h3><div class="grid">';
    body += R("Customer",p.customerName) + R("Address",p.address) + R("RISE PID",p.riseId||"\u2014");
    body += R("Assessment Date",p.assessmentDate?fmts(p.assessmentDate):"\u2014");
    body += R("Sq Ft",p.sqft||"\u2014") + R("Volume",Number(p.sqft)?(Number(p.sqft)*8).toLocaleString()+" ft\u00b3":"\u2014");
    body += R("Stories",p.stories||"\u2014") + R("Bedrooms",s.bedrooms||"\u2014");
    body += R("Year Built",p.yearBuilt||"\u2014") + R("Home Age",p.yearBuilt?(new Date().getFullYear()-Number(p.yearBuilt))+" yrs":"\u2014");
    body += R("Occupants",p.occupants||"\u2014");
    body += '</div></div>';

    body += '<div class="sec"><h3>Building Property Type</h3><div class="grid">';
    body += R("Style",v("style")) + R("Tenant Type",v("tenantType"));
    body += R("Gutters Exist",chk(s.gutterExist)) + R("Downspouts",chk(s.downspouts)) + R("Gutter Repairs",chk(s.gutterRepair));
    body += R("Roof Condition",v("roofCondition")) + R("Roof Type",v("roofType")) + R("Roof Age",v("roofAge")) + R("Roof Repairs",chk(s.roofRepair));
    body += '</div></div>';

    body += '<div class="sec"><h3>Interior Conditions</h3><div class="grid">';
    body += R("Ceiling Condition",v("ceilingCond")) + R("Wall Condition",v("wallCond")) + R("Walls Need Insulation",v("wallsNeedInsul"));
    body += '</div></div>';

    body += '<div class="sec"><h3>Smoke / CO / Weatherization</h3><div class="grid">';
    body += R("Smoke \u2014 present",v("smokePresent")) + R("Smoke \u2014 to install",v("smokeNeeded"));
    body += R("CO \u2014 present",v("coPresent")) + R("CO \u2014 to install",v("coNeeded"));
    body += R("Tenmats Needed",v("tenmats")) + R("Doors Need Sweeps/WS",v("doorSweeps"));
    body += '</div></div>';

    body += '<div class="sec"><h3>Heating System Info</h3><div class="grid">';
    body += R("Thermostat",htg.thermostat||"\u2014") + R("Fuel Type",htg.fuel||"\u2014") + R("System Type",htg.system||"\u2014") + R("Flue Condition",htg.flue||"\u2014");
    body += R("Manufacturer",htg.mfg||"\u2014") + R("Install Year",htg.year||"\u2014") + R("Age",htg.year?(new Date().getFullYear()-Number(htg.year))+" yrs":"\u2014") + R("Condition",htg.condition||"\u2014");
    body += R("BTU Input",htg.btuIn||"\u2014") + R("BTU Output",htg.btuOut||"\u2014") + R("AFUE",afue) + R("Draft",htg.draft||"\u2014");
    body += R("Gas Shut Off",chk(htg.gasShutoff)) + R("Pipes Asbestos Wrapped",chk(htg.asbestosPipes)) + R("Replacement Recommended",chk(htg.replaceRec)) + R("Clean & Tune",chk(htg.cleanTuneOverride!==undefined?htg.cleanTuneOverride:htg.cleanTune));
    body += '</div>'+(htg.notes?'<p style="color:#333;margin-top:6px">Notes: '+htg.notes+'</p>':"")+'</div>';

    body += '<div class="sec"><h3>Cooling System Info</h3><div class="grid">';
    body += R("Type",clg.type||"\u2014") + R("Manufacturer",clg.mfg||"\u2014") + R("Install Year",clg.year||"\u2014");
    body += R("Age",clg.year?(new Date().getFullYear()-Number(clg.year))+" yrs":"\u2014") + R("SEER",clg.seer||"\u2014") + R("Condition",clg.condition||"\u2014");
    body += R("BTU Size",clg.btu||"\u2014") + R("Replacement Recommended",chk(clg.replaceRec));
    if(clg.replaceReason) body += R("Reason",clg.replaceReason);
    body += '</div></div>';

    body += '<div class="sec"><h3>Domestic Hot Water Info</h3><div class="grid">';
    body += R("Fuel",dhw.fuel||"\u2014") + R("System Type",dhw.system||"\u2014") + R("Manufacturer",dhw.mfg||"\u2014");
    body += R("Install Year",dhw.year||"\u2014") + R("Age",dhw.year?(new Date().getFullYear()-Number(dhw.year))+" yrs":"\u2014") + R("Condition",dhw.condition||"\u2014");
    body += R("Input BTU",dhw.btuIn||"\u2014") + R("Insulated Pipes",chk(dhw.insulPipes)) + R("Flue Repair Needed",chk(dhw.flueRepair));
    body += R("Replacement Recommended",chk(dhw.replaceRec)) + R("Ducts Need Sealing",chk(dhw.ductsSealed));
    if(dhw.replaceReason) body += R("Reason",dhw.replaceReason);
    body += '</div></div>';

    body += '<div class="sec"><h3>Interior Inspection</h3><div class="grid">';
    body += R("Mold",chk(int2.mold)) + R("Moisture Problems",chk(int2.moisture)) + R("Live Knob & Tube",chk(int2.knobTube)) + R("Electrical Issues",chk(int2.electrical));
    body += R("Broken Glass",chk(int2.brokenGlass)) + R("Vermiculite/Asbestos",chk(int2.vermiculite)) + R("Water Leaks",chk(int2.waterLeaks)) + R("Roof Leaks",chk(int2.roofLeaks));
    if(int2.waterLoc) body += R("Water Leak Location",int2.waterLoc);
    if(int2.roofLoc) body += R("Roof Leak Location",int2.roofLoc);
    body += R("Ceiling Condition",int2.ceiling||"\u2014") + R("Wall Condition",int2.wall||"\u2014");
    body += R("Dropped Ceiling",chk(int2.droppedCeiling)) + R("Drywall Repair",chk(int2.drywallRepair)) + R("Recessed Lighting",chk(int2.recessedLight));
    if(int2.recessedLoc) body += R("Recessed Loc",int2.recessedLoc);
    body += R("CO Detector",chk(int2.coDetector)) + R("Smoke Detector",chk(int2.smokeDetector));
    body += '</div></div>';

    body += '<div class="sec"><h3>Door Types / Exhaust Venting</h3><div class="grid">';
    body += R("Front \u2014 Existing",chk(s.doors?.Front)) + R("Back \u2014 Existing",chk(s.doors?.Back)) + R("Basement \u2014 Existing",chk(s.doors?.Basement)) + R("Attic \u2014 Existing",chk(s.doors?.Attic));
    body += R("Strips/Sweeps Needed",s.totalSweeps||"\u2014");
    body += R("Exhaust Fan Replace",chk(exh.fanReplace)) + R("Bath Fan w/ Light",chk(exh.bathFanLight)) + R("Vent Kit Needed",chk(exh.ventKit));
    body += R("Termination Cap",chk(exh.termCap)) + R("Dryer Vented Properly",chk(exh.dryerProper)) + R("Dryer Vent Repair",chk(exh.dryerRepair));
    body += R("BD In",exh.bdIn||"\u2014") + R("BD Out",exh.bdOut||"\u2014") + R("No BD (estimated)",chk(exh.noBD));
    body += '</div>'+(exh.notes?'<p style="color:#333;margin-top:6px">Notes: '+exh.notes+'</p>':"")+'</div>';

    body += '<div class="sec"><h3>Attic</h3><div class="grid">';
    body += R("Finished",chk(att.finished)) + R("Unfinished",chk(att.unfinished)) + R("Flat",chk(att.flat));
    body += R("Sq Ft",nv("attic","sqft")) + R("Pre-Existing R",nv("attic","preR")) + R("R to Add",nv("attic","addR"));
    body += R("Total R",(att.preR||att.addR)?"R-"+(Number(att.preR||0)+Number(att.addR||0)):"\u2014");
    body += R("Recessed Lighting Qty",att.recessQty||"\u2014") + R("Storage Created",att.storage||"\u2014");
    body += R("Ductwork Present",chk(att.ductwork)) + R("Floor Boards",chk(att.floorBoards)) + R("Mold Present",chk(att.moldPresent));
    body += R("Vermiculite Present",chk(att.vermPresent)) + R("Knob & Tube",chk(att.knobTube));
    if(att.ductwork) body += R("Duct Condition",att.condition||"\u2014") + R("Ln Ft Air Seal",att.lnftAirSeal||"\u2014");
    body += R("Existing Ventilation",att.existVent||"\u2014") + R("Needed Ventilation",att.needVent||"\u2014") + R("Access Location",att.accessLoc||"\u2014");
    body += '</div>'+(att.notes?'<p style="color:#333;margin-top:6px">Notes: '+att.notes+'</p>':"")+'</div>';

    body += '<div class="sec"><h3>Collar Beam</h3><div class="grid">';
    body += R("Sq Ft",col.sqft||"\u2014") + R("Pre-Existing R",col.preR||"\u2014") + R("R to Add",col.addR||"\u2014");
    body += R("Total R",(col.preR||col.addR)?"R-"+(Number(col.preR||0)+Number(col.addR||0)):"\u2014");
    body += R("Accessible",chk(col.accessible)) + R("Cut In Needed",chk(col.cutIn)) + R("Ductwork",chk(col.ductwork));
    if(col.ductwork) body += R("Condition",col.condition||"\u2014") + R("Ln Ft Air Seal",col.lnftAirSeal||"\u2014");
    body += '</div></div>';

    body += '<div class="sec"><h3>Outer Ceiling Joists</h3><div class="grid">';
    body += R("Sq Ft",nv("outerCeiling","sqft")) + R("Pre-Existing R",nv("outerCeiling","preR")) + R("R to Add",nv("outerCeiling","addR"));
    body += R("Accessible",chk(oc.accessible)) + R("Cut In",chk(oc.cutIn)) + R("Floor Boards",chk(oc.floorBoards)) + R("Ductwork",chk(oc.ductwork));
    if(oc.ductwork) body += R("Condition",oc.condition||"\u2014") + R("Ln Ft Air Seal",oc.lnftAirSeal||"\u2014");
    body += '</div></div>';

    body += '<div class="sec"><h3>Knee Walls</h3><div class="grid">';
    body += R("Sq Ft",nv("kneeWall","sqft")) + R("Pre-Existing R",nv("kneeWall","preR")) + R("R to Add",nv("kneeWall","addR"));
    body += R("Dense Pack",nyn("kneeWall","densePack")) + R("Rigid Foam",nyn("kneeWall","rigidFoam")) + R("Tyvek",nyn("kneeWall","tyvek"));
    body += R("Fiberglass Batts",nyn("kneeWall","fgBatts")) + R("Wall Type",nv("kneeWall","wallType"));
    if(kw.tyvek) body += R("Tyvek Sq Ft",kw.tyvekSqft||"\u2014");
    body += '</div></div>';

    body += '<div class="sec"><h3>Exterior Walls \u2014 1st Floor</h3><div class="grid">';
    body += R("Sq Ft",nv("extWall1","sqft")) + R("Pre-Existing R",nv("extWall1","preR")) + R("R to Add",nv("extWall1","addR"));
    body += R("Window/Door SqFt",ew1.sqft?Math.round(Number(ew1.sqft)*0.16):"\u2014") + R("Net Insulation SqFt",ew1.sqft?Math.round(Number(ew1.sqft)*0.84):"\u2014");
    body += R("Dense Pack",nyn("extWall1","densePack")) + R("Cladding",nv("extWall1","cladding")) + R("Insulate From",nv("extWall1","insulFrom"));
    body += R("Wall Type",nv("extWall1","wallType")) + R("Phenolic Foam",nyn("extWall1","phenolic"));
    body += '</div></div>';

    body += '<div class="sec"><h3>Exterior Walls \u2014 2nd Floor</h3><div class="grid">';
    body += R("Sq Ft",nv("extWall2","sqft")) + R("Pre-Existing R",nv("extWall2","preR")) + R("R to Add",nv("extWall2","addR"));
    body += R("Window/Door SqFt",ew2.sqft?Math.round(Number(ew2.sqft)*0.14):"\u2014") + R("Net Insulation SqFt",ew2.sqft?Math.round(Number(ew2.sqft)*0.86):"\u2014");
    body += R("Dense Pack",nyn("extWall2","densePack")) + R("Cladding",nv("extWall2","cladding"));
    body += '</div></div>';

    body += '<div class="sec"><h3>Foundation / Crawl</h3><div class="grid">';
    body += R("Type",nv("fnd","type")) + R("Above Grade SqFt",nv("fnd","aboveSqft")) + R("Below Grade SqFt",nv("fnd","belowSqft"));
    body += R("Pre-Existing R",nv("fnd","preR")) + R("Insulation Type",nv("fnd","insulType"));
    body += R("Band Joist Access",chk(fnd.bandAccess)) + R("Band Joist LnFt",nv("fnd","bandLnft")) + R("Band Joist R",fnd.bandR||"\u2014") + R("Band Insulation",fnd.bandInsul||"\u2014");
    body += R("Vented",chk(fnd.vented)) + R("Vapor Barrier",nyn("fnd","vaporBarrier")) + R("Water Issues",nyn("fnd","waterIssues"));
    body += R("Crawl Ductwork",chk(fnd.crawlDuct)) + R("Crawl Floor",fnd.crawlFloor||"\u2014");
    if(fnd.vented) body += R("# of Vents",fnd.ventCount||"\u2014");
    if(fnd.vaporBarrier) body += R("Barrier SqFt",fnd.barrierSqft||"\u2014");
    body += R("Crawl Above SqFt",fnd.crawlAbove||"\u2014") + R("Crawl Below SqFt",fnd.crawlBelow||"\u2014") + R("Crawl Pre-Existing R",fnd.crawlR||"\u2014");
    body += R("Crawl Band Access",chk(fnd.crawlBandAccess));
    if(fnd.crawlBandAccess) body += R("Crawl Band LnFt",fnd.crawlBandLnft||"\u2014") + R("Crawl Band R",fnd.crawlBandR||"\u2014");
    body += '</div></div>';

    body += '<div class="sec"><h3>Diagnostics</h3><div class="grid">';
    body += R("Pre CFM50",p.preCFM50||"\u2014") + R("Ext Temp",v("extTemp")) + R("BD Location",p.bdLoc||"\u2014");
    body += '</div>'+(s.diagNotes?'<p style="color:#333;margin-top:6px">Notes: '+s.diagNotes+'</p>':"")+'</div>';

    body += '<div class="sec"><h3>ASHRAE 62.2-2016 Ventilation</h3>';
    body += '<p style="font-size:9px;color:#999;margin:0 0 6px">Existing \u00b7 Detached \u00b7 Infiltration credit: Yes \u00b7 Alt. compliance: Yes \u00b7 wsf = 0.56</p>';
    body += ashraeHTML;
    body += '</div>';

    body += '<div class="sec"><h3>Measures \u2014 Energy Efficiency</h3>' + measTable + '</div>';
    body += '<div class="sec"><h3>Measures \u2014 Health & Safety</h3>' + hsTable + '</div>';

    body += '<div class="sec"><h3>Insulation Quantities</h3><div class="grid">';
    ["Attic (0-R11)","Attic (R12-19)","Basement Wall","Crawl Space Wall","Knee Wall","Floor Above Crawl","Rim Joist","Injection Foam Walls"].forEach(function(m) { body += R(m, (s.insulQty?.[m]||"\u2014") + " " + (m.includes("Rim Joist")?"LnFt":"SqFt")); });
    body += '</div></div>';

    body += '<div class="sec"><h3>Notes on Work</h3><p style="color:#333">'+(p.measureNotes||"\u2014")+'</p></div>';
    body += '<div class="sec"><h3>Notes on Health & Safety</h3><p style="color:#333">'+(s.hsNotes||"\u2014")+'</p></div>';

    const html = `<!DOCTYPE html><html><head><title>HEA/IE Retrofit Form — ${p.customerName}</title><style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:16px;font-size:11px}h1{font-size:16px;border-bottom:2px solid #333;padding-bottom:6px}h2{font-size:11px;color:#666;margin-bottom:12px}.sec{margin-bottom:10px;border:1px solid #ddd;border-radius:5px;padding:8px}.sec h3{font-size:12px;margin:0 0 6px;border-bottom:1px solid #eee;padding-bottom:3px}.row{display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f5f5f5}.lbl{color:#666}.val{font-weight:600}.grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px}</style></head><body>
      <h1>2026 HEA / IE Retrofit Form</h1><h2>${p.customerName} · ${p.address} · RISE: ${p.riseId||"—"} · ${new Date().toLocaleDateString()}</h2>${body}</body></html>`;
    return html;
  };

  return { getScopeHTML };
}
