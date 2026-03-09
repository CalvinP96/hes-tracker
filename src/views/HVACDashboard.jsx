import React, { useState, useRef } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit } from "../helpers/index.js";
import { Sec, Gr, F, Sel, CK, PrintBtn, SI, SigPad } from "../components/ui.jsx";
  // â”€â”€ HVAC Tech Dedicated View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (role === "hvac") {
    const hvacJobs = projects.filter(p => p.currentStage >= 3 && p.currentStage <= 7);
    const myNotifications = [];
    projects.forEach(pr => {
      const hv = pr.hvac || {};
      if (hv.replaceRequestBy === userName) {
        if (hv.replaceRequestStatus === "approved") myNotifications.push({ proj: pr, status: "approved", type: hv.replaceType });
        if (hv.replaceRequestStatus === "denied") myNotifications.push({ proj: pr, status: "denied", type: hv.replaceType });
      }
    });
    // Job states: tuneJobs = not done yet, replJobs = tune done + approved + repl not done, doneJobs = fully done (hidden)
    const tuneJobs = hvacJobs.filter(p => !(p.hvac||{}).completed);
    const replJobs = hvacJobs.filter(p => {
      const hv = p.hvac||{};
      return hv.completed && hv.replaceRequestStatus==="approved" && !hv.replInstallComplete;
    });
    const pendingJobs = [...tuneJobs, ...replJobs]; // all active
    const completedJobs = hvacJobs.filter(p => {
      const hv = p.hvac||{};
      if (!hv.completed) return false;
      if (hv.replaceRequestStatus==="approved" && !hv.replInstallComplete) return false;
      return true;
    });

    // If a project is selected, show HVAC work view
    if (selId) {
      const pr = projects.find(p => p.id === selId);
      if (pr) {
        const hv = pr.hvac||{};
        const isReplPhase = hv.completed && hv.replaceRequestStatus==="approved" && !hv.replInstallComplete;
        const replSections = Object.entries(PHOTO_SECTIONS).filter(([cat])=>cat.startsWith("HVAC Replacement"));
        const replItems = replSections.flatMap(([,items])=>items);
        const replTaken = replItems.filter(i=>hasPhoto(pr.photos,i.id)).length;

        const compressRepl = (id,file) => {
          if(!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const maxW=1600; let w=img.width,h2=img.height;
              if(w>maxW){h2=Math.round(h2*maxW/w);w=maxW;}
              const c=document.createElement("canvas"); c.width=w; c.height=h2;
              c.getContext("2d").drawImage(img,0,0,w,h2);
              const compressed=c.toDataURL("image/jpeg",0.7);
              const existing=getPhotos(pr.photos,id);
              upC(pr.id,{photos:{...pr.photos,[id]:[...existing,{d:compressed,at:new Date().toISOString(),by:userName}]}});
              addLog(pr.id,`ðŸ“¸ Replacement: ${replItems.find(x=>x.id===id)?.l||id}`);
            };
            img.src=e.target.result;
          };
          reader.readAsDataURL(file);
        };

        // â”€â”€ Replacement Install View â”€â”€
        if (isReplPhase) {
          return (
            <div style={S.app}>{globalCSS}
              <Hdr role={curRole} user={userName} onSw={doLogout}
                onBack={()=>setSelId(null)}
                title={pr.customerName||"Unnamed"} sub={`Replacement Install â€” ${hv.replaceType||"Equipment"}`}
                badge={<span style={{...S.bdg,background:"#22c55e"}}>âœ… Approved</span>}
              />
              <div className="proj-cnt cnt-wrap" style={S.cnt}>
                {/* Replacement info */}
                <Sec title="ðŸ”„ Replacement Install">
                  <div style={{padding:"8px 12px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:8,marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#22c55e"}}>âœ… Replacement Approved â€” {hv.replaceType}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Priority: {hv.replacePriority}</div>
                    {hv.replaceJustification && <div style={{fontSize:10,color:"#64748b",marginTop:4}}>{hv.replaceJustification}</div>}
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>Document the replacement install with photos below. Take before, during, and after photos for program proof.</div>

                  {/* Replacement notes */}
                  <F label="New Equipment Make" value={hv.replNewMake||""} onChange={v=>upC(pr.id,{hvac:{...hv,replNewMake:v}})}/>
                  <div style={{height:6}}/>
                  <F label="New Equipment Model #" value={hv.replNewModel||""} onChange={v=>upC(pr.id,{hvac:{...hv,replNewModel:v}})}/>
                  <div style={{height:6}}/>
                  <F label="New Equipment Serial #" value={hv.replNewSerial||""} onChange={v=>upC(pr.id,{hvac:{...hv,replNewSerial:v}})}/>
                  <div style={{height:6}}/>
                  <textarea style={{...S.ta,minHeight:40}} value={hv.replNotes||""} onChange={e=>upC(pr.id,{hvac:{...hv,replNotes:e.target.value}})} placeholder="Install notes (any issues, special conditions, etc.)..." rows={2}/>
                </Sec>

                {/* Replacement photos */}
                <Sec title={<span>ðŸ“· Replacement Photos <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{replTaken}/{replItems.length}</span></span>}>
                  <div style={S.prog}><div style={{...S.progF,width:`${replItems.length?(replTaken/replItems.length)*100:0}%`,background:"linear-gradient(90deg,#22c55e,#16a34a)"}}/></div>
                  {replSections.map(([cat,items])=>{
                    const cd=items.filter(i=>hasPhoto(pr.photos,i.id)).length;
                    return <div key={cat} style={{marginTop:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#22c55e",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                        <span>{cat.replace("HVAC Replacement â€” ","")}</span><span style={{color:cd===items.length?"#22c55e":"#64748b"}}>{cd}/{items.length}</span>
                      </div>
                      {items.map(it=>{
                        const photos=getPhotos(pr.photos,it.id);
                        const has=photos.length>0;
                        return <div key={it.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                          <div style={{width:48,height:48,borderRadius:6,border:`1px dashed ${has?"rgba(34,197,94,.3)":"rgba(255,255,255,.1)"}`,background:has?"rgba(34,197,94,.04)":"rgba(255,255,255,.02)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                            {has ? <img src={photos[photos.length-1].d} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:5}} alt=""/> :
                              <label style={{fontSize:10,color:"#64748b",cursor:"pointer",textAlign:"center",padding:4}}>ðŸ“¸ Tap<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compressRepl(it.id,e.target.files?.[0]);e.target.value="";}}/></label>
                            }
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,color:has?"#e2e8f0":"#64748b"}}>{has?"âœ“ ":""}{it.l}</div>
                            {has && <div style={{fontSize:9,color:"#475569"}}>{photos.length} photo{photos.length>1?"s":""}</div>}
                          </div>
                          {has && <label style={{fontSize:10,color:"#60A5FA",cursor:"pointer"}}>ï¼‹<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compressRepl(it.id,e.target.files?.[0]);e.target.value="";}}/></label>}
                        </div>;
                      })}
                    </div>;
                  })}
                </Sec>

                {/* Mark replacement complete */}
                <div style={{padding:"12px 0"}}>
                  <button type="button" style={{...S.btn,width:"100%",padding:"12px",fontSize:14,opacity:replTaken>=3?1:.4}} disabled={replTaken<3} onClick={()=>{
                    upC(pr.id,{hvac:{...hv,replInstallComplete:true,replInstallDate:new Date().toISOString(),replInstallBy:userName}});
                    addLog(pr.id,`âœ… Replacement install documented: ${hv.replaceType} â€” ${replTaken} photos`);
                    setSelId(null);
                  }}>âœ“ Mark Replacement Install Complete</button>
                  {replTaken<3 && <div style={{fontSize:10,color:"#f59e0b",textAlign:"center",marginTop:4}}>Take at least 3 photos to complete</div>}
                </div>
              </div>
            </div>
          );
        }

        // â”€â”€ Standard Tune & Clean View â”€â”€
        return (
          <div style={S.app}>{globalCSS}
            <Hdr role={curRole} user={userName} onSw={doLogout}
              onBack={()=>setSelId(null)}
              title={pr.customerName||"Unnamed"} sub={pr.address}
              badge={<span style={{...S.bdg,background:STAGES[pr.currentStage].color}}>{STAGES[pr.currentStage].icon}</span>}
            />
            <div className="proj-cnt cnt-wrap" style={S.cnt}>
              <HVACTab p={pr} u={c=>upC(pr.id,c)} onLog={t=>addLog(pr.id,t)} user={userName} role={role}/>
              {/* HVAC Photos Only */}
              {(()=>{
                const hvacSections = Object.entries(PHOTO_SECTIONS).filter(([cat])=>cat.startsWith("HVAC"));
                const hvacItems = hvacSections.flatMap(([,items])=>items);
                const taken = hvacItems.filter(i=>hasPhoto(pr.photos,i.id)).length;
                const compress = (id,file) => {
                  if(!file) return;
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                      const maxW=1600; let w=img.width,h2=img.height;
                      if(w>maxW){h2=Math.round(h2*maxW/w);w=maxW;}
                      const c=document.createElement("canvas"); c.width=w; c.height=h2;
                      c.getContext("2d").drawImage(img,0,0,w,h2);
                      const compressed=c.toDataURL("image/jpeg",0.7);
                      const existing=getPhotos(pr.photos,id);
                      upC(pr.id,{photos:{...pr.photos,[id]:[...existing,{d:compressed,at:new Date().toISOString(),by:userName}]}});
                      addLog(pr.id,`ðŸ“¸ ${hvacItems.find(x=>x.id===id)?.l||id}`);
                    };
                    img.src=e.target.result;
                  };
                  reader.readAsDataURL(file);
                };
                return <div style={{marginTop:12}}>
                  <Sec title={<span>ðŸ“· HVAC Photos <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{taken}/{hvacItems.length}</span></span>}>
                    <div style={S.prog}><div style={{...S.progF,width:`${hvacItems.length?(taken/hvacItems.length)*100:0}%`,background:"linear-gradient(90deg,#2563EB,#3B82F6)"}}/></div>
                    {hvacSections.map(([cat,items])=>{
                      const cd=items.filter(i=>hasPhoto(pr.photos,i.id)).length;
                      return <div key={cat} style={{marginTop:10}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                          <span>{cat}</span><span style={{color:cd===items.length?"#22c55e":"#64748b"}}>{cd}/{items.length}</span>
                        </div>
                        {items.map(it=>{
                          const photos=getPhotos(pr.photos,it.id);
                          const has=photos.length>0;
                          return <div key={it.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                            <div style={{width:48,height:48,borderRadius:6,border:`1px dashed ${has?"rgba(34,197,94,.3)":"rgba(255,255,255,.1)"}`,background:has?"rgba(34,197,94,.04)":"rgba(255,255,255,.02)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                              {has ? <img src={photos[photos.length-1].d} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:5}} alt=""/> :
                                <label style={{fontSize:10,color:"#64748b",cursor:"pointer",textAlign:"center",padding:4}}>ðŸ“¸ Tap<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compress(it.id,e.target.files?.[0]);e.target.value="";}}/></label>
                              }
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:11,color:has?"#e2e8f0":"#64748b"}}>{has?"âœ“ ":""}{it.l}</div>
                              {has && <div style={{fontSize:9,color:"#475569"}}>{photos.length} photo{photos.length>1?"s":""}</div>}
                            </div>
                            {has && <label style={{fontSize:10,color:"#60A5FA",cursor:"pointer"}}>ï¼‹<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compress(it.id,e.target.files?.[0]);e.target.value="";}}/></label>}
                          </div>;
                        })}
                      </div>;
                    })}
                  </Sec>
                </div>;
              })()}
            </div>
          </div>
        );
      }
    }

    // HVAC Home â€” full view with tracking
    const allRepl = projects.filter(pr=>(pr.hvac||{}).replaceRequestStatus);
    const replPending = allRepl.filter(pr=>(pr.hvac||{}).replaceRequestStatus==="pending");
    const replApproved = allRepl.filter(pr=>(pr.hvac||{}).replaceRequestStatus==="approved");
    const replDenied = allRepl.filter(pr=>(pr.hvac||{}).replaceRequestStatus==="denied");
    const hvacPhotoCount = (pr) => {
      const hvacIds = Object.entries(PHOTO_SECTIONS).filter(([cat])=>cat.startsWith("HVAC")).flatMap(([,items])=>items).map(i=>i.id);
      return hvacIds.filter(id=>hasPhoto(pr.photos,id)).length;
    };
    const totalHvacPhotos = Object.entries(PHOTO_SECTIONS).filter(([cat])=>cat.startsWith("HVAC")).flatMap(([,items])=>items).length;

    const crd = {borderRadius:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",padding:"10px 12px",marginBottom:8};
    const kpiBox = {textAlign:"center",padding:"8px 4px"};
    const kpiNum = {fontSize:24,fontWeight:700,lineHeight:1};
    const kpiLbl = {fontSize:8,color:"#64748b",marginTop:3,lineHeight:1.2,textTransform:"uppercase",letterSpacing:".04em"};

    return (
      <div style={S.app}>{globalCSS}
        <Hdr role={curRole} user={userName} onSw={doLogout} title="ðŸ”§ HVAC Dashboard"
          sub={`${userName} Â· ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}`}
        />

        <div style={{padding:"0 16px"}}>
          {/* â”€â”€ KPI Row â”€â”€ */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:8,marginBottom:8}}>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#f59e0b"}}>{tuneJobs.length}</div><div style={kpiLbl}>Tune & Clean</div></div>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#22c55e"}}>{replJobs.length}</div><div style={kpiLbl}>Repl Install</div></div>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#fbbf24"}}>{replPending.length}</div><div style={kpiLbl}>Repl Pending</div></div>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#94a3b8"}}>{completedJobs.length}</div><div style={kpiLbl}>Done</div></div>
          </div>

          {/* â”€â”€ Replacement Request Tracker â”€â”€ */}
          {allRepl.length > 0 && <div style={{...crd,background:"rgba(245,158,11,.04)",borderColor:"rgba(245,158,11,.2)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>ðŸ”„ Replacement Requests</div>
            {replPending.length > 0 && <>
              <div style={{fontSize:9,fontWeight:600,color:"#fbbf24",marginBottom:4}}>â³ AWAITING APPROVAL</div>
              {replPending.map(pr=>{
                const hv=pr.hvac||{};
                return <div key={pr.id} style={{padding:"6px 8px",background:"rgba(245,158,11,.06)",borderRadius:6,marginBottom:4,border:"1px solid rgba(245,158,11,.15)",cursor:"pointer"}} onClick={()=>setSelId(pr.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{pr.customerName}</div>
                    <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(245,158,11,.15)",color:"#fbbf24",fontWeight:600}}>PENDING</span>
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{hv.replaceType} Â· {hv.replacePriority}</div>
                  <div style={{fontSize:9,color:"#64748b",marginTop:1}}>Submitted {hv.replaceRequestDate?new Date(hv.replaceRequestDate).toLocaleDateString():""}</div>
                </div>;
              })}
            </>}
            {replApproved.length > 0 && <>
              <div style={{fontSize:9,fontWeight:600,color:"#22c55e",marginBottom:4,marginTop:replPending.length?8:0}}>âœ… APPROVED</div>
              {replApproved.map(pr=>{
                const hv=pr.hvac||{};
                return <div key={pr.id} style={{padding:"6px 8px",background:"rgba(34,197,94,.04)",borderRadius:6,marginBottom:4,border:"1px solid rgba(34,197,94,.15)",cursor:"pointer"}} onClick={()=>setSelId(pr.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#e2e8f0"}}>{pr.customerName}</div>
                    <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(34,197,94,.15)",color:"#22c55e",fontWeight:600}}>APPROVED</span>
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{hv.replaceType}</div>
                </div>;
              })}
            </>}
            {replDenied.length > 0 && <>
              <div style={{fontSize:9,fontWeight:600,color:"#ef4444",marginBottom:4,marginTop:8}}>âŒ DENIED</div>
              {replDenied.map(pr=>{
                const hv=pr.hvac||{};
                return <div key={pr.id} style={{padding:"6px 8px",background:"rgba(239,68,68,.04)",borderRadius:6,marginBottom:4,border:"1px solid rgba(239,68,68,.15)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#94a3b8"}}>{pr.customerName}</div>
                    <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(239,68,68,.15)",color:"#ef4444",fontWeight:600}}>DENIED</span>
                  </div>
                  <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{hv.replaceType}</div>
                </div>;
              })}
            </>}
          </div>}

          {/* â”€â”€ Notifications â”€â”€ */}
          {myNotifications.length > 0 && <div style={{...crd,background:"rgba(37,99,235,.04)",borderColor:"rgba(37,99,235,.2)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#93C5FD",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>ðŸ”” Updates For You</div>
            {myNotifications.map((n,i) => (
              <div key={i} style={{padding:"6px 8px",borderRadius:6,marginBottom:4,cursor:"pointer",
                background:n.status==="approved"?"rgba(34,197,94,.06)":"rgba(239,68,68,.06)",
                border:`1px solid ${n.status==="approved"?"rgba(34,197,94,.2)":"rgba(239,68,68,.2)"}`
              }} onClick={()=>setSelId(n.proj.id)}>
                <div style={{fontSize:12,fontWeight:600,color:n.status==="approved"?"#22c55e":"#ef4444"}}>
                  {n.status==="approved"?"âœ…":"âŒ"} {n.type} â€” {n.status.toUpperCase()}
                </div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{n.proj.customerName} Â· {n.proj.address}</div>
              </div>
            ))}
          </div>}

          {/* â”€â”€ Tune & Clean Jobs â”€â”€ */}
          {tuneJobs.length > 0 && <>
            <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,marginTop:4}}>ðŸ”§ Tune & Clean</div>
            {tuneJobs.map(pr => {
              const hv = pr.hvac||{};
              const replSt = hv.replaceRequestStatus;
              const pc = hvacPhotoCount(pr);
              return (
                <button key={pr.id} style={{...S.card,width:"100%",textAlign:"left",cursor:"pointer",marginBottom:6,border:"1px solid rgba(245,158,11,.2)"}} onClick={()=>setSelId(pr.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{pr.customerName||"Unnamed"}</div>
                      <div style={{fontSize:12,color:"#94a3b8"}}>{pr.address}</div>
                      {pr.stId && <div style={{fontSize:10,color:"#64748b",marginTop:2}}>ST# {pr.stId}</div>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <span style={{...S.bdg,background:STAGES[pr.currentStage].color,fontSize:9}}>{STAGES[pr.currentStage].icon} {STAGES[pr.currentStage].label}</span>
                      <div style={{fontSize:9,color:pc===totalHvacPhotos?"#22c55e":"#64748b",marginTop:4}}>ðŸ“· {pc}/{totalHvacPhotos}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                    {hv.techName && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(255,255,255,.05)",color:"#94a3b8"}}>Tech: {hv.techName}</span>}
                    {replSt==="pending" && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(245,158,11,.15)",color:"#fbbf24"}}>ðŸ”„ Repl Pending</span>}
                  </div>
                </button>
              );
            })}
          </>}

          {/* â”€â”€ Replacement Install Jobs â”€â”€ */}
          {replJobs.length > 0 && <>
            <div style={{fontSize:11,fontWeight:700,color:"#22c55e",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,marginTop:12}}>ðŸ”„ Replacement Install</div>
            {replJobs.map(pr => {
              const hv = pr.hvac||{};
              const replPhotos = Object.entries(PHOTO_SECTIONS).filter(([cat])=>cat.startsWith("HVAC Replacement")).flatMap(([,items])=>items);
              const rpc = replPhotos.filter(i=>hasPhoto(pr.photos,i.id)).length;
              return (
                <button key={pr.id} style={{...S.card,width:"100%",textAlign:"left",cursor:"pointer",marginBottom:6,border:"1px solid rgba(34,197,94,.3)",background:"rgba(34,197,94,.03)"}} onClick={()=>setSelId(pr.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#e2e8f0"}}>{pr.customerName||"Unnamed"}</div>
                      <div style={{fontSize:12,color:"#94a3b8"}}>{pr.address}</div>
                      <div style={{fontSize:11,color:"#22c55e",marginTop:3,fontWeight:600}}>{hv.replaceType} â€” Approved</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <span style={{...S.bdg,background:"#22c55e",fontSize:9}}>âœ… Install</span>
                      <div style={{fontSize:9,color:rpc>=3?"#22c55e":"#64748b",marginTop:4}}>ðŸ“· {rpc}/{replPhotos.length}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </>}

          {tuneJobs.length===0 && replJobs.length===0 && <div style={{textAlign:"center",padding:40,color:"#64748b"}}>
            <div style={{fontSize:32}}>ðŸ”§</div>
            <div style={{fontSize:13,marginTop:8}}>No HVAC jobs assigned right now.</div>
            <div style={{fontSize:11,color:"#475569",marginTop:4}}>Jobs appear here when projects reach the Tune & Clean stage.</div>
          </div>}
        </div>
      </div>
    );
  }


