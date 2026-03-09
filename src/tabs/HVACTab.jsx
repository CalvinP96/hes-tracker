import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, HVAC_BRANDS, COND_OPTS, YN_OPTS, HVAC_GUIDES, PHOTO_SECTIONS } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount } from "../helpers/index.js";
import { Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function HVACTab({p,u,onLog,user,role}) {
  const h = p.hvac || {};
  const uh = (section,key,val) => u({hvac:{...h,[section]:{...(h[section]||{}),[key]:val}}});
  const uhTop = (key,val) => u({hvac:{...h,[key]:val}});
  const f = h.furnace || {};
  const w = h.waterHeater || {};
  const c = h.condenser || {};
  const [guide,setGuide] = useState(null);

  const getHVACHTML = () => {
    const v = (x) => x || "â€”";
    const cell = (num,label,val) => `<td style="border:1px solid #999;padding:6px 8px;width:50%;vertical-align:top"><span style="font-weight:700">${num}. ${label}</span><br/><span style="color:#333">${v(val)}</span></td>`;
    const row2 = (n1,l1,v1,n2,l2,v2) => `<tr>${cell(n1,l1,v1)}${cell(n2,l2,v2)}</tr>`;
    const row1 = (num,label,val) => `<tr><td colspan="2" style="border:1px solid #999;padding:6px 8px"><span style="font-weight:700">${num}. ${label}</span><br/><span style="color:#333">${v(val)}</span></td></tr>`;
    const secHdr = (title) => `<tr><td colspan="2" style="border:2px solid #333;padding:8px 10px;background:#f0f0f0;font-weight:700;font-size:14px">${title}</td></tr>`;
    const afueRow = `<tr><td style="border:1px solid #999;padding:6px 8px;background:#ffe;font-weight:600">AFUE Pre-Tune Up: <span style="color:#1E3A8A">${v(f.afuePre)}%</span></td><td style="border:1px solid #999;padding:6px 8px;background:#ffe;font-weight:600">AFUE Post-Tune Up: <span style="color:#16a34a">${v(f.afuePost)}%</span></td></tr>`;
    const findingsTags = (findings) => findings ? findings.split("; ").map(t=>`<span style="display:inline-block;padding:2px 8px;margin:2px;border-radius:3px;background:#e8f4fd;border:1px solid #b8d9f0;font-size:10px">${t}</span>`).join("") : "â€”";
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
${row2(7,"Ignitor Condition & OHM Reading",(f.ignitorCond||"")+(f.ignitorOhm?" Â· "+f.ignitorOhm+"Î©":""),8,"Burner Condition & Operations",f.burnerCond)}
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
${row2(30,"Electrical Components, Whip & Disconnect",c.electrical,31,"Refrigerant Pressures",(c.suctionPSI?"Suction: "+c.suctionPSI+" PSI":"")+(c.dischargePSI?" Â· Discharge: "+c.dischargePSI+" PSI":"")+(c.refrigerant?" Â· "+c.refrigerant:""))}
${row2(32,"Exposed Line Set Condition",c.lineSet,33,"Other Issues (piping, venting, drainage)",c.otherIssues)}
${row1(34,"Evaporator Coil Condition",c.evapCoil)}

${secHdr("WHOLE SYSTEM ASSESSMENT")}
${row1(35,"Details, Notes & Recommendations",findingsTags(h.systemNotes)+(h.detailNotes?"<br/><span style='font-size:11px;color:#555'>"+h.detailNotes+"</span>":""))}
${(h.systemNotes||"").includes("replacement")?`<tr><td colspan="2" style="border:1px solid #999;padding:6px 8px;background:#fff3cd"><b>âš  Replacement Flagged</b> â€” Priority: ${v(h.replacePriority)} Â· Type: ${v(h.replaceType)}</td></tr>`:""}
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

  // Dropdown field â€” HVAC specific, no "Other" needed (options are comprehensive)
  const DDField = ({label,section,field,opts,tip}) => {
    const val = (section?h[section]?.[field]:h[field]) || "";
    const set = (v) => section ? uh(section,field,v) : uhTop(field,v);
    return <div style={{marginBottom:4}}>
      <label style={S.fl}>{label}</label>
      <select style={S.inp} value={val} onChange={e=>set(e.target.value)}>
        {opts.map(o=><option key={o} value={o}>{o||"â€” Select â€”"}</option>)}
      </select>
      {tip && <div style={{fontSize:9,color:"#64748b",marginTop:2}}>ðŸ’¡ {tip}</div>}
    </div>;
  };

  const guidePanel = (key) => {
    const g = HVAC_GUIDES[key];
    if (!g) return null;
    const open = guide === key;
    return <div style={{marginBottom:8}}>
      <button type="button" onClick={()=>setGuide(open?null:key)} style={{...S.ghost,width:"100%",textAlign:"left",padding:"8px 12px",fontSize:12,color:"#f59e0b",borderColor:"rgba(245,158,11,.2)",background:open?"rgba(245,158,11,.06)":"transparent"}}>
        {open?"â–¾":"â–¸"} {g.title}
      </button>
      {open && <div style={{padding:"8px 12px",background:"rgba(245,158,11,.04)",border:"1px solid rgba(245,158,11,.1)",borderTop:"none",borderRadius:"0 0 8px 8px",fontSize:11}}>
        {g.tips.map((t,i)=><div key={i} style={{padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)",color:"#cbd5e1"}}>
          <span style={{color:"#f59e0b",marginRight:6}}>â€¢</span>{t}
        </div>)}
      </div>}
    </div>;
  };

  return (
    <div>
      <Sec title="HVAC Tune & Clean">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Complete all sections that apply. Use dropdowns â€” only use "Other" if none fit.</p>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <F label="Technician" value={h.techName||""} onChange={v=>uhTop("techName",v)}/>
            <F label="Manager" value={h.managerName||""} onChange={v=>uhTop("managerName",v)}/>
            <PrintBtn onClick={()=>savePrint(getHVACHTML())}/>
          </div>
        </div>
        {!h.completed ? (
          <button type="button" style={{...S.btn,width:"100%",padding:"10px",fontSize:13,opacity:h.techName?.trim()?.length>0?1:.4}} disabled={!h.techName?.trim()} onClick={()=>{uhTop("completed",true);uhTop("completedDate",new Date().toISOString());onLog("HVAC tune & clean completed by "+h.techName);}}>
            âœ“ Mark Tune & Clean Complete
          </button>
        ) : (
          <div style={{padding:"8px 12px",background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.3)",borderRadius:8,fontSize:12,color:"#22c55e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>âœ“ Completed{h.completedDate ? " â€” "+new Date(h.completedDate).toLocaleDateString() : ""}{h.techName ? " by "+h.techName : ""}</span>
            <button type="button" style={{...S.ghost,padding:"3px 8px",fontSize:10,color:"#f59e0b",borderColor:"rgba(245,158,11,.3)"}} onClick={()=>uhTop("completed",false)}>Undo</button>
          </div>
        )}
      </Sec>

      {/* â•â•â•â•â•â• FURNACE TUNE-UP â•â•â•â•â•â• */}
      <Sec title="ðŸ”¥ Furnace Tune-Up">
        {guidePanel("furnace")}
        <div style={{fontSize:10,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"rgba(255,255,255,.02)",borderRadius:6,border:"1px solid rgba(255,255,255,.04)"}}>
          ðŸ“¸ <b>Photo required:</b> Furnace nameplate/tag, heat exchanger, any damage or issues found
        </div>
        <Gr>
          <Sel label="1. Furnace Make" value={f.make||""} onChange={v=>uh("furnace","make",v)} opts={HVAC_BRANDS}/>
          <F label="2. Model #" value={f.model||""} onChange={v=>uh("furnace","model",v)}/>
          <F label="3. Serial #" value={f.serial||""} onChange={v=>uh("furnace","serial",v)}/>
          <F label="4. Furnace Age (years)" value={f.age||""} onChange={v=>uh("furnace","age",v)} num/>
        </Gr>
        {Number(f.age) >= 15 && <div style={{padding:"6px 10px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6,fontSize:11,color:"#fbbf24",marginTop:4,marginBottom:4}}>âš  Furnace is {f.age}+ years old â€” document thoroughly and consider replacement recommendation</div>}
        <DDField label="5. Condition of Heat Exchanger" section="furnace" field="heatExchanger" tip="Shine flashlight through burner ports. Any visible cracks = recommend replacement." opts={["","Good â€” no cracks or corrosion","Fair â€” minor surface rust, no cracks","Rust/corrosion present â€” monitor","Cracked â€” STOP, flag for replacement","Compromised â€” visible holes or separation","Could not inspect"]}/>
        <DDField label="6. Inducer Motor Operations & Condition" section="furnace" field="inducerMotor" opts={["","Operating normally â€” quiet","Noisy â€” grinding or rattling","Vibrating excessively","Weak/slow operation","Not operating","N/A â€” not equipped"]}/>
        <Gr>
          <DDField label="7. Ignitor Condition" section="furnace" field="ignitorCond" tip="Silicon nitride: 10-200Î© normal. Silicon carbide: 40-90Î© normal." opts={["","Good â€” clean, no cracks","Cracked â€” needs replacement","Weak glow â€” near end of life","Corroded","N/A â€” standing pilot"]}/>
          <F label="7b. Ignitor OHM Reading" value={f.ignitorOhm||""} onChange={v=>uh("furnace","ignitorOhm",v)} num/>
        </Gr>
        <DDField label="8. Burner Condition & Operations" section="furnace" field="burnerCond" tip="Blue/even flame = good. Yellow/orange/lifting = problem." opts={["","Clean â€” blue even flame","Dirty â€” needs cleaning","Corroded burners","Misaligned â€” flame rollout risk","Cracked burner tubes","Sooting/carbon buildup"]}/>
        <DDField label="9. Flame Sensor Condition" section="furnace" field="flameSensor" tip="Clean with fine steel wool. Should read 2-6 microamps." opts={["","Clean â€” good signal","Dirty â€” cleaned during service","Corroded â€” cleaned, monitor","Weak signal â€” may need replacement soon","Replaced","N/A â€” standing pilot"]}/>
        <Gr>
          <F label="10. Filter Size" value={f.filterSize||""} onChange={v=>uh("furnace","filterSize",v)}/>
          <Sel label="11. Filter Changed?" value={f.filterChanged||""} onChange={v=>uh("furnace","filterChanged",v)} opts={YN}/>
        </Gr>
        <DDField label="12. Blower Motor Operations & Condition" section="furnace" field="blowerMotor" opts={["","Operating normally â€” quiet","Noisy â€” bearing wear","Vibrating","Overheating â€” hot to touch","Weak airflow","Not operating","ECM motor â€” operating normally","ECM motor â€” error codes"]}/>
        <DDField label="13. Control Board Operations & Condition" section="furnace" field="controlBoard" tip="Check for error/fault codes. Note any blinking LED patterns." opts={["","Operating normally â€” no fault codes","Error codes present (note in findings)","Burn marks or discoloration","Intermittent operation","Corroded connections","Needs replacement"]}/>
        <DDField label="14. Thermostat Location & Condition" section="furnace" field="thermostat" tip="ðŸ“¸ Take photo â€” offer smart thermostat upgrade." opts={["","Digital programmable â€” working","Manual/dial â€” recommend upgrade","Smart thermostat â€” working","Inaccurate readings","Poor location (drafty/direct sun)","Not communicating with system"]}/>
        <Gr>
          <F label="AFUE Pre-Tune Up" value={f.afuePre||""} onChange={v=>uh("furnace","afuePre",v)} num/>
          <F label="AFUE Post-Tune Up" value={f.afuePost||""} onChange={v=>uh("furnace","afuePost",v)} num/>
        </Gr>
        {f.afuePre && f.afuePost && Number(f.afuePost) > Number(f.afuePre) && <div style={{fontSize:11,color:"#22c55e",marginTop:4}}>â†‘ Improved {(Number(f.afuePost)-Number(f.afuePre)).toFixed(1)}% AFUE after tune-up</div>}
        <div style={{marginTop:6}}>
          <label style={S.fl}>15. Furnace Findings & Recommendations</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
            {["System operating normally","Needs minor repair","Needs major repair","Recommend replacement â€” age","Recommend replacement â€” cracked HX","Recommend replacement â€” safety concern","Cleaned and serviced â€” good condition","Parts ordered â€” follow-up needed"].map(tag=>{
              const tags = f.findings?.split("; ").filter(Boolean) || [];
              const has = tags.includes(tag);
              return <button key={tag} type="button" onClick={()=>{
                const next = has ? tags.filter(t=>t!==tag) : [...tags,tag];
                uh("furnace","findings",next.join("; "));
              }} style={{padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                border:has?"1px solid rgba(37,99,235,.5)":"1px solid rgba(255,255,255,.1)",
                background:has?"rgba(37,99,235,.15)":"rgba(255,255,255,.03)",
                color:has?"#93C5FD":"#94a3b8"
              }}>{has?"âœ“ ":""}{tag}</button>;
            })}
          </div>
          <textarea style={S.ta} rows={2} value={f.findingsNotes||""} onChange={e=>uh("furnace","findingsNotes",e.target.value)} placeholder="Additional notes (only if needed)â€¦"/>
        </div>
      </Sec>

      {/* â•â•â•â•â•â• WATER HEATER CHECK-UP â•â•â•â•â•â• */}
      <Sec title="ðŸš¿ Water Heater Check-Up">
        {guidePanel("waterHeater")}
        <div style={{fontSize:10,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"rgba(255,255,255,.02)",borderRadius:6,border:"1px solid rgba(255,255,255,.04)"}}>
          ðŸ“¸ <b>Photos required:</b> Nameplate/tag, overall condition, venting, burners, any issues
        </div>
        <Gr>
          <Sel label="16. Water Heater Make" value={w.make||""} onChange={v=>uh("waterHeater","make",v)} opts={[...HVAC_BRANDS.slice(0,1),"A.O. Smith","Bradford White","Rheem","State","Kenmore","Rinnai","Navien","Noritz",...HVAC_BRANDS.slice(1)]}/>
          <F label="17. Model #" value={w.model||""} onChange={v=>uh("waterHeater","model",v)}/>
          <F label="18. Serial #" value={w.serial||""} onChange={v=>uh("waterHeater","serial",v)}/>
          <F label="19. Age (years)" value={w.age||""} onChange={v=>uh("waterHeater","age",v)} num/>
        </Gr>
        {Number(w.age) >= 12 && <div style={{padding:"6px 10px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6,fontSize:11,color:"#fbbf24",marginTop:4,marginBottom:4}}>âš  Water heater is {w.age}+ years old â€” document thoroughly and consider replacement</div>}
        <DDField label="20. Water Heater Condition" section="waterHeater" field="condition" tip="ðŸ“¸ Take photos of overall condition, any rust/leaks." opts={["","Good â€” no issues","Fair â€” minor surface rust","Corroded â€” moderate to heavy","Leaking from tank","Sediment buildup (heavy drain)","T&P valve releasing/weeping","Pilot issues","Needs replacement"]}/>
        <DDField label="21. Water Heater Venting" section="waterHeater" field="venting" tip="ðŸ“¸ Check pitch (Â¼â€³ per foot up), connections, corrosion. Draft test after 5 min operation." opts={["","Proper pitch and connections â€” good","Minor corrosion â€” serviceable","Corroded/deteriorating â€” needs repair","Disconnected joint(s)","Improper pitch â€” condensation risk","Single-wall in attic â€” code issue","Backdrafting â€” SAFETY CONCERN","Orphaned (no longer connected)","Power vent â€” operating normally"]}/>
        <DDField label="22. Water Heater Burners" section="waterHeater" field="burners" tip="ðŸ“¸ Take photo of burner assembly. Blue flame = good." opts={["","Clean â€” operating normally","Dirty â€” needs cleaning","Corroded","Flame irregular/yellow","Sooting present","Cleaned during service"]}/>
        <div style={{marginTop:6}}>
          <label style={S.fl}>23. Water Heater Recommendations</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
            {["Good condition â€” no action","Cleaned and serviced","Needs minor repair","Needs T&P valve replacement","Venting needs repair","Recommend replacement â€” age","Recommend replacement â€” leaking","Recommend replacement â€” safety","Sediment flush recommended","Follow-up needed"].map(tag=>{
              const tags = w.findings?.split("; ").filter(Boolean) || [];
              const has = tags.includes(tag);
              return <button key={tag} type="button" onClick={()=>{
                const next = has ? tags.filter(t=>t!==tag) : [...tags,tag];
                uh("waterHeater","findings",next.join("; "));
              }} style={{padding:"4px 10px",borderRadius:5,fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                border:has?"1px solid rgba(37,99,235,.5)":"1px solid rgba(255,255,255,.1)",
                background:has?"rgba(37,99,235,.15)":"rgba(255,255,255,.03)",
                color:has?"#93C5FD":"#94a3b8"
              }}>{has?"âœ“ ":""}{tag}</button>;
            })}
          </div>
          <textarea style={S.ta} rows={2} value={w.findingsNotes||""} onChange={e=>uh("waterHeater","findingsNotes",e.target.value)} placeholder="Additional notes (only if needed)â€¦"/>
        </div>
      </Sec>

      {/* â•â•â•â•â•â• A/C TUNE-UP â•â•â•â•â•â• */}
      <Sec title="â„ï¸ A/C Condenser Tune-Up">
        {guidePanel("condenser")}
        <div style={{fontSize:10,color:"#64748b",marginBottom:8,padding:"6px 10px",background:"rgba(255,255,255,.02)",borderRadius:6,border:"1px solid rgba(255,255,255,.04)"}}>
          ðŸ“¸ <b>Photos required:</b> Condenser nameplate/tag, overall condition, any damage, electrical components
        </div>
        <Gr>
          <Sel label="24. Condenser Make" value={c.make||""} onChange={v=>uh("condenser","make",v)} opts={HVAC_BRANDS}/>
          <F label="25. Model #" value={c.model||""} onChange={v=>uh("condenser","model",v)}/>
          <F label="26. Serial #" value={c.serial||""} onChange={v=>uh("condenser","serial",v)}/>
          <F label="27. Age (years)" value={c.age||""} onChange={v=>uh("condenser","age",v)} num/>
        </Gr>
        {Number(c.age) >= 12 && <div style={{padding:"6px 10px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6,fontSize:11,color:"#fbbf24",marginTop:4,marginBottom:4}}>âš  A/C is {c.age}+ years old â€” check for R-22 refrigerant and consider replacement</div>}
        <DDField label="28. Condenser Condition" section="condenser" field="condition" tip="ðŸ“¸ Take photos of any damage, bent fins, corrosion." opts={["","Good â€” clean and operational","Fair â€” minor fin damage","Dirty â€” needs cleaning","Damaged fins â€” moderate","Rust/corrosion present","Refrigerant leak suspected","Compressor noisy","Not operating","Recommend replacement"]}/>
        <Sel label="29. Condenser Coils Cleaned?" value={c.coilsCleaned||""} onChange={v=>uh("condenser","coilsCleaned",v)} opts={YN}/>
        <DDField label="30. Electrical Components, Whip & Disconnect" section="condenser" field="electrical" tip="Check disconnect for burn marks. Check contactor for pitting. Check capacitor for bulging." opts={["","All components good condition","Whip damaged/deteriorating","Disconnect corroded","Contactor pitted â€” needs replacement","Capacitor bulging â€” needs replacement","Wiring issues found","Loose connections â€” tightened","Needs electrical repair"]}/>
        <div>
          <label style={S.fl}>31. Refrigerant Pressures</label>
          <Gr>
            <F label="Suction (low side) PSI" value={c.suctionPSI||""} onChange={v=>uh("condenser","suctionPSI",v)} num/>
            <F label="Discharge (high side) PSI" value={c.dischargePSI||""} onChange={v=>uh("condenser","dischargePSI",v)} num/>
            <Sel label="Refrigerant Type" value={c.refrigerant||""} onChange={v=>uh("condenser","refrigerant",v)} opts={["","R-410A","R-22","R-407C","R-134a","Unknown"]}/>
          </Gr>
          {c.refrigerant === "R-22" && <div style={{padding:"6px 10px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.3)",borderRadius:6,fontSize:11,color:"#ef4444",marginTop:4}}>âš  R-22 is phased out â€” if system needs charge, recommend replacement to R-410A system</div>}
        </div>
        <DDField label="32. Exposed Line Set Condition" section="condenser" field="lineSet" tip="ðŸ“¸ Check suction line insulation (larger line). Missing = efficiency loss." opts={["","Good condition â€” insulation intact","Insulation damaged/missing","Kinked line","Exposed/unsecured sections","Corroded fittings","Oil stains â€” possible leak"]}/>
        <DDField label="33. Other Issues (piping, venting, drainage)" section="condenser" field="otherIssues" opts={["","No other issues","Condensate drain clogged","Condensate drain missing trap","Drain line damaged","Piping needs support/securing","Venting issue found (note below)"]}/>
        <DDField label="34. Evaporator Coil Condition" section="condenser" field="evapCoil" opts={["","Clean â€” good condition","Dirty â€” needs cleaning","Corroded","Leaking â€” refrigerant","Frozen/icing â€” airflow issue","Could not access for inspection"]}/>
      </Sec>

      {/* â•â•â•â•â•â• WHOLE SYSTEM ASSESSMENT â•â•â•â•â•â• */}
      <Sec title="ðŸ“ Whole System Assessment & Notes">
        {guidePanel("replacement")}
        <label style={S.fl}>35. Overall Details, Notes & Recommendations</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
          {["All systems operating â€” good condition","Furnace needs replacement","A/C needs replacement","Water heater needs replacement","Minor repairs needed â€” see notes","Safety concern identified","Follow-up visit required","Customer declined recommended repairs","Parts on order"].map(tag=>{
            const tags = h.systemNotes?.split("; ").filter(Boolean) || [];
            const has = tags.includes(tag);
            return <button key={tag} type="button" onClick={()=>{
              const next = has ? tags.filter(t=>t!==tag) : [...tags,tag];
              uhTop("systemNotes",next.join("; "));
            }} style={{padding:"5px 12px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              border:has?"1px solid rgba(37,99,235,.5)":"1px solid rgba(255,255,255,.1)",
              background:has?"rgba(37,99,235,.15)":"rgba(255,255,255,.03)",
              color:has?"#93C5FD":"#94a3b8"
            }}>{has?"âœ“ ":""}{tag}</button>;
          })}
        </div>
        <textarea style={S.ta} rows={3} value={h.detailNotes||""} onChange={e=>uhTop("detailNotes",e.target.value)} placeholder="Any additional details, observations, or special circumstancesâ€¦"/>

        {/* Replacement Request for scope team */}
        {(h.systemNotes||"").includes("replacement") && <div style={{marginTop:10,padding:"10px 12px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.2)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:4}}>ðŸ”„ Replacement Identified</div>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>Fill in details below and submit a replacement request. Admin will review and approve/deny.</div>
          <Gr>
            <Sel label="Replacement Priority" value={h.replacePriority||""} onChange={v=>uhTop("replacePriority",v)} opts={["","Urgent â€” safety issue","Soon â€” failing equipment","Planned â€” end of life","Customer request"]}/>
            <Sel label="Replacement Type" value={h.replaceType||""} onChange={v=>uhTop("replaceType",v)} opts={["","Furnace only","A/C only","Furnace + A/C","Water heater only","Full system"]}/>
          </Gr>
          <textarea style={{...S.ta,marginTop:6,minHeight:40}} value={h.replaceJustification||""} onChange={e=>uhTop("replaceJustification",e.target.value)} placeholder="Justification â€” describe why replacement is needed (condition, safety concerns, age, etc.)..." rows={2}/>
          {/* Submit request */}
          {!h.replaceRequestStatus && <button type="button" style={{...S.ghost,borderColor:"#f59e0b",color:"#f59e0b",padding:"10px 16px",marginTop:6,width:"100%",fontSize:12,fontWeight:600,opacity:(h.replacePriority&&h.replaceType)?1:.4}} disabled={!h.replacePriority||!h.replaceType} onClick={()=>{
            u({hvac:{...h, replaceRequestStatus:"pending", replaceRequestDate:new Date().toISOString(), replaceRequestBy:user}});
            onLog(`ðŸ”„ Replacement request submitted: ${h.replaceType} â€” ${h.replacePriority}`);
          }}>ðŸ”„ Submit Replacement Request</button>}
          {/* Status display */}
          {h.replaceRequestStatus==="pending" && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6}}>
            <div style={{fontSize:11,color:"#fbbf24",fontWeight:600}}>â³ Replacement Request Pending</div>
            <div style={{fontSize:10,color:"#64748b"}}>Submitted by {h.replaceRequestBy} Â· {h.replaceRequestDate?new Date(h.replaceRequestDate).toLocaleString():""}</div>
            {/* Admin approve/deny */}
            {(role==="admin"||role==="scope") && <div style={{marginTop:6,display:"flex",gap:6}}>
              <textarea style={{...S.ta,flex:1,minHeight:30}} value={h._replResp||""} onChange={e=>uhTop("_replResp",e.target.value)} placeholder="Response (internal)..." rows={1}/>
              <button type="button" style={{padding:"8px 16px",borderRadius:6,border:"1px solid rgba(34,197,94,.4)",background:"rgba(34,197,94,.1)",color:"#22c55e",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>{
                u({hvac:{...h, replaceRequestStatus:"approved", replaceResponse:h._replResp||""}, mechNeeded:true, mechStatus:"approved", mechDate:new Date().toISOString().slice(0,10)});
                onLog(`âœ… Replacement APPROVED: ${h.replaceType}`);
              }}>âœ“ Approve</button>
              <button type="button" style={{padding:"8px 16px",borderRadius:6,border:"1px solid rgba(239,68,68,.4)",background:"rgba(239,68,68,.1)",color:"#ef4444",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>{
                u({hvac:{...h, replaceRequestStatus:"denied", replaceResponse:h._replResp||""}});
                onLog(`âŒ Replacement DENIED: ${h.replaceType}`);
              }}>âœ• Deny</button>
            </div>}
          </div>}
          {h.replaceRequestStatus==="approved" && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:6}}>
            <div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>âœ… Replacement APPROVED</div>
            {h.replaceResponse && (role==="admin"||role==="scope") && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Internal: {h.replaceResponse}</div>}
            <div style={{fontSize:10,color:"#64748b",marginTop:2}}>Scope team will build replacement into the project scope.</div>
          </div>}
          {h.replaceRequestStatus==="denied" && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)",borderRadius:6}}>
            <div style={{fontSize:11,color:"#ef4444",fontWeight:600}}>âŒ Replacement Denied</div>
            {h.replaceResponse && (role==="admin"||role==="scope") && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>Internal: {h.replaceResponse}</div>}
          </div>}
        </div>}
      </Sec>
    </div>
  );
}


