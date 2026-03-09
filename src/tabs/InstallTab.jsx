﻿﻿import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function InstallTab({p,u,onLog,user,role,appSettings={}}) {
  const fi = p.fi || {};
  const sf = (k,f,v) => u({fi:{...fi,safety:{...(fi.safety||{}),[k]:{...(fi.safety?.[k]||{}),[f]:v}}}});
  const uf = (k,v) => u({fi:{...fi,[k]:v}});
  const s = p.scope2026 || {};
  const a = p.audit || {};
  const co = p.changeOrders || [];
  const [prev, setPrev] = useState(null);
  const [coText, setCoText] = useState("");

  // â”€â”€ Post Photos â”€â”€
  const postSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.includes("(Post)"));
  const postItems = postSections.flatMap(([cat,items])=>items.map(i=>({...i,cat})));
  const postTaken = postItems.filter(i=>hasPhoto(p.photos,i.id)).length;

  const handleFile = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type === "image/gif") {
        const existing = getPhotos(p.photos, id);
        const newEntry = {d:e.target.result,at:new Date().toISOString(),by:user};
        u({photos:{...p.photos,[id]:[...existing, newEntry]}});
        if(onLog) onLog(`ðŸ“¸ ${postItems.find(x=>x.id===id)?.l||id} (${existing.length+1})`);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxW = 1600;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        const existing = getPhotos(p.photos, id);
        const newEntry = {d:c.toDataURL("image/jpeg",0.7),at:new Date().toISOString(),by:user};
        u({photos:{...p.photos,[id]:[...existing, newEntry]}});
        if(onLog) onLog(`ðŸ“¸ ${postItems.find(x=>x.id===id)?.l||id} (${existing.length+1})`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // â”€â”€ RED Calc â€” same logic as scope tab, uses post CFM50 â”€â”€
  const buildRedCalc = (usePostQ50) => {
    const baseSqft = Number(p.sqft) || 0;
    const finBasement = s.fnd?.type === "Finished" ? (Number(s.fnd?.aboveSqft)||0) + (Number(s.fnd?.belowSqft)||0) : 0;
    const Afl = baseSqft + finBasement;
    const Nbr = Number(s.bedrooms) || 0;
    const Q50 = usePostQ50 ? (Number(p.postCFM50) || 0) : (Number(p.preCFM50) || 0);
    const st = Number(p.stories) || 1;
    const H = st >= 2 ? 16 : st >= 1.5 ? 14 : 8;
    const Hr = 8.202; const wsf = 0.56;

    // Same fan flow sources as scope tab
    const kRaw = s.ashrae?.kitchenCFM ?? a.kitchenFan ?? "";
    const b1Raw = s.ashrae?.bath1CFM ?? a.bathFan1 ?? "";
    const b2Raw = s.ashrae?.bath2CFM ?? a.bathFan2 ?? "";
    const b3Raw = s.ashrae?.bath3CFM ?? a.bathFan3 ?? "";
    const kPresent = String(kRaw).trim() !== "";
    const b1Present = String(b1Raw).trim() !== "";
    const b2Present = String(b2Raw).trim() !== "";
    const b3Present = String(b3Raw).trim() !== "";
    const kCFM = Number(kRaw) || 0; const b1 = Number(b1Raw) || 0;
    const b2 = Number(b2Raw) || 0; const b3 = Number(b3Raw) || 0;
    const kWin = s.ashrae?.kWin || false;
    const b1Win = s.ashrae?.b1Win || false;
    const b2Win = s.ashrae?.b2Win || false;
    const b3Win = s.ashrae?.b3Win || false;

    // Infiltration credit
    const Qinf = Q50 > 0 ? 0.052 * Q50 * wsf * Math.pow(H / 8.2, 0.4) : 0;
    const Qtot = (Afl > 0) ? 0.03 * Afl + 7.5 * (Nbr + 1) : 0;
    const kReq = kPresent ? 100 : 0;
    const b1Req = b1Present ? 50 : 0;
    const b2Req = b2Present ? 50 : 0;
    const b3Req = b3Present ? 50 : 0;
    const kDef = !kPresent ? 0 : Math.max(0, kReq - (kWin ? 20 : kCFM));
    const b1Def = !b1Present ? 0 : Math.max(0, b1Req - (b1Win ? 20 : b1));
    const b2Def = !b2Present ? 0 : Math.max(0, b2Req - (b2Win ? 20 : b2));
    const b3Def = !b3Present ? 0 : Math.max(0, b3Req - (b3Win ? 20 : b3));
    const totalDef = kDef + b1Def + b2Def + b3Def;
    const supplement = totalDef * 0.25;
    const Qfan = Qtot + supplement - Qinf;
    const FAN_SETTINGS = [50, 80, 110];
    const recFan = FAN_SETTINGS.find(f => f >= Qfan) || FAN_SETTINGS[FAN_SETTINGS.length - 1];
    const R = v => Math.round(v * 100) / 100;
    const Ri = v => Math.round(v);
    return { Afl, Nbr, Q50, H, Hr, wsf, st, Qinf, Qtot, totalDef, supplement, Qfan, FAN_SETTINGS, recFan, R, Ri, baseSqft, finBasement, kCFM, b1, b2, b3, kPresent, b1Present, b2Present, b3Present, kWin, b1Win, b2Win, b3Win, kReq, b1Req, b2Req, b3Req, kDef, b1Def, b2Def, b3Def };
  };

  // â”€â”€ Change Order Requests â”€â”€
  const [coPhoto, setCoPhoto] = React.useState(null);
  const compressCOPhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        setCoPhoto(c.toDataURL("image/jpeg", 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  const addCO = () => {
    if (!coText.trim()) return;
    const newCO = { id: Date.now().toString(36), text: coText.trim(), by: user, at: new Date().toISOString(), status: "pending", response: "", photo: coPhoto||"" };
    // Send email BEFORE state update â€” keepalive prevents mobile from killing it
    try { fetch("/.netlify/functions/cor-email", { method:"POST", keepalive:true, headers:{"Content-Type":"application/json"}, body:JSON.stringify({
      projectId: p.id, corId: newCO.id, corText: newCO.text, corBy: user,
      corDate: newCO.at, customerName: p.customerName, address: p.address, riseId: p.riseId,
      notifyEmail: appSettings.notifyEmail||"", notifyCc: appSettings.notifyCc||"",
    })}).catch(()=>{}); } catch(e){}
    u({ changeOrders: [...co, newCO] });
    if (onLog) onLog(`ðŸ“ COR requested: ${coText.trim().slice(0,50)}â€¦`);
    setCoText(""); setCoPhoto(null);
  };
  const updateCO = (id, fields) => {
    u({ changeOrders: co.map(c => c.id === id ? { ...c, ...fields } : c) });
    if (onLog && fields.status) onLog(`COR ${fields.status}: ${co.find(c=>c.id===id)?.text?.slice(0,40)}â€¦`);
  };

  // â”€â”€ Print HTML â”€â”€
  const getInstallHTML = () => {
    const rc = buildRedCalc(true);
    const R = rc.R;
    const safetyRows = FI_SAFETY.map(c => {
      const r = fi.safety?.[c.k] || {};
      const cls = r.pf==="P"?"pass":r.pf==="F"?"fail":"na";
      return `<div class="row"><span class="lbl">${c.l}</span><span>${c.r&&r.reading?r.reading+" "+c.u+" Â· ":""}<span class="${cls}">${r.pf||"â€”"}</span>${r.fu?" âš  F/U":""}</span></div>`;
    }).join("");
    const mq2 = p.measureQty||{};
    const measList = p.measures.length ? `<table style="width:100%;border-collapse:collapse;font-size:9px;margin-top:4px">\n<tr style="background:#f0fdf4;"><th style="text-align:left;padding:2px 5px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:2px 5px;border:1px solid #ccc">Qty</th><th style="padding:2px 5px;border:1px solid #ccc">Unit</th></tr>\n${p.measures.map(m=>`<tr><td style="padding:2px 5px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:2px 5px;border:1px solid #ddd">${getResolvedQty(p,m)||"â€”"}</td><td style="padding:2px 5px;border:1px solid #ddd">${measUnit(m)}</td></tr>`).join("")}\n</table>` : "<em>None</em>";
    const hsList = p.healthSafety.length ? `<table style="width:100%;border-collapse:collapse;font-size:9px;margin-top:4px">\n<tr style="background:#fffbeb;"><th style="text-align:left;padding:2px 5px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:2px 5px;border:1px solid #ccc">Qty</th><th style="padding:2px 5px;border:1px solid #ccc">Unit</th></tr>\n${p.healthSafety.map(m=>`<tr><td style="padding:2px 5px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:2px 5px;border:1px solid #ddd">${getResolvedQty(p,m)||"â€”"}</td><td style="padding:2px 5px;border:1px solid #ddd">ea</td></tr>`).join("")}\n</table>` : "<em>None</em>";
    const coRows = co.filter(c=>c.status==="approved").map(c=>`<div class="row"><span class="lbl">${c.text}</span><span class="pass">APPROVED${(c.adds||[]).length?" â€” "+(c.adds||[]).map(a=>"+"+(a.m||a)).join(", "):""}</span></div>`).join("");
    const fan = Number(fi.postFanSetting) || 0;

    const body = `
      <div class="sec"><h3>Scope of Work</h3>
        <div style="margin-bottom:6px"><strong>Energy Efficiency:</strong><br/>${measList}</div>
        <div style="margin-bottom:6px"><strong>Health & Safety:</strong><br/>${hsList}</div>
        ${p.measureNotes?`<div style="margin-bottom:4px"><strong>Notes:</strong> ${p.measureNotes}</div>`:""}
      </div>
      ${co.filter(c=>c.status==="approved").length?`<div class="sec"><h3>Approved CORs</h3>${coRows}</div>`:""}
      <div class="sec"><h3>Post-Work Blower Door</h3><div class="grid">
        <div class="row"><span class="lbl">Pre CFM50</span><span class="val">${p.preCFM50||"â€”"}</span></div>
        <div class="row"><span class="lbl">Post CFM50</span><span class="val">${p.postCFM50||"â€”"}</span></div>
        ${p.preCFM50&&p.postCFM50?`<div class="row"><span class="lbl">Reduction</span><span class="val">${Math.round(((p.preCFM50-p.postCFM50)/p.preCFM50)*100)}%</span></div>`:""}
      </div></div>
      <div class="sec"><h3>Post-Work ASHRAE 62.2-2016</h3><div class="grid">
        <div class="row"><span class="lbl">Floor area</span><span class="val">${rc.Afl} ftÂ²</span></div>
        <div class="row"><span class="lbl">Post Q50</span><span class="val">${rc.Q50} CFM</span></div>
        <div class="row"><span class="lbl">Qinf</span><span class="val">${R(rc.Qinf)} CFM</span></div>
        <div class="row"><span class="lbl">Qtot</span><span class="val">${R(rc.Qtot)} CFM</span></div>
        <div class="row"><span class="lbl">Supplement</span><span class="val">${R(rc.supplement)} CFM</span></div>
        <div class="row" style="border-top:2px solid #1E3A8A;padding-top:4px;margin-top:4px"><span style="font-weight:700">Qfan (post)</span><span style="font-weight:700;color:#1E3A8A;font-size:14px">${R(rc.Qfan)} CFM</span></div>
        ${fan?`<div class="row"><span class="lbl">Fan: ${fan} CFM Â· Run-time: ${R(rc.Qfan/fan*60)} min/hr</span></div>`:""}
      </div></div>
      <div class="sec"><h3>Health & Safety Checks</h3>${safetyRows}</div>
      <div class="sec"><h3>Status</h3>
        <div class="row"><span class="lbl">Final Passed</span><span class="val">${p.finalPassed?"âœ… Yes":"No"}</span></div>
        <div class="row"><span class="lbl">Customer Sign-off</span><span class="val">${p.customerSignoff?"âœ… Yes":"No"}</span></div>
      </div>
      ${fi.preScopeSig?`<div class="sec"><h3>Pre-Work Scope Authorization</h3><img src="${fi.preScopeSig}" style="max-width:280px;height:60px;object-fit:contain"/><div style="font-size:10px;color:#666;margin-top:4px">Signed ${fi.preScopeDate?new Date(fi.preScopeDate).toLocaleString():""}</div></div>`:""}
      ${fi.postScopeSig?`<div class="sec"><h3>Post-Work Scope Completion</h3><img src="${fi.postScopeSig}" style="max-width:280px;height:60px;object-fit:contain"/><div style="font-size:10px;color:#666;margin-top:4px">Signed ${fi.postScopeDate?new Date(fi.postScopeDate).toLocaleString():""}</div></div>`:""}
      ${fi.customerSig?`<div class="sec"><h3>Customer Signature â€” Work Completion</h3><img src="${fi.customerSig}" style="max-width:280px;height:60px;object-fit:contain"/></div>`:""}`;
    return formPrintHTML("Install Completion & Final Inspection", p, body, fi.inspectorSig, fi.customerSig);
  };

  // Photo preview
  if (prev) {
    const arr = getPhotos(p.photos, prev.id);
    const ph = arr[prev.idx]; const it = postItems.find(x=>x.id===prev.id);
    return (
      <div style={S.camOv}>
        <div style={S.camH}>
          <button style={{...S.back,fontSize:18}} onClick={()=>setPrev(null)}>â† Back</button>
          <div style={{flex:1,textAlign:"center",fontWeight:600,fontSize:14}}>{it?.l} {arr.length>1?`(${prev.idx+1}/${arr.length})`:""}</div>
          <button style={{...S.ghost,color:"#ef4444",borderColor:"#ef4444",padding:"4px 10px"}} onClick={()=>{
            const remaining = arr.filter((_,i)=>i!==prev.idx);
            u({photos:{...p.photos,[prev.id]:remaining.length?remaining:undefined}});
            if(onLog)onLog(`ðŸ—‘ï¸ Removed ${it?.l||prev.id}`);setPrev(null);
          }}>Delete</button>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"#000",padding:8,position:"relative"}}>
          {ph?.d && <img src={ph.d} style={{maxWidth:"100%",maxHeight:"80vh",borderRadius:8}} alt=""/>}
          {arr.length > 1 && prev.idx > 0 && <button onClick={()=>setPrev({...prev,idx:prev.idx-1})} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",color:"#fff",border:"none",borderRadius:"50%",width:36,height:36,fontSize:18,cursor:"pointer"}}>â€¹</button>}
          {arr.length > 1 && prev.idx < arr.length-1 && <button onClick={()=>setPrev({...prev,idx:prev.idx+1})} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",color:"#fff",border:"none",borderRadius:"50%",width:36,height:36,fontSize:18,cursor:"pointer"}}>â€º</button>}
        </div>
        <div style={{padding:12,textAlign:"center",fontSize:11,color:"#94a3b8"}}>{ph?.by} Â· {ph?.at&&new Date(ph.at).toLocaleString()}</div>
      </div>
    );
  }

  const rcPost = buildRedCalc(true);
  const rcPre = buildRedCalc(false);
  const red = p.preCFM50 && p.postCFM50 ? Math.round(((p.preCFM50-p.postCFM50)/p.preCFM50)*100) : null;
  const {R,Ri} = rcPost;

  return (
    <div>
      {/* â”€â”€ HEADER + PRINT â”€â”€ */}
      <Sec title="🏗️ Install Completion">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>Complete all sections before leaving the job site.</p>
          <PrintBtn onClick={()=>savePrint(getInstallHTML())}/>
        </div>
      </Sec>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           PRE-WORK SCOPE OF WORK — locked original scope
         â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {(() => {
        const htg=s.htg||{};const clg=s.clg||{};const dhw=s.dhw||{};const att=s.attic||{};const fnd=s.fnd||{};
        const iq=s.insulQty||{};const mq=p.measureQty||{};
        const afue=htg.btuIn&&htg.btuOut?(Number(htg.btuOut)/Number(htg.btuIn)*100).toFixed(1)+"%":"â€”";
        const seer=clg.btuOut&&clg.watts?(Number(clg.btuOut)/Number(clg.watts)).toFixed(1):"â€”";
        const approvedCOs = co.filter(c=>c.status==="approved");
        const coAdds = approvedCOs.flatMap(c=>(c.adds||[]));
        const coRemoves = approvedCOs.flatMap(c=>(c.removes||[]));
        const coAddNames = coAdds.map(a=>a.m||a);
        const postMeasures = [...p.measures.filter(m=>!coRemoves.includes(m)),...coAddNames.filter(m=>!p.measures.includes(m)&&EE_MEASURES.includes(m))];
        const postHS = [...p.healthSafety.filter(m=>!coRemoves.includes(m)),...coAddNames.filter(m=>!p.healthSafety.includes(m)&&HS_MEASURES.includes(m))];

        // Formal scope detail renderer
        const ScopeBlock = ({measures,hs,label,isPost}) => {
          const tblStyle = {width:"100%",borderCollapse:"collapse",fontSize:11,marginTop:4};
          const thStyle = {textAlign:"left",padding:"4px 8px",borderBottom:"2px solid rgba(255,255,255,.15)",color:"#94a3b8",fontSize:10,textTransform:"uppercase",letterSpacing:".03em"};
          const tdStyle = {padding:"5px 8px",borderBottom:"1px solid rgba(255,255,255,.04)",color:"#e2e8f0"};
          const tdR = {...tdStyle,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontWeight:600};
          const added = isPost ? coAdds : [];
          const removed = isPost ? coRemoves : [];
          // Build CO qty lookup: measure â†’ qty from approved COs
          const coQtyMap = {};
          approvedCOs.forEach(c=>(c.adds||[]).forEach(a=>{if(a.qty)coQtyMap[a.m]=a.qty;}));
          const getQty = (m) => {
            if(coQtyMap[m]) return coQtyMap[m];
            return getResolvedQty(p,m)||"1";
          };
          return <>
            {/* Property Summary */}
            <div style={{background:"rgba(255,255,255,.02)",borderRadius:6,padding:"8px 10px",marginBottom:8,fontSize:11}}>
              <div className="hvac-2col" style={{gap:"2px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Customer</span><span style={{color:"#e2e8f0",fontWeight:600}}>{p.customerName||"â€”"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Address</span><span style={{color:"#e2e8f0",fontWeight:600}}>{p.address||"â€”"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Sq Footage</span><span style={{color:"#e2e8f0",fontWeight:600}}>{p.sqft||"â€”"} ftÂ²</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Year Built</span><span style={{color:"#e2e8f0",fontWeight:600}}>{p.yearBuilt||"â€”"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Stories</span><span style={{color:"#e2e8f0",fontWeight:600}}>{p.stories||"â€”"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Home Type</span><span style={{color:"#e2e8f0",fontWeight:600}}>{s.style||p.homeType||"â€”"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>Pre CFM50</span><span style={{color:"#e2e8f0",fontWeight:600}}>{p.preCFM50||"â€”"}</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#64748b"}}>RISE PID</span><span style={{color:"#e2e8f0",fontWeight:600}}>{p.riseId||"â€”"}</span></div>
              </div>
            </div>
            {/* EE Measures Table */}
            <div style={{fontSize:12,fontWeight:700,color:"#22c55e",marginBottom:2,marginTop:10}}>Energy Efficiency Measures</div>
            <div style={{fontSize:10,color:"#475569",marginBottom:4}}>The following energy conservation measures shall be performed in accordance with the approved scope of work and applicable program standards.</div>
            <table style={tblStyle}>
              <thead><tr><th style={thStyle}>Measure</th><th style={{...thStyle,textAlign:"right"}}>Qty</th><th style={{...thStyle,width:50}}>Unit</th><th style={{...thStyle,width:60}}>Status</th></tr></thead>
              <tbody>
                {measures.map(m => {
                  const isAdded = added.map(a=>a.m||a).includes(m);
                  return <tr key={m} style={isAdded?{background:"rgba(249,115,22,.06)"}:{}}>
                    <td style={tdStyle}>{isAdded&&"ðŸ”¶ "}{m}</td>
                    <td style={tdR}>{getQty(m)}</td>
                    <td style={tdStyle}>{measUnit(m)}</td>
                    <td style={{...tdStyle,color:isAdded?"#f97316":"#22c55e",fontWeight:600,fontSize:10}}>{isAdded?"COR Added":"Approved"}</td>
                  </tr>;
                })}
                {removed.filter(m=>EE_MEASURES.includes(m)).map(m =>
                  <tr key={"rm_"+m} style={{background:"rgba(239,68,68,.04)"}}>
                    <td style={{...tdStyle,textDecoration:"line-through",color:"#64748b"}}>{m}</td><td style={tdR}>â€”</td><td style={tdStyle}>â€”</td>
                    <td style={{...tdStyle,color:"#ef4444",fontWeight:600,fontSize:10}}>COR Removed</td>
                  </tr>
                )}
                {measures.length === 0 && <tr><td colSpan={4} style={{...tdStyle,color:"#475569",textAlign:"center",padding:12}}>No energy efficiency measures</td></tr>}
              </tbody>
            </table>
            {/* H&S Measures Table */}
            <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:2,marginTop:12}}>Health & Safety Measures</div>
            <div style={{fontSize:10,color:"#475569",marginBottom:4}}>The following health and safety measures shall be completed to address identified hazards and ensure compliance with program requirements.</div>
            <table style={tblStyle}>
              <thead><tr><th style={thStyle}>Measure</th><th style={{...thStyle,textAlign:"right"}}>Qty</th><th style={{...thStyle,width:60}}>Status</th></tr></thead>
              <tbody>
                {(isPost?postHS:p.healthSafety).map(m => {
                  const isAdded = added.map(a=>a.m||a).includes(m);
                  return <tr key={m} style={isAdded?{background:"rgba(249,115,22,.06)"}:{}}>
                    <td style={tdStyle}>{isAdded&&"ðŸ”¶ "}{m}</td>
                    <td style={tdR}>{getQty(m)}</td>
                    <td style={{...tdStyle,color:isAdded?"#f97316":"#22c55e",fontWeight:600,fontSize:10}}>{isAdded?"COR Added":"Approved"}</td>
                  </tr>;
                })}
                {removed.filter(m=>HS_MEASURES.includes(m)).map(m =>
                  <tr key={"rm_"+m} style={{background:"rgba(239,68,68,.04)"}}>
                    <td style={{...tdStyle,textDecoration:"line-through",color:"#64748b"}}>{m}</td><td style={tdR}>â€”</td>
                    <td style={{...tdStyle,color:"#ef4444",fontWeight:600,fontSize:10}}>COR Removed</td>
                  </tr>
                )}
                {(isPost?postHS:p.healthSafety).length === 0 && <tr><td colSpan={3} style={{...tdStyle,color:"#475569",textAlign:"center",padding:12}}>No health & safety measures</td></tr>}
              </tbody>
            </table>
            {/* Insulation Detail */}
            {Object.entries(iq).some(([,v])=>v) && <>
              <div style={{fontSize:12,fontWeight:700,color:"#60A5FA",marginBottom:2,marginTop:12}}>Insulation Specifications</div>
              <div style={{fontSize:10,color:"#475569",marginBottom:4}}>Quantities and locations as determined during the energy assessment. All insulation shall meet or exceed specified R-values.</div>
              <table style={tblStyle}>
                <thead><tr><th style={thStyle}>Location</th><th style={{...thStyle,textAlign:"right"}}>Quantity</th><th style={{...thStyle,width:50}}>Unit</th></tr></thead>
                <tbody>
                  {Object.entries(iq).filter(([,v])=>v).map(([loc,qty])=>
                    <tr key={loc}><td style={tdStyle}>{loc}</td><td style={tdR}>{qty}</td><td style={tdStyle}>{loc.includes("Rim Joist")?"LnFt":"SqFt"}</td></tr>
                  )}
                </tbody>
              </table>
            </>}
            {/* Notes */}
            {p.measureNotes && <div style={{fontSize:11,color:"#94a3b8",padding:"8px 10px",background:"rgba(255,255,255,.03)",borderRadius:6,marginTop:8,borderLeft:"3px solid rgba(255,255,255,.1)"}}><span style={{color:"#64748b",fontWeight:600}}>Scope Notes:</span> {p.measureNotes}</div>}
          </>;
        };

        return <>
          <Sec title="📋 Pre-Work Scope of Work" danger={!fi.preScopeSig}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:4}}>
              <div style={{fontSize:10,color:fi.preScopeSig?"#22c55e":"#f59e0b",fontWeight:600}}>
                {fi.preScopeSig ? "âœ“ Customer authorized â€” work may proceed" : "âš  Customer must review and sign before work begins"}
              </div>
              <PrintBtn label="Print Pre" onClick={()=>{
                const body = `<div class="sec"><h3>Property Information</h3><div class="grid">
                  <div class="row"><span class="lbl">Customer</span><span class="val">${p.customerName||"â€”"}</span></div>
                  <div class="row"><span class="lbl">Address</span><span class="val">${p.address||"â€”"}</span></div>
                  <div class="row"><span class="lbl">Sq Footage</span><span class="val">${p.sqft||"â€”"} ftÂ²</span></div>
                  <div class="row"><span class="lbl">Year Built</span><span class="val">${p.yearBuilt||"â€”"}</span></div>
                  <div class="row"><span class="lbl">Stories</span><span class="val">${p.stories||"â€”"}</span></div>
                  <div class="row"><span class="lbl">Pre CFM50</span><span class="val">${p.preCFM50||"â€”"}</span></div>
                  <div class="row"><span class="lbl">RISE PID</span><span class="val">${p.riseId||"â€”"}</span></div>
                </div></div>
                <div class="sec"><h3>Energy Efficiency Measures</h3><p style="font-size:10px;color:#666">The following energy conservation measures shall be performed in accordance with the approved scope of work and applicable program standards.</p>
                <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">
                <tr style="background:#f0fdf4"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th><th style="padding:3px 6px;border:1px solid #ccc">Unit</th></tr>
                ${p.measures.map(m=>`<tr><td style="padding:3px 6px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${getResolvedQty(p,m)||"â€”"}</td><td style="padding:3px 6px;border:1px solid #ddd">${measUnit(m)}</td></tr>`).join("")}
                </table></div>
                <div class="sec"><h3>Health & Safety Measures</h3><p style="font-size:10px;color:#666">The following health and safety measures shall be completed to address identified hazards and ensure compliance with program requirements.</p>
                <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px">
                <tr style="background:#fffbeb"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th></tr>
                ${p.healthSafety.map(m=>`<tr><td style="padding:3px 6px;border:1px solid #ddd">${m}</td><td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${getResolvedQty(p,m)||"1"}</td></tr>`).join("")}
                </table></div>
                ${Object.entries(iq).some(([,v])=>v)?`<div class="sec"><h3>Insulation Specifications</h3><table style="width:100%;border-collapse:collapse;font-size:10px"><tr style="background:#eff6ff"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Location</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th><th style="padding:3px 6px;border:1px solid #ccc">Unit</th></tr>${Object.entries(iq).filter(([,v])=>v).map(([l,v])=>`<tr><td style="padding:3px 6px;border:1px solid #ddd">${l}</td><td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${v}</td><td style="padding:3px 6px;border:1px solid #ddd">${l.includes("Rim Joist")?"LnFt":"SqFt"}</td></tr>`).join("")}</table></div>`:""}
                ${p.measureNotes?`<div class="sec"><h3>Notes</h3><p>${p.measureNotes}</p></div>`:""}`;
                savePrint(formPrintHTML("Pre-Work Scope of Work — Authorization", p, body, false, fi.preScopeSig));
              }}/>
            </div>
            <div style={{opacity:fi.preScopeSig?0.7:1}}>
              <ScopeBlock measures={p.measures} hs={p.healthSafety} label="Original" isPost={false}/>
            </div>
            {fi.preScopeSig ? (
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>âœ“ Pre-Work Authorization Signed</div>{fi.preScopeDate && <div style={{fontSize:9,color:"#64748b"}}>{new Date(fi.preScopeDate).toLocaleString()}</div>}</div>
                  {(role==="admin"||role==="scope")&&<button type="button" style={{...S.ghost,padding:"3px 8px",fontSize:9,color:"#f59e0b",borderColor:"rgba(245,158,11,.3)"}} onClick={()=>{u({fi:{...fi,preScopeSig:"",preScopeDate:""}});onLog("Pre-work scope signature cleared");}}>Clear Signature</button>}
                </div>
                <img src={fi.preScopeSig} style={{maxWidth:200,height:50,objectFit:"contain",marginTop:4}} alt="sig"/>
              </div>
            ) : (
              <div style={{marginTop:10}}>
                <div style={{fontSize:10,color:"#475569",marginBottom:4,fontStyle:"italic"}}>By signing below, the customer acknowledges and authorizes the scope of work described above. Work shall not commence until this authorization is obtained.</div>
                <SigPad label="Customer Signature — Pre-Work Scope Authorization" value="" onChange={v=>{u({fi:{...fi,preScopeSig:v,preScopeDate:new Date().toISOString()}});onLog("Customer signed pre-work scope authorization");}}/>
              </div>
            )}
          </Sec>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
               CHANGE ORDER REQUESTS â€” structured add/remove
             â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <Sec title={`Change Order Requests (${co.length})`}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:8}}>Installer describes the change needed. Scope/Admin reviews and formally adjusts the scope.</div>
            {/* Installer request */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",marginBottom:4,textTransform:"uppercase",letterSpacing:".04em"}}>Request a Change</div>
              <textarea style={{...S.ta,minHeight:50}} value={coText} onChange={e=>setCoText(e.target.value)} placeholder="Describe what needs to change and why (e.g., 'Found additional air sealing opportunities in basement that were not visible during assessment. Recommend adding air sealing to scope.')..." rows={2}/>
              <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center"}}>
                <label style={{...S.ghost,borderColor:"#64748b",color:"#94a3b8",padding:"6px 12px",fontSize:11,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,flexShrink:0}}>
                  ðŸ“· {coPhoto?"Photo âœ“":"Attach Photo"}
                  <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compressCOPhoto(e.target.files?.[0]);e.target.value="";}}/>
                </label>
                {coPhoto && <button type="button" style={{...S.ghost,borderColor:"#ef4444",color:"#ef4444",padding:"4px 8px",fontSize:10}} onClick={()=>setCoPhoto(null)}>Ã— Remove</button>}
                {coPhoto && <img src={coPhoto} style={{height:36,borderRadius:4,border:"1px solid rgba(255,255,255,.1)"}} alt="COR"/>}
              </div>
              <button type="button" style={{...S.ghost,borderColor:"#f97316",color:"#f97316",padding:"8px 16px",marginTop:6,width:"100%",fontSize:12,fontWeight:600,opacity:coText.trim()?1:.4}} onClick={addCO} disabled={!coText.trim()}>ðŸ“ Submit Change Order Request</button>
            </div>
            {/* CO List â€” denied hidden from non-admin/scope */}
            {co.filter(c => c.status!=="denied" || role==="admin" || role==="scope").map(c => (
              <div key={c.id} style={{background:c.status==="approved"?"rgba(34,197,94,.04)":c.status==="denied"?"rgba(239,68,68,.04)":"rgba(255,255,255,.02)",border:`1px solid ${c.status==="approved"?"rgba(34,197,94,.2)":c.status==="denied"?"rgba(239,68,68,.2)":"rgba(255,255,255,.06)"}`,borderRadius:8,padding:10,marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:"#e2e8f0",lineHeight:1.4}}>{c.text}</div>
                    <div style={{fontSize:9,color:"#64748b",marginTop:2}}>Requested by {c.by} Â· {new Date(c.at).toLocaleString()}</div>
                  </div>
                  <span style={{fontSize:9,padding:"2px 8px",borderRadius:4,fontWeight:700,marginLeft:8,flexShrink:0,
                    background:c.status==="approved"?"rgba(34,197,94,.15)":c.status==="denied"?"rgba(239,68,68,.15)":"rgba(245,158,11,.15)",
                    color:c.status==="approved"?"#22c55e":c.status==="denied"?"#ef4444":"#f59e0b"
                  }}>{c.status.toUpperCase()}</span>
                </div>
                {/* CO Photo */}
                {c.photo && <div style={{marginTop:4,marginBottom:4}}><img src={c.photo} style={{maxWidth:"100%",maxHeight:200,borderRadius:6,border:"1px solid rgba(255,255,255,.1)"}} alt="COR photo"/></div>}
                {/* Show adds/removes on approved â€” visible to everyone */}
                {c.status==="approved" && ((c.adds||[]).length>0||(c.removes||[]).length>0) && <div style={{marginTop:6,padding:"6px 8px",background:"rgba(255,255,255,.02)",borderRadius:6,fontSize:11}}>
                  {(c.adds||[]).map((a,i)=><div key={"a"+i} style={{color:"#22c55e",padding:"2px 0"}}>+ Add: {a.m||a}{a.qty?" â€” Qty: "+a.qty:""}</div>)}
                  {(c.removes||[]).map((m,i)=><div key={"r"+i} style={{color:"#ef4444",padding:"2px 0"}}>âˆ’ Remove: {m}</div>)}
                </div>}
                {/* Internal response â€” ONLY visible to admin/scope */}
                {c.response && (role==="admin"||role==="scope") && <div style={{fontSize:11,color:"#94a3b8",marginTop:4,padding:"4px 8px",background:"rgba(255,255,255,.03)",borderRadius:4,borderLeft:"2px solid rgba(255,255,255,.1)"}}><span style={{fontSize:9,color:"#64748b",fontWeight:600}}>INTERNAL: </span>{c.response}</div>}
                {/* Admin/Scope approval panel â€” clean dropdowns */}
                {c.status==="pending" && role!=="installer" && role!=="hvac" && (role==="admin"||role==="scope") && (
                  <div style={{marginTop:8,padding:"10px 12px",background:"rgba(255,255,255,.02)",borderRadius:8,border:"1px solid rgba(255,255,255,.06)"}}>
                    <div style={{fontSize:10,fontWeight:600,color:"#94a3b8",marginBottom:8}}>SCOPE TEAM REVIEW</div>
                    {/* Admin editable version of installer text */}
                    <div style={{marginBottom:8}}>
                      <label style={{fontSize:10,color:"#f59e0b",fontWeight:600,display:"block",marginBottom:3}}>âœï¸ Edit Request Description (visible to customer/program)</label>
                      <textarea style={{...S.ta,minHeight:40,borderColor:"rgba(245,158,11,.3)"}} value={c._editText!==undefined?c._editText:c.text} onChange={e=>u({changeOrders:co.map(x=>x.id===c.id?{...x,_editText:e.target.value}:x)})} rows={2}/>
                    </div>
                    {/* Add service â€” dropdown + qty */}
                    <div style={{marginBottom:8}}>
                      <label style={{fontSize:10,color:"#22c55e",fontWeight:600,display:"block",marginBottom:3}}>+ Add a Service</label>
                      <div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
                        <div style={{flex:1}}>
                          <select style={{...S.inp,fontSize:12}} value={c._addSel||""} onChange={e=>u({changeOrders:co.map(x=>x.id===c.id?{...x,_addSel:e.target.value}:x)})}>
                            <option value="">â€” Select measure to add â€”</option>
                            <optgroup label="Energy Efficiency">
                              {[...EE_MEASURES].sort().filter(m=>!p.measures.includes(m)&&!p.healthSafety.includes(m)&&!(c._adds||[]).some(a=>(a.m||a)===m)).map(m=>
                                <option key={m} value={m}>{m}</option>
                              )}
                            </optgroup>
                            <optgroup label="Health & Safety">
                              {[...HS_MEASURES].sort().filter(m=>!p.measures.includes(m)&&!p.healthSafety.includes(m)&&!(c._adds||[]).some(a=>(a.m||a)===m)).map(m=>
                                <option key={m} value={m}>{m}</option>
                              )}
                            </optgroup>
                          </select>
                        </div>
                        <div style={{width:70}}>
                          <label style={{fontSize:9,color:"#64748b"}}>Qty</label>
                          <input type="number" style={{...S.inp,fontSize:12,textAlign:"center"}} value={c._addQty||"1"} onChange={e=>u({changeOrders:co.map(x=>x.id===c.id?{...x,_addQty:e.target.value}:x)})} min="1"/>
                        </div>
                        <button type="button" style={{...S.btn,padding:"8px 12px",fontSize:11,whiteSpace:"nowrap",opacity:c._addSel?1:.4}} disabled={!c._addSel} onClick={()=>{
                          const newAdd = {m:c._addSel, qty:c._addQty||"1"};
                          u({changeOrders:co.map(x=>x.id===c.id?{...x,_adds:[...(x._adds||[]),newAdd],_addSel:"",_addQty:"1"}:x)});
                        }}>+ Add</button>
                      </div>
                      {/* Show queued adds */}
                      {(c._adds||[]).length>0 && <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>
                        {(c._adds||[]).map((a,i)=><span key={i} style={{padding:"4px 10px",borderRadius:5,fontSize:11,background:"rgba(34,197,94,.12)",color:"#22c55e",display:"flex",alignItems:"center",gap:6,border:"1px solid rgba(34,197,94,.2)"}}>
                          + {a.m||a} ({a.qty||1} {measUnit(a.m||a)})
                          <button type="button" onClick={()=>u({changeOrders:co.map(x=>x.id===c.id?{...x,_adds:(x._adds||[]).filter((_,j)=>j!==i)}:x)})} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>Ã—</button>
                        </span>)}
                      </div>}
                    </div>
                    {/* Remove service â€” dropdown */}
                    <div style={{marginBottom:8}}>
                      <label style={{fontSize:10,color:"#ef4444",fontWeight:600,display:"block",marginBottom:3}}>âˆ’ Remove a Service</label>
                      <div style={{display:"flex",gap:6}}>
                        <select style={{...S.inp,flex:1,fontSize:12}} value="" onChange={e=>{if(e.target.value)u({changeOrders:co.map(x=>x.id===c.id?{...x,_removes:[...(x._removes||[]),e.target.value]}:x)});}}>
                          <option value="">â€” Select measure to remove â€”</option>
                          {[...p.measures,...p.healthSafety].sort().filter(m=>!(c._removes||[]).includes(m)).map(m=>
                            <option key={m} value={m}>{m}</option>
                          )}
                        </select>
                      </div>
                      {(c._removes||[]).length>0 && <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:4}}>
                        {(c._removes||[]).map((m,i)=><span key={i} style={{padding:"4px 10px",borderRadius:5,fontSize:11,background:"rgba(239,68,68,.12)",color:"#ef4444",display:"flex",alignItems:"center",gap:6,border:"1px solid rgba(239,68,68,.2)"}}>
                          âˆ’ {m}
                          <button type="button" onClick={()=>u({changeOrders:co.map(x=>x.id===c.id?{...x,_removes:(x._removes||[]).filter((_,j)=>j!==i)}:x)})} style={{background:"none",border:"none",color:"#86efac",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>Ã—</button>
                        </span>)}
                      </div>}
                    </div>
                    {/* Internal note */}
                    <div style={{marginBottom:8}}>
                      <label style={{fontSize:10,color:"#64748b",fontWeight:600,display:"block",marginBottom:3}}>Internal Note (not visible to installer or customer)</label>
                      <textarea style={{...S.ta,minHeight:36}} value={c._resp||""} onChange={e=>u({changeOrders:co.map(x=>x.id===c.id?{...x,_resp:e.target.value}:x)})} placeholder="Internal justification or notesâ€¦" rows={1}/>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button type="button" style={{flex:1,padding:"10px",borderRadius:6,border:"1px solid rgba(34,197,94,.4)",background:"rgba(34,197,94,.1)",color:"#22c55e",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>updateCO(c.id,{status:"approved",response:c._resp||"",adds:c._adds||[],removes:c._removes||[],text:c._editText!==undefined?c._editText:c.text})}>âœ“ Approve</button>
                      <button type="button" style={{flex:1,padding:"10px",borderRadius:6,border:"1px solid rgba(239,68,68,.4)",background:"rgba(239,68,68,.1)",color:"#ef4444",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>updateCO(c.id,{status:"denied",response:c._resp||"",text:c._editText!==undefined?c._editText:c.text})}>âœ• Deny</button>
                    </div>
                  </div>
                )}
                {c.status==="pending"&&(role==="installer"||role==="hvac")&&<div style={{marginTop:4,fontSize:10,color:"#f59e0b",fontStyle:"italic"}}>â³ Awaiting review from Scope/Admin team</div>}
              </div>
            ))}
            {co.length===0&&<p style={{color:"#475569",fontSize:11,textAlign:"center",padding:8}}>No CORs submitted.</p>}
          </Sec>

          {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
               POST-WORK SCOPE â€” original + approved COs
             â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <Sec title="ðŸ“‹ Post-Work Scope of Work">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:4}}>
              <div style={{fontSize:10,color:"#64748b"}}>Final scope of work as performed, including all approved modifications. Customer signs upon completion of all work.</div>
              <PrintBtn label="Print Post" onClick={()=>{
                const coQtyMap2 = {};
                approvedCOs.forEach(c=>(c.adds||[]).forEach(a=>{if(a.qty)coQtyMap2[a.m]=a.qty;}));
                const getQ = (m) => coQtyMap2[m]||getResolvedQty(p,m)||"1";
                const measRows = postMeasures.map(m=>`<tr style="${coAddNames.includes(m)?'background:#fff7ed':''}">`+
                  `<td style="padding:3px 6px;border:1px solid #ddd">${coAddNames.includes(m)?"ðŸ”¶ ":""}${m}</td>`+
                  `<td style="text-align:right;padding:3px 6px;border:1px solid #ddd">${getQ(m)}</td>`+
                  `<td style="padding:3px 6px;border:1px solid #ddd">${measUnit(m)}</td>`+
                  `<td style="padding:3px 6px;border:1px solid #ddd;font-size:9px;color:${coAddNames.includes(m)?"#c2410c":"#16a34a"}">${coAddNames.includes(m)?"COR Added":"Approved"}</td></tr>`).join("");
                const removedRows = coRemoves.filter(m=>EE_MEASURES.includes(m)).map(m=>`<tr style="background:#fef2f2"><td style="padding:3px 6px;border:1px solid #ddd;text-decoration:line-through;color:#999">${m}</td><td style="padding:3px 6px;border:1px solid #ddd">â€”</td><td style="padding:3px 6px;border:1px solid #ddd">â€”</td><td style="padding:3px 6px;border:1px solid #ddd;font-size:9px;color:#dc2626">COR Removed</td></tr>`).join("");
                const body = `<div class="sec"><h3>Energy Efficiency Measures (Final)</h3>
                  <p style="font-size:10px;color:#666">The following measures were performed as part of the approved scope including any approved CORs.</p>
                  <table style="width:100%;border-collapse:collapse;font-size:10px"><tr style="background:#f0fdf4"><th style="text-align:left;padding:3px 6px;border:1px solid #ccc">Measure</th><th style="text-align:right;padding:3px 6px;border:1px solid #ccc">Qty</th><th style="padding:3px 6px;border:1px solid #ccc">Unit</th><th style="padding:3px 6px;border:1px solid #ccc">Status</th></tr>${measRows}${removedRows}</table></div>
                  ${approvedCOs.length?`<div class="sec"><h3>Approved Scope Modifications (${approvedCOs.length})</h3>${approvedCOs.map(c=>`<div style="padding:6px 0;border-bottom:1px solid #eee"><div style="font-size:11px;color:#333;margin-bottom:4px">${c.text}</div><span style="font-size:10px;color:#666">${(c.adds||[]).map(a=>"+ Add: "+(a.m||a)+(a.qty?" ("+a.qty+")":"")).concat((c.removes||[]).map(r=>"âˆ’ Remove: "+r)).join("<br/>")}</span>${c.photo?'<br/><img src="'+c.photo+'" style="max-width:100%;max-height:250px;margin-top:6px;border-radius:4px;border:1px solid #ddd"/>':""}</div>`).join("")}</div>`:""}`+
                  `<p style="font-size:10px;color:#666;margin-top:12px;font-style:italic">By signing below, the customer acknowledges that the work described above has been completed to their satisfaction.</p>`;
                savePrint(formPrintHTML("Post-Work Scope of Work â€” Completion", p, body, false, fi.postScopeSig));
              }}/>
            </div>
            {approvedCOs.length>0 && <div style={{padding:"6px 10px",background:"rgba(249,115,22,.06)",border:"1px solid rgba(249,115,22,.2)",borderRadius:6,fontSize:11,color:"#f97316",marginBottom:8}}>
              ðŸ“ This scope reflects {approvedCOs.length} approved COR{approvedCOs.length>1?"s":""} â€” additions marked ðŸ”¶, removals shown as struck through.
            </div>}
            {co.filter(c=>c.status==="pending").length>0 && <div style={{padding:"6px 10px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.3)",borderRadius:6,fontSize:11,color:"#fbbf24",marginBottom:8}}>âš  {co.filter(c=>c.status==="pending").length} COR{co.filter(c=>c.status==="pending").length>1?"s":""} pending review â€” post-work scope may still change</div>}
            <ScopeBlock measures={postMeasures} hs={postHS} label="Final" isPost={true}/>
            {/* Approved CO details with photos */}
            {approvedCOs.length>0 && <div style={{marginTop:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"#f97316",marginBottom:4}}>Approved CORs ({approvedCOs.length})</div>
              {approvedCOs.map(c=><div key={c.id} style={{padding:"8px 10px",background:"rgba(249,115,22,.04)",border:"1px solid rgba(249,115,22,.15)",borderRadius:6,marginBottom:6}}>
                <div style={{fontSize:11,color:"#e2e8f0",marginBottom:4}}>{c.text}</div>
                <div style={{fontSize:10,color:"#94a3b8"}}>
                  {(c.adds||[]).map((a,i)=><span key={"a"+i} style={{color:"#22c55e",marginRight:8}}>+ {a.m||a}{a.qty?" ("+a.qty+")":""}</span>)}
                  {(c.removes||[]).map((m,i)=><span key={"r"+i} style={{color:"#ef4444",marginRight:8}}>âˆ’ {m}</span>)}
                </div>
                {c.photo && <img src={c.photo} style={{maxWidth:"100%",maxHeight:200,borderRadius:6,marginTop:6,border:"1px solid rgba(255,255,255,.1)"}} alt="COR evidence"/>}
                <div style={{fontSize:9,color:"#64748b",marginTop:4}}>Approved Â· {new Date(c.at).toLocaleString()}</div>
              </div>)}
            </div>}
            {fi.postScopeSig ? (
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>âœ“ Post-Work Scope Signed â€” Work Accepted</div>{fi.postScopeDate&&<div style={{fontSize:9,color:"#64748b"}}>{new Date(fi.postScopeDate).toLocaleString()}</div>}</div>
                  {(role==="admin"||role==="scope")&&<button type="button" style={{...S.ghost,padding:"3px 8px",fontSize:9,color:"#f59e0b",borderColor:"rgba(245,158,11,.3)"}} onClick={()=>{u({fi:{...fi,postScopeSig:"",postScopeDate:""}});onLog("Post-work scope signature cleared");}}>Clear Signature</button>}
                </div>
                <img src={fi.postScopeSig} style={{maxWidth:200,height:50,objectFit:"contain",marginTop:4}} alt="sig"/>
              </div>
            ) : (
              <div style={{marginTop:10}}>
                <div style={{fontSize:10,color:"#475569",marginBottom:4,fontStyle:"italic"}}>By signing below, the customer acknowledges that the work described in this post-work scope has been completed to their satisfaction and accepts the work as performed.</div>
                <SigPad label="Customer Signature â€” Post-Work Scope Acceptance" value="" onChange={v=>{u({fi:{...fi,postScopeSig:v,postScopeDate:new Date().toISOString()}});onLog("Customer signed post-work scope acceptance");}}/>
              </div>
            )}
          </Sec>
        </>;
      })()}

      {/* â”€â”€ POST PHOTOS â”€â”€ */}
      <Sec title={<span>Post-Install Photos <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{postTaken}/{postItems.length}</span></span>}>
        <div style={S.prog}><div style={{...S.progF,width:`${postItems.length?(postTaken/postItems.length)*100:0}%`,background:"linear-gradient(90deg,#f97316,#eab308)"}}/></div>
        {postSections.map(([cat,items]) => (
          <div key={cat} style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#f97316",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>{cat}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:6}}>
              {items.map(item => {
                const arr = getPhotos(p.photos, item.id);
                const has = arr.length > 0;
                return <div key={item.id} style={{background:has?"rgba(34,197,94,.08)":"rgba(255,255,255,.03)",border:`1px solid ${has?"rgba(34,197,94,.3)":"rgba(255,255,255,.08)"}`,borderRadius:8,overflow:"hidden"}}>
                  {has ? <div style={{position:"relative",cursor:"pointer"}} onClick={()=>setPrev({id:item.id,idx:0})}>
                    <img src={arr[0].d} style={{width:"100%",height:70,objectFit:"cover"}} alt=""/>
                    {arr.length>1 && <span style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,.7)",color:"#fff",fontSize:9,padding:"1px 4px",borderRadius:4}}>{arr.length}</span>}
                  </div> : <div style={{height:70,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <label style={{fontSize:10,color:"#64748b",cursor:"pointer",textAlign:"center",padding:4}}>ðŸ“¸ Tap<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(item.id,e.target.files?.[0])}/></label>
                  </div>}
                  <div style={{padding:"4px 6px",fontSize:9,color:"#94a3b8",borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{item.l}{has&&" âœ“"}</span>
                    {has && <label style={{fontSize:10,color:"#60A5FA",cursor:"pointer"}}>ï¼‹<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(item.id,e.target.files?.[0])}/></label>}
                  </div>
                </div>;
              })}
            </div>
          </div>
        ))}
      </Sec>

      {/* â”€â”€ BLOWER DOOR â”€â”€ */}
      <Sec title="Post-Work Blower Door">
        <Gr>
          <F label="Pre CFM50" value={p.preCFM50} onChange={v=>u({preCFM50:v})} num/>
          <F label="Post CFM50" value={p.postCFM50} onChange={v=>u({postCFM50:v})} num/>
          <F label="Pre CFM25" value={p.preCFM25} onChange={v=>u({preCFM25:v})} num/>
          <F label="Post CFM25" value={p.postCFM25} onChange={v=>u({postCFM25:v})} num/>
        </Gr>
        {red !== null && <div style={S.calc}><span>Air Seal Reduction: <b>{red}%</b></span><span style={{color:red>=25?"#22c55e":"#f59e0b",marginLeft:10}}>{red>=25?"âœ“ Meets 25%":"âš  Below 25%"}</span></div>}
        {p.preCFM25 && p.postCFM25 && (()=>{const r=Math.round((Number(p.preCFM25)-Number(p.postCFM25))/Number(p.preCFM25)*100);return <div style={S.calc}><span>Duct Leakage Reduction: <b>{r}%</b> ({p.preCFM25}â†’{p.postCFM25} CFM25)</span></div>;})()}
      </Sec>

      {/* â”€â”€ POST-WORK RED CALC â”€â”€ */}
      <Sec title="Post-Work ASHRAE 62.2-2016 â€” RED Calc">
        {!rcPost.Q50 ? <p style={{color:"#64748b",fontSize:12,textAlign:"center",padding:12}}>Enter Post CFM50 above to calculate.</p> : (() => {
          const {Afl,Nbr,Q50,H,Hr,wsf,st,Qinf,Qtot,totalDef,supplement,Qfan,FAN_SETTINGS,recFan,baseSqft,finBasement,kCFM,b1,b2,b3,kPresent,b1Present,b2Present,b3Present,kWin,b1Win,b2Win,b3Win,kReq,b1Req,b2Req,b3Req,kDef,b1Def,b2Def,b3Def} = rcPost;
          const hdr = {fontSize:13,fontWeight:700,color:"#60A5FA",margin:"14px 0 6px",borderBottom:"1px solid rgba(37,99,235,.25)",paddingBottom:4};
          const row = {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",fontSize:12,borderBottom:"1px solid rgba(255,255,255,.04)"};
          const lbl = {color:"#94a3b8",flex:1};
          const val = {fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#e2e8f0",textAlign:"right"};
          const eq = {fontSize:10,color:"#475569",padding:"1px 0 5px 12px",fontFamily:"'JetBrains Mono',monospace",borderLeft:"2px solid rgba(37,99,235,.15)"};
          const autoBox = {background:"rgba(37,99,235,.06)",borderRadius:6,padding:"6px 10px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:13,color:"#e2e8f0",textAlign:"center"};
          const autoSub = {fontSize:9,color:"#64748b",textAlign:"center",marginTop:2};
          const resultBox = {background:"rgba(37,99,235,.08)",border:"2px solid rgba(37,99,235,.3)",borderRadius:8,padding:12,marginTop:8};

          return <div>
            {/* Configuration */}
            <div style={hdr}>Configuration</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 16px",fontSize:12}}>
              <div style={row}><span style={lbl}>Construction</span><span style={val}>Existing</span></div>
              <div style={row}><span style={lbl}>Dwelling unit</span><span style={val}>Detached</span></div>
              <div style={row}><span style={lbl}>Infiltration credit</span><span style={val}>Yes</span></div>
              <div style={row}><span style={lbl}>Alt. compliance</span><span style={val}>Yes</span></div>
              <div style={row}><span style={lbl}>Weather station</span><span style={val}>Chicago Midway AP</span></div>
              <div style={row}><span style={lbl}>wsf [1/hr]</span><span style={{...val,color:"#60A5FA"}}>{wsf}</span></div>
            </div>

            {/* Building Inputs */}
            <div style={hdr}>Building Inputs (Post-Work)</div>
            <div className="ashrae-inputs" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Floor area [ftÂ²]</div><div style={autoBox}>{Afl||"â€”"}</div><div style={autoSub}>{finBasement>0?`${baseSqft} + ${finBasement} fin. bsmt`:"â† Sq Footage"}</div></div>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Nocc (occupants)</div><div style={autoBox}>{Nbr + 1}</div><div style={autoSub}>{Nbr} bedrooms + 1 = {Nbr + 1}</div></div>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Height [ft]</div><div style={autoBox}>{H}</div><div style={autoSub}>{st>=2?"2-story":"1"+(st>=1.5?".5":"")+"-story"}</div></div>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Post Q50 [CFM]</div><div style={{...autoBox,color:"#22c55e"}}>{Q50}</div><div style={autoSub}>â† Post blower door</div></div>
            </div>

            {/* Local Ventilation â€” read-only from scope */}
            <div style={hdr}>Local Ventilation â€” Alternative Compliance <span style={{fontSize:9,fontWeight:400,color:"#64748b"}}>(from Scope)</span></div>
            <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>Blank = no fan = no requirement. Openable window = 20 CFM credit. Kitchen: 100 CFM Â· Bath: 50 CFM (intermittent rates)</div>
            <div className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",fontSize:11,alignItems:"center"}}>
              <span style={{fontWeight:600,color:"#64748b"}}></span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Fan Flow [CFM]</span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center",fontSize:9}}>Window</span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Req'd</span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Deficit</span>
            </div>
            {[
              {n:"Kitchen",v:kCFM,w:kWin,r:kReq,d:kDef,present:kPresent},
              {n:"Bath #1",v:b1,w:b1Win,r:b1Req,d:b1Def,present:b1Present},
              {n:"Bath #2",v:b2,w:b2Win,r:b2Req,d:b2Def,present:b2Present},
              {n:"Bath #3",v:b3,w:b3Win,r:b3Req,d:b3Def,present:b3Present},
            ].map(f=>(
              <div key={f.n} className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",alignItems:"center",marginBottom:2}}>
                <span style={{fontSize:12,color:"#cbd5e1"}}>{f.n}</span>
                <div style={{textAlign:"center",fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:f.present?"#e2e8f0":"#475569",background:"rgba(255,255,255,.03)",borderRadius:4,padding:"4px 6px"}}>{f.present?f.v:"â€”"}</div>
                <div style={{textAlign:"center",fontSize:11,color:f.w?"#60A5FA":"#475569"}}>{f.w?"âœ“":"â€”"}</div>
                <div style={{textAlign:"center",fontSize:11,color:f.present?"#64748b":"#475569"}}>{f.present?f.r:"â€”"}</div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:!f.present?"#475569":f.d>0?"#f59e0b":"#22c55e"}}>{f.present?f.d:"â€”"}</div>
              </div>
            ))}
            <div className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:4,marginTop:4}}>
              <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>Total</span>
              <span></span><span></span><span></span>
              <div style={{textAlign:"center",fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:totalDef>0?"#f59e0b":"#22c55e"}}>{Ri(totalDef)}</div>
            </div>

            {/* Results with full equations */}
            <div style={resultBox}>
              <div style={{fontSize:13,fontWeight:700,color:"#3B82F6",marginBottom:10}}>Post-Work Ventilation Results</div>

              <div style={row}><span style={lbl}>Infiltration credit, Qinf [CFM]</span><span style={val}>{R(Qinf)}</span></div>
              <div style={eq}>= 0.052 Ã— Q50 Ã— wsf Ã— (H / 8.2)^0.4<br/>= 0.052 Ã— {Q50} Ã— {wsf} Ã— ({H} / 8.2)^0.4</div>

              <div style={row}><span style={lbl}>Total required ventilation rate, Qtot [CFM]</span><span style={val}>{R(Qtot)}</span></div>
              <div style={eq}>= 0.03 Ã— Afl + 7.5 Ã— (Nbr + 1)<br/>= 0.03 Ã— {Afl} + 7.5 Ã— ({Nbr} + 1)<br/>= {R(0.03*Afl)} + {R(7.5*(Nbr+1))}</div>

              <div style={row}><span style={lbl}>Total local ventilation deficit [CFM]</span><span style={val}>{Ri(totalDef)}</span></div>
              <div style={eq}>= Î£ max(0, req âˆ’ measured) per fan<br/>Kitchen {kReq} âˆ’ {kCFM} = {kDef} Â· Bath1 {b1Req} âˆ’ {b1} = {b1Def} Â· Bath2 {b2Req} âˆ’ {b2} = {b2Def} Â· Bath3 {b3Req} âˆ’ {b3} = {b3Def}</div>

              <div style={row}><span style={lbl}>Alternative compliance supplement [CFM]</span><span style={val}>{R(supplement)}</span></div>
              <div style={eq}>= totalDeficit Ã— 0.25 (intermittent â†’ continuous)<br/>= {Ri(totalDef)} Ã— 0.25</div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0 4px",borderTop:"2px solid rgba(37,99,235,.4)",marginTop:8}}>
                <span style={{fontWeight:700,color:"#e2e8f0",fontSize:13}}>Required mech. ventilation, Qfan [CFM]</span>
                <span style={{fontWeight:800,color:Qfan < PROGRAM.fanMinCFM ? "#22c55e" : "#3B82F6",fontSize:18,fontFamily:"'JetBrains Mono',monospace"}}>{R(Qfan)}</span>
              </div>
              <div style={eq}>= Qtot + supplement âˆ’ Qinf<br/>= {R(Qtot)} + {R(supplement)} âˆ’ {R(Qinf)}</div>
              {Qfan < PROGRAM.fanMinCFM && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.3)",borderRadius:6,fontSize:12,color:"#22c55e",fontWeight:600}}>âœ“ Qfan below {PROGRAM.fanMinCFM} CFM â€” no mechanical ventilation fan required</div>}
              {rcPre.Qfan > 0 && <div style={{fontSize:10,color:"#64748b",marginTop:4,padding:"4px 8px",background:"rgba(255,255,255,.03)",borderRadius:4}}>Pre-work Qfan was {R(rcPre.Qfan)} CFM Â· Î” {R(Qfan-rcPre.Qfan)} CFM</div>}
            </div>

            {/* Fan Setting + Run-Time Solver */}
            {Qfan >= PROGRAM.fanMinCFM && <div style={{background:"rgba(37,99,235,.04)",border:"1px solid rgba(37,99,235,.2)",borderRadius:8,padding:10,marginTop:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"#60A5FA",marginBottom:6}}>Dwelling-Unit Ventilation Run-Time Solver</div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:8}}>Select fan setting. Recommended = lowest setting â‰¥ Qfan ({R(Qfan)} CFM). All fans run continuous.</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {FAN_SETTINGS.map(cfm => {
                  const meets = cfm >= Qfan && Qfan > 0;
                  const isRec = cfm === recFan && Qfan > 0;
                  const sel = Number(fi.postFanSetting) === cfm;
                  return <button key={cfm} type="button" onClick={()=>uf("postFanSetting",cfm)} style={{
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
              {Number(fi.postFanSetting) > 0 && Qfan > 0 && (() => {
                const fan = Number(fi.postFanSetting);
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
                  <div style={eq}>= Qfan Ã· fan capacity Ã— 60<br/>= {R(Qfan)} Ã· {fan} Ã— 60 = {minPerHr} min/hr</div>
                  <div style={{marginTop:6,fontSize:10,color:fan >= Qfan?"#22c55e":"#f59e0b",fontWeight:600}}>
                    {fan >= Qfan?`âœ“ Continuous (60 min/hr) exceeds minimum ${minPerHr} min/hr`:`âš  Fan setting below Qfan â€” does not meet requirement`}
                  </div>
                </div>;
              })()}
            </div>}
            <p style={{fontSize:9,color:"#475569",marginTop:10,textAlign:"right"}}>ASHRAE 62.2-2016 Â· Local Ventilation Alternative Compliance Â· basc.pnnl.gov/redcalc</p>
          </div>;
        })()}
      </Sec>

      {/* â”€â”€ CAZ / HEALTH & SAFETY â”€â”€ */}
      <Sec title="Health & Safety Checks">
        {FI_SAFETY.map(c => {
          const r = fi.safety?.[c.k] || {};
          return (
            <div key={c.k} style={S.cazR}>
              <span style={{flex:1,fontSize:12,minWidth:110}}>{c.l}</span>
              {c.r && <input style={{...S.inp,width:55,textAlign:"center"}} value={r.reading||""} onChange={e=>sf(c.k,"reading",e.target.value)} placeholder={c.u}/>}
              <BtnGrp value={r.pf||""} onChange={v=>sf(c.k,"pf",v)} opts={[{v:"P",l:"Pass",c:"#22c55e"},{v:"F",l:"Fail",c:"#ef4444"},{v:"NA",l:"N/A",c:"#64748b"}]}/>
              <CK checked={r.fu||false} onChange={v=>sf(c.k,"fu",v)} label="F/U" small/>
            </div>
          );
        })}
      </Sec>

      {/* â”€â”€ FOLLOW-UP â”€â”€ */}
      <Sec title="Follow-up">
        <CK checked={fi.followupNeeded==="yes"} onChange={v=>uf("followupNeeded",v?"yes":"no")} label="Follow-up needed"/>
        {fi.followupNeeded==="yes" && <textarea style={{...S.ta,marginTop:6}} value={fi.followupNotes||""} onChange={e=>uf("followupNotes",e.target.value)} rows={2} placeholder="What needs follow-upâ€¦"/>}
      </Sec>

      {/* â”€â”€ SIGN-OFF â”€â”€ */}
      <Sec title="Final Sign-off">
        <CK checked={p.finalPassed} onChange={v=>u({finalPassed:v})} label="âœ… Final Inspection Passed"/>
        <div style={{marginTop:6}}><CK checked={p.customerSignoff} onChange={v=>u({customerSignoff:v})} label="âœ… Customer Signature Collected"/></div>
        <SigPad label="Installer / Inspector Signature" value={fi.inspectorSig||""} onChange={v=>uf("inspectorSig",v)}/>
        <SigPad label="Customer Signature â€” Work Completion" value={fi.customerSig||""} onChange={v=>uf("customerSig",v)}/>
      </Sec>
    </div>
  );
}



