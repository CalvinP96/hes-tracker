import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function QAQCTab({p,u}) {
  const q = p.qaqc || {};
  const uq = (k,v) => u({qaqc:{...q,[k]:v}});
  const fi = q.fi || {};
  const ufi = (k,v) => uq("fi",{...fi,[k]:v});
  const sr = (cat,idx,f,v) => { const key=`${cat}-${idx}`; uq("results",{...(q.results||{}),[key]:{...(q.results?.[key]||{}),[f]:v}}); };

  const PFRow = ({item}) => {
    const d = fi[item.k] || {};
    const ud = (f,v) => ufi(item.k,{...d,[f]:v});
    return (
      <div style={{borderBottom:"1px solid rgba(255,255,255,.06)",padding:"10px 0"}}>
        <div style={{fontSize:12,...(item.sub?{paddingLeft:12,fontWeight:400,color:"#94a3b8"}:{fontWeight:600,color:"#e2e8f0"}),marginBottom:6}}>{item.l}</div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {item.r && <input style={{...S.inp,width:80,fontSize:12,padding:"6px 8px"}} value={d.reading||""} onChange={e=>ud("reading",e.target.value)} placeholder={item.u||""}/>}
          {item.yn && <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <span style={{fontSize:8,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em"}}>Result</span>
            <BtnGrp value={d.yn||""} onChange={v=>ud("yn",v)} opts={[{v:"Y",l:"Yes",c:"#22c55e"},{v:"N",l:"No",c:"#ef4444"},{v:"NA",l:"N/A",c:"#64748b"}]}/>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <span style={{fontSize:8,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em"}}>Pass/Fail</span>
            <BtnGrp value={d.pf||""} onChange={v=>ud("pf",v)} opts={[{v:"P",l:"Pass",c:"#22c55e"},{v:"F",l:"Fail",c:"#ef4444"},{v:"NA",l:"N/A",c:"#64748b"}]}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <span style={{fontSize:8,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em"}}>Follow-up</span>
            <BtnGrp value={d.fu||""} onChange={v=>ud("fu",v)} opts={[{v:"Y",l:"Yes",c:"#f59e0b"},{v:"N",l:"No",c:"#64748b"},{v:"NA",l:"N/A",c:"#475569"}]}/>
          </div>
        </div>
      </div>
    );
  };

  const getFIhtml = () => {
    let body = `<div class="sec"><h3>Final Inspection Info</h3>
      <div class="row"><span class="lbl">Homeowner</span><span class="val">${p.customerName||"â€”"}</span></div>
      <div class="row"><span class="lbl">Address</span><span class="val">${p.address||"â€”"}</span></div>
      <div class="row"><span class="lbl">Date</span><span class="val">${fi.date||"â€”"}</span></div>
      <div class="row"><span class="lbl">Installation Contractor</span><span class="val">${fi.contractor||"Assured Energy Solutions"}</span></div></div>`;
    body += `<div class="sec"><h3>Health &amp; Safety</h3>`;
    FI_SAFETY.forEach(item => {
      const d = fi[item.k]||{};
      const pfCls = d.pf==="P"?"pass":d.pf==="F"?"fail":"na";
      body += `<div class="row"><span class="lbl">${item.sub?"&nbsp;&nbsp;&nbsp;&nbsp;":""}${item.l}${d.reading?" ("+d.reading+" "+(item.u||"")+")":""}${item.yn?" â€” "+(d.yn||"â€”"):""}</span><span class="${pfCls}">${d.pf||"â€”"}</span><span style="font-size:10px;color:#999;margin-left:8px">F/U: ${d.fu||"â€”"}</span></div>`;
    });
    body += `<div class="row"><span class="lbl">Smoke detectors installed</span><span class="val">${fi.smokeQty||"â€”"}</span></div>`;
    body += `<div class="row"><span class="lbl">CO detectors installed</span><span class="val">${fi.coQty||"â€”"}</span></div>`;
    body += `<div class="row"><span class="lbl">Required ventilation (ASHRAE 62.2)</span><span class="val">${fi.ventCFM||"â€”"} CFM</span></div>`;
    body += `<div class="row"><span class="lbl">New exhaust fan installed</span><span class="val">${fi.newFan||"â€”"}</span></div>`;
    body += `<div class="row"><span class="lbl">All H&amp;S issues addressed</span><span class="${fi.hsAddressed==="Y"?"pass":"fail"}">${fi.hsAddressed||"â€”"}</span></div>`;
    if(fi.hsWhyNot) body += `<div class="row"><span class="lbl">If no, why not</span><span class="val">${fi.hsWhyNot}</span></div>`;
    body += `</div>`;
    body += `<div class="sec"><h3>Insulation</h3>`;
    FI_INSUL.forEach(ins => {
      const d = fi[ins.k]||{};
      body += `<div class="row"><span class="lbl"><b>${ins.l}</b> â€” Pre: R-${d.preR||"?"} â†’ Post: R-${d.postR||"?"} â€” Insulated: ${d.done||"â€”"}</span></div>`;
    });
    body += `</div>`;
    body += `<div class="sec"><h3>Combustion Appliances (not including oven/stove) â€” Space Heating &amp; DHW</h3>`;
    [1,2,3].forEach(n => {
      const d = fi[`equip${n}`]||{};
      if(d.type) body += `<div class="row"><span class="lbl">${n}. ${d.type} â€” ${d.vent||""} â€” Replaced: ${d.replaced||"â€”"} â€” F/U: ${d.fu||"â€”"}</span></div>`;
    });
    body += `</div>`;
    body += `<div class="sec"><h3>Blower Door</h3><div class="row"><span class="lbl">Pre CFM50</span><span class="val">${p.preCFM50||fi.preCFM50||"â€”"}</span></div><div class="row"><span class="lbl">Post CFM50</span><span class="val">${p.postCFM50||fi.postCFM50||"â€”"}</span></div></div>`;
    body += `<div class="sec"><h3>Duct Sealing â€“ Duct Blaster</h3><div class="row"><span class="lbl">Pre CFM25</span><span class="val">${fi.preCFM25||"â€”"}</span></div><div class="row"><span class="lbl">Post CFM25</span><span class="val">${fi.postCFM25||"â€”"}</span></div></div>`;
    body += `<div class="sec"><h3>Direct Installs</h3><div class="row"><span class="lbl">New thermostat installed</span><span class="val">${fi.thermostat||"â€”"}</span></div></div>`;
    if(fi.followUp) body += `<div class="sec"><h3>Follow-up Needed</h3><p>${fi.followUp}</p></div>`;
    body += `<div class="sec"><h3>Contractor Checklist</h3>`;
    FI_CONTRACTOR_CK.forEach(ck => { body += `<div class="row"><span class="lbl">${ck}</span><span class="${fi.ck?.[ck]?"pass":"na"}">${fi.ck?.[ck]?"â˜‘":"â˜"}</span></div>`; });
    body += `</div>`;
    return formPrintHTML("Home Energy Savings â€“ Retrofits Final Inspection Form", p, body, fi.inspectorSig, fi.custSig);
  };

  return (
    <div>
      {/* â”€â”€ FINAL INSPECTION FORM â”€â”€ */}
      <Sec title="ðŸ“‹ Home Energy Savings â€“ Retrofits Final Inspection Form">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Appendix F</p>
          <PrintBtn onClick={()=>savePrint(getFIhtml())}/>
        </div>
      </Sec>

      <Sec title="Inspection Info">
        <Gr>
          <F label="Homeowner Name" computed={p.customerName||"â€”"}/>
          <F label="Home Address" computed={p.address||"â€”"}/>
        </Gr>
        <Gr>
          <F label="Date of Final Inspection" value={fi.date||""} onChange={v=>ufi("date",v)} type="date"/>
          <F label="Installation Contractor" value={fi.contractor||"Assured Energy Solutions"} onChange={v=>ufi("contractor",v)}/>
        </Gr>
        <SigPad label="Customer Signature" value={fi.custSig||""} onChange={v=>ufi("custSig",v)}/>
      </Sec>

      {/* â”€â”€ INSTALLATION CONTRACTOR CHECKLIST â”€â”€ */}
      <Sec title="Installation Contractor Checklist">
        <p style={{fontSize:10,color:"#94a3b8",margin:0}}>Complete all sections below</p>
      </Sec>

      {/* â”€â”€ HEALTH & SAFETY â”€â”€ */}
      <Sec title="Health & Safety">
        {FI_SAFETY.map(item => <PFRow key={item.k} item={item}/>)}

        <div style={{marginTop:10,borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:10}}>
          <Gr>
            <F label="# Smoke Detectors Installed" value={fi.smokeQty||""} onChange={v=>ufi("smokeQty",v)} num/>
            <F label="# CO Detectors Installed" value={fi.coQty||""} onChange={v=>ufi("coQty",v)} num/>
          </Gr>
          <Gr>
            <F label="Required Ventilation Rate (ASHRAE 62.2)" value={fi.ventCFM||""} onChange={v=>ufi("ventCFM",v)} num suffix="CFM"/>
            <Sel label="New Exhaust Fan Installed?" value={fi.newFan||""} onChange={v=>ufi("newFan",v)} opts={["Yes","No"]}/>
          </Gr>
          <div style={{marginTop:8}}>
            <Sel label="Were all H&S issues addressed at home?" value={fi.hsAddressed||""} onChange={v=>ufi("hsAddressed",v)} opts={["Yes","No"]}/>
            {fi.hsAddressed==="No" && <div style={{marginTop:6}}><label style={S.fl}>If no, why not:</label><textarea style={S.ta} value={fi.hsWhyNot||""} onChange={e=>ufi("hsWhyNot",e.target.value)} rows={2}/></div>}
          </div>
        </div>
      </Sec>

      {/* â”€â”€ INSULATION â”€â”€ */}
      <Sec title="Insulation">
        {FI_INSUL.map(ins => {
          const d = fi[ins.k]||{};
          const ud = (f,v) => ufi(ins.k,{...d,[f]:v});
          return (
            <div key={ins.k} style={{borderBottom:"1px solid rgba(255,255,255,.06)",padding:"8px 0"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",marginBottom:4}}>{ins.l}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                <F label="Pre R-value" value={d.preR||""} onChange={v=>ud("preR",v)} num/>
                <F label="Post R-value" value={d.postR||""} onChange={v=>ud("postR",v)} num/>
                <Sel label={ins.q} value={d.done||""} onChange={v=>ud("done",v)} opts={["Yes","No"]}/>
              </div>
            </div>
          );
        })}
      </Sec>

      {/* â”€â”€ SPACE HEATING & DHW â”€â”€ */}
      <Sec title="Combustion Appliances (not including oven/stove) â€” Space Heating and DHW">
        {[1,2,3].map(n => {
          const d = fi[`equip${n}`]||{};
          const ud = (f,v) => ufi(`equip${n}`,{...d,[f]:v});
          return (
            <div key={n} style={{borderBottom:"1px solid rgba(255,255,255,.06)",padding:"8px 0"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}>Equipment {n}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <F label="Equipment Type" value={d.type||""} onChange={v=>ud("type",v)}/>
                <Sel label="Vent Type" value={d.vent||""} onChange={v=>ud("vent",v)} opts={["Natural Draft","Sealed"]}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4}}>
                <Sel label="Replaced?" value={d.replaced||""} onChange={v=>ud("replaced",v)} opts={["Yes","No"]}/>
                <Sel label="Follow-up needed?" value={d.fu||""} onChange={v=>ud("fu",v)} opts={["Yes","No"]}/>
              </div>
            </div>
          );
        })}
      </Sec>

      {/* â”€â”€ BLOWER DOOR â”€â”€ */}
      <Sec title="Blower Door">
        <Gr>
          <F label="Pre CFM50" computed={p.preCFM50||"â€”"}/>
          <F label="Post CFM50" computed={p.postCFM50||"â€”"}/>
        </Gr>
      </Sec>

      {/* â”€â”€ DUCT SEALING â”€â”€ */}
      <Sec title="Duct Sealing â€” Duct Blaster">
        <Gr>
          <F label="Pre CFM25" value={fi.preCFM25||""} onChange={v=>ufi("preCFM25",v)} num/>
          <F label="Post CFM25" value={fi.postCFM25||""} onChange={v=>ufi("postCFM25",v)} num/>
        </Gr>
      </Sec>

      {/* â”€â”€ DIRECT INSTALLS â”€â”€ */}
      <Sec title="Direct Installs">
        <Sel label="Was a new thermostat installed?" value={fi.thermostat||""} onChange={v=>ufi("thermostat",v)} opts={["Yes","No"]}/>
      </Sec>

      {/* â”€â”€ FOLLOW-UP â”€â”€ */}
      <Sec title="Follow-up Needed">
        <CK checked={fi.followUpNA} onChange={v=>ufi("followUpNA",v)} label="N/A"/>
        {!fi.followUpNA && <textarea style={{...S.ta,marginTop:6}} value={fi.followUp||""} onChange={e=>ufi("followUp",e.target.value)} rows={3} placeholder="Please list any follow-up needed for this customer's homeâ€¦"/>}
      </Sec>

      {/* â”€â”€ CONTRACTOR CHECKLIST â”€â”€ */}
      <Sec title="Contractor Checklist">
        <p style={{fontSize:10,color:"#64748b",marginBottom:6,fontStyle:"italic"}}>To be completed by the contractor:</p>
        {FI_CONTRACTOR_CK.map(ck => <CK key={ck} checked={fi.ck?.[ck]} onChange={v=>ufi("ck",{...(fi.ck||{}),[ck]:v})} label={ck}/>)}
      </Sec>

      {/* â”€â”€ INSPECTOR SIGNATURE â”€â”€ */}
      <Sec title="Inspector Sign-off">
        <SigPad label="Inspector Signature" value={fi.inspectorSig||""} onChange={v=>ufi("inspectorSig",v)}/>
      </Sec>

      {/* â”€â”€ QAQC OBSERVATION FORM (Appendix G) â”€â”€ */}
      <Sec title="ðŸ”Ž QAQC Observation Form">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Per Appendix G â€” post-installation observation</p>
          <PrintBtn onClick={()=>{
            let body = `<div class="sec"><h3>Info</h3><div class="row"><span class="lbl">Date</span><span class="val">${q.date||"â€”"}</span></div><div class="row"><span class="lbl">Inspector</span><span class="val">${q.inspector||"â€”"}</span></div></div>`;
            Object.entries(QAQC_SECTIONS).forEach(([cat,items]) => {
              const rows = items.map((item,i) => {
                const r = q.results?.[`${cat}-${i}`]||{};
                const cls = r.v==="Y"?"pass":r.v==="N"?"fail":"na";
                return `<div class="row"><span class="lbl">${i+1}. ${item}</span><span class="${cls}">${r.v||"â€”"}</span></div>`;
              }).join("");
              body += `<div class="sec"><h3>${cat}</h3>${rows}</div>`;
            });
            body += `<div class="sec"><h3>Result</h3><div class="row"><span class="lbl">Overall</span><span class="${q.passed===true?"pass":"fail"}">${q.passed===true?"PASS":q.passed===false?"FAIL":"â€”"}</span></div>${q.notes?`<p style="margin-top:6px;color:#666">${q.notes}</p>`:""}</div>`;
            savePrint(formPrintHTML("QAQC Observation Form", p, body, q.inspectorSig, q.custSig));
          }}/>
        </div>
      </Sec>
      <Sec title="Observation Info">
        <Gr><F label="Date" value={q.date||""} onChange={v=>uq("date",v)} type="date"/><F label="Inspector" value={q.inspector||""} onChange={v=>uq("inspector",v)}/></Gr>
        <div style={{marginTop:6}}><CK checked={q.scheduled} onChange={v=>uq("scheduled",v)} label="QAQC Scheduled"/></div>
      </Sec>
      {Object.entries(QAQC_SECTIONS).map(([cat,items]) => (
        <Sec key={cat} title={cat}>
          {items.map((item,i) => {
            const r = q.results?.[`${cat}-${i}`] || {};
            return (
              <div key={i} style={{borderBottom:"1px solid rgba(255,255,255,.04)",padding:"8px 0"}}>
                <div style={{fontSize:12,color:"#e2e8f0",marginBottom:6}}>{i+1}. {item}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <BtnGrp value={r.v||""} onChange={v=>sr(cat,i,"v",v)} opts={[{v:"Y",l:"Yes",c:"#22c55e"},{v:"N",l:"No",c:"#ef4444"},{v:"NA",l:"N/A",c:"#64748b"}]}/>
                  <input style={{...S.inp,flex:1,fontSize:11,minWidth:0}} value={r.c||""} onChange={e=>sr(cat,i,"c",e.target.value)} placeholder="Commentâ€¦"/>
                </div>
              </div>
            );
          })}
        </Sec>
      ))}
      <Sec title="Overall Result">
        <Sel label="Result" value={q.passed===true?"pass":q.passed===false?"fail":""} onChange={v=>uq("passed",v==="pass"?true:v==="fail"?false:null)} opts={["pass","fail"]}/>
        <textarea style={{...S.ta,marginTop:8}} value={q.notes||""} onChange={e=>uq("notes",e.target.value)} rows={3} placeholder="Overall notesâ€¦"/>
        <SigPad label="QAQC Inspector Signature" value={q.inspectorSig||""} onChange={v=>uq("inspectorSig",v)}/>
      </Sec>
    </div>
  );
}


