﻿import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function ScopeTab({p,u,onLog}) {
  const s = p.scope2026 || {};
  const a = p.audit || {};
  const ss = (k,v) => u({scope2026:{...s,[k]:v}});
  const sn = (sec,k,v) => u({scope2026:{...s,[sec]:{...(s[sec]||{}),[k]:v}}});
  const tog = (list,m) => { const l = p[list].includes(m) ? p[list].filter(x=>x!==m) : [...p[list],m]; u({[list]:l}); };

  // Auto-fill scope from assessment (always overwrites)
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (filled || !a) return;
    const updates = {};
    const nested = {};
    // Roof age
    if (a.roofAge) updates.roofAge = a.roofAge;
    // Tenant type (map: Ownedâ†’Own, Rentedâ†’Rent)
    if (a.tenantType) updates.tenantType = a.tenantType === "Owned" ? "Own" : a.tenantType === "Rented" ? "Rent" : a.tenantType;
    // Thermostat (map: Non-programmableâ†’Manual)
    if (a.thermostatType) {
      nested.htg = {...(s.htg||{}), thermostat: a.thermostatType === "Non-programmable" ? "Manual" : a.thermostatType};
    }
    // Ceiling / wall conditions
    if (a.ceilingCond) updates.ceilingCond = a.ceilingCond;
    if (a.wallCond) updates.wallCond = a.wallCond;
    if (a.wallsNeedInsul) updates.wallsNeedInsul = a.wallsNeedInsul;
    // Bedrooms
    if (a.bedrooms) updates.bedrooms = a.bedrooms;
    // Fan flows â†’ ASHRAE
    const ash = s.ashrae || {};
    const ashUp = {};
    if (a.bathFan1) ashUp.bath1CFM = a.bathFan1;
    if (a.bathFan2) ashUp.bath2CFM = a.bathFan2;
    if (a.bathFan3) ashUp.bath3CFM = a.bathFan3;
    if (a.kitchenFan) ashUp.kitchenCFM = a.kitchenFan;
    if (Object.keys(ashUp).length) nested.ashrae = {...ash, ...ashUp};
    // Smoke / CO
    if (a.smokePresent) updates.smokePresent = a.smokePresent;
    if (a.smokeNeeded) updates.smokeNeeded = a.smokeNeeded;
    if (a.coPresent) updates.coPresent = a.coPresent;
    if (a.coNeeded) updates.coNeeded = a.coNeeded;
    // Weatherization
    if (a.tenmats) updates.tenmats = a.tenmats;
    if (a.doorSweeps) updates.doorSweeps = a.doorSweeps;
    // Occupants (shared on p)
    if (a.occupants) u({occupants: a.occupants});

    if (Object.keys(updates).length || Object.keys(nested).length) {
      u({scope2026:{...s, ...updates, ...nested}});
    }
    setFilled(true);
  }, []);

  const getScopeHTML = () => {
    const yn = v => v===true?"Yes":v===false?"No":"â€”";
    const v = k => s[k]||"â€”";
    const nv = (sec,k) => s[sec]?.[k]||"â€”";
    const nyn = (sec,k) => s[sec]?.[k]===true?"Yes":s[sec]?.[k]===false?"No":"â€”";

    const mq = p.measureQty||{};
    const measTable = p.measures.length ? `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">\n<tr style="background:#f0fdf4;"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Unit</th></tr>\n${p.measures.map(m=>`<tr><td style="padding:3px 6px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${getResolvedQty(p,m)||"â€”"}</td><td style="padding:3px 6px;border:1px solid #ddd">${measUnit(m)}</td></tr>`).join("")}\n</table>` : "<span style='color:#999'>None selected</span>";
    const hsTable = p.healthSafety.length ? `<table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">\n<tr style="background:#fffbeb;"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Unit</th></tr>\n${p.healthSafety.map(m=>`<tr><td style="padding:3px 6px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${getResolvedQty(p,m)||"â€”"}</td><td style="padding:3px 6px;border:1px solid #ddd">ea</td></tr>`).join("")}\n</table>` : "<span style='color:#999'>None selected</span>";

    const chk = b => b===true?"â˜‘":b===false?"â˜":"â€”";
    const htg = s.htg||{}; const clg = s.clg||{}; const dhw = s.dhw||{};
    const int2 = s.int||{}; const exh = s.exh||{}; const att = s.attic||{};
    const col = s.collar||{}; const oc = s.outerCeiling||{}; const kw = s.kneeWall||{};
    const ew1 = s.extWall1||{}; const ew2 = s.extWall2||{}; const fnd = s.fnd||{};
    const afue = htg.btuIn && htg.btuOut ? (Number(htg.btuOut)/Number(htg.btuIn)*100).toFixed(1)+"%" : "â€”";

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



    const html = `<!DOCTYPE html><html><head><title>HEA/IE Retrofit Form â€” ${p.customerName}</title><style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:16px;font-size:11px}h1{font-size:16px;border-bottom:2px solid #333;padding-bottom:6px}h2{font-size:11px;color:#666;margin-bottom:12px}.sec{margin-bottom:10px;border:1px solid #ddd;border-radius:5px;padding:8px}.sec h3{font-size:12px;margin:0 0 6px;border-bottom:1px solid #eee;padding-bottom:3px}.row{display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f5f5f5}.lbl{color:#666}.val{font-weight:600}.grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px}</style></head><body>
      <h1>2026 HEA / IE Retrofit Form</h1><h2>${p.customerName} · ${p.address} · RISE: ${p.riseId||"â€”"} · ${new Date().toLocaleDateString()}</h2>${body}</body></html>`;
    return html;
  };

  return (
    <div id="scope-print-content">
      <Sec title="ðŸ“‹ 2026 HEA/IE Retrofit Form">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Scope of Work â€” submit to RISE for approval</p>
          <div style={{display:"flex",gap:6}}>
            <button type="button" style={{...S.ghost,padding:"4px 10px",fontSize:10,color:"#60A5FA",borderColor:"rgba(37,99,235,.3)"}} onClick={()=>{
              const conf = confirm("Re-fill scope fields from assessment data? This will overwrite current values.");
              if(conf){setFilled(false);}
            }}>â†» Sync from Assessment</button>
            <PrintBtn onClick={()=>printScope(p,s)}/>
          </div>
        </div>
        {!filled && <div style={{fontSize:10,color:"#22c55e",marginTop:4}}>âœ“ Auto-filled empty fields from assessment data</div>}
      </Sec>

      {/* â•â• PAGE 1: BUILDING PROPERTY TYPE â•â• */}
      <Sec title="Building Property Type">
        <Gr>
          <Sel label="Style" value={s.style||""} onChange={v=>ss("style",v)} opts={["Single Family, Detached","Townhouse, Single Unit","Duplex, Single Unit","Multi-Family (Any Type), Multiple Units","Mobile Home","Multi-Family 3+ Units, Single Tenant Unit","Condo 3+ Units, Single Unit","Condo 3+ Units, Common Area","2-Flat","Apartment","Manufactured Home"]}/>
          <F label="Year Built" value={p.yearBuilt} onChange={v=>u({yearBuilt:v})} num/>
          <F label="Stories" value={p.stories} onChange={v=>u({stories:v})} num/>
          <F label="Bedrooms" value={s.bedrooms||""} onChange={v=>ss("bedrooms",v)} num/>
          <F label="Occupants" value={p.occupants} onChange={v=>u({occupants:v})} num/>
          <F label="Sq Footage" value={p.sqft} onChange={v=>u({sqft:v})} num/>
          <div style={{display:"flex",flexDirection:"column"}}><label style={S.fl}>Volume</label><div style={{...S.inp,background:"rgba(37,99,235,.08)",color:"#93C5FD",display:"flex",alignItems:"center",marginTop:"auto"}}>{Number(p.sqft) ? (Number(p.sqft)*8).toLocaleString() : "â€”"}<span style={{fontSize:10,color:"#64748b",marginLeft:6}}>ft³ (sqft Ã— 8)</span></div></div>
          <F label="Home Age" computed={p.yearBuilt ? (new Date().getFullYear() - Number(p.yearBuilt)) + " yrs" : "â€”"} suffix="auto"/>
          <Sel label="Tenant Type" value={s.tenantType||""} onChange={v=>ss("tenantType",v)} opts={["Own","Rent"]}/>
        </Gr>
        <div style={{marginTop:8,fontSize:11,fontWeight:600,color:"#60A5FA",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Gutters</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.gutterExist} onChange={v=>ss("gutterExist",v)} label="Gutters Exist"/>
          <CK checked={s.downspouts} onChange={v=>ss("downspouts",v)} label="Downspouts"/>
          <CK checked={s.gutterRepair} onChange={v=>ss("gutterRepair",v)} label="Repairs Needed"/>
        </div>
        <div style={{marginTop:8,fontSize:11,fontWeight:600,color:"#60A5FA",marginBottom:4,textTransform:"uppercase",letterSpacing:".05em"}}>Roof</div>
        <Gr>
          <Sel label="Condition" value={s.roofCondition||""} onChange={v=>ss("roofCondition",v)} opts={["Good","Average","Poor"]}/>
          <Sel label="Type" value={s.roofType||""} onChange={v=>ss("roofType",v)} opts={["Architecture","3-Tab","Flat"]}/>
          <F label="Approx. Age" value={s.roofAge||""} onChange={v=>ss("roofAge",v)} num/>
        </Gr>
        <div style={{marginTop:4}}><CK checked={s.roofRepair} onChange={v=>ss("roofRepair",v)} label="Roof Repairs Needed"/></div>
        <div style={{marginTop:4,display:"flex",alignItems:"center",gap:12}}>
          <CK checked={s.highRoofVent} onChange={v=>ss("highRoofVent",v)} label="High Roof Venting"/>
          {s.highRoofVent && <div style={{width:140}}><Sel label="Vent Type" value={s.ventType||""} onChange={v=>ss("ventType",v)} opts={["Static","Ridge"]}/></div>}
        </div>
        <textarea style={{...S.ta,marginTop:8}} value={s.propNotes||""} onChange={e=>ss("propNotes",e.target.value)} rows={2} placeholder="Building property notesâ€¦"/>
      </Sec>

      {/* â•â• INTERIOR CONDITIONS (from assessment) â•â• */}
      <Sec title={<span>Interior Conditions {a.ceilingCond && <span style={{fontSize:9,color:"#60A5FA",fontWeight:400}}> · assessment values auto-filled</span>}</span>}>
        <Gr>
          <Sel label="Ceiling Conditions" value={s.ceilingCond||""} onChange={v=>ss("ceilingCond",v)} opts={["Good","Poor"]}/>
          <Sel label="Wall Conditions" value={s.wallCond||""} onChange={v=>ss("wallCond",v)} opts={["Good","Fair","Poor"]}/>
          <Sel label="Walls Need Insulation?" value={s.wallsNeedInsul||""} onChange={v=>ss("wallsNeedInsul",v)} opts={["Yes","No","Other"]}/>
        </Gr>
      </Sec>

      {/* â•â• SMOKE / CO / WEATHERIZATION â•â• */}
      <Sec title="Smoke / CO / Weatherization">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <F label="Smoke â€” present" value={s.smokePresent||""} onChange={v=>ss("smokePresent",v)} num/>
          <F label="Smoke â€” to install" value={s.smokeNeeded||""} onChange={v=>ss("smokeNeeded",v)} num/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6}}>
          <F label="CO â€” present" value={s.coPresent||""} onChange={v=>ss("coPresent",v)} num/>
          <F label="CO â€” to install" value={s.coNeeded||""} onChange={v=>ss("coNeeded",v)} num/>
        </div>
        <div style={{marginTop:8}}><Gr>
          <F label="Tenmats Needed" value={s.tenmats||""} onChange={v=>ss("tenmats",v)} num/>
          <F label="Doors Need Sweeps/WS" value={s.doorSweeps||""} onChange={v=>ss("doorSweeps",v)} num/>
        </Gr></div>
      </Sec>

      {/* â•â• PAGE 2: HEATING SYSTEM â•â• */}
      <Sec title="Heating System Info">
        <Gr>
          <Sel label="Thermostat" value={s.htg?.thermostat||""} onChange={v=>sn("htg","thermostat",v)} opts={["Manual","Programmable","Smart"]}/>
          <Sel label="Fuel Type" value={s.htg?.fuel||""} onChange={v=>sn("htg","fuel",v)} opts={["Natural Gas","Electric","Propane","Oil","Other"]}/>
          <Sel label="System Type" value={s.htg?.system||""} onChange={v=>sn("htg","system",v)} opts={["Forced Air","Boiler","Other"]}/>
          <Sel label="Flue Condition" value={s.htg?.flue||""} onChange={v=>sn("htg","flue",v)} opts={["Good","Average","Poor"]}/>
        </Gr>
        <div style={{marginTop:8}}><Gr>
          <F label="Manufacturer" value={s.htg?.mfg||""} onChange={v=>sn("htg","mfg",v)}/>
          <F label="Install Year" value={s.htg?.year||""} onChange={v=>sn("htg","year",v)} num/>
          <F label="Age" computed={s.htg?.year ? (new Date().getFullYear()-Number(s.htg.year))+" yrs" : "â€”"}/>
          <F label="Condition" value={s.htg?.condition||""} onChange={v=>sn("htg","condition",v)}/>
        </Gr></div>
        <div style={{marginTop:8}}><Gr>
          <F label="BTU Input" value={s.htg?.btuIn||""} onChange={v=>sn("htg","btuIn",v)} num/>
          <F label="BTU Output" value={s.htg?.btuOut||""} onChange={v=>sn("htg","btuOut",v)} num/>
          <F label="AFUE" computed={s.htg?.btuIn && s.htg?.btuOut ? (Number(s.htg.btuOut)/Number(s.htg.btuIn)*100).toFixed(1)+"%" : "â€”"} suffix="auto"/>
          <F label="Draft" value={s.htg?.draft||""} onChange={v=>sn("htg","draft",v)} num/>
        </Gr></div>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.htg?.gasShutoff} onChange={v=>sn("htg","gasShutoff",v)} label="Gas Shut Off"/>
          <CK checked={s.htg?.asbestosPipes} onChange={v=>sn("htg","asbestosPipes",v)} label="Pipes Asbestos Wrapped"/>
          <CK checked={s.htg?.replaceRec} onChange={v=>sn("htg","replaceRec",v)} label="Replacement Recommended"/>
          {(()=>{
            const yr = Number(s.htg?.year||0);
            const age = yr ? new Date().getFullYear() - yr : 0;
            const autoOn = age > 3 && s.htg?.fuel==="Natural Gas" && !s.htg?.replaceRec;
            const val = s.htg?.cleanTuneOverride !== undefined ? s.htg.cleanTuneOverride : (autoOn || !!s.htg?.cleanTune);
            return <div style={{display:"flex",alignItems:"center",gap:4}}>
              <CK checked={val} onChange={v=>{u({scope2026:{...s,htg:{...(s.htg||{}),cleanTune:v,cleanTuneOverride:v}}});}} label="Clean & Tune"/>
              {autoOn && s.htg?.cleanTuneOverride===undefined && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
              {s.htg?.cleanTuneOverride!==undefined && autoOn && <span style={{fontSize:8,color:"#60A5FA",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{u({scope2026:{...s,htg:{...(s.htg||{}),cleanTuneOverride:undefined,cleanTune:true}}});}}>â†» auto</span>}
            </div>;
          })()}
        </div>
        <textarea style={{...S.ta,marginTop:8}} value={s.htg?.notes||""} onChange={e=>sn("htg","notes",e.target.value)} rows={2} placeholder="Heating notesâ€¦"/>
        {(()=>{
          const recs = [];
          const afue = s.htg?.btuIn && s.htg?.btuOut ? Number(s.htg.btuOut)/Number(s.htg.btuIn)*100 : null;
          const fuel = s.htg?.fuel; const sys = s.htg?.system;
          if(fuel==="Electric") recs.push({t:"rec",m:"Electric resistance heat â†’ eligible for heat pump replacement regardless of age/condition (ComEd)."});
          if(afue && afue < PROGRAM.furnaceMinAFUE && fuel==="Natural Gas") recs.push({t:"info",m:`AFUE ${afue.toFixed(1)}% â€” below ${PROGRAM.furnaceMinAFUE}% min for new furnace. Replacement only if failed/H&S risk and repair >$${PROGRAM.furnaceRepairCap}.`});
          if(afue && afue >= PROGRAM.furnaceMinAFUE) recs.push({t:"rec",m:`AFUE ${afue.toFixed(1)}% meets â‰¥${PROGRAM.furnaceMinAFUE}% program standard.`});
          if(sys==="Boiler" && afue && afue < PROGRAM.boilerMinAFUE) recs.push({t:"info",m:`Boiler AFUE ${afue.toFixed(1)}% â€” new boiler must be â‰¥${PROGRAM.boilerMinAFUE}%. Emergency replacement only.`});
          const furnAge = Number(s.htg?.year||0) ? new Date().getFullYear() - Number(s.htg.year) : 0;
          if(furnAge > 3 && fuel==="Natural Gas" && !s.htg?.replaceRec) recs.push({t:"rec",m:`Furnace is ${furnAge} yrs old (>3 yrs) â†’ Clean & Tune auto-selected per program rules.`});
          if(s.htg?.cleanTune && fuel==="Natural Gas") recs.push({t:"info",m:`Furnace tune-up: must not have had tune-up within last 3 years.`});
          if(s.htg?.replaceRec && sys==="Boiler") recs.push({t:"rec",m:"System is Boiler â†’ Boiler Replacement will be auto-selected in measures (not Furnace Replacement)."});
          if(s.htg?.replaceRec && sys!=="Boiler") recs.push({t:"rec",m:"System is Forced Air â†’ Furnace Replacement will be auto-selected in measures. New furnace must be â‰¥95% AFUE."});
          if(sys==="Boiler" && p.measures.includes("Furnace Replacement")) recs.push({t:"flag",m:"âš  Furnace Replacement is checked but system is Boiler â€” should be Boiler Replacement."});
          if(sys!=="Boiler" && sys && p.measures.includes("Boiler Replacement")) recs.push({t:"flag",m:"âš  Boiler Replacement is checked but system is not a Boiler â€” should be Furnace Replacement."});
          return recs.map((r,i)=><Rec key={i} type={r.t}>{r.m}</Rec>);
        })()}
      </Sec>

      {/* â•â• PAGE 2: COOLING SYSTEM â•â• */}
      <Sec title="Cooling System Info">
        <Gr>
          <Sel label="Type" value={s.clg?.type||""} onChange={v=>sn("clg","type",v)} opts={["Central Air","Window Units","Mini Split","Heat Pump","None"]}/>
          <F label="Manufacturer" value={s.clg?.mfg||""} onChange={v=>sn("clg","mfg",v)}/>
          <F label="Install Year" value={s.clg?.year||""} onChange={v=>sn("clg","year",v)} num/>
          <F label="Age" computed={s.clg?.year ? (new Date().getFullYear()-Number(s.clg.year))+" yrs" : (s.clg?.age ? s.clg.age+" yrs" : "â€”")}/>
          <F label="SEER" value={s.clg?.seer||""} onChange={v=>sn("clg","seer",v)} num/>
          <F label="Condition" value={s.clg?.condition||""} onChange={v=>sn("clg","condition",v)}/>
          <Sel label="BTU Size" value={s.clg?.btu||""} onChange={v=>sn("clg","btu",v)} opts={["2 Ton (24k)","2.5 Ton (30k)","3 Ton (36k)","3.5 Ton (42k)"]}/>
        </Gr>
        <div style={{marginTop:6}}><CK checked={s.clg?.replaceRec} onChange={v=>sn("clg","replaceRec",v)} label="Replacement Recommended"/></div>
        {s.clg?.replaceRec && <div style={{marginTop:4}}><F label="Reason" value={s.clg?.replaceReason||""} onChange={v=>sn("clg","replaceReason",v)}/></div>}
      </Sec>

      {/* â•â• PAGE 2: DOMESTIC HOT WATER â•â• */}
      <Sec title="Domestic Hot Water Info">
        <Gr>
          <Sel label="Fuel" value={s.dhw?.fuel||""} onChange={v=>sn("dhw","fuel",v)} opts={["Natural Gas","Electric","Propane","Other"]}/>
          <Sel label="System Type" value={s.dhw?.system||""} onChange={v=>sn("dhw","system",v)} opts={["On Demand","Storage Tank","Indirect","Heat Pump","Other"]}/>
          <F label="Manufacturer" value={s.dhw?.mfg||""} onChange={v=>sn("dhw","mfg",v)}/>
          <F label="Install Year" value={s.dhw?.year||""} onChange={v=>sn("dhw","year",v)} num/>
          <F label="Age" computed={s.dhw?.year ? (new Date().getFullYear()-Number(s.dhw.year))+" yrs" : (s.dhw?.age ? s.dhw.age+" yrs" : "â€”")}/>
          <F label="Condition" value={s.dhw?.condition||""} onChange={v=>sn("dhw","condition",v)}/>
          <F label="Input BTU" value={s.dhw?.btuIn||""} onChange={v=>sn("dhw","btuIn",v)} num/>
          {(()=>{
            const key = `${s.dhw?.fuel||""}|${s.dhw?.system||""}`;
            const eff = PROGRAM.dhwEff[key];
            const btuIn = Number(s.dhw?.btuIn);
            const autoOut = eff && btuIn ? Math.round(btuIn * eff / 100) : null;
            return <>
              <F label="Output BTU" computed={autoOut ? autoOut.toLocaleString() : "â€”"} suffix={eff ? `${eff}% avg` : "select fuel+type"}/>
              <F label="Efficiency" computed={eff ? eff+"%" : "â€”"} suffix={eff ? `${s.dhw?.fuel} ${s.dhw?.system}` : "auto"}/>
            </>;
          })()}
        </Gr>
        {(()=>{
          const recs = [];
          const fuel = s.dhw?.fuel; const sys = s.dhw?.system;
          if(fuel==="Electric" && sys!=="Heat Pump") recs.push({t:"rec",m:"Electric resistance â†’ eligible for Heat Pump WH replacement regardless of age/condition (ComEd). Must be Energy Star rated."});
          if(fuel==="Electric" && sys==="Heat Pump") recs.push({t:"info",m:"Heat Pump WH already installed â€” no replacement needed."});
          const key = `${fuel||""}|${sys||""}`;
          const eff = PROGRAM.dhwEff[key];
          if(fuel==="Natural Gas" && eff && eff/100 < PROGRAM.dhwMinEF) recs.push({t:"warn",m:`Avg efficiency ${eff}% (EF ~${(eff/100).toFixed(2)}) is below program minimum EF â‰¥0.67. If failed/H&S risk and repair >$650 â†’ eligible for replacement.`});
          if(fuel==="Natural Gas" && eff && eff/100 >= PROGRAM.dhwMinEF) recs.push({t:"info",m:`Avg efficiency meets program minimum EF â‰¥0.67. Replacement only if failed/H&S and repair >$650.`});
          return recs.map((r,i)=><Rec key={i} type={r.t}>{r.m}</Rec>);
        })()}
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.dhw?.insulPipes} onChange={v=>sn("dhw","insulPipes",v)} label="Insulated Pipes"/>
          <CK checked={s.dhw?.flueRepair} onChange={v=>sn("dhw","flueRepair",v)} label="Flue Repair Needed"/>
          <CK checked={s.dhw?.replaceRec} onChange={v=>sn("dhw","replaceRec",v)} label="Replacement Recommended"/>
          <CK checked={s.dhw?.ductsSealed} onChange={v=>sn("dhw","ductsSealed",v)} label="Ducts Need Sealing"/>
        </div>
        {s.dhw?.replaceRec && <div style={{marginTop:6}}><F label="Reason" value={s.dhw?.replaceReason||""} onChange={v=>sn("dhw","replaceReason",v)}/></div>}
      </Sec>

      {/* â•â• PAGE 3: INTERIOR INSPECTION â•â• */}
      <Sec title="Interior Inspection">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.int?.mold} onChange={v=>sn("int","mold",v)} label="Mold"/>
          <CK checked={s.int?.moisture} onChange={v=>sn("int","moisture",v)} label="Moisture Problems"/>
          <CK checked={s.int?.knobTube} onChange={v=>sn("int","knobTube",v)} label="Live Knob & Tube"/>
          <CK checked={s.int?.electrical} onChange={v=>sn("int","electrical",v)} label="Electrical Issues"/>
          <CK checked={s.int?.brokenGlass} onChange={v=>sn("int","brokenGlass",v)} label="Broken Glass"/>
          <CK checked={s.int?.vermiculite} onChange={v=>sn("int","vermiculite",v)} label="Vermiculite/Asbestos"/>
          <CK checked={s.int?.waterLeaks} onChange={v=>sn("int","waterLeaks",v)} label="Water Leaks"/>
          <CK checked={s.int?.roofLeaks} onChange={v=>sn("int","roofLeaks",v)} label="Roof Leaks"/>
        </div>
        {(s.int?.waterLeaks || s.int?.roofLeaks) && <div style={{marginTop:6}}><Gr>
          {s.int?.waterLeaks && <F label="Water Leak Location" value={s.int?.waterLoc||""} onChange={v=>sn("int","waterLoc",v)}/>}
          {s.int?.roofLeaks && <F label="Roof Leak Location" value={s.int?.roofLoc||""} onChange={v=>sn("int","roofLoc",v)}/>}
        </Gr></div>}
        <div style={{marginTop:8}}><Gr>
          <Sel label="Ceiling Condition" value={s.int?.ceiling||""} onChange={v=>sn("int","ceiling",v)} opts={["Good","Poor"]}/>
          <Sel label="Wall Condition" value={s.int?.wall||""} onChange={v=>sn("int","wall",v)} opts={["Good","Poor"]}/>
        </Gr></div>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.int?.droppedCeiling} onChange={v=>sn("int","droppedCeiling",v)} label="Dropped Ceiling"/>
          <CK checked={s.int?.drywallRepair} onChange={v=>sn("int","drywallRepair",v)} label="Drywall Repair"/>
          <CK checked={s.int?.recessedLight} onChange={v=>sn("int","recessedLight",v)} label="Recessed Lighting"/>
          <CK checked={s.int?.coDetector} onChange={v=>sn("int","coDetector",v)} label="CO Detector"/>
          <CK checked={s.int?.smokeDetector} onChange={v=>sn("int","smokeDetector",v)} label="Smoke Detector"/>
        </div>
        {s.int?.recessedLight && <div style={{marginTop:6}}><F label="Recessed Lighting Location" value={s.int?.recessedLoc||""} onChange={v=>sn("int","recessedLoc",v)}/></div>}
        {s.int?.knobTube && <Rec type="flag">LIVE KNOB & TUBE â€” insulation CANNOT proceed in affected areas until remediated by licensed electrician.</Rec>}
        {s.int?.vermiculite && <Rec type="flag">VERMICULITE/ASBESTOS â€” do NOT disturb. Abatement required before insulation. May use estimated blower door only.</Rec>}
        {s.int?.mold && <Rec type="flag">MOLD PRESENT â€” mold remediation must be completed before insulation work can begin.</Rec>}
        {s.htg?.asbestosPipes && <Rec type="flag">ASBESTOS-WRAPPED PIPES â€” do not disturb. Abatement may be required.</Rec>}
      </Sec>

      {/* â•â• PAGE 3: DOOR TYPES / EXHAUST VENTING â•â• */}
      <Sec title="Door Types / Exhaust Venting">
        <div style={{fontSize:11,fontWeight:600,color:"#60A5FA",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Weather Strips / Door Sweeps</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0px 8px"}}>
          {["Front","Back","Basement","Attic"].map(d=>(
            <CK key={d} checked={s.doors?.[d]} onChange={v=>sn("doors",d,v)} label={`${d} â€” Existing`}/>
          ))}
        </div>
        <div style={{maxWidth:200}}><F label="Total Strips/Sweeps Needed" value={s.totalSweeps||""} onChange={v=>ss("totalSweeps",v)}/></div>
        <div style={{marginTop:10,fontSize:11,fontWeight:600,color:"#60A5FA",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Exhaust</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.exh?.fanReplace} onChange={v=>sn("exh","fanReplace",v)} label="Exhaust Fan Replacement"/>
          <CK checked={s.exh?.bathFanLight} onChange={v=>sn("exh","bathFanLight",v)} label="Bath Fan w/ Light"/>
          <CK checked={s.exh?.ventKit} onChange={v=>sn("exh","ventKit",v)} label="Vent Kit Needed"/>
          <CK checked={s.exh?.termCap} onChange={v=>sn("exh","termCap",v)} label="Termination Cap Needed"/>
          <CK checked={s.exh?.dryerProper} onChange={v=>sn("exh","dryerProper",v)} label="Dryer Vented Properly"/>
          <CK checked={s.exh?.dryerRepair} onChange={v=>sn("exh","dryerRepair",v)} label="Dryer Vent Repair"/>
        </div>
        <div style={{marginTop:8}}><Gr>
          <F label="Blower Door In" value={s.exh?.bdIn||""} onChange={v=>sn("exh","bdIn",v)}/>
          <F label="Blower Door Out" value={s.exh?.bdOut||""} onChange={v=>sn("exh","bdOut",v)}/>
        </Gr></div>
        <div style={{marginTop:6}}><CK checked={s.exh?.noBD} onChange={v=>sn("exh","noBD",v)} label="No blower door â€” estimated (asbestos/vermiculite ONLY)"/></div>
        <textarea style={{...S.ta,marginTop:6}} value={s.exh?.notes||""} onChange={e=>sn("exh","notes",e.target.value)} rows={2} placeholder="Notesâ€¦"/>
      </Sec>

      {/* â•â• PAGE 4: ATTIC â•â• */}
      <Sec title="Attic">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0px 8px",marginBottom:8}}>
          <CK checked={s.attic?.finished} onChange={v=>sn("attic","finished",v)} label="Finished"/>
          <CK checked={s.attic?.unfinished} onChange={v=>sn("attic","unfinished",v)} label="Unfinished"/>
          <CK checked={s.attic?.flat} onChange={v=>sn("attic","flat",v)} label="Flat"/>
        </div>
        <Gr><F label="Sq Footage" value={s.attic?.sqft||""} onChange={v=>sn("attic","sqft",v)} num/><F label="Existing R-Value" value={s.attic?.preR||""} onChange={v=>sn("attic","preR",v)} num/><F label="R-Value to Add" value={s.attic?.addR||""} onChange={v=>sn("attic","addR",v)} num/><F label="Total R" computed={s.attic?.preR||s.attic?.addR ? "R-"+(Number(s.attic?.preR||0)+Number(s.attic?.addR||0)) : "â€”"} suffix="auto"/></Gr>
        <div style={{marginTop:8}}><Gr>
          <F label="Recessed Lighting Qty" value={s.attic?.recessQty||""} onChange={v=>sn("attic","recessQty",v)}/>
          <F label="Storage Created" value={s.attic?.storage||""} onChange={v=>sn("attic","storage",v)} num/>
        </Gr></div>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.attic?.ductwork} onChange={v=>sn("attic","ductwork",v)} label="Ductwork Present"/>
          <CK checked={s.attic?.floorBoards} onChange={v=>sn("attic","floorBoards",v)} label="Floor Boards"/>
          <CK checked={s.attic?.moldPresent} onChange={v=>sn("attic","moldPresent",v)} label="Mold Present"/>
          <CK checked={s.attic?.vermPresent} onChange={v=>sn("attic","vermPresent",v)} label="Vermiculite Present"/>
          <CK checked={s.attic?.knobTube} onChange={v=>sn("attic","knobTube",v)} label="Knob & Tube"/>
        </div>
        {s.attic?.ductwork && <Gr><Sel label="Duct Condition" value={s.attic?.condition||""} onChange={v=>sn("attic","condition",v)} opts={["Good","Poor"]}/><F label="Duct LnFt to Air Seal" value={s.attic?.lnftAirSeal||""} onChange={v=>sn("attic","lnftAirSeal",v)} num/></Gr>}
        <div style={{marginTop:6}}><Gr>
          <F label="Existing Ventilation" value={s.attic?.existVent||""} onChange={v=>sn("attic","existVent",v)}/>
          <F label="Needed Ventilation" value={s.attic?.needVent||""} onChange={v=>sn("attic","needVent",v)}/>
          <F label="Access Location" value={s.attic?.accessLoc||""} onChange={v=>sn("attic","accessLoc",v)}/>
        </Gr></div>
        <textarea style={{...S.ta,marginTop:6}} value={s.attic?.notes||""} onChange={e=>sn("attic","notes",e.target.value)} rows={2} placeholder="Attic notesâ€¦"/>
        <InsulRec section="attic" preR={s.attic?.preR} addR={s.attic?.addR}/>
        {s.attic?.ceilingCond==="Poor" && <Rec type="warn">Poor ceiling condition â€” consider fiberglass instead of cellulose (cellulose weighs ~2x fiberglass for same R-value).</Rec>}
        {s.attic?.floorBoards && <Rec type="info">Floor boards present â€” dense pack at 3.5 lbs/ft³ unless homeowner agrees to remove flooring and blow to R-49.</Rec>}
        {s.attic?.knobTube && <Rec type="flag">KNOB & TUBE in attic â€” insulation CANNOT proceed until remediated by licensed electrician.</Rec>}
        {s.attic?.vermPresent && <Rec type="flag">VERMICULITE in attic â€” do NOT disturb. Abatement required before insulation.</Rec>}
        {s.attic?.moldPresent && <Rec type="flag">MOLD in attic â€” remediation required before insulation work.</Rec>}
      </Sec>

      {/* â•â• PAGE 4: COLLAR BEAM â•â• */}
      <Sec title="Collar Beam">
        <Gr><F label="Sq Footage" value={s.collar?.sqft||""} onChange={v=>sn("collar","sqft",v)} num/><F label="Pre-Existing R" value={s.collar?.preR||""} onChange={v=>sn("collar","preR",v)} num/><F label="R-Value to Add" value={s.collar?.addR||""} onChange={v=>sn("collar","addR",v)} num/><F label="Total R" computed={s.collar?.preR||s.collar?.addR ? "R-"+(Number(s.collar?.preR||0)+Number(s.collar?.addR||0)) : "â€”"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.collar?.accessible} onChange={v=>sn("collar","accessible",v)} label="Accessible"/>
          <CK checked={s.collar?.cutIn} onChange={v=>sn("collar","cutIn",v)} label="Cut In Needed"/>
          <CK checked={s.collar?.ductwork} onChange={v=>sn("collar","ductwork",v)} label="Ductwork"/>
        </div>
        {s.collar?.ductwork && <div style={{marginTop:6}}><Gr><Sel label="Condition" value={s.collar?.condition||""} onChange={v=>sn("collar","condition",v)} opts={["Good","Poor"]}/><F label="Ln Ft Air Seal" value={s.collar?.lnftAirSeal||""} onChange={v=>sn("collar","lnftAirSeal",v)} num/></Gr></div>}
        <InsulRec section="collar" preR={s.collar?.preR} addR={s.collar?.addR}/>
      </Sec>

      {/* â•â• PAGE 4: OUTER CEILING JOISTS â•â• */}
      <Sec title="Outer Ceiling Joists">
        <Gr><F label="Sq Ft" value={s.outerCeiling?.sqft||""} onChange={v=>sn("outerCeiling","sqft",v)} num/><F label="Pre-Existing R" value={s.outerCeiling?.preR||""} onChange={v=>sn("outerCeiling","preR",v)} num/><F label="R to Add" value={s.outerCeiling?.addR||""} onChange={v=>sn("outerCeiling","addR",v)} num/><F label="Total R" computed={s.outerCeiling?.preR||s.outerCeiling?.addR ? "R-"+(Number(s.outerCeiling?.preR||0)+Number(s.outerCeiling?.addR||0)) : "â€”"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.outerCeiling?.accessible} onChange={v=>sn("outerCeiling","accessible",v)} label="Accessible"/>
          <CK checked={s.outerCeiling?.cutIn} onChange={v=>sn("outerCeiling","cutIn",v)} label="Cut In"/>
          <CK checked={s.outerCeiling?.floorBoards} onChange={v=>sn("outerCeiling","floorBoards",v)} label="Floor Boards"/>
          <CK checked={s.outerCeiling?.ductwork} onChange={v=>sn("outerCeiling","ductwork",v)} label="Ductwork"/>
        </div>
        {s.outerCeiling?.ductwork && <div style={{marginTop:6}}><Gr><Sel label="Condition" value={s.outerCeiling?.condition||""} onChange={v=>sn("outerCeiling","condition",v)} opts={["Good","Poor"]}/><F label="Ln Ft Air Seal" value={s.outerCeiling?.lnftAirSeal||""} onChange={v=>sn("outerCeiling","lnftAirSeal",v)} num/></Gr></div>}
        <InsulRec section="outerCeiling" preR={s.outerCeiling?.preR} addR={s.outerCeiling?.addR}/>
      </Sec>

      <Sec title="Knee Walls">
        <Gr><F label="Sq Ft" value={s.kneeWall?.sqft||""} onChange={v=>sn("kneeWall","sqft",v)} num/><F label="Pre-Existing R" value={s.kneeWall?.preR||""} onChange={v=>sn("kneeWall","preR",v)} num/><F label="R to Add" value={s.kneeWall?.addR||""} onChange={v=>sn("kneeWall","addR",v)} num/><F label="Total R" computed={s.kneeWall?.preR||s.kneeWall?.addR ? "R-"+(Number(s.kneeWall?.preR||0)+Number(s.kneeWall?.addR||0)) : "â€”"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.kneeWall?.densePack} onChange={v=>sn("kneeWall","densePack",v)} label="Dense Pack"/>
          <CK checked={s.kneeWall?.rigidFoam} onChange={v=>sn("kneeWall","rigidFoam",v)} label="Rigid Foam Board"/>
          <CK checked={s.kneeWall?.tyvek} onChange={v=>sn("kneeWall","tyvek",v)} label="Tyvek Needed"/>
          <CK checked={s.kneeWall?.fgBatts} onChange={v=>sn("kneeWall","fgBatts",v)} label="Fiberglass Batts"/>
        </div>
        <div style={{marginTop:6}}><Sel label="Wall Type" value={s.kneeWall?.wallType||""} onChange={v=>sn("kneeWall","wallType",v)} opts={["Drywall","Plaster"]}/></div>
        {s.kneeWall?.tyvek && <div style={{marginTop:6}}><F label="Tyvek Sq Ft" value={s.kneeWall?.tyvekSqft||""} onChange={v=>sn("kneeWall","tyvekSqft",v)} num/></div>}
        <InsulRec section="kneeWall" preR={s.kneeWall?.preR} addR={s.kneeWall?.addR}/>
        {s.kneeWall?.preR && Number(s.kneeWall?.preR)===0 && <Rec type="info">Knee wall cavity must have no existing thermal resistance to qualify. Insulate to R-11 or greater (R-13+5 or R-20 preferred).</Rec>}
      </Sec>

      <Sec title="Exterior Walls — 1st Floor">
        <Gr><F label="Sq Ft" value={s.extWall1?.sqft||""} onChange={v=>sn("extWall1","sqft",v)} num/><F label="Pre-Existing R" value={s.extWall1?.preR||""} onChange={v=>sn("extWall1","preR",v)} num/><F label="R to Add" value={s.extWall1?.addR||""} onChange={v=>sn("extWall1","addR",v)} num/><F label="Win/Door SqFt" computed={s.extWall1?.sqft ? Math.round(Number(s.extWall1.sqft)*0.16) : "â€”"}/><F label="Total R" computed={s.extWall1?.preR||s.extWall1?.addR ? "R-"+(Number(s.extWall1?.preR||0)+Number(s.extWall1?.addR||0)) : "â€”"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.extWall1?.densePack} onChange={v=>sn("extWall1","densePack",v)} label="Dense Pack"/>
          <CK checked={s.extWall1?.phenolic} onChange={v=>sn("extWall1","phenolic",v)} label="Phenolic Foam"/>
        </div>
        <div style={{marginTop:6}}><Gr>
          <Sel label="Cladding" value={s.extWall1?.cladding||""} onChange={v=>sn("extWall1","cladding",v)} opts={["Vinyl","Masonry","Other"]}/>
          <Sel label="Insulate From" value={s.extWall1?.insulFrom||""} onChange={v=>sn("extWall1","insulFrom",v)} opts={["Interior","Exterior"]}/>
          <Sel label="Wall Type" value={s.extWall1?.wallType||""} onChange={v=>sn("extWall1","wallType",v)} opts={["Drywall","Plaster"]}/>
          <F label="Drilled Hole Location" value={s.extWall1?.drillLoc||""} onChange={v=>sn("extWall1","drillLoc",v)}/>
          {s.extWall1?.cladding==="Other"&&<F label="Other Cladding" value={s.extWall1?.otherClad||""} onChange={v=>sn("extWall1","otherClad",v)}/>}
        </Gr></div>
        <div style={{marginTop:4}}><CK checked={s.extWall1?.ownerPrep} onChange={v=>sn("extWall1","ownerPrep",v)} label="Informed owner about prep"/></div>
        <InsulRec section="extWall1" preR={s.extWall1?.preR} addR={s.extWall1?.addR}/>
        {s.extWall1?.preR && Number(s.extWall1.preR) > 0 && <Rec type="info">Walls may only be insulated if no existing insulation or existing is in poor condition.</Rec>}
      </Sec>

      <Sec title="Exterior Walls — 2nd Floor">
        <Gr><F label="Sq Ft" value={s.extWall2?.sqft||""} onChange={v=>sn("extWall2","sqft",v)} num/><F label="Pre-Existing R" value={s.extWall2?.preR||""} onChange={v=>sn("extWall2","preR",v)} num/><F label="R to Add" value={s.extWall2?.addR||""} onChange={v=>sn("extWall2","addR",v)} num/><F label="Win/Door SqFt" computed={s.extWall2?.sqft ? Math.round(Number(s.extWall2.sqft)*0.14) : "â€”"}/><F label="Total R" computed={s.extWall2?.preR||s.extWall2?.addR ? "R-"+(Number(s.extWall2?.preR||0)+Number(s.extWall2?.addR||0)) : "â€”"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.extWall2?.densePack} onChange={v=>sn("extWall2","densePack",v)} label="Dense Pack"/>
          <CK checked={s.extWall2?.phenolic} onChange={v=>sn("extWall2","phenolic",v)} label="Phenolic Foam"/>
        </div>
        <div style={{marginTop:6}}><Gr>
          <Sel label="Cladding" value={s.extWall2?.cladding||""} onChange={v=>sn("extWall2","cladding",v)} opts={["Vinyl","Masonry","Other"]}/>
          <Sel label="Insulate From" value={s.extWall2?.insulFrom||""} onChange={v=>sn("extWall2","insulFrom",v)} opts={["Interior","Exterior"]}/>
          <Sel label="Wall Type" value={s.extWall2?.wallType||""} onChange={v=>sn("extWall2","wallType",v)} opts={["Drywall","Plaster"]}/>
          <F label="Drilled Hole Location" value={s.extWall2?.drillLoc||""} onChange={v=>sn("extWall2","drillLoc",v)}/>
          {s.extWall2?.cladding==="Other"&&<F label="Other Cladding" value={s.extWall2?.otherClad||""} onChange={v=>sn("extWall2","otherClad",v)}/>}
        </Gr></div>
        <div style={{marginTop:4}}><CK checked={s.extWall2?.ownerPrep} onChange={v=>sn("extWall2","ownerPrep",v)} label="Informed owner about prep"/></div>
        <InsulRec section="extWall2" preR={s.extWall2?.preR} addR={s.extWall2?.addR}/>
      </Sec>

      <Sec title="Foundation / Crawl">
        <div style={{marginBottom:8}}><Sel label="Type" value={s.fnd?.type||""} onChange={v=>sn("fnd","type",v)} opts={["No Basement/Slab","Finished","Unfinished","w/ Framing"]}/></div>
        <Gr><F label="Above Grade SqFt" value={s.fnd?.aboveSqft||""} onChange={v=>sn("fnd","aboveSqft",v)} num/><F label="Below Grade SqFt" value={s.fnd?.belowSqft||""} onChange={v=>sn("fnd","belowSqft",v)} num/><F label="Pre-Existing R" value={s.fnd?.preR||""} onChange={v=>sn("fnd","preR",v)} num/></Gr>
        <div style={{marginTop:8}}><Sel label="Insulation Type" value={s.fnd?.insulType||""} onChange={v=>sn("fnd","insulType",v)} opts={["Fiberglass","Rigid Foam Board","None"]}/></div>
        <div style={{marginTop:8,fontSize:11,fontWeight:600,color:"#60A5FA",textTransform:"uppercase",letterSpacing:".05em"}}>Band Joists</div>
        <div style={{marginTop:4}}><CK checked={s.fnd?.bandAccess} onChange={v=>sn("fnd","bandAccess",v)} label="Access to Band Joists"/></div>
        {s.fnd?.bandAccess && <div style={{marginTop:4}}><Gr><F label="Linear Ft" value={s.fnd?.bandLnft||""} onChange={v=>sn("fnd","bandLnft",v)}/><F label="Pre-Existing R" value={s.fnd?.bandR||""} onChange={v=>sn("fnd","bandR",v)}/><Sel label="Insulation" value={s.fnd?.bandInsul||""} onChange={v=>sn("fnd","bandInsul",v)} opts={["Fiberglass","Rigid Foam Board","None"]}/></Gr></div>}

        <div style={{marginTop:10,fontSize:11,fontWeight:600,color:"#60A5FA",textTransform:"uppercase",letterSpacing:".05em"}}>Crawlspace</div>
        <div style={{marginTop:4,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.fnd?.vented} onChange={v=>sn("fnd","vented",v)} label="Vented"/>
          <CK checked={s.fnd?.vaporBarrier} onChange={v=>sn("fnd","vaporBarrier",v)} label="Vapor Barrier Needed"/>
          <CK checked={s.fnd?.waterIssues} onChange={v=>sn("fnd","waterIssues",v)} label="Water Issues"/>
          <CK checked={s.fnd?.crawlDuct} onChange={v=>sn("fnd","crawlDuct",v)} label="Ductwork"/>
        </div>
        <div style={{marginTop:6}}><Gr>
          <Sel label="Crawl Floor" value={s.fnd?.crawlFloor||""} onChange={v=>sn("fnd","crawlFloor",v)} opts={["Concrete","Dirt/Gravel"]}/>
          {s.fnd?.vented && <F label="# of Vents" value={s.fnd?.ventCount||""} onChange={v=>sn("fnd","ventCount",v)}/>}
          {s.fnd?.vaporBarrier && <F label="Barrier SqFt" value={s.fnd?.barrierSqft||""} onChange={v=>sn("fnd","barrierSqft",v)}/>}
          {s.fnd?.crawlDuct && <Sel label="Duct Condition" value={s.fnd?.ductCond||""} onChange={v=>sn("fnd","ductCond",v)} opts={["Good","Poor"]}/>}
        </Gr></div>
        <div style={{marginTop:6}}><Gr>
          <F label="Crawl Above Grade SqFt" value={s.fnd?.crawlAbove||""} onChange={v=>sn("fnd","crawlAbove",v)}/>
          <F label="Crawl Below Grade SqFt" value={s.fnd?.crawlBelow||""} onChange={v=>sn("fnd","crawlBelow",v)}/>
          <F label="Crawl Pre-Existing R" value={s.fnd?.crawlR||""} onChange={v=>sn("fnd","crawlR",v)}/>
        </Gr></div>
        <div style={{marginTop:6}}><CK checked={s.fnd?.crawlBandAccess} onChange={v=>sn("fnd","crawlBandAccess",v)} label="Crawl Band Joist Access"/></div>
        {s.fnd?.crawlBandAccess && <div style={{marginTop:4}}><Gr>
          <F label="Crawl Band LnFt" value={s.fnd?.crawlBandLnft||""} onChange={v=>sn("fnd","crawlBandLnft",v)}/>
          <F label="Crawl Band R" value={s.fnd?.crawlBandR||""} onChange={v=>sn("fnd","crawlBandR",v)}/>
          <Sel label="Crawl Band Insulation" value={s.fnd?.crawlBandInsul||""} onChange={v=>sn("fnd","crawlBandInsul",v)} opts={["Fiberglass","Rigid Foam Board","None"]}/>
        </Gr></div>}
        <div style={{marginTop:6}}><CK checked={s.fnd?.crawlWallsObstructed} onChange={v=>sn("fnd","crawlWallsObstructed",v)} label="Crawl walls insulated or obstructed already"/></div>
        <InsulRec section="fnd" preR={s.fnd?.preR} addR={null}/>
        {s.fnd?.preR && Number(s.fnd.preR) === 0 && <Rec type="rec">No existing basement wall insulation â†’ eligible. Bring to min R-10/13. Rigid foam board or batt insulation.</Rec>}
        {s.fnd?.preR && Number(s.fnd.preR) >= 10 && <Rec type="info">Existing R-{s.fnd.preR} â€” basement wall insulation not needed.</Rec>}
        {s.fnd?.bandAccess && Number(s.fnd?.bandR||0) === 0 && <Rec type="rec">Rim joist has no insulation â†’ insulate to min R-10. Batt insulation NOT allowed for rim joist.</Rec>}
        {s.fnd?.vaporBarrier && s.fnd?.crawlFloor==="Dirt/Gravel" && <Rec type="rec">Dirt/gravel crawl floor â€” vapor barrier (min 6 mil) required before wall insulation.</Rec>}
        {s.fnd?.crawlR !== undefined && Number(s.fnd?.crawlR||0) === 0 && <Rec type="rec">Crawlspace walls â†’ insulate to R-15/19 with rigid foam board or 2-part spray foam. No fibrous insulation on crawl walls.</Rec>}
        {s.fnd?.waterIssues && <Rec type="flag">Water issues present â€” must be resolved before insulation work can proceed.</Rec>}
      </Sec>

      <Sec title="Diagnostics">
        <Gr><F label="Pre CFM50" value={p.preCFM50} onChange={v=>u({preCFM50:v})} num/><F label="Ext Temp" value={s.extTemp||""} onChange={v=>ss("extTemp",v)} num/><Sel label="BD Location" value={p.bdLoc} onChange={v=>u({bdLoc:v})} opts={["Front","Side","Back"]}/></Gr>
        {(()=>{
          const cfm = Number(p.preCFM50); const sqft = Number(p.sqft);
          const recs = [];
          if(cfm && sqft) {
            const pct = cfm / sqft;
            if(pct >= PROGRAM.airSealMinCFM50pct) recs.push({t:"rec",m:`CFM50 ${cfm} is â‰¥110% of ${sqft} sqft (${(pct*100).toFixed(0)}%). Air sealing eligible.`});
            else recs.push({t:"warn",m:`CFM50 ${cfm} is ${(pct*100).toFixed(0)}% of sqft â€” below 110% threshold. Air sealing may not be eligible.`});
            const target25 = Math.round(cfm * 0.75);
            recs.push({t:"info",m:`25% reduction goal: post-CFM50 target â‰¤${target25}. Need to reduce by â‰¥${cfm - target25} CFM50.`});
          }
          return recs.map((r,i)=><Rec key={i} type={r.t}>{r.m}</Rec>);
        })()}
        <textarea style={{...S.ta,marginTop:6}} value={s.diagNotes||""} onChange={e=>ss("diagNotes",e.target.value)} rows={2} placeholder="Diagnostics notesâ€¦"/>
      </Sec>

      <Sec title="ASHRAE 62.2-2016 Ventilation">
        {(() => {
          const a = p.audit || {};
          const baseSqft = Number(p.sqft) || 0;
          const finBasement = s.fnd?.type === "Finished" ? (Number(s.fnd?.aboveSqft)||0) + (Number(s.fnd?.belowSqft)||0) : 0;
          const Afl = baseSqft + finBasement;
          const Nbr = Number(s.bedrooms) || 0;
          const preQ50 = Number(p.preCFM50) || 0;
          const sqft = Number(p.sqft) || 0;
          const canAirSeal = s.ashrae?.canAirSeal !== undefined ? s.ashrae.canAirSeal : (preQ50 > 0 && sqft > 0 && preQ50 >= sqft * PROGRAM.airSealMinCFM50pct);
          const Q50 = canAirSeal ? Math.round(preQ50 * (1 - PROGRAM.airSealGoal / 100)) : preQ50;
          const st = Number(p.stories) || 1;
          const H = st >= 2 ? 16 : st >= 1.5 ? 14 : 8;
          const Hr = 8.202;
          const wsf = 0.56;

          // Fan flows from assessment, overridable
          // Raw values to check presence (blank = no fan = no requirement)
          const kRaw = s.ashrae?.kitchenCFM ?? a.kitchenFan ?? "";
          const b1Raw = s.ashrae?.bath1CFM ?? a.bathFan1 ?? "";
          const b2Raw = s.ashrae?.bath2CFM ?? a.bathFan2 ?? "";
          const b3Raw = s.ashrae?.bath3CFM ?? a.bathFan3 ?? "";
          const kPresent = String(kRaw).trim() !== "";
          const b1Present = String(b1Raw).trim() !== "";
          const b2Present = String(b2Raw).trim() !== "";
          const b3Present = String(b3Raw).trim() !== "";
          const kCFM = Number(kRaw) || 0;
          const b1 = Number(b1Raw) || 0;
          const b2 = Number(b2Raw) || 0;
          const b3 = Number(b3Raw) || 0;
          const kWin = s.ashrae?.kWin || false;
          const b1Win = s.ashrae?.b1Win || false;
          const b2Win = s.ashrae?.b2Win || false;
          const b3Win = s.ashrae?.b3Win || false;

          /* â•â• ASHRAE 62.2-2016 CALCULATIONS â•â•
             Section 4.1.1 â€” Total Required Ventilation Rate
             Qtot = 0.03 Ã— Afl + 7.5 Ã— (Nbr + 1)
             (Nbr = number of bedrooms, Nocc = Nbr + 1)
             
             Infiltration Credit
             Qinf = 0.052 Ã— Q50 Ã— wsf Ã— (H / 8.2)^0.4
             
             Local Ventilation â€” Alternative Compliance:
             Intermittent exhaust rates: Kitchen 100 CFM, Bath 50 CFM
             Deficit = max(0, required - measured). Window = 20 CFM credit.
             Blank = no fan = no requirement.
             Alternative compliance supplement = totalDeficit Ã— 0.25
             (converts intermittent deficit to continuous equivalent)
             
             Qfan = Qtot + supplement - Qinf
          */

          // Infiltration credit
          const Qinf_eff = Q50 > 0 ? 0.052 * Q50 * wsf * Math.pow(H / 8.2, 0.4) : 0;

          // Qtot (Eq 4.1a)
          const Qtot = (Afl > 0) ? 0.03 * Afl + 7.5 * (Nbr + 1) : 0;

          // Local ventilation deficits â€” Alternative Compliance
          // Intermittent rates: Kitchen 100 CFM, Bath 50 CFM
          // Window = 20 CFM credit. Blank = no fan = no requirement.
          const kReq = kPresent ? 100 : 0;
          const b1Req = b1Present ? 50 : 0;
          const b2Req = b2Present ? 50 : 0;
          const b3Req = b3Present ? 50 : 0;
          const kDef = !kPresent ? 0 : Math.max(0, kReq - (kWin ? 20 : kCFM));
          const b1Def = !b1Present ? 0 : Math.max(0, b1Req - (b1Win ? 20 : b1));
          const b2Def = !b2Present ? 0 : Math.max(0, b2Req - (b2Win ? 20 : b2));
          const b3Def = !b3Present ? 0 : Math.max(0, b3Req - (b3Win ? 20 : b3));
          const totalDef = kDef + b1Def + b2Def + b3Def;

          // Alternative compliance supplement (intermittent â†’ continuous: Ã—0.25)
          const supplement = totalDef * 0.25;

          // Infiltration credit â€” existing: FULL credit
          const Qinf_credit = Qinf_eff;

          // Required mechanical ventilation rate
          const Qfan = Qtot + supplement - Qinf_credit;

          // Fan setting selector (continuous run: 50 / 80 / 110 CFM)
          const FAN_SETTINGS = [50, 80, 110];
          const recFan = FAN_SETTINGS.find(f => f >= Qfan) || FAN_SETTINGS[FAN_SETTINGS.length - 1];

          const R = v => Math.round(v * 100) / 100;
          const Ri = v => Math.round(v);

          // Styles
          const hdr = {fontSize:13,fontWeight:700,color:"#60A5FA",margin:"14px 0 6px",borderBottom:"1px solid rgba(37,99,235,.25)",paddingBottom:4};
          const row = {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",fontSize:12,borderBottom:"1px solid rgba(255,255,255,.04)"};
          const lbl = {color:"#94a3b8",flex:1};
          const val = {fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#e2e8f0",textAlign:"right"};
          const eq = {fontSize:10,color:"#475569",padding:"1px 0 5px 12px",fontFamily:"'JetBrains Mono',monospace",borderLeft:"2px solid rgba(37,99,235,.15)"};
          const autoBox = {background:"rgba(37,99,235,.06)",borderRadius:6,padding:"6px 10px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:13,color:"#e2e8f0",textAlign:"center"};
          const autoSub = {fontSize:9,color:"#64748b",textAlign:"center",marginTop:2};
          const resultBox = {background:"rgba(37,99,235,.08)",border:"2px solid rgba(37,99,235,.3)",borderRadius:8,padding:12,marginTop:8};
          const solverBox = (c) => ({background:`rgba(${c},.04)`,border:`1px solid rgba(${c},.2)`,borderRadius:8,padding:10,marginTop:10});

          return (
            <div>
              {/* â•â• CONFIGURATION â•â• */}
              <div style={hdr}>Configuration</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 16px",fontSize:12}}>
                <div style={row}><span style={lbl}>Construction</span><span style={val}>Existing</span></div>
                <div style={row}><span style={lbl}>Dwelling unit</span><span style={val}>Detached</span></div>
                <div style={row}><span style={lbl}>Infiltration credit</span><span style={val}>Yes</span></div>
                <div style={row}><span style={lbl}>Alt. compliance</span><span style={val}>Yes</span></div>
                <div style={row}><span style={lbl}>Weather station</span><span style={val}>Chicago Midway AP</span></div>
                <div style={row}><span style={lbl}>wsf [1/hr]</span><span style={{...val,color:"#60A5FA"}}>{wsf}</span></div>
              </div>

              {/* â•â• BUILDING INPUTS â•â• */}
              <div style={hdr}>Building Inputs</div>
              <div className="ashrae-inputs" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Floor area [ft²]</div><div style={autoBox}>{Afl||"â€”"}</div><div style={autoSub}>{finBasement > 0 ? `${baseSqft} + ${finBasement} fin. bsmt` : "â† Sq Footage"}</div></div>
                <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Nocc (occupants)</div><div style={autoBox}>{Nbr + 1}</div><div style={autoSub}>{Nbr} bedrooms + 1 = {Nbr + 1}</div></div>
                <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Height [ft]</div><div style={autoBox}>{H}</div><div style={autoSub}>{st>=2?"2-story":"1"+(st>=1.5?".5":"")+"-story"}</div></div>
                <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Q50 [CFM] â€” est. post</div><div style={{...autoBox,color:canAirSeal?"#f59e0b":"#e2e8f0"}}>{Q50||"â€”"}</div><div style={autoSub}>{canAirSeal ? `${preQ50} Ã— 0.75 (25% reduction)` : `${preQ50} (no air seal)`}</div>
                  <label style={{display:"flex",alignItems:"center",gap:4,marginTop:4,fontSize:10,color:canAirSeal?"#f59e0b":"#64748b",cursor:"pointer",justifyContent:"center"}}>
                    <input type="checkbox" checked={!!canAirSeal} onChange={e=>sn("ashrae","canAirSeal",e.target.checked)} style={{accentColor:"#2563EB",width:13,height:13}}/>
                    Air seal eligible
                  </label>
                </div>
              </div>

              {/* â•â• LOCAL VENTILATION â•â• */}
              <div style={hdr}>Local Ventilation â€” Alternative Compliance</div>
              <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>Blank = no fan = no requirement. Openable window = 20 CFM credit. Kitchen: 100 CFM · Bath: 50 CFM (intermittent rates)</div>
              <div style={{fontSize:9,color:"#f59e0b",marginBottom:6}}>âš  If a fan is present but not operational or CFM is unknown, enter 0.</div>
              <div className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",fontSize:11,alignItems:"center"}}>
                <span style={{fontWeight:600,color:"#64748b"}}></span>
                <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Fan Flow [CFM]</span>
                <span style={{fontWeight:600,color:"#64748b",textAlign:"center",fontSize:9}}>Window</span>
                <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Req'd</span>
                <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Deficit</span>
              </div>
              {[
                {n:"Kitchen",v:kCFM,k:"kitchenCFM",ak:"kitchenFan",w:kWin,wk:"kWin",r:kReq,d:kDef,present:kPresent},
                {n:"Bath #1",v:b1,k:"bath1CFM",ak:"bathFan1",w:b1Win,wk:"b1Win",r:b1Req,d:b1Def,present:b1Present},
                {n:"Bath #2",v:b2,k:"bath2CFM",ak:"bathFan2",w:b2Win,wk:"b2Win",r:b2Req,d:b2Def,present:b2Present},
                {n:"Bath #3",v:b3,k:"bath3CFM",ak:"bathFan3",w:b3Win,wk:"b3Win",r:b3Req,d:b3Def,present:b3Present},
              ].map(f=>(
                <div key={f.n} className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",alignItems:"center",marginBottom:2}}>
                  <span style={{fontSize:12,color:"#cbd5e1"}}>{f.n}</span>
                  <input style={{...S.inp,textAlign:"center",fontSize:12}} value={s.ashrae?.[f.k]??a[f.ak]??""} onChange={e=>sn("ashrae",f.k,e.target.value)} placeholder="blank = none"/>
                  <div style={{textAlign:"center"}}><input type="checkbox" checked={f.w} onChange={e=>sn("ashrae",f.wk,e.target.checked)} style={{accentColor:"#60A5FA"}}/></div>
                  <div style={{textAlign:"center",fontSize:11,color:f.present?"#64748b":"#475569"}}>{f.present?f.r:"â€”"}</div>
                  <div style={{textAlign:"center",fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:!f.present?"#475569":f.d>0?"#f59e0b":"#22c55e"}}>{f.present?f.d:"â€”"}</div>
                </div>
              ))}
              <div className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:4,marginTop:4}}>
                <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>Total</span>
                <span></span><span></span><span></span>
                <div style={{textAlign:"center",fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:totalDef>0?"#f59e0b":"#22c55e"}}>{Ri(totalDef)}</div>
              </div>

              {/* â•â• RESULTS â•â• */}
              <div style={resultBox}>
                <div style={{fontSize:13,fontWeight:700,color:"#3B82F6",marginBottom:4}}>Dwelling-Unit Ventilation Results</div>
                <div style={{fontSize:9,color:canAirSeal?"#f59e0b":"#64748b",marginBottom:8}}>Using {canAirSeal ? `estimated post Q50: ${preQ50} Ã— 0.75 = ${Q50} CFM` : `pre-work Q50: ${preQ50} CFM (no air seal)`}</div>

                <div style={row}><span style={lbl}>Infiltration credit, Qinf [CFM]</span><span style={val}>{R(Qinf_eff)}</span></div>
                <div style={eq}>= 0.052 Ã— Q50 Ã— wsf Ã— (H / 8.2)^0.4<br/>= 0.052 Ã— {Q50} Ã— {wsf} Ã— ({H} / 8.2)^0.4</div>

                <div style={row}><span style={lbl}>Total required ventilation rate, Qtot [CFM]</span><span style={val}>{R(Qtot)}</span></div>
                <div style={eq}>= 0.03 Ã— Afl + 7.5 Ã— (Nbr + 1)<br/>= 0.03 Ã— {Afl} + 7.5 Ã— ({Nbr} + 1)<br/>= {R(0.03*Afl)} + {R(7.5*(Nbr+1))}</div>

                <div style={row}><span style={lbl}>Total local ventilation deficit [CFM]</span><span style={val}>{Ri(totalDef)}</span></div>
                <div style={eq}>= Î£ max(0, req âˆ’ measured) per fan<br/>Kitchen {kReq} âˆ’ {kCFM} = {kDef} · Bath1 {b1Req} âˆ’ {b1} = {b1Def} · Bath2 {b2Req} âˆ’ {b2} = {b2Def} · Bath3 {b3Req} âˆ’ {b3} = {b3Def}</div>

                <div style={row}><span style={lbl}>Alternative compliance supplement [CFM]</span><span style={val}>{R(supplement)}</span></div>
                <div style={eq}>= totalDeficit Ã— 0.25 (intermittent â†’ continuous)<br/>= {Ri(totalDef)} Ã— 0.25</div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0 4px",borderTop:"2px solid rgba(37,99,235,.4)",marginTop:8}}>
                  <span style={{fontWeight:700,color:"#e2e8f0",fontSize:13}}>Required mech. ventilation, Qfan [CFM]</span>
                  <span style={{fontWeight:800,color:Qfan < PROGRAM.fanMinCFM ? "#22c55e" : "#3B82F6",fontSize:18,fontFamily:"'JetBrains Mono',monospace"}}>{R(Qfan)}</span>
                </div>
                <div style={eq}>= Qtot + supplement âˆ’ Qinf<br/>= {R(Qtot)} + {R(supplement)} âˆ’ {R(Qinf_credit)}</div>
                {Qfan < PROGRAM.fanMinCFM && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.3)",borderRadius:6,fontSize:12,color:"#22c55e",fontWeight:600}}>âœ“ Qfan below {PROGRAM.fanMinCFM} CFM â€” no mechanical ventilation fan required</div>}
              </div>

              {/* â•â• DWELLING-UNIT VENTILATION RUN-TIME SOLVER â•â• */}
              {Qfan >= PROGRAM.fanMinCFM && <div style={solverBox("37,99,235")}>
                <div style={{fontSize:12,fontWeight:700,color:"#60A5FA",marginBottom:6}}>Dwelling-Unit Ventilation Run-Time Solver</div>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:8}}>Select fan setting. Recommended = lowest setting â‰¥ Qfan ({R(Qfan)} CFM). All fans run continuous.</div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  {FAN_SETTINGS.map(cfm => {
                    const meets = cfm >= Qfan && Qfan > 0;
                    const isRec = cfm === recFan && Qfan > 0;
                    const sel = Number(s.ashrae?.fanSetting) === cfm;
                    return <button key={cfm} type="button" onClick={()=>sn("ashrae","fanSetting",cfm)} style={{
                      flex:1,padding:"10px 8px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                      border:sel?`2px solid ${isRec?"#22c55e":"#60A5FA"}`:`1px solid ${meets?"rgba(34,197,94,.3)":"rgba(255,255,255,.1)"}`,
                      background:sel?(isRec?"rgba(34,197,94,.15)":"rgba(37,99,235,.15)"):"rgba(255,255,255,.03)",
                      color:sel?(isRec?"#22c55e":"#93C5FD"):meets?"#86efac":"#64748b",textAlign:"center"
                    }}>
                      <div style={{fontSize:18,fontWeight:700}}>{cfm}</div>
                      <div style={{fontSize:10}}>CFM</div>
                      {isRec && <div style={{fontSize:9,marginTop:2,color:"#22c55e",fontWeight:600}}>âœ“ REC</div>}
                      {!meets && Qfan > 0 && <div style={{fontSize:9,marginTop:2,color:"#ef4444"}}>Below Qfan</div>}
                    </button>;
                  })}
                </div>
                {Number(s.ashrae?.fanSetting) > 0 && Qfan > 0 && (() => {
                  const fan = Number(s.ashrae.fanSetting);
                  const minPerHr = R(Qfan / fan * 60);
                  return <div style={{background:"rgba(37,99,235,.08)",borderRadius:8,padding:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:12,color:"#cbd5e1"}}>Fan capacity</span>
                      <span style={{fontSize:14,fontWeight:700,color:"#93C5FD",fontFamily:"'JetBrains Mono',monospace"}}>{fan} CFM</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:12,color:"#cbd5e1"}}>Min. run-time per hour</span>
                      <span style={{fontSize:14,fontWeight:700,color:"#60A5FA",fontFamily:"'JetBrains Mono',monospace"}}>{minPerHr} min/hr</span>
                    </div>
                    <div style={eq}>= Qfan ÷ fan capacity Ã— 60<br/>= {R(Qfan)} ÷ {fan} Ã— 60 = {minPerHr} min/hr</div>
                    <div style={{marginTop:6,fontSize:10,color:fan >= Qfan ? "#22c55e" : "#f59e0b",fontWeight:600}}>
                      {fan >= Qfan ? `âœ“ Continuous (60 min/hr) exceeds minimum ${minPerHr} min/hr` : `âš  Fan setting below Qfan â€” does not meet requirement`}
                    </div>
                  </div>;
                })()}
              </div>}

              <p style={{fontSize:9,color:"#475569",marginTop:10,textAlign:"right"}}>ASHRAE 62.2-2016 · Local Ventilation Alternative Compliance · basc.pnnl.gov/redcalc</p>
            </div>
          );
        })()}
      </Sec>

      <Sec title={`Energy Efficiency Measures (${p.measures.length})`}>
        {(()=>{
          // Auto-calculate quantities from scope data â€” keyed off R to Add
          const aq = {};
          const atticAdd = Number(s.attic?.addR||0);
          const atticPre = Number(s.attic?.preR||0);
          if(atticAdd > 0 && s.attic?.sqft) {
            if(atticPre <= 11) aq["Attic Insulation (0-R11)"] = Number(s.attic.sqft);
            else if(atticPre <= 19) aq["Attic Insulation (R12-19)"] = Number(s.attic.sqft);
          }
          if(Number(s.fnd?.addR||0) > 0 || (s.fnd?.preR!==undefined && Number(s.fnd.preR||0)===0 && (Number(s.fnd?.aboveSqft||0)+Number(s.fnd?.belowSqft||0))>0)) {
            const bsmt = (Number(s.fnd?.aboveSqft||0)+Number(s.fnd?.belowSqft||0));
            if(bsmt>0) aq["Basement Wall Insulation"] = bsmt;
          }
          if(s.fnd?.crawlR!==undefined && Number(s.fnd.crawlR||0)===0) {
            const crawl = (Number(s.fnd?.crawlAbove||0)+Number(s.fnd?.crawlBelow||0));
            if(crawl>0) aq["Crawl Space Wall Insulation"] = crawl;
          }
          if(Number(s.kneeWall?.addR||0) > 0 && s.kneeWall?.sqft) aq["Knee Wall Insulation"] = Number(s.kneeWall.sqft);
          const w1net = Number(s.extWall1?.addR||0) > 0 && s.extWall1?.sqft ? Math.round(Number(s.extWall1.sqft)*0.84) : 0;
          const w2net = Number(s.extWall2?.addR||0) > 0 && s.extWall2?.sqft ? Math.round(Number(s.extWall2.sqft)*0.86) : 0;
          if(w1net+w2net>0) aq["Injection Foam Walls"] = w1net+w2net;
          if(s.fnd?.bandAccess && Number(s.fnd?.bandR||0)===0 && s.fnd?.bandLnft) aq["Rim Joist Insulation"] = Number(s.fnd.bandLnft);
          if(s.fnd?.crawlBandAccess && Number(s.fnd?.crawlBandR||0)===0 && s.fnd?.crawlBandLnft) {
            aq["Rim Joist Insulation"] = (aq["Rim Joist Insulation"]||0) + Number(s.fnd.crawlBandLnft);
          }
          if(Number(s.collar?.addR||0) > 0 && s.collar?.sqft) aq["Attic Insulation (R12-19)"] = (aq["Attic Insulation (R12-19)"]||0) + Number(s.collar.sqft);
          if(Number(s.outerCeiling?.addR||0) > 0 && s.outerCeiling?.sqft) aq["Attic Insulation (R12-19)"] = (aq["Attic Insulation (R12-19)"]||0) + Number(s.outerCeiling.sqft);
          // Mechanicals = 1 each
          if(s.htg?.replaceRec) aq[s.htg?.system==="Boiler"?"Boiler Replacement":"Furnace Replacement"] = 1;
          if(s.dhw?.replaceRec) aq["Water Heater Replacement"] = 1;
          if(s.clg?.replaceRec) aq["Central AC Replacement"] = 1;
          const ctVal = s.htg?.cleanTuneOverride!==undefined ? s.htg.cleanTuneOverride : (s.htg?.cleanTune || (Number(s.htg?.year||0) && (new Date().getFullYear()-Number(s.htg.year))>3 && s.htg?.fuel==="Natural Gas" && !s.htg?.replaceRec));
          if(ctVal) aq["Furnace Tune-Up"] = 1;
          aq["Air Sealing"] = 1;
          if(s.attic?.ductwork || s.collar?.ductwork || s.fnd?.crawlDuct) aq["Duct Sealing"] = 1;

          const mq = p.measureQty || {};
          const mu = p.measureUnchecked || {};
          const setQ = (m,v) => u({measureQty:{...mq,[m]:v}});
          const getQ = (m) => mq[m] !== undefined ? mq[m] : (aq[m] !== undefined ? String(aq[m]) : "");
          const isAuto = (m) => mq[m] === undefined && aq[m] !== undefined;
          const unit = (m) => {
            if(m.includes("Insulation") && !m.includes("Rim")) return "sqft";
            if(m.includes("Rim Joist")) return "lnft";
            if(m.includes("Foam Walls")) return "sqft";
            return "ea";
          };

          return <div style={{display:"grid",gap:4}}>
            {EE_MEASURES.map(m => {
              const inList = p.measures.includes(m);
              const autoOn = aq[m] !== undefined && !mu[m];
              const checked = inList || autoOn;
              const q = getQ(m);
              const autoQty = isAuto(m);
              const togM = () => {
                if(checked && autoOn && !inList) { u({measureUnchecked:{...mu,[m]:true}}); }
                else if(checked && inList && autoOn) { tog("measures",m); u({measureUnchecked:{...mu,[m]:true}}); }
                else if(checked && inList && !autoOn) { tog("measures",m); }
                else { const nu={...mu}; delete nu[m]; u({measureUnchecked:nu}); if(!inList) tog("measures",m); }
              };
              return <div key={m} style={{display:"flex",alignItems:"center",gap:6}}>
                <CK checked={checked} onChange={togM} label={m} color={checked?"#22c55e":null}/>
                {checked && !inList && autoOn && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
                {checked && <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
                  <input style={{...S.inp,width:70,textAlign:"center",fontSize:11,background:autoQty?"rgba(37,99,235,.08)":"",color:autoQty?"#93C5FD":""}} inputMode="decimal" value={q} onChange={e=>{const v=e.target.value;if(v===""||/^-?\d*\.?\d*$/.test(v))setQ(m,v);}} placeholder="qty"/>
                  <span style={{fontSize:9,color:"#64748b",minWidth:28}}>{unit(m)}</span>
                  {autoQty && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
                  {!autoQty && aq[m]!==undefined && <span style={{fontSize:8,color:"#60A5FA",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{const nq={...mq};delete nq[m];u({measureQty:nq});}} title="Reset to auto-calculated value">â†» auto</span>}
                </div>}
              </div>;
            })}
          </div>;
        })()}
      </Sec>
      <Sec title={`Health & Safety Measures (${p.healthSafety.length})`}>
        {(()=>{
          const aq = {};
          if(s.coNeeded && Number(s.coNeeded)>0) aq["CO Detector (Hardwired)"] = Number(s.coNeeded);
          if(s.smokeNeeded && Number(s.smokeNeeded)>0) aq["Smoke Detector (Hardwired)"] = Number(s.smokeNeeded);
          if(s.doorSweeps && Number(s.doorSweeps)>0) aq["Door Sweeps"] = Number(s.doorSweeps);
          
          if(s.dhw?.flueRepair) aq["Flue Repairs"] = 1;

          const mq = p.measureQty || {};
          const mu = p.hsUnchecked || {};
          const setQ = (m,v) => u({measureQty:{...mq,[m]:v}});
          const getQ = (m) => mq[m] !== undefined ? mq[m] : (aq[m] !== undefined ? String(aq[m]) : "");
          const isAuto = (m) => mq[m] === undefined && aq[m] !== undefined;

          return <div style={{display:"grid",gap:4}}>
            {HS_MEASURES.map(m => {
              const inList = p.healthSafety.includes(m);
              const autoOn = aq[m] !== undefined && !mu[m];
              const checked = inList || autoOn;
              const q = getQ(m);
              const autoQty = isAuto(m);
              const togM = () => {
                if(checked && autoOn && !inList) { u({hsUnchecked:{...mu,[m]:true}}); }
                else if(checked && inList && autoOn) { tog("healthSafety",m); u({hsUnchecked:{...mu,[m]:true}}); }
                else if(checked && inList && !autoOn) { tog("healthSafety",m); }
                else { const nu={...mu}; delete nu[m]; u({hsUnchecked:nu}); if(!inList) tog("healthSafety",m); }
              };
              return <div key={m} style={{display:"flex",alignItems:"center",gap:6}}>
                <CK checked={checked} onChange={togM} label={m} color={checked?"#f59e0b":null}/>
                {checked && !inList && autoOn && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
                {checked && <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
                  <input style={{...S.inp,width:70,textAlign:"center",fontSize:11,background:autoQty?"rgba(37,99,235,.08)":"",color:autoQty?"#93C5FD":""}} inputMode="decimal" value={q} onChange={e=>{const v=e.target.value;if(v===""||/^-?\d*\.?\d*$/.test(v))setQ(m,v);}} placeholder="qty"/>
                  <span style={{fontSize:9,color:"#64748b",minWidth:20}}>ea</span>
                  {autoQty && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
                  {!autoQty && aq[m]!==undefined && <span style={{fontSize:8,color:"#60A5FA",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{const nq={...mq};delete nq[m];u({measureQty:nq});}} title="Reset to auto-calculated value">â†» auto</span>}
                </div>}
              </div>;
            })}
          </div>;
        })()}
      </Sec>

      <Sec title="Notes on Work">
        <textarea style={S.ta} value={p.measureNotes} onChange={e=>u({measureNotes:e.target.value})} rows={2} placeholder="Notes on work to be performedâ€¦"/>
      </Sec>
      <Sec title="Notes on Health & Safety">
        <textarea style={S.ta} value={s.hsNotes||""} onChange={e=>ss("hsNotes",e.target.value)} rows={2} placeholder="H&S notesâ€¦"/>
      </Sec>

      <Sec title="Insulation Quantities">
        <Gr>{["Attic (0-R11)","Attic (R12-19)","Basement Wall","Crawl Space Wall","Knee Wall","Floor Above Crawl","Rim Joist","Injection Foam Walls"].map(m =>
          <F key={m} label={`${m} ${m.includes("Rim Joist")?"LnFt":"SqFt"}`} value={s.insulQty?.[m]||""} onChange={v=>ss("insulQty",{...(s.insulQty||{}),[m]:v})}/>
        )}</Gr>
        <textarea style={{...S.ta,marginTop:6}} value={s.insulNotes||""} onChange={e=>ss("insulNotes",e.target.value)} rows={2} placeholder="Insulation notesâ€¦"/>
      </Sec>

      <Sec title="Scope Variances">
        <textarea style={S.ta} value={p.scopeVariances} onChange={e=>u({scopeVariances:e.target.value})} rows={2} placeholder="Scope variancesâ€¦"/>
      </Sec>

      <Sec title="RISE Submission">
        <Gr>
          <Sel label="RISE Status" value={p.riseStatus} onChange={v=>{u({riseStatus:v});onLog(`RISE â†’ ${v}`);}} opts={["pending","approved","corrections"]}/>
          <F label="Approval Date" value={p.scopeDate} onChange={v=>u({scopeDate:v})} type="date"/>
        </Gr>
        <div style={{marginTop:8}}><CK checked={p.scopeApproved} onChange={v=>{u({scopeApproved:v});if(v)onLog("Scope approved");}} label="Scope Approved"/></div>
        <div style={{marginTop:8}}><textarea style={S.ta} value={p.scopeNotes} onChange={e=>u({scopeNotes:e.target.value})} rows={2} placeholder="Conditions, correctionsâ€¦"/></div>
      </Sec>
      <Sec title="Mechanical Replacement">
        <CK checked={p.mechNeeded} onChange={v=>u({mechNeeded:v})} label="Replacement needed (Decision Tree)"/>
        {p.mechNeeded && (
          <div style={{marginTop:8}}>
            <Gr><Sel label="Status" value={p.mechStatus} onChange={v=>{u({mechStatus:v});onLog(`Mech â†’ ${v}`);}} opts={["requested","approved","denied"]}/><F label="Date" value={p.mechDate} onChange={v=>u({mechDate:v})} type="date"/></Gr>
            <textarea style={{...S.ta,marginTop:6}} value={p.mechNotes} onChange={e=>u({mechNotes:e.target.value})} rows={2} placeholder="Notesâ€¦"/>
          </div>
        )}
      </Sec>
    </div>
  );
}



