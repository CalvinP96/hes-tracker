import React, { useState, useRef } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit } from "../helpers/index.js";
import { Sec, Gr, F, Sel, CK, PrintBtn, SI, SigPad } from "../components/ui.jsx";
  // â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = projects.filter(p => {
    if (filter === "alerts") return getAlerts(p).length > 0;
    if (filter !== "all" && p.currentStage !== parseInt(filter)) return false;
    if (search) { const s = search.toLowerCase(); return p.customerName.toLowerCase().includes(s) || p.address.toLowerCase().includes(s) || (p.riseId||"").toLowerCase().includes(s) || (p.stId||"").toLowerCase().includes(s); }
    return true;
  });
  const sorted = [...filtered].sort((a,b) => {
    if (a.flagged && !b.flagged) return -1;
    if (!a.flagged && b.flagged) return 1;
    const aa = getAlerts(a).length, ba = getAlerts(b).length;
    if (aa > 0 && ba === 0) return -1;
    if (aa === 0 && ba > 0) return 1;
    return new Date(b.created) - new Date(a.created);
  });
  const alertCount = projects.filter(p => getAlerts(p).length > 0).length;

  return (
    <div style={S.app}>{globalCSS}
      <Hdr role={curRole} user={userName} onSw={doLogout} title="HES Retrofits"
        sub={`${projects.length} projects`}
        actions={<>{role==="admin" && <><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={()=>setShowSettings(!showSettings)}>âš™ï¸ Settings</button><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={()=>setShowUsers(!showUsers)}>ðŸ‘¥ Users</button><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={exportData}>ðŸ“¥ Data</button><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={exportPhotos}>ðŸ“· Photos</button></>}<button style={{...S.btn,padding:"8px 16px",fontSize:13}} onClick={()=>setView("new")}>+ New Lead</button></>}
      />

      {/* â”€â”€ User Management (Admin only) â”€â”€ */}
      {showUsers && role === "admin" && <UserMgmt users={users} onSave={saveUserList} onDelete={async (id) => { await dbDeleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }} onClose={()=>setShowUsers(false)}/>}

      {showSettings && role === "admin" && (() => {
        const saveSetting = (k,v) => {
          const ns = {...appSettings, [k]:v};
          setAppSettings(ns);
          saveSettings(ns);
        };
        return <div style={{...S.card,margin:"0 16px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>âš™ï¸ Settings</div>
            <button style={{...S.ghost,padding:"4px 10px",fontSize:11}} onClick={()=>setShowSettings(false)}>âœ• Close</button>
          </div>

          <div style={{fontSize:11,fontWeight:600,color:"#93C5FD",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Notifications</div>
          <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>COR and replacement request emails go to these addresses. Separate multiple with commas.</div>
          <F label="Notification Email(s)" value={appSettings.notifyEmail||""} onChange={v=>saveSetting("notifyEmail",v)} placeholder="dave@company.com, manager@company.com"/>
          <div style={{marginTop:8}}>
            <F label="CC Email(s) (optional)" value={appSettings.notifyCc||""} onChange={v=>saveSetting("notifyCc",v)} placeholder="backup@company.com"/>
          </div>

          {appSettings.notifyEmail && <div style={{marginTop:10,padding:"6px 10px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:6,fontSize:11,color:"#22c55e"}}>
            âœ“ Emails will be sent to: {appSettings.notifyEmail}
          </div>}
          {!appSettings.notifyEmail && <div style={{marginTop:10,padding:"6px 10px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.2)",borderRadius:6,fontSize:11,color:"#f59e0b"}}>
            âš  No notification email set â€” COR emails will use the server default (ADMIN_EMAIL env var)
          </div>}
        </div>;
      })()}

      {alertCount > 0 && (
        <div style={S.readyBan} onClick={() => setFilter(filter === "alerts" ? "all" : "alerts")}>
          <span style={{fontSize:18}}>ðŸ””</span>
          <span style={{flex:1,fontSize:13}}><b>{alertCount}</b> need{alertCount>1?"":"s"} attention</span>
          <span style={{fontSize:11,color:"#fde68a"}}>{filter==="alerts"?"Show all":"Filter"} â†’</span>
        </div>
      )}

      <div className="pipe-bar" style={S.pipe}>
        {STAGES.map(s => {
          const c = projects.filter(p => p.currentStage === s.id).length;
          return (
            <button key={s.id} style={{
              ...S.chip,
              background: filter === String(s.id) ? s.color : "rgba(255,255,255,0.06)",
              color: filter === String(s.id) ? "#fff" : "#94a3b8",
              borderColor: filter === String(s.id) ? s.color : "rgba(255,255,255,0.08)",
            }} onClick={() => setFilter(filter === String(s.id) ? "all" : String(s.id))}>
              {s.icon} <span style={S.chipN}>{c}</span>
            </button>
          );
        })}
      </div>

      {/* â”€â”€ Ops Dashboard â”€â”€ */}
      {filter === "all" && !search && projects.length > 0 && (()=>{
        const now = new Date();
        const daysAgo = (d) => d ? Math.floor((now - new Date(d))/(1000*60*60*24)) : null;
        const thisWeek = (d) => d && daysAgo(d) <= 7;
        const thisMonth = (d) => d && daysAgo(d) <= 30;

        // Pipeline counts
        const byStage = STAGES.map(st=>({...st, count:projects.filter(p=>p.currentStage===st.id).length}));
        const active = projects.filter(p=>p.currentStage>=1 && p.currentStage<7);
        const completed = projects.filter(p=>p.currentStage>=7);
        const needsScheduling = projects.filter(p=>p.customerName && p.address && !p.assessmentScheduled && !p.assessmentDate && p.currentStage<2).length;
        const needsInstallSched = projects.filter(p=>p.scopeApproved && !p.installScheduled && !p.installDate && p.currentStage<5).length;

        // Aging / stuck â€” days in current stage
        const aging = active.map(p=>{
          const lastLog = p.activityLog?.[0];
          const stageDate = lastLog?.ts || p.created;
          return {...p, daysInStage: daysAgo(stageDate)};
        }).sort((a,b)=>b.daysInStage-a.daysInStage);
        const stuck = aging.filter(p=>p.daysInStage>=7);

        // Throughput
        const completedThisWeek = projects.filter(p=>p.currentStage>=7 && p.activityLog?.find(a=>a.txt?.includes("Closeout") && thisWeek(a.ts))).length;
        const completedThisMonth = projects.filter(p=>p.currentStage>=7 && p.activityLog?.find(a=>a.txt?.includes("Closeout") && thisMonth(a.ts))).length;
        const assessThisWeek = projects.filter(p=>thisWeek(p.assessmentDate)).length;
        const installsThisWeek = projects.filter(p=>thisWeek(p.installDate)).length;

        // Average days to complete (created â†’ stage 8)
        const compTimes = completed.map(p=>{const close=p.activityLog?.find(a=>a.txt?.includes("Closeout"));return close?daysAgo(p.created)-daysAgo(close.ts):null;}).filter(Boolean);
        const avgDays = compTimes.length ? Math.round(compTimes.reduce((a,b)=>a+b,0)/compTimes.length) : null;

        // Crew activity from logs
        const crewAct = {};
        projects.forEach(p=>p.activityLog?.forEach(a=>{if(a.by&&a.by!=="System"){crewAct[a.by]=(crewAct[a.by]||0)+1;}}));
        const topCrew = Object.entries(crewAct).sort((a,b)=>b[1]-a[1]).slice(0,5);

        // Measures installed
        const totalEE = projects.reduce((s,p)=>s+p.measures.length,0);
        const totalHS = projects.reduce((s,p)=>s+p.healthSafety.length,0);
        const mCount = {};
        projects.forEach(p=>[...p.measures,...p.healthSafety].forEach(m=>{mCount[m]=(mCount[m]||0)+1;}));
        const topM = Object.entries(mCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

        // Hazard flags
        const hazards = projects.filter(p=>{const s=p.scope2026||{};return s.int?.knobTube||s.int?.vermiculite||s.int?.mold||s.attic?.knobTube||s.attic?.vermPresent||s.attic?.moldPresent;});

        const card = {borderRadius:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",padding:"10px 12px",marginBottom:8};
        const hdr = {fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,fontWeight:600};
        const kpi = {textAlign:"center",padding:"6px 4px"};
        const kpiN = {fontSize:22,fontWeight:700,lineHeight:1};
        const kpiL = {fontSize:8,color:"#64748b",marginTop:2,lineHeight:1.2};
        const row = {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",fontSize:11};

        return <div className="ops-dash" style={{padding:"0 16px",marginBottom:6}}>
          {/* KPI Row */}
          <div className="ops-kpis" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:8}}>
            <div style={{...card,...kpi,marginBottom:0}}><div style={{...kpiN,color:"#e2e8f0"}}>{projects.length}</div><div style={kpiL}>Total Projects</div></div>
            <div style={{...card,...kpi,marginBottom:0}}><div style={{...kpiN,color:"#60A5FA"}}>{active.length}</div><div style={kpiL}>Active</div></div>
            <div style={{...card,...kpi,marginBottom:0}}><div style={{...kpiN,color:"#22c55e"}}>{completed.length}</div><div style={kpiL}>Completed</div></div>
            <div style={{...card,...kpi,marginBottom:0}}><div style={{...kpiN,color:stuck.length>0?"#ef4444":"#22c55e"}}>{stuck.length}</div><div style={kpiL}>Stuck (7d+)</div></div>
            <div style={{...card,...kpi,marginBottom:0}}><div style={{...kpiN,color:"#f59e0b"}}>{avgDays||"â€”"}</div><div style={kpiL}>Avg Days</div></div>
          </div>

          {/* Action Items */}
          {(needsScheduling>0||needsInstallSched>0||hazards.length>0) && <div style={{...card,background:"rgba(239,68,68,.06)",borderColor:"rgba(239,68,68,.2)"}}>
            <div style={{...hdr,color:"#ef4444"}}>âš¡ Action Required</div>
            {needsScheduling>0 && <div style={{...row,color:"#fca5a5"}}><span>Needs assessment scheduling</span><b>{needsScheduling}</b></div>}
            {needsInstallSched>0 && <div style={{...row,color:"#fca5a5"}}><span>Needs install scheduling</span><b>{needsInstallSched}</b></div>}
            {hazards.length>0 && <div style={{...row,color:"#fca5a5"}}><span>â›” Hazard flags (K&T/asbestos/mold)</span><b>{hazards.length}</b></div>}
          </div>}

          {/* â•â• PENDING CHANGE ORDER REQUESTS â€” urgent review panel â•â• */}
          {(role==="admin"||role==="scope") && (()=>{
            const allPendingCOs = [];
            projects.forEach(pr => (pr.changeOrders||[]).forEach(c => {
              if (c.status==="pending") allPendingCOs.push({...c, proj: pr});
            }));
            if (allPendingCOs.length === 0) return null;
            return <div style={{...card,background:"rgba(249,115,22,.08)",borderColor:"rgba(249,115,22,.4)",borderWidth:2,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#f97316,#fbbf24,#f97316,#fbbf24)",backgroundSize:"200% 100%",animation:"coSlide 2s linear infinite"}}/>
              <div style={{...hdr,color:"#f97316",fontSize:12}}>ðŸ”¶ PENDING CHANGE ORDER REQUESTS â€” {allPendingCOs.length} AWAITING REVIEW</div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:8}}>Crews are waiting. Review and respond quickly.</div>
              {allPendingCOs.sort((a,b)=>new Date(a.at)-new Date(b.at)).map(c => {
                const pr = c.proj;
                return <div key={c.id} style={{padding:"8px 10px",background:"rgba(0,0,0,.2)",borderRadius:6,marginBottom:6,border:"1px solid rgba(249,115,22,.2)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#f97316",cursor:"pointer"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("install");}}>{pr.customerName||"Unnamed"} â€” {pr.address||""}</div>
                    <span style={{fontSize:9,color:"#64748b"}}>{Math.floor((Date.now()-new Date(c.at))/(1000*60))} min ago</span>
                  </div>
                  <div style={{fontSize:11,color:"#e2e8f0",lineHeight:1.4,marginBottom:4}}>{c.text}</div>
                  {c.photo && <img src={c.photo} style={{maxWidth:"100%",maxHeight:120,borderRadius:4,marginBottom:4,border:"1px solid rgba(255,255,255,.1)"}} alt="COR"/>}
                  <div style={{fontSize:9,color:"#64748b"}}>By {c.by} Â· {new Date(c.at).toLocaleString()}</div>
                  <div style={{marginTop:6,display:"flex",gap:6}}>
                    <button type="button" style={{flex:1,padding:"8px",borderRadius:6,border:"1px solid rgba(34,197,94,.4)",background:"rgba(34,197,94,.1)",color:"#22c55e",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("install");}}>Open â†’ Review</button>
                  </div>
                </div>;
              })}
            </div>;
          })()}

          {/* â•â• PENDING REPLACEMENT REQUESTS â•â• */}
          {(role==="admin"||role==="scope") && (()=>{
            const pendRepl = projects.filter(pr=>(pr.hvac||{}).replaceRequestStatus==="pending");
            if (pendRepl.length === 0) return null;
            return <div style={{...card,background:"rgba(245,158,11,.06)",borderColor:"rgba(245,158,11,.3)"}}>
              <div style={{...hdr,color:"#f59e0b"}}>ðŸ”„ REPLACEMENT REQUESTS â€” {pendRepl.length} AWAITING REVIEW</div>
              {pendRepl.map(pr => {
                const hv = pr.hvac||{};
                return <div key={pr.id} style={{padding:"8px 10px",background:"rgba(0,0,0,.15)",borderRadius:6,marginBottom:6,border:"1px solid rgba(245,158,11,.15)"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#fbbf24",cursor:"pointer"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("hvac");}}>{pr.customerName||"Unnamed"} â€” {pr.address||""}</div>
                  <div style={{fontSize:11,color:"#e2e8f0",marginTop:3}}><b>{hv.replaceType}</b> Â· {hv.replacePriority}</div>
                  {hv.replaceJustification && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{hv.replaceJustification}</div>}
                  <div style={{fontSize:9,color:"#64748b",marginTop:3}}>By {hv.replaceRequestBy} Â· {hv.replaceRequestDate?new Date(hv.replaceRequestDate).toLocaleString():""}</div>
                  <button type="button" style={{marginTop:6,width:"100%",padding:"8px",borderRadius:6,border:"1px solid rgba(245,158,11,.4)",background:"rgba(245,158,11,.1)",color:"#fbbf24",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("hvac");}}>Open â†’ Review</button>
                </div>;
              })}
            </div>;
          })()}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {/* Pipeline Breakdown */}
            <div style={card}>
              <div style={hdr}>Pipeline</div>
              {byStage.filter(s=>s.count>0).map(s=><div key={s.id} style={row}>
                <span style={{color:"#94a3b8"}}>{s.icon} {s.label}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:Math.min(s.count/Math.max(...byStage.map(x=>x.count))*60,60),height:6,borderRadius:3,background:s.color,minWidth:4}}/>
                  <span style={{fontWeight:600,color:"#e2e8f0",minWidth:16,textAlign:"right"}}>{s.count}</span>
                </div>
              </div>)}
            </div>

            {/* Weekly Throughput */}
            <div style={card}>
              <div style={hdr}>This Week</div>
              <div style={row}><span style={{color:"#94a3b8"}}>Assessments</span><b style={{color:"#60A5FA"}}>{assessThisWeek}</b></div>
              <div style={row}><span style={{color:"#94a3b8"}}>Installs</span><b style={{color:"#f59e0b"}}>{installsThisWeek}</b></div>
              <div style={row}><span style={{color:"#94a3b8"}}>Completed</span><b style={{color:"#22c55e"}}>{completedThisWeek}</b></div>
              <div style={{...hdr,marginTop:8}}>This Month</div>
              <div style={row}><span style={{color:"#94a3b8"}}>Completed</span><b style={{color:"#22c55e"}}>{completedThisMonth}</b></div>
              <div style={row}><span style={{color:"#94a3b8"}}>Measures installed</span><b style={{color:"#e2e8f0"}}>{totalEE+totalHS}</b></div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {/* Stuck Projects */}
            {stuck.length>0 && <div style={{...card,background:"rgba(245,158,11,.04)",borderColor:"rgba(245,158,11,.15)"}}>
              <div style={{...hdr,color:"#f59e0b"}}>â³ Aging Projects</div>
              {stuck.slice(0,5).map(p=><div key={p.id} style={{...row,cursor:"pointer"}} onClick={()=>{setSelId(p.id);setView("detail");setTab("info");}}>
                <span style={{color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:6}}>{p.customerName||"Unnamed"}</span>
                <span style={{flexShrink:0}}><span style={{color:STAGES[p.currentStage].color,fontSize:10}}>{STAGES[p.currentStage].icon}</span> <b style={{color:p.daysInStage>=14?"#ef4444":"#f59e0b"}}>{p.daysInStage}d</b></span>
              </div>)}
              {stuck.length>5 && <div style={{fontSize:9,color:"#64748b",textAlign:"center",marginTop:4}}>+{stuck.length-5} more</div>}
            </div>}

            {/* Team Activity */}
            {topCrew.length>0 && <div style={card}>
              <div style={hdr}>Team Activity</div>
              {topCrew.map(([name,count])=><div key={name} style={row}>
                <span style={{color:"#94a3b8"}}>{name}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:Math.min(count/Math.max(...topCrew.map(x=>x[1]))*50,50),height:5,borderRadius:3,background:"#60A5FA",minWidth:4}}/>
                  <span style={{fontWeight:600,color:"#e2e8f0",minWidth:20,textAlign:"right"}}>{count}</span>
                </div>
              </div>)}
              <div style={{fontSize:8,color:"#475569",marginTop:4}}>Actions logged (all time)</div>
            </div>}
          </div>

          {/* Top Measures */}
          {topM.length>0 && <div style={card}>
            <div style={hdr}>Top Measures Across Portfolio</div>
            {topM.map(([m,c])=><div key={m} style={row}>
              <span style={{color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{m}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:Math.min(c/Math.max(...topM.map(x=>x[1]))*80,80),height:5,borderRadius:3,background:"#22c55e",minWidth:4}}/>
                <span style={{fontWeight:600,color:"#e2e8f0",minWidth:20,textAlign:"right"}}>{c}</span>
              </div>
            </div>)}
          </div>}
        </div>;
      })()}

      <div className="search-row" style={S.sRow}>
        <input style={S.sInp} placeholder="Search name, address, RISE, STâ€¦" value={search} onChange={e => setSearch(e.target.value)}/>
        {(filter !== "all" || search) && <button style={S.ghost} onClick={() => {setFilter("all");setSearch("");}}>Clear</button>}
      </div>

      {sorted.length === 0 ? (
        <div style={S.empty}>
          <p style={{fontSize:32}}>ðŸ“‚</p>
          <p style={{color:"#64748b",fontSize:13}}>{projects.length===0?"No projects yet. Tap + New Lead.":"No matches."}</p>
        </div>
      ) : (
        <div className="proj-list" style={S.list}>
          {sorted.map(p => {
            const st = STAGES[p.currentStage];
            const al = getAlerts(p);
            return (
              <button key={p.id} className="proj-card" style={S.card} onClick={() => {setSelId(p.id);setView("proj");setTab(tabs[0]);}}>
                <div style={S.cTop}>
                  <div style={{display:"flex",alignItems:"center",gap:5,flex:1,minWidth:0}}>
                    {p.flagged && <span>âš ï¸</span>}
                    <span className="c-name" style={S.cName}>{p.customerName}</span>
                  </div>
                  <span style={{...S.bdg,background:st.color,fontSize:10}}>{st.icon} {st.label}</span>
                </div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{p.address}</div>
                {al.length > 0 && (
                  <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                    {al.map((a,i) => <span key={i} style={{...S.tBadge,...(a.type==="co"?{background:"rgba(249,115,22,.15)",color:"#f97316",border:"1px solid rgba(249,115,22,.3)"}:a.type==="repl"?{background:"rgba(245,158,11,.15)",color:"#fbbf24",border:"1px solid rgba(245,158,11,.3)"}:a.type==="repl_done"?{background:"rgba(34,197,94,.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,.3)"}:{})}}>{a.type==="advance"?"â¬†":a.type==="co"?"ðŸ”¶":a.type==="repl"||a.type==="repl_done"?"ðŸ”„":"ðŸ””"} {a.msg}</span>)}
                  </div>
                )}
                <div style={S.cMeta}>
                  {p.riseId && <span>RISE:{p.riseId}</span>}
                  {p.stId && <span>ST:{p.stId}</span>}
                  {p.assessmentDate && <span>Assess:{fmts(p.assessmentDate)}</span>}
                  {p.installDate && <span>Install:{fmts(p.installDate)}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


