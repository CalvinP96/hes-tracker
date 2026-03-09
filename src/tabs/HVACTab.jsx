import React, { useState, useRef, useCallback, useEffect } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM, HVAC_BRANDS, COND_OPTS, YN_OPTS, HVAC_GUIDES } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
import { savePrint, printScope, photoPageHTML, sideBySideHTML, formPrintHTML } from "../export/savePrint.js";
import { exportProjectForms, exportProjectPhotos } from "../export/exportForms.js";

export function HVACTab({p,u,onLog,user,role}) {
  const h = p.hvac || {};
  const uh = (section,key,val) => u({hvac:{...h,[section]:{...(h[section]||{}),[key]:val}}});
  const uhTop = (key,val) => u({hvac:{...h,[key]:val}});
  const f = h.furnace || {};
  const w = h.waterHeater || {};
  const c = h.condenser || {};
  const [guide,setGuide] = useState(null);

  const getHVACHTML = () => {
    const v = (x) => x || "—";
    const cell = (num,label,val) => `<td style="border:1px solid #999;padding:6px 8px;width:50%;vertical-align:top"><span style="font-weight:700">${num}. ${label}</span><br/><span style="color:#333">${v(val)}</span></td>`;
    const row2 = (n1,l1,v1,n2,l2,v2) => `<tr>${cell(n1,l1,v1)}${cell(n2,l2,v2)}</tr>`;
    const row1 = (num,label,val) => `<tr><td colspan="2" style="border:1px solid #999;padding:6px 8px"><span style="font-weight:700">${num}. ${label}</span><br/><span style="color:#333">${v(val)}</span></td></tr>`;
    const secHdr = (title) => `<tr><td colspan="2" style="border:2px solid #333;padding:8px 10px;background:#f0f0f0;font-weight:700;font-size:14px">${title}</td></tr>`;
    const afueRow = `<tr><td style="border:1px solid #999;padding:6px 8px;background:#ffe;font-weight:600">AFUE Pre-Tune Up: <span style="color:#1E3A8A">${v(f.afuePre)}%</span></td><td style="border:1px solid #999;padding:6px 8px;background:#ffe;font-weight:600">AFUE Post-Tune Up: <span style="color:#16a34a">${v(f.afuePost)}%</span></td></tr>`;
    const findingsTags = (findings) => findings ? findings.split("; ").map(t=>`<span style="display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;background:#e8f4fd;border:1px solid #b8d9f0;font-size:10px">${t}</span>`).join("") : "—";
    const sigBlock = (label, sig) => sig ? `<div style="margin-top:16px;padding-top:8px;border-top:1px solid #ccc"><span style="font-size:10px;color:#666">${label}:</span><br/><img src="${sig}" style="max-width:280px;height:60px;object-fit:contain"/><br/><span style="font-size:9px;color:#999">Digitally signed in HES Tracker</span></div>` : `<div style="margin-top:16px;padding-top:8px;border-top:1px solid #ccc"><span style="font-size:10px;color:#666">${label}:</span><br/><div style="height:40px;border-bottom:1px solid #333;width:250px;margin-top:4px"></div></div>`;

    return `<!DOCTYPE html><html><head><title>AES System Tune Up</title>
<style>@page{margin:.4in}body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:12px;font-size:12px;color:#000}table{width:100%;border-collapse:collapse;margin-bottom:4px}h1{font-size:16px;margin:0;text-align:center}h2{font-size:13px;margin:4px 0;font-weight:400;text-align:center;color:#444}
.hdr-tbl td{border:none;padding:2px 0;font-size:11px;vertical-align:top}
</style></head><body>
<div style="text-align:center;margin-bottom:8px">
<div style="font-size:22px;font-weight:900;letter-spacing:1px;color:#c00">ASSURED</div>
<div style="font-size:11px;font-weight:700;color:#333;letter-spacing:2px">HEATING & COOLING</div>
</div>
<table class="hdr-tbl" style="margin-bottom:12px"><tr>
<td>Assured Heating and Cooling<br/>22530 Center Rd.<br/>Frankfort, IL 60423<br/>708-580-8100</td>
</tr></table>
<table class="hdr-tbl" style="margin-bottom:8px">
<tr><td><b>Work Order #:</b> ${v(p.stId)}</td><td><b>Customer:</b> ${v(p.customerName)}</td></tr>
<tr><td><b>Assigned Technician:</b> ${v(h.techName)}</td><td><b>Address:</b> ${v(p.address)}</td></tr>
<tr><td><b>Date:</b> ${h.completedDate ? new Date(h.completedDate).toLocaleDateString() : new Date().toLocaleDateString()}</td><td><b>Task:</b> Tune-up and cleaning</td></tr>
</table>
<div style="font-size:10px;color:#444;padding:4px 0 8px;border-bottom:1px solid #ccc;margin-bottom:8px">
<b>Work Order Description:</b> Furnace tune-up and cleaning, A/C tune-up and cleaning, and water heater check-up. Gather all equipment information, photos of any necessary repairs, and check all heat exchangers.
</div>

<table style="margin-top:4px">
<tr><td colspan="2" style="border:2px solid #333;padding:8px 10px;background:#e8e8e8;font-weight:700;font-size:15px">AES System Tune Up<br/><span style="font-size:11px;font-weight:400;font-style:italic">Furnace / Condenser / Water Heater tune up and checklist</span></td></tr>
${secHdr("FURNACE TUNE-UP")}
${row2(1,"Furnace Make",f.make,2,"Furnace Model #",f.model)}
${row2(3,"Furnace Serial #",f.serial,4,"Furnace Age",f.age?f.age+" years":"")}
${row2(5,"Condition of Heat Exchanger",f.heatExchanger,6,"Inducer Motor Operations & Condition",f.inducerMotor)}
${row2(7,"Ignitor Condition & OHM Reading",(f.ignitorCond||"")+(f.ignitorOhm?" · "+f.ignitorOhm+"Ω":""),8,"Burner Condition & Operations",f.burnerCond)}
${row2(9,"Flame Sensor Condition",f.flameSensor,10,"Filter Size",f.filterSize)}
${row2(11,"Filter Changed",f.filterChanged,12,"Blower Motor Operations & Condition",f.blowerMotor)}
${row2(13,"Control Board Operations & Condition",f.controlBoard,14,"Thermostat Location & Condition",f.thermostat)}
${afueRow}
${row1(15,"Findings & Recommendations",findingsTags(f.findings)+(f.findingsNotes?"<br/><span style='font-size:11px;color:#555'>"+f.findingsNotes+"</span>":""))}

${secHdr("WATER HEATER CHECK-UP")}
${row2(16,"Water Heater Make",w.make,17,"Water Heater Model #",w.model)}
${row2(18,"Water Heater Serial #",w.serial,19,"Water Heater Age",w.age?w.age+" years":"")}
${row2(20,"Water Heater Condition",w.condition,21,"Water Heater Venting",w.venting)}
${row2(22,"Water Heater Burners",w.burners,23,"Water Heater Recommendations",findingsTags(w.findings)+(w.findingsNotes?"<br/>"+w.findingsNotes:""))}

${secHdr("A/C TUNE-UP")}
${row2(24,"Condenser Make",c.make,25,"Condenser Model #",c.model)}
${row2(26,"Condenser Serial #",c.serial,27,"Condenser Age",c.age?c.age+" years":"")}
${row2(28,"Condenser Condition",c.condition,29,"Condenser Coils Cleaned",c.coilsCleaned)}
${row2(30,"Electrical Components, Whip & Disconnect",c.electrical,31,"Refrigerant Pressures",(c.suctionPSI?"Suction: "+c.suctionPSI+" PSI":"")+(c.dischargePSI?" · Discharge: "+c.dischargePSI+" PSI":"")+(c.refrigerant?" · "+c.refrigerant:""))}
${row2(32,"Exposed Line Set Condition",c.lineSet,33,"Other Issues (piping, venting, drainage)",c.otherIssues)}
${row1(34,"Evaporator Coil Condition",c.evapCoil)}

${secHdr("WHOLE SYSTEM ASSESSMENT")}
${row1(35,"Details, Notes & Recommendations",findingsTags(h.systemNotes)+(h.detailNotes?"<br/><span style='font-size:11px;color:#555'>"+h.detailNotes+"</span>":""))}
${(h.systemNotes||"").includes("replacement")?`<tr><td colspan="2" style="border:1px solid #999;padding:6px 8px;background:#fff3cd"><b>⚠ Replacement Flagged</b> — Priority: ${v(h.replacePriority)} · Type: ${v(h.replaceType)}</td></tr>`:""}
</table>

<div style="margin-top:16px;display:flex;justify-content:space-between">
<div>
<div style="font-size:10px;color:#666">Technician Signature:</div>
<div style="margin-top:20px;border-top:1px solid #333;width:240px;padding-top:2px;font-size:10px">${v(h.techName)}</div>
</div>
<div>
<div style="font-size:10px;color:#666">Manager:</div>
<div style="margin-top:20px;border-top:1px solid #333;width:240px;padding-top:2px;font-size:10px">${v(h.managerName)||"_____________________"}</div>
</div>
</div>
<div style="text-align:center;margin-top:16px;font-size:9px;color:#999">Date: ${new Date().toLocaleDateString()}</div>
</body></html>`;
  };

  // Dropdown field — HVAC specific, no "Other" needed (options are comprehensive)
  const DDField = ({label,section,field,opts,tip}) => {
    const val = (section?h[section]?.[field]:h[field]) || "";
    const set = (v) => section ? uh(section,field,v) : uhTop(field,v);
    return <div style={{marginBottom:4}}>
      <label style={S.fl}>{label}</label>
      <select style={S.inp} value={val} onChange={e=>set(e.target.value)}>
        {opts.map(o=><option key={o} value={o}>{o||"— Select —"}</option>)}
      </select>
      {tip && <div style={{fontSize:9,color:"#64748b",marginTop:2}}>💡 {tip}</div>}
    </div>;
  };

  const guidePanel = (key) => {
    const g = HVAC_GUIDES[key];
    if (!g) return null;
    const open = guide === key;
    return <div style={{marginBottom:8}}>
      <button type="button" onClick={()=>setGuide(open?null:key)} style={{...S.ghost,width:"100%",textAlign:"left",padding:"8px 12px",fontSize:12,color:"#f59e0b",borderColor:"rgba(245,158,11,.2)",background:open?"rgba(245,158,11,.06)":"transparent"}}>
        {open?"▾":"▸"} {g.title}
      </button>
      {open && <div style={{padding:"8px 12px",background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.1)",borderTop:"none",borderRadius:"0 0 8px 8px",fontSize:11}}>
        {g.tips.map((t,i)=><div key={i} style={{padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)",color:"#cbd5e1"}}>
          <span style={{color:"#f59e0b",marginRight:6}}>•</span>{t}
        </div>)}
      </div>}
    </div>;
  };

  return (
    <div>
      <Sec title="HVAC Tune & Clean">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Complete all sections that apply. Use dropdowns — only use "Other" if none fit.</p>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <F label="Technician" value={h.techName||""} onChange={v=>uhTop("techName",v)}/>
            <F label="Manager" value={h.managerName||""} onChange={v=>uhTop("managerName",v)}/>
            <PrintBtn onClick={()=>savePrint(getHVACHTML())}/>
          </div>
        </div>
        {!h.completed ? (
          <button type="button" style={{...S.btn,width:"100%",padding:"10px",fontSize:13,opacity:h.techName?.trim()?.length>0?1:.4}} disabled={!h.techName?.trim()} onClick={()=>{uhTop("completed",true);uhTop("completedDate",new Date().toISOString());onLog("HVAC tune & clean completed by "+h.techName);}}>
            ✓ Mark Tune & Clean Complete
          </button>
        ) : (
          <div style={{padding:"8px 12px",background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.3)",borderRadius:8,fontSize:12,color:"#22c55e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>✓ Completed{h.completedDate ? " — "+new Date(h.completedDate).toLocaleDateString() : ""}{h.techName ? " by "+h.techName : ""}</span>
            <button type="button" style={{...S.ghost,padding:"3px 8px",fontSize:10,color:"#f59e0b",borderColor:"rgba(245,158,11,.3)"}} onClick={()=>uhTop("completed",false)}>Undo</button>
          </div>
        )}
      </Sec>

      {/* ══════ FURNACE TUNE-UP ══════ */}
      <Sec title="🔥 Furnace Tune-Up">
        {guidePanel("furnace")}
        <div style={{fontSize:10,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"rgba(255,255,255,.02)",borderRadius:6,border:"1px solid rgba(255,255,255,.04)"}}>
          📸 <b>Photo required:</b> Furnace nameplate/tag, heat exchanger, any damage or issues found
        </div>
        <Gr>
          <Sel label="1. Furnace Make" value={f.make||""} onChange={v=>uh("furnace","make",v)} opts={HVAC_BRANDS}/>
          <F label="2. Model #" value={f.model||""} onChange={v=>uh("furnace","model",v)}/>
          <F label="3. Serial #" value={f.serial||""} onChange={v=>uh("furnace","serial",v)}/>
          <F label="4. Furnace Age (years)" value={f.age||""} onChange={v=>uh("furnace","age",v)} num/>
        </Gr>
        {Number(f.age) >= 15 && <div style={{padding:"6px 10px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6,fontSize:11,color:"#fbbf24",marginTop:4,marginBottom:4}}>⚠ Furnace is {f.age}+ years old — document thoroughly and consider replacement recommendation</div>}
        <DDField label="5. Condition of Heat Exchanger" section="furnace" field="heatExchanger" tip="Shine flashlight through burner ports. Any visible cracks = recommend replacement." opts={["","Good — no cracks or corrosion","Fair — minor surface rust, no cracks","Rust/corrosion present — monitor","Cracked — STOP, flag for replacement","Compromised — visible holes or separation","Could not inspect"]}/>
        <DDField label="6. Inducer Motor Operations & Condition" section="furnace" field="inducerMotor" opts={["","Operating normally — quiet","Noisy — grinding or rattling","Vibrating excessively","Weak/slow operation","Not operating","N/A — not equipped"]}/>
        <Gr>
          <DDField label="7. Ignitor Condition" section="furnace" field="ignitorCond" tip="Silicon nitride: 10-200Ω normal. Silicon carbide: 40-90Ω normal." opts={["","Good — clean, no cracks","Cracked — needs replacement","Weak glow — near end of life","Corroded","N/A — standing pilot"]}/>
          <F label="7b. Ignitor OHM Reading" value={f.ignitorOhm||""} onChange={v=>uh("furnace","ignitorOhm",v)} num/>
        </Gr>
        <DDField label="8. Burner Condition & Operations" section="furnace" field="burnerCond" tip="Blue/even flame = good. Yellow/orange/lifting = problem." opts={["","Clean — blue even flame","Dirty — needs cleaning","Corroded burners","Misaligned — flame rollout risk","Cracked burner tubes","Sooting/carbon buildup"]}/>
        <DDField label="9. Flame Sensor Condition" section="furnace" field="flameSensor" tip="Clean with fine steel wool. Should read 2-6 microamps." opts={["","Clean — good signal","Dirty — cleaned during service","Corroded — cleaned, monitor","Weak signal — may need replacement soon","Replaced","N/A — standing pilot"]}/>
        <Gr>
          <F label="10. Filter Size" value={f.filterSize||""} onChange={v=>uh("furnace","filterSize",v)}/>
          <Sel label="11. Filter Changed?" value={f.filterChanged||""} onChange={v=>uh("furnace","filterChanged",v)} opts={YN_OPTS}/>
        </Gr>
        <DDField label="12. Blower Motor Operations & Condition" section="furnace" field="blowerMotor" opts={["","Operating normally — quiet","Noisy — bearing wear","Vibrating","Overheating — hot to touch","Weak airflow","Not operating","ECM motor — operating normally","ECM motor — error codes"]}/>
        <DDField label="13. Control Board Operations & Condition" section="furnace" field="controlBoard" tip="Check for error/fault codes. Note any blinking LED patterns." opts={["","Operating normally — no fault codes","Error codes present (note in findings)","Burn marks or discoloration","Intermittent operation","Corroded connections","Needs replacement"]}/>
        <DDField label="14. Thermostat Location & Condition" section="furnace" field="thermostat" tip="📸 Take photo — offer smart thermostat upgrade." opts={["","Digital programmable — working","Manual/dial — recommend upgrade","Smart thermostat — working","Inaccurate readings","Poor location (drafty/direct sun)","Not communicating with system"]}/>
        <Gr>
          <F label="AFUE Pre-Tune Up" value={f.afuePre||""} onChange={v=>uh("furnace","afuePre",v)} num/>
          <F label="AFUE Post-Tune Up" value={f.afuePost||""} onChange={v=>uh("furnace","afuePost",v)} num/>
        </Gr>
        {f.afuePre && f.afuePost && Number(f.afuePost) > Number(f.afuePre) && <div style={{fontSize:11,color:"#22c55e",marginTop:4}}>↑ Improved {(Number(f.afuePost)-Number(f.afuePre)).toFixed(1)}% AFUE after tune-up</div>}
        <div style={{marginTop:6}}>
          <label style={S.fl}>15. Furnace Findings & Recommendations</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
            {["System operating normally","Needs minor repair","Needs major repair","Recommend replacement — age","Recommend replacement — cracked HX","Recommend replacement — safety concern","Cleaned and serviced — good condition","Parts ordered — follow-up needed"].map(tag=>{
              const tags = f.findings?.split("; ").filter(Boolean) || [];
              const has = tags.includes(tag);
              return <button key={tag} type="button" onClick={()=>{
                const next = has ? tags.filter(t=>t!==tag) : [...tags,tag];
                uh("furnace","findings",next.join("; "));
              }} style={{padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                border:has?"1px solid rgba(37,99,235,.5)":"1px solid rgba(255,255,255,.1)",
                background:has?"rgba(37,99,235,.15)":"rgba(255,255,255,.03)",
                color:has?"#93C5FD":"#94a3b8"
              }}>{has?"✓ ":""}{tag}</button>;
            })}
          </div>
          <textarea style={S.ta} rows={2} value={f.findingsNotes||""} onChange={e=>uh("furnace","findingsNotes",e.target.value)} placeholder="Additional notes (only if needed)…"/>
        </div>
      </Sec>

      {/* ══════ WATER HEATER CHECK-UP ══════ */}
      <Sec title="🚿 Water Heater Check-Up">
        {guidePanel("waterHeater")}
        <div style={{fontSize:10,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"rgba(255,255,255,.02)",borderRadius:6,border:"1px solid rgba(255,255,255,.04)"}}>
          📸 <b>Photos required:</b> Nameplate/tag, overall condition, venting, burners, any issues
        </div>
        <Gr>
          <Sel label="16. Water Heater Make" value={w.make||""} onChange={v=>uh("waterHeater","make",v)} opts={[...HVAC_BRANDS.slice(0,1),"A.O. Smith","Bradford White","Rheem","State","Kenmore","Rinnai","Navien","Noritz",...HVAC_BRANDS.slice(1)]}/>
          <F label="17. Model #" value={w.model||""} onChange={v=>uh("waterHeater","model",v)}/>
          <F label="18. Serial #" value={w.serial||""} onChange={v=>uh("waterHeater","serial",v)}/>
          <F label="19. Age (years)" value={w.age||""} onChange={v=>uh("waterHeater","age",v)} num/>
        </Gr>
        {Number(w.age) >= 12 && <div style={{padding:"6px 10px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6,fontSize:11,color:"#fbbf24",marginTop:4,marginBottom:4}}>⚠ Water heater is {w.age}+ years old — document thoroughly and consider replacement</div>}
        <DDField label="20. Water Heater Condition" section="waterHeater" field="condition" tip="📸 Take photos of overall condition, any rust/leaks." opts={["","Good — no issues","Fair — minor surface rust","Corroded — moderate to heavy","Leaking from tank","Sediment buildup (heavy drain)","T&P valve releasing/weeping","Pilot issues","Needs replacement"]}/>
        <DDField label="21. Water Heater Venting" section="waterHeater" field="venting" tip="📸 Check pitch (¼″ per foot up), connections, corrosion. Draft test after 5 min operation." opts={["","Proper pitch and connections — good","Minor corrosion — serviceable","Corroded/deteriorating — needs repair","Disconnected joint(s)","Improper pitch — condensation risk","Single-wall in attic — code issue","Backdrafting — SAFETY CONCERN","Orphaned (no longer connected)","Power vent — operating normally"]}/>
        <DDField label="22. Water Heater Burners" section="waterHeater" field="burners" tip="📸 Take photo of burner assembly. Blue flame = good." opts={["","Clean — operating normally","Dirty — needs cleaning","Corroded","Flame irregular/yellow","Sooting present","Cleaned during service"]}/>
        <div style={{marginTop:6}}>
          <label style={S.fl}>23. Water Heater Recommendations</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
            {["Good condition — no action","Cleaned and serviced","Needs minor repair","Needs T&P valve replacement","Venting needs repair","Recommend replacement — age","Recommend replacement — leaking","Recommend replacement — safety","Sediment flush recommended","Follow-up needed"].map(tag=>{
              const tags = w.findings?.split("; ").filter(Boolean) || [];
              const has = tags.includes(tag);
              return <button key={tag} type="button" onClick={()=>{
                const next = has ? tags.filter(t=>t!==tag) : [...tags,tag];
                uh("waterHeater","findings",next.join("; "));
              }} style={{padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                border:has?"1px solid rgba(37,99,235,.5)":"1px solid rgba(255,255,255,.1)",
                background:has?"rgba(37,99,235,.15)":"rgba(255,255,255,.03)",
                color:has?"#93C5FD":"#94a3b8"
              }}>{has?"✓ ":""}{tag}</button>;
            })}
          </div>
          <textarea style={S.ta} rows={2} value={w.findingsNotes||""} onChange={e=>uh("waterHeater","findingsNotes",e.target.value)} placeholder="Additional notes (only if needed)…"/>
        </div>
      </Sec>

      {/* ══════ A/C TUNE-UP ══════ */}
      <Sec title="❄️ A/C Condenser Tune-Up">
        {guidePanel("condenser")}
        <div style={{fontSize:10,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"rgba(255,255,255,.02)",borderRadius:6,border:"1px solid rgba(255,255,255,.04)"}}>
          📸 <b>Photos required:</b> Condenser nameplate/tag, overall condition, any damage, electrical components
        </div>
        <Gr>
          <Sel label="24. Condenser Make" value={c.make||""} onChange={v=>uh("condenser","make",v)} opts={HVAC_BRANDS}/>
          <F label="25. Model #" value={c.model||""} onChange={v=>uh("condenser","model",v)}/>
          <F label="26. Serial #" value={c.serial||""} onChange={v=>uh("condenser","serial",v)}/>
          <F label="27. Age (years)" value={c.age||""} onChange={v=>uh("condenser","age",v)} num/>
        </Gr>
        {Number(c.age) >= 12 && <div style={{padding:"6px 10px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6,fontSize:11,color:"#fbbf24",marginTop:4,marginBottom:4}}>⚠ A/C is {c.age}+ years old — check for R-22 refrigerant and consider replacement</div>}
        <DDField label="28. Condenser Condition" section="condenser" field="condition" tip="📸 Take photos of any damage, bent fins, corrosion." opts={["","Good — clean and operational","Fair — minor fin damage","Dirty — needs cleaning","Damaged fins — moderate","Rust/corrosion present","Refrigerant leak suspected","Compressor noisy","Not operating","Recommend replacement"]}/>
        <Sel label="29. Condenser Coils Cleaned?" value={c.coilsCleaned||""} onChange={v=>uh("condenser","coilsCleaned",v)} opts={YN_OPTS}/>
        <DDField label="30. Electrical Components, Whip & Disconnect" section="condenser" field="electrical" tip="Check disconnect for burn marks. Check contactor for pitting. Check capacitor for bulging." opts={["","All components good condition","Whip damaged/deteriorating","Disconnect corroded","Contactor pitted — needs replacement","Capacitor bulging — needs replacement","Wiring issues found","Loose connections — tightened","Needs electrical repair"]}/>
        <div>
          <label style={S.fl}>31. Refrigerant Pressures</label>
          <Gr>
            <F label="Suction (low side) PSI" value={c.suctionPSI||""} onChange={v=>uh("condenser","suctionPSI",v)} num/>
            <F label="Discharge (high side) PSI" value={c.dischargePSI||""} onChange={v=>uh("condenser","dischargePSI",v)} num/>
            <Sel label="Refrigerant Type" value={c.refrigerant||""} onChange={v=>uh("condenser","refrigerant",v)} opts={["","R-410A","R-22","R-407C","R-134a","Unknown"]}/>
          </Gr>
          {c.refrigerant === "R-22" && <div style={{padding:"6px 10px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.3)",borderRadius:6,fontSize:11,color:"#ef4444",marginTop:4}}>⚠ R-22 is phased out — if system needs charge, recommend replacement to R-410A system</div>}
        </div>
        <DDField label="32. Exposed Line Set Condition" section="condenser" field="lineSet" tip="📸 Check suction line insulation (larger line). Missing = efficiency loss." opts={["","Good condition — insulation intact","Insulation damaged/missing","Kinked line","Exposed/unsecured sections","Corroded fittings","Oil stains — possible leak"]}/>
        <DDField label="33. Other Issues (piping, venting, drainage)" section="condenser" field="otherIssues" opts={["","No other issues","Condensate drain clogged","Condensate drain missing trap","Drain line damaged","Piping needs support/securing","Venting issue found (note below)"]}/>
        <DDField label="34. Evaporator Coil Condition" section="condenser" field="evapCoil" opts={["","Clean — good condition","Dirty — needs cleaning","Corroded","Leaking — refrigerant","Frozen/icing — airflow issue","Could not access for inspection"]}/>
      </Sec>

      {/* ══════ WHOLE SYSTEM ASSESSMENT ══════ */}
      <Sec title="📝 Whole System Assessment & Notes">
        {guidePanel("replacement")}
        <label style={S.fl}>35. Overall Details, Notes & Recommendations</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
          {["All systems operating — good condition","Furnace needs replacement","A/C needs replacement","Water heater needs replacement","Minor repairs needed — see notes","Safety concern identified","Follow-up visit required","Customer declined recommended repairs","Parts on order"].map(tag=>{
            const tags = h.systemNotes?.split("; ").filter(Boolean) || [];
            const has = tags.includes(tag);
            return <button key={tag} type="button" onClick={()=>{
              const next = has ? tags.filter(t=>t!==tag) : [...tags,tag];
              uhTop("systemNotes",next.join("; "));
            }} style={{padding:"5px 12px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              border:has?"1px solid rgba(37,99,235,.5)":"1px solid rgba(255,255,255,.1)",
              background:has?"rgba(37,99,235,.15)":"rgba(255,255,255,.03)",
              color:has?"#93C5FD":"#94a3b8"
            }}>{has?"✓ ":""}{tag}</button>;
          })}
        </div>
        <textarea style={S.ta} rows={3} value={h.detailNotes||""} onChange={e=>uhTop("detailNotes",e.target.value)} placeholder="Any additional details, observations, or special circumstances…"/>

        {/* Replacement Request for scope team */}
        {(h.systemNotes||"").includes("replacement") && <div style={{marginTop:10,padding:"10px 12px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.2)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:4}}>🔄 Replacement Identified</div>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>Fill in details below and submit a replacement request. Admin will review and approve/deny.</div>
          <Gr>
            <Sel label="Replacement Priority" value={h.replacePriority||""} onChange={v=>uhTop("replacePriority",v)} opts={["","Urgent — safety issue","Soon — failing equipment","Planned — end of life","Customer request"]}/>
            <Sel label="Replacement Type" value={h.replaceType||""} onChange={v=>uhTop("replaceType",v)} opts={["","Furnace only","A/C only","Furnace + A/C","Water heater only","Full system"]}/>
          </Gr>
          <textarea style={{...S.ta,marginTop:6,minHeight:40}} value={h.replaceJustification||""} onChange={e=>uhTop("replaceJustification",e.target.value)} placeholder="Justification — describe why replacement is needed (condition, safety concerns, age, etc.)..." rows={2}/>
          {/* Submit request */}
          {!h.replaceRequestStatus && <button type="button" style={{...S.ghost,borderColor:"#f59e0b",color:"#f59e0b",padding:"10px 16px",marginTop:6,width:"100%",fontSize:12,fontWeight:600,opacity:(h.replacePriority&&h.replaceType)?1:.4}} disabled={!h.replacePriority||!h.replaceType} onClick={()=>{
            u({hvac:{...h, replaceRequestStatus:"pending", replaceRequestDate:new Date().toISOString(), replaceRequestBy:user}});
            onLog(`🔄 Replacement request submitted: ${h.replaceType} — ${h.replacePriority}`);
          }}>🔄 Submit Replacement Request</button>}
          {/* Status display */}
          {h.replaceRequestStatus==="pending" && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6}}>
            <div style={{fontSize:11,color:"#fbbf24",fontWeight:600}}>⏳ Replacement Request Pending</div>
            <div style={{fontSize:10,color:"#64748b"}}>Submitted by {h.replaceRequestBy} · {h.replaceRequestDate?new Date(h.replaceRequestDate).toLocaleString():""}</div>
            {/* Admin approve/deny */}
            {(role==="admin"||role==="scope") && <div style={{marginTop:6,display:"flex",gap:6}}>
              <textarea style={{...S.ta,flex:1,minHeight:30}} value={h._replResp||""} onChange={e=>uhTop("_replResp",e.target.value)} placeholder="Response (internal)..." rows={1}/>
              <button type="button" style={{padding:"8px 16px",borderRadius:6,border:"1px solid rgba(34,197,94,.4)",background:"rgba(34,197,94,.1)",color:"#22c55e",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>{
                u({hvac:{...h, replaceRequestStatus:"approved", replaceResponse:h._replResp||""}, mechNeeded:true, mechStatus:"approved", mechDate:new Date().toISOString().slice(0,10)});
                onLog(`✅ Replacement APPROVED: ${h.replaceType}`);
              }}>✓ Approve</button>
              <button type="button" style={{padding:"8px 16px",borderRadius:6,border:"1px solid rgba(239,68,68,.4)",background:"rgba(239,68,68,.1)",color:"#ef4444",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>{
                u({hvac:{...h, replaceRequestStatus:"denied", replaceResponse:h._replResp||""}});
                onLog(`❌ Replacement DENIED: ${h.replaceType}`);
              }}>✕ Deny</button>
            </div>}
          </div>}
          {h.replaceRequestStatus==="approved" && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:6}}>
            <div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>✅ Replacement APPROVED</div>
            {h.replaceResponse && (role==="admin"||role==="scope") && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Internal: {h.replaceResponse}</div>}
            <div style={{fontSize:10,color:"#64748b",marginTop:2}}>Scope team will build replacement into the project scope.</div>
          </div>}
          {h.replaceRequestStatus==="denied" && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:6}}>
            <div style={{fontSize:11,color:"#ef4444",fontWeight:600}}>❌ Replacement Denied</div>
            {h.replaceResponse && (role==="admin"||role==="scope") && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Internal: {h.replaceResponse}</div>}
          </div>}
        </div>}
      </Sec>
    </div>
  );
}
