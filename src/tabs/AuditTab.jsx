import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function AuditTab({p,u,onLog,user}) {
  const a = p.audit || {};
  const sa = (k,v) => u({audit:{...a,[k]:v}});
  const [prev, setPrev] = useState(null); // {id, idx}
  // Pre Photos
  const preSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.includes("(Pre)"));
  const preItems = preSections.flatMap(([cat,items])=>items.map(i=>({...i,cat})));
  const preTaken = preItems.filter(i=>hasPhoto(p.photos,i.id)).length;

  const handleFile = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type === "image/gif") {
        const existing = getPhotos(p.photos, id);
        const newEntry = {d:e.target.result,at:new Date().toISOString(),by:user};
        u({photos:{...p.photos,[id]:[...existing, newEntry]}});
        if(onLog) onLog(`ðŸ“¸ ${preItems.find(x=>x.id===id)?.l||id} (${existing.length+1})`);
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
        if(onLog) onLog(`ðŸ“¸ ${preItems.find(x=>x.id===id)?.l||id} (${existing.length+1})`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Photo preview
  if (prev) {
    const arr = getPhotos(p.photos, prev.id);
    const ph = arr[prev.idx]; const it = preItems.find(x=>x.id===prev.id);
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
        <div style={{padding:12,textAlign:"center",fontSize:11,color:"#94a3b8"}}>{ph?.by} · {ph?.at&&new Date(ph.at).toLocaleString()}</div>
      </div>
    );
  }

  const getAuditHTML = () => {
    const body = `
      <div class="sec"><h3>Basic Info</h3><div class="grid">
        <div class="row"><span class="lbl">Occupants</span><span class="val">${a.occupants||"â€”"}</span></div>
        <div class="row"><span class="lbl">Tenant Type</span><span class="val">${a.tenantType||"â€”"}</span></div>
        <div class="row"><span class="lbl">Roof Age</span><span class="val">${a.roofAge||"â€”"}</span></div>
        <div class="row"><span class="lbl">Thermostat</span><span class="val">${a.thermostatType||"â€”"}</span></div>
        <div class="row"><span class="lbl">Ceiling</span><span class="val">${a.ceilingCond||"â€”"}</span></div>
        <div class="row"><span class="lbl">Walls</span><span class="val">${a.wallCond||"â€”"}</span></div>
        <div class="row"><span class="lbl">Walls Need Insul.</span><span class="val">${a.wallsNeedInsul||"â€”"}</span></div>
      </div></div>
      <div class="sec"><h3>Fan Testing</h3><div class="grid">
        <div class="row"><span class="lbl">Bath Fan 1</span><span class="val">${a.bathFan1||"â€”"} CFM</span></div>
        <div class="row"><span class="lbl">Bath Fan 2</span><span class="val">${a.bathFan2||"â€”"} CFM</span></div>
        <div class="row"><span class="lbl">Bath Fan 3</span><span class="val">${a.bathFan3||"â€”"} CFM</span></div>
        <div class="row"><span class="lbl">Kitchen Fan</span><span class="val">${a.kitchenFan||"â€”"} CFM</span></div>
      </div></div>
      <div class="sec"><h3>Smoke / CO</h3><div class="grid">
        <div class="row"><span class="lbl">Smoke Present</span><span class="val">${a.smokePresent||"â€”"}</span></div>
        <div class="row"><span class="lbl">Smoke to Install</span><span class="val">${a.smokeNeeded||"â€”"}</span></div>
        <div class="row"><span class="lbl">CO Present</span><span class="val">${a.coPresent||"â€”"}</span></div>
        <div class="row"><span class="lbl">CO to Install</span><span class="val">${a.coNeeded||"â€”"}</span></div>
      </div></div>
      <div class="sec"><h3>Weatherization</h3><div class="grid">
        <div class="row"><span class="lbl">Tenmats</span><span class="val">${a.tenmats||"â€”"}</span></div>
        <div class="row"><span class="lbl">Door Sweeps/WS</span><span class="val">${a.doorSweeps||"â€”"}</span></div>
      </div></div>
      <div class="sec"><h3>H&S Conditions</h3>${["Gas Mechanical Repair","Mold Remediation","Water/Sewage Issues","Asbestos Abatement","Electrical Issues","Other"].filter(x=>a.hsConds?.[x]).map(x=>`<span style="display:inline-block;padding:2px 8px;border:1px solid #ddd;border-radius:4px;margin:2px;font-size:11px">${x}</span>`).join("")||"<span style='color:#999'>None</span>"}</div>
      <div class="sec"><h3>Status</h3><div class="row"><span class="lbl">Deferred?</span><span class="val">${a.deferred||"â€”"}</span></div>${a.additionalNotes?`<p style="margin-top:6px;color:#666">${a.additionalNotes}</p>`:""}</div>`;
    return formPrintHTML("Data Collection Tool — Assessment", p, body, a.assessorSig);
  };

  return (
    <div>
      {/* â”€â”€ CUSTOMER AUTHORIZATION FORM â”€â”€ */}
      <Sec title={<span>Customer Authorization Form {a.customerAuthSig ? <span style={{color:"#22c55e",fontSize:11}}>âœ“ Signed</span> : <span style={{color:"#f59e0b",fontSize:11}}>âš  Required</span>}</span>}>
        {/* Page 1 with signature fields overlaid on the form */}
        <div style={{position:"relative",background:"#fff",borderRadius:6,overflow:"hidden"}}>
          <img src="/auth-form-page1.jpg" alt="Page 1" style={{width:"100%",display:"block"}}/>
          {/* Overlay: Customer representative signature â€” row at 43.3%-44.9% */}
          <div style={{position:"absolute",top:"43.4%",left:"41.5%",width:"52%",height:"1.4%",cursor:"pointer",display:"flex",alignItems:"center"}} onClick={()=>{if(!a.customerAuthSig){const el=document.getElementById("authSigTrigger");if(el)el.click();}}}>
            {a.customerAuthSig && <img src={a.customerAuthSig} style={{height:"100%",objectFit:"contain"}}/>}
          </div>
          {/* Overlay: Customer representative printed name â€” row at 44.9%-46.5% */}
          <div style={{position:"absolute",top:"45%",left:"41.5%",width:"52%",height:"1.4%",display:"flex",alignItems:"center"}}>
            <input style={{width:"100%",height:"100%",border:"none",background:"transparent",fontSize:"1.2vw",fontWeight:600,color:"#000",outline:"none",fontFamily:"Arial,sans-serif",padding:0}} value={a.customerAuthName||p.customerName||""} onChange={e=>sa("customerAuthName",e.target.value)} placeholder=""/>
          </div>
          {/* Overlay: Date â€” row at 46.5%-48.1% */}
          <div style={{position:"absolute",top:"46.6%",left:"41.5%",width:"52%",height:"1.4%",display:"flex",alignItems:"center"}}>
            <span style={{fontSize:"1.2vw",color:"#000",fontFamily:"Arial,sans-serif"}}>{a.authDate ? new Date(a.authDate).toLocaleDateString("en-US") : ""}</span>
          </div>
          {/* Overlay: Property address â€” row at 48.1%-49.6% */}
          <div style={{position:"absolute",top:"48.2%",left:"41.5%",width:"52%",height:"1.4%",display:"flex",alignItems:"center"}}>
            <span style={{fontSize:"1.2vw",color:"#000",fontFamily:"Arial,sans-serif"}}>{p.address||""}</span>
          </div>
        </div>
        {/* Page 2 */}
        <div style={{background:"#fff",borderRadius:6,overflow:"hidden",marginTop:4}}>
          <img src="/auth-form-page2.jpg" alt="Page 2" style={{width:"100%",display:"block"}}/>
        </div>
        {/* Sign / Re-sign after both pages */}
        {!a.customerAuthSig && <div style={{marginTop:8}}>
          <SigPad label="Customer Signature" value={a.customerAuthSig||""} onChange={v=>{u({audit:{...a,customerAuthSig:v,...(v&&!a.authDate?{authDate:new Date().toISOString()}:{})}});}}/>
        </div>}
        {a.customerAuthSig && <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={{...S.btn,padding:"8px 16px",fontSize:12}} onClick={()=>{
            const sigImg = a.customerAuthSig ? `<img src="${a.customerAuthSig}" style="height:100%;object-fit:contain"/>` : "";
            const authDate = a.authDate ? new Date(a.authDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "";
            savePrint(`<div style="max-width:720px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#000;padding:20px">
<div style="position:relative">
<img src="/auth-form-page1.jpg" style="width:100%;display:block"/>
<div style="position:absolute;top:43.4%;left:41.5%;width:52%;height:1.4%;display:flex;align-items:center;overflow:hidden">${sigImg}</div>
<div style="position:absolute;top:45%;left:41.5%;width:52%;height:1.4%;display:flex;align-items:center"><span style="font-size:9px;font-weight:bold;color:#000">${a.customerAuthName||p.customerName||""}</span></div>
<div style="position:absolute;top:46.6%;left:41.5%;width:52%;height:1.4%;display:flex;align-items:center"><span style="font-size:9px;color:#000">${authDate}</span></div>
<div style="position:absolute;top:48.2%;left:41.5%;width:52%;height:1.4%;display:flex;align-items:center"><span style="font-size:9px;color:#000">${p.address||""}</span></div>
</div>
<div style="page-break-before:always"></div>
<img src="/auth-form-page2.jpg" style="width:100%;display:block"/>
</div>`);
          }}>ðŸ–¨ï¸ Print Signed Form</button>
          <button style={{...S.ghost,padding:"8px 16px",fontSize:12,color:"#ef4444",borderColor:"rgba(239,68,68,.3)"}} onClick={()=>{u({audit:{...a,customerAuthSig:"",authDate:"",customerAuthName:""}});}}>âœ• Clear & Re-sign</button>
        </div>}
      </Sec>

      <Sec title="ðŸ“‹ Data Collection Tool">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:11,color:"#94a3b8",margin:0}}>For use with BLK2GO</p>
          <PrintBtn onClick={()=>savePrint(getAuditHTML())}/>
        </div>
        <p style={{fontSize:10,color:"#64748b",marginTop:4}}>Customer: <b>{p.customerName}</b> · {p.address} · Assessment: {p.assessmentDate ? fmts(p.assessmentDate) : "â€”"}</p>
      </Sec>

      <Sec title="Basic Info">
        <Gr>
          <F label="5. Number of Occupants *" value={a.occupants||""} onChange={v=>sa("occupants",v)} num/>
          <Sel label="6. Tenant Type *" value={a.tenantType||""} onChange={v=>sa("tenantType",v)} opts={["Owned","Rented"]}/>
          <F label="7. Roof Age (guesstimate) *" value={a.roofAge||""} onChange={v=>sa("roofAge",v)} num/>
        </Gr>
      </Sec>

      <Sec title="Interior Conditions">
        <Sel label="8. Thermostat Type *" value={a.thermostatType||""} onChange={v=>sa("thermostatType",v)} opts={["Non-programmable","Programmable","Smart","Other"]}/>
        <div style={{height:8}}/>
        <Gr>
          <Sel label="9. Drywall Ceiling Conditions *" value={a.ceilingCond||""} onChange={v=>sa("ceilingCond",v)} opts={["Good","Poor"]}/>
          <Sel label="10. Drywall Wall Conditions *" value={a.wallCond||""} onChange={v=>sa("wallCond",v)} opts={["Good","Fair","Poor"]}/>
        </Gr>
        <div style={{height:8}}/>
        <Sel label="11. Walls Need Insulation? *" value={a.wallsNeedInsul||""} onChange={v=>sa("wallsNeedInsul",v)} opts={["Yes","No","Other"]}/>
      </Sec>

      <Sec title="Pressure Pan / Fan Testing">
        <Gr>
          <F label="12. Bath Fan 1 CFM *" value={a.bathFan1||""} onChange={v=>sa("bathFan1",v)} num/>
          <F label="13. Bath Fan 2 CFM" value={a.bathFan2||""} onChange={v=>sa("bathFan2",v)} num/>
          <F label="14. Bath Fan 3 CFM" value={a.bathFan3||""} onChange={v=>sa("bathFan3",v)} num/>
          <F label="15. Kitchen Fan CFM" value={a.kitchenFan||""} onChange={v=>sa("kitchenFan",v)} num/>
        </Gr>
        <p style={{fontSize:10,color:"#64748b",marginTop:4}}>Q13-14 only if additional full baths present</p>
        <p style={{fontSize:10,color:"#f59e0b",marginTop:2}}>âš  If a fan is present but not operational or CFM is unknown, enter 0. Leave blank if no fan exists.</p>
      </Sec>

      <Sec title="Smoke / CO Detectors">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <F label="16. Smoke â€” present *" value={a.smokePresent||""} onChange={v=>sa("smokePresent",v)} num/>
          <F label="17. Smoke â€” to install *" value={a.smokeNeeded||""} onChange={v=>sa("smokeNeeded",v)} num/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:6}}>
          <F label="18. CO â€” present *" value={a.coPresent||""} onChange={v=>sa("coPresent",v)} num/>
          <F label="19. CO â€” to install *" value={a.coNeeded||""} onChange={v=>sa("coNeeded",v)} num/>
        </div>
      </Sec>

      <Sec title="Weatherization">
        <Gr>
          <F label="20. Tenmats Needed *" value={a.tenmats||""} onChange={v=>sa("tenmats",v)} num/>
          <F label="21. Doors Need Sweeps/WS *" value={a.doorSweeps||""} onChange={v=>sa("doorSweeps",v)} num/>
        </Gr>
      </Sec>

      <Sec title="22. Health & Safety Conditions">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          {["Gas Mechanical Repair","Mold Remediation","Water/Sewage Issues","Asbestos Abatement","Electrical Issues","Other"].map(x =>
            <CK key={x} checked={a.hsConds?.[x]} onChange={v=>sa("hsConds",{...(a.hsConds||{}),[x]:v})} label={x}/>
          )}
        </div>
      </Sec>

      <Sec title="Blower Door">
        <Gr>
          <F label="Pre CFM50" value={p.preCFM50} onChange={v=>u({preCFM50:v})} num/>
          <F label="BD Location" value={p.bdLoc} onChange={v=>u({bdLoc:v})} placeholder="Front/Side"/>
          <F label="Ext. Temp" value={p.extTemp} onChange={v=>u({extTemp:v})} placeholder="°F" num/>
        </Gr>
        {p.preCFM50 && p.sqft && <div style={S.calc}><span>Pre CFM50: <b>{p.preCFM50}</b></span><span style={{color:Number(p.preCFM50)>=Number(p.sqft)*1.1?"#22c55e":"#f59e0b",marginLeft:10}}>{Number(p.preCFM50)>=Number(p.sqft)*1.1?"âœ“ â‰¥110% sqft":"âš  <110% sqft"}</span></div>}
      </Sec>

      <Sec title="CAZ Testing">
        {CAZ_ITEMS.map(c => {
          const r = p.cazResults?.[c.k] || {};
          return (
            <div key={c.k} style={S.cazR}>
              <span style={{flex:1,fontSize:12,minWidth:120}}>{c.l}</span>
              {c.r && <input style={{...S.inp,width:60,textAlign:"center"}} value={r.reading||""} onChange={e=>u({cazResults:{...p.cazResults,[c.k]:{...(p.cazResults?.[c.k]||{}),reading:e.target.value}}})} placeholder={c.u}/>}
              <BtnGrp value={r.result||""} onChange={v=>u({cazResults:{...p.cazResults,[c.k]:{...(p.cazResults?.[c.k]||{}),result:v}}})} opts={[{v:"pass",l:"Pass",c:"#22c55e"},{v:"fail",l:"Fail",c:"#ef4444"},{v:"na",l:"N/A",c:"#64748b"}]}/>
              <CK checked={r.fu||false} onChange={v=>u({cazResults:{...p.cazResults,[c.k]:{...(p.cazResults?.[c.k]||{}),fu:v}}})} label="F/U" small/>
            </div>
          );
        })}
      </Sec>


      <Sec title="Project Status">
        <Sel label="23. Project Deferred? *" value={a.deferred||""} onChange={v=>sa("deferred",v)} opts={["YES","NO"]}/>
        <div style={{height:8}}/>
        <div><label style={S.fl}>24. Additional Notes</label><textarea style={S.ta} value={a.additionalNotes||""} onChange={e=>sa("additionalNotes",e.target.value)} rows={3} placeholder="Any additional informationâ€¦"/></div>
        <SigPad label="Assessor Signature" value={a.assessorSig||""} onChange={v=>sa("assessorSig",v)}/>
      </Sec>

      {/* â”€â”€ PRE-INSTALL PHOTOS â”€â”€ */}
      <Sec title={<span>Pre-Install Photos <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{preTaken}/{preItems.length}</span></span>}>
        <div style={S.prog}><div style={{...S.progF,width:`${preItems.length?(preTaken/preItems.length)*100:0}%`,background:"linear-gradient(90deg,#2563EB,#3B82F6)"}}/></div>
        {preSections.map(([cat,items]) => (
          <div key={cat} style={{marginTop:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#60A5FA",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>{cat}</div>
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
    </div>
  );
}



