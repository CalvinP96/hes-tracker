import React, { useState, useRef, useCallback, useEffect } from "react";
import { S } from "../../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM, HVAC_BRANDS, COND_OPTS, YN_OPTS, HVAC_GUIDES } from "../../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../../components/ui.jsx";
import { savePrint, printScope, photoPageHTML, sideBySideHTML, formPrintHTML } from "../../export/savePrint.js";
import { exportProjectForms, exportProjectPhotos } from "../../export/exportForms.js";
import { ASHRAECalc } from "./ASHRAECalc";
import { InsulationSpec } from "./InsulationSpec";
import { MechanicalSpec } from "./MechanicalSpec";
import { MeasureBuilder } from "./MeasureBuilder";
import { ScopeExport } from "./ScopeExport";

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
    // Tenant type (map: Owned→Own, Rented→Rent)
    if (a.tenantType) updates.tenantType = a.tenantType === "Owned" ? "Own" : a.tenantType === "Rented" ? "Rent" : a.tenantType;
    // Thermostat (map: Non-programmable→Manual)
    if (a.thermostatType) {
      nested.htg = {...(s.htg||{}), thermostat: a.thermostatType === "Non-programmable" ? "Manual" : a.thermostatType};
    }
    // Ceiling / wall conditions
    if (a.ceilingCond) updates.ceilingCond = a.ceilingCond;
    if (a.wallCond) updates.wallCond = a.wallCond;
    if (a.wallsNeedInsul) updates.wallsNeedInsul = a.wallsNeedInsul;
    // Bedrooms
    if (a.bedrooms) updates.bedrooms = a.bedrooms;
    // Fan flows → ASHRAE
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

  // Get the getScopeHTML function from ScopeExport
  const scopeExport = ScopeExport({p, s});

  return (
    <div id="scope-print-content">
      <Sec title="📋 2026 HEA/IE Retrofit Form">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Scope of Work — submit to RISE for approval</p>
          <div style={{display:"flex",gap:6}}>
            <button type="button" style={{...S.ghost,padding:"4px 10px",fontSize:10,color:"#60A5FA",borderColor:"rgba(37,99,235,.3)"}} onClick={()=>{
              const conf = confirm("Re-fill scope fields from assessment data? This will overwrite current values.");
              if(conf){setFilled(false);}
            }}>↻ Sync from Assessment</button>
            <PrintBtn onClick={()=>printScope(p,s)}/>
          </div>
        </div>
        {!filled && <div style={{fontSize:10,color:"#22c55e",marginTop:4}}>✓ Auto-filled empty fields from assessment data</div>}
      </Sec>

      {/* ══ PAGE 1: BUILDING PROPERTY TYPE ══ */}
      <Sec title="Building Property Type">
        <Gr>
          <Sel label="Style" value={s.style||""} onChange={v=>ss("style",v)} opts={["Single Family, Detached","Townhouse, Single Unit","Duplex, Single Unit","Multi-Family (Any Type), Multiple Units","Mobile Home","Multi-Family 3+ Units, Single Tenant Unit","Condo 3+ Units, Single Unit","Condo 3+ Units, Common Area","2-Flat","Apartment","Manufactured Home"]}/>
          <F label="Year Built" value={p.yearBuilt} onChange={v=>u({yearBuilt:v})} num/>
          <F label="Stories" value={p.stories} onChange={v=>u({stories:v})} num/>
          <F label="Bedrooms" value={s.bedrooms||""} onChange={v=>ss("bedrooms",v)} num/>
          <F label="Occupants" value={p.occupants} onChange={v=>u({occupants:v})} num/>
          <F label="Sq Footage" value={p.sqft} onChange={v=>u({sqft:v})} num/>
          <div style={{display:"flex",flexDirection:"column"}}><label style={S.fl}>Volume</label><div style={{...S.inp,background:"rgba(37,99,235,.08)",color:"#93C5FD",display:"flex",alignItems:"center",marginTop:"auto"}}>{Number(p.sqft) ? (Number(p.sqft)*8).toLocaleString() : "—"}<span style={{fontSize:10,color:"#64748b",marginLeft:6}}>ft³ (sqft × 8)</span></div></div>
          <F label="Home Age" computed={p.yearBuilt ? (new Date().getFullYear() - Number(p.yearBuilt)) + " yrs" : "—"} suffix="auto"/>
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
        <textarea style={{...S.ta,marginTop:8}} value={s.propNotes||""} onChange={e=>ss("propNotes",e.target.value)} rows={2} placeholder="Building property notes…"/>
      </Sec>

      {/* ══ INTERIOR CONDITIONS (from assessment) ══ */}
      <Sec title={<span>Interior Conditions {a.ceilingCond && <span style={{fontSize:9,color:"#60A5FA",fontWeight:400}}> · assessment values auto-filled</span>}</span>}>
        <Gr>
          <Sel label="Ceiling Conditions" value={s.ceilingCond||""} onChange={v=>ss("ceilingCond",v)} opts={["Good","Poor"]}/>
          <Sel label="Wall Conditions" value={s.wallCond||""} onChange={v=>ss("wallCond",v)} opts={["Good","Fair","Poor"]}/>
          <Sel label="Walls Need Insulation?" value={s.wallsNeedInsul||""} onChange={v=>ss("wallsNeedInsul",v)} opts={["Yes","No","Other"]}/>
        </Gr>
      </Sec>

      {/* ══ SMOKE / CO / WEATHERIZATION ══ */}
      <Sec title="Smoke / CO / Weatherization">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <F label="Smoke — present" value={s.smokePresent||""} onChange={v=>ss("smokePresent",v)} num/>
          <F label="Smoke — to install" value={s.smokeNeeded||""} onChange={v=>ss("smokeNeeded",v)} num/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6}}>
          <F label="CO — present" value={s.coPresent||""} onChange={v=>ss("coPresent",v)} num/>
          <F label="CO — to install" value={s.coNeeded||""} onChange={v=>ss("coNeeded",v)} num/>
        </div>
        <div style={{marginTop:8}}><Gr>
          <F label="Tenmats Needed" value={s.tenmats||""} onChange={v=>ss("tenmats",v)} num/>
          <F label="Doors Need Sweeps/WS" value={s.doorSweeps||""} onChange={v=>ss("doorSweeps",v)} num/>
        </Gr></div>
      </Sec>

      {/* ══ PAGE 2: MECHANICAL SYSTEMS ══ */}
      <MechanicalSpec p={p} u={u} onLog={onLog} s={s} ss={ss} sn={sn} />

      {/* ══ PAGE 3: INTERIOR INSPECTION ══ */}
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
        {s.int?.knobTube && <Rec type="flag">LIVE KNOB & TUBE — insulation CANNOT proceed in affected areas until remediated by licensed electrician.</Rec>}
        {s.int?.vermiculite && <Rec type="flag">VERMICULITE/ASBESTOS — do NOT disturb. Abatement required before insulation. May use estimated blower door only.</Rec>}
        {s.int?.mold && <Rec type="flag">MOLD PRESENT — mold remediation must be completed before insulation work can begin.</Rec>}
        {s.htg?.asbestosPipes && <Rec type="flag">ASBESTOS-WRAPPED PIPES — do not disturb. Abatement may be required.</Rec>}
      </Sec>

      {/* ══ PAGE 3: DOOR TYPES / EXHAUST VENTING ══ */}
      <Sec title="Door Types / Exhaust Venting">
        <div style={{fontSize:11,fontWeight:600,color:"#60A5FA",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Weather Strips / Door Sweeps</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0px 8px"}}>
          {["Front","Back","Basement","Attic"].map(d=>(
            <CK key={d} checked={s.doors?.[d]} onChange={v=>sn("doors",d,v)} label={`${d} — Existing`}/>
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
        <div style={{marginTop:6}}><CK checked={s.exh?.noBD} onChange={v=>sn("exh","noBD",v)} label="No blower door — estimated (asbestos/vermiculite ONLY)"/></div>
        <textarea style={{...S.ta,marginTop:6}} value={s.exh?.notes||""} onChange={e=>sn("exh","notes",e.target.value)} rows={2} placeholder="Notes…"/>
      </Sec>

      {/* ══ PAGE 4: INSULATION SECTIONS ══ */}
      <InsulationSpec p={p} u={u} onLog={onLog} s={s} ss={ss} sn={sn} />

      {/* ══ PAGE 4: DIAGNOSTICS & ASHRAE ══ */}
      <Sec title="Diagnostics">
        <Gr><F label="Pre CFM50" value={p.preCFM50} onChange={v=>u({preCFM50:v})} num/><F label="Ext Temp" value={s.extTemp||""} onChange={v=>ss("extTemp",v)} num/><Sel label="BD Location" value={p.bdLoc} onChange={v=>u({bdLoc:v})} opts={["Front","Side","Back"]}/></Gr>
        {(()=>{
          const cfm = Number(p.preCFM50); const sqft = Number(p.sqft);
          const recs = [];
          if(cfm && sqft) {
            const pct = cfm / sqft;
            if(pct >= PROGRAM.airSealMinCFM50pct) recs.push({t:"rec",m:`CFM50 ${cfm} is ≥110% of ${sqft} sqft (${(pct*100).toFixed(0)}%). Air sealing eligible.`});
            else recs.push({t:"warn",m:`CFM50 ${cfm} is ${(pct*100).toFixed(0)}% of sqft — below 110% threshold. Air sealing may not be eligible.`});
            const target25 = Math.round(cfm * 0.75);
            recs.push({t:"info",m:`25% reduction goal: post-CFM50 target ≤${target25}. Need to reduce by ≥${cfm - target25} CFM50.`});
          }
          return recs.map((r,i)=><Rec key={i} type={r.t}>{r.m}</Rec>);
        })()}
        <textarea style={{...S.ta,marginTop:6}} value={s.diagNotes||""} onChange={e=>ss("diagNotes",e.target.value)} rows={2} placeholder="Diagnostics notes…"/>
      </Sec>

      {/* ══ ASHRAE CALCULATOR ══ */}
      <ASHRAECalc p={p} u={u} onLog={onLog} s={s} sn={sn} />

      {/* ══ MEASURE BUILDER ══ */}
      <MeasureBuilder p={p} u={u} onLog={onLog} s={s} ss={ss} />

      <Sec title="Scope Variances">
        <textarea style={S.ta} value={p.scopeVariances} onChange={e=>u({scopeVariances:e.target.value})} rows={2} placeholder="Scope variances…"/>
      </Sec>

      <Sec title="RISE Submission">
        <Gr>
          <Sel label="RISE Status" value={p.riseStatus} onChange={v=>{u({riseStatus:v});onLog(`RISE → ${v}`);}} opts={["pending","approved","corrections"]}/>
          <F label="Approval Date" value={p.scopeDate} onChange={v=>u({scopeDate:v})} type="date"/>
        </Gr>
        <div style={{marginTop:8}}><CK checked={p.scopeApproved} onChange={v=>{u({scopeApproved:v});if(v)onLog("Scope approved");}} label="Scope Approved"/></div>
        <div style={{marginTop:8}}><textarea style={S.ta} value={p.scopeNotes} onChange={e=>u({scopeNotes:e.target.value})} rows={2} placeholder="Conditions, corrections…"/></div>
      </Sec>
      <Sec title="Mechanical Replacement">
        <CK checked={p.mechNeeded} onChange={v=>u({mechNeeded:v})} label="Replacement needed (Decision Tree)"/>
        {p.mechNeeded && (
          <div style={{marginTop:8}}>
            <Gr><Sel label="Status" value={p.mechStatus} onChange={v=>{u({mechStatus:v});onLog(`Mech → ${v}`);}} opts={["requested","approved","denied"]}/><F label="Date" value={p.mechDate} onChange={v=>u({mechDate:v})} type="date"/></Gr>
            <textarea style={{...S.ta,marginTop:6}} value={p.mechNotes} onChange={e=>u({mechNotes:e.target.value})} rows={2} placeholder="Notes…"/>
          </div>
        )}
      </Sec>
    </div>
  );
}
