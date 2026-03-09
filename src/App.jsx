import React, { useState, useEffect, useCallback, useRef } from "react";
import { loadUsers, saveUser, deleteUser, loadProjects, saveProjects, getSession, setSession, setSessionNav, loadSettings, saveSettings } from "./db.js";
import { STAGES, ROLES, TAB_META, DEFAULT_USERS } from "./constants/index.js";
import { uid, fmts, blank, calcStage, getAlerts, getPhotos, hasPhoto } from "./helpers/index.js";
import { S } from "./styles/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI, Hdr, UserMgmt } from "./components/ui.jsx";
import { savePrint, printScope, photoPageHTML, sideBySideHTML, formPrintHTML } from "./export/savePrint.js";
import { exportData, exportPhotos, exportProjectPhotos, exportProjectForms } from "./export/exportForms.js";
import { InfoTab }     from "./tabs/InfoTab.jsx";
import { SchedTab }    from "./tabs/SchedTab.jsx";
import { AuditTab }    from "./tabs/AuditTab.jsx";
import { PhotoTab }    from "./tabs/PhotoTab.jsx";
import { ScopeTab }    from "./tabs/ScopeTab.jsx";
import { InstallTab }  from "./tabs/InstallTab.jsx";
import { HVACTab }     from "./tabs/HVACTab.jsx";
import { QAQCTab }     from "./tabs/QAQCTab.jsx";
import { CloseoutTab } from "./tabs/CloseoutTab.jsx";
import { LogTab }      from "./tabs/LogTab.jsx";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState(null); // null = loading
  const [curUser, setCurUser] = useState(null); // logged-in user object
  const [view, setView] = useState("dash");
  const [selId, setSelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("info");
  // New project fields (lifted out of conditional to fix hooks crash)
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");
  // Login fields
  const [loginUser, setLoginUser] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginErr, setLoginErr] = useState("");
  // User management
  const [showUsers, setShowUsers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appSettings, setAppSettings] = useState({});
  const [editUser, setEditUser] = useState(null);
  const tmr = useRef(null);

  const role = curUser?.role || null;
  const userName = curUser?.name || "";

  useEffect(() => {
    Promise.all([loadProjects(), loadUsers(), loadSettings()]).then(([p, u, s]) => {
      if (p) setProjects(p.filter(x => x.id !== "__app_settings__"));
      if (s) setAppSettings(s);
      // Merge: ensure all DEFAULT_USERS exist (e.g. HVAC tech added in update)
      let userList = u && u.length > 0 ? [...u] : [...DEFAULT_USERS];
      DEFAULT_USERS.forEach(du => {
        if (!userList.find(x => x.id === du.id || x.username === du.username)) {
          userList.push(du);
        }
      });
      setUsers(userList);
      // Save merged list back so new defaults persist
      if (u && u.length > 0 && userList.length > u.length) {
        for (const nu of userList.filter(x => !u.find(y => y.id === x.id))) {
          saveUser(nu);
        }
      }
      // Restore session
      const session = getSession();
      if (session?.userId) {
        const found = userList.find(x => x.id === session.userId);
        if (found) {
          setCurUser(found);
          // Check URL deep link (?project=ID&tab=install)
          const urlParams = new URLSearchParams(window.location.search);
          const deepProject = urlParams.get("project");
          const deepTab = urlParams.get("tab");
          if (deepProject) {
            setView("proj");
            setSelId(deepProject);
            if (deepTab) setTab(deepTab);
            // Clean URL
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            if (session.view) setView(session.view);
            if (session.selId) setSelId(session.selId);
            if (session.tab) setTab(session.tab);
          }
        }
      } else {
        // Not logged in — check if deep link exists, stash it for after login
        const urlParams = new URLSearchParams(window.location.search);
        const deepProject = urlParams.get("project");
        if (deepProject) {
          localStorage.setItem("hes-deeplink", JSON.stringify({ project: deepProject, tab: urlParams.get("tab") }));
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
      setLoading(false);
    });
  }, []);

  // Persist navigation state
  useEffect(() => {
    if (curUser) setSessionNav({ view, selId, tab });
  }, [view, selId, tab, curUser]);

  const save = useCallback((p) => {
    if(tmr.current) clearTimeout(tmr.current);
    tmr.current = setTimeout(() => saveProjects(p), 400);
  }, []);

  // Re-fetch from Supabase when user returns to tab (picks up email approvals, other device changes)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && curUser) {
        loadProjects().then(p => {
          if (p) setProjects(prev => {
            const fresh = p.filter(x => x.id !== "__app_settings__");
            // Merge: use server version for each project (picks up email COR approvals)
            return fresh.map(fp => {
              const local = prev.find(lp => lp.id === fp.id);
              // If local has unsaved edits (within last 2 sec), keep local
              if (local && tmr.current) return local;
              return fp;
            });
          });
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [curUser]);

  const saveUserList = async (list) => {
    setUsers(list);
    // Sync each user to Supabase
    for (const u of list) {
      await saveUser(u);
    }
  };

  const up = fn => setProjects(prev => { const n = fn(prev); save(n); return n; });
  const upP = (id, c) => up(prev => prev.map(p => p.id === id ? {...p,...c} : p));
  const addLog = (id, txt) => up(prev => prev.map(p => p.id === id ? {...p, activityLog:[{ts:new Date().toISOString(), txt, by:userName, role},...p.activityLog]} : p));

  const checkAdvance = (id) => {
    setProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const ns = calcStage(p);
        if (ns !== p.currentStage) {
          const dir = ns > p.currentStage ? "Advanced" : "Reverted";
          return {...p, currentStage:ns, stageHistory:[...p.stageHistory,{s:ns,at:new Date().toISOString()}],
            activityLog:[{ts:new Date().toISOString(),txt:`${dir} → ${STAGES[ns].label}`,by:"System"},...p.activityLog]};
        }
        return p;
      });
      save(next); return next;
    });
  };

  const upC = (id, c) => { upP(id, c); setTimeout(() => checkAdvance(id), 100); };

  const proj = projects.find(p => p.id === selId);
  const curRole = ROLES.find(r => r.key === role);

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={S.center}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');@keyframes spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}`}</style>
      <div style={S.spin}/>
    </div>
  );

  const globalCSS = <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes coSlide{0%{background-position:0% 50%}100%{background-position:200% 50%}}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}html{color-scheme:dark}body{margin:0}input,select,textarea,button{font-size:16px;color-scheme:dark}select option{background:#1e293b;color:#e2e8f0}

/* ── Mobile-first fixes ── */
.sec-wrap{padding:10px 10px 8px}
.gr-wrap{display:grid;grid-template-columns:1fr;gap:6px}
.hvac-2col{display:grid;grid-template-columns:1fr;gap:6px}
.tags-wrap{display:flex;flex-wrap:wrap;gap:4px}
.tags-wrap button{min-height:36px}

/* ── Small phones: tighter ── */
@media(max-width:374px){
.sec-wrap{padding:8px 8px 6px!important}
.tab-bar{gap:0!important}
.tab-bar button{padding:10px 8px!important;font-size:11px!important;min-height:40px!important}
.hdr-bar{padding:8px 10px!important}
.pipe-bar{padding:6px 10px!important}
}

/* ── All phones (under 480px) ── */
@media(max-width:479px){
.ashrae-inputs{grid-template-columns:1fr 1fr!important}
.ashrae-grid{grid-template-columns:80px 1fr 50px 40px 45px!important;gap:2px 4px!important;font-size:10px!important}
.vent-grid{grid-template-columns:1fr 1fr!important}
.cnt-wrap{padding:8px 10px!important}
}

/* ── Phones: 480px+ ── */
@media(min-width:480px){
.gr-wrap{grid-template-columns:repeat(2,1fr)}
.hvac-2col{grid-template-columns:1fr 1fr}
}

/* ── Desktop: 768px+ ── */
@media(min-width:768px){
input,select,textarea,button{font-size:inherit}
.gr-wrap{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.hvac-2col{grid-template-columns:1fr 1fr}
.proj-list{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:8px!important;padding:8px 32px!important}
.proj-cnt{max-width:1200px;margin:0 auto;padding:16px 32px!important}
.ops-dash{padding:0 32px!important}
.ops-kpis{grid-template-columns:repeat(5,1fr)!important;gap:10px!important}
.hdr-bar{padding:10px 32px!important}
.pipe-bar{padding:8px 32px!important;gap:6px!important}
.stage-bar{padding:8px 32px!important}
.tab-bar{padding:0 32px!important}
.search-row{padding:8px 32px!important}
.alert-bar{padding:8px 32px!important}
}

/* ── Large desktop: 1200px+ ── */
@media(min-width:1200px){
.proj-list{grid-template-columns:repeat(3,1fr)!important;padding:12px 48px!important}
.proj-cnt{max-width:1400px;padding:20px 48px!important}
.ops-dash{padding:0 48px!important}
.hdr-bar{padding:12px 48px!important}
.pipe-bar{padding:10px 48px!important}
.stage-bar{padding:10px 48px!important}
.tab-bar{padding:0 48px!important}
.search-row{padding:10px 48px!important}
.alert-bar{padding:10px 48px!important}
.proj-card{padding:16px 18px!important}
.proj-card .c-name{font-size:15px!important}
}

/* ── XL desktop: 1600px+ ── */
@media(min-width:1600px){
.proj-list{grid-template-columns:repeat(4,1fr)!important;padding:16px 80px!important}
.proj-cnt{max-width:1600px;padding:24px 80px!important}
.ops-dash{padding:0 80px!important}
.hdr-bar{padding:14px 80px!important}
.pipe-bar{padding:12px 80px!important}
.stage-bar{padding:12px 80px!important}
.tab-bar{padding:0 80px!important}
.search-row{padding:12px 80px!important}
.alert-bar{padding:12px 80px!important}
}

/* ── Hover effects (desktop) ── */
@media(hover:hover){
.proj-card:hover{background:rgba(255,255,255,.06)!important;border-color:rgba(37,99,235,.25)!important;transform:translateY(-1px);transition:all .15s ease}
.proj-card{transition:all .15s ease}
.tab-btn:hover{color:#e2e8f0!important;background:rgba(255,255,255,.04)}
.tab-btn{transition:color .15s ease}
.pipe-chip:hover{opacity:.85;transition:opacity .15s}
}

/* ── Scrollbar ── */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.2)}
`}</style>;

  // ── Login screen ──────────────────────────────────────────
  const doLogin = () => {
    if (!users) return;
    const found = users.find(u => u.username.toLowerCase() === loginUser.trim().toLowerCase() && u.pin === loginPin);
    if (found) {
      setCurUser(found);
      setLoginErr("");
      setLoginUser("");
      setLoginPin("");
      setSession(found.id);
      // Check for stashed deep link from email
      try {
        const dl = localStorage.getItem("hes-deeplink");
        if (dl) {
          const { project, tab: dlTab } = JSON.parse(dl);
          localStorage.removeItem("hes-deeplink");
          if (project) { setView("proj"); setSelId(project); if (dlTab) setTab(dlTab); }
        }
      } catch(e){}
    } else {
      setLoginErr("Invalid username or PIN");
    }
  };

  const doLogout = () => {
    setCurUser(null);
    setView("dash");
    setSelId(null);
    setSession(null);
  };

  // ── Export Functions ──
  // export functions imported from ./export/exportForms.js

        if (!curUser) return (
    <div style={S.app}>{globalCSS}
      <div style={S.rpWrap}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <img src="/logo.png" alt="Assured Energy Solutions" style={{width:220,maxWidth:"80%",margin:"0 auto",display:"block"}}/>
          <h1 style={{fontSize:16,fontWeight:500,color:"#94a3b8",margin:"14px 0 2px",textAlign:"center"}}>HES Retrofits Tracker</h1>
          <p style={{color:"#64748b",fontSize:12}}>Sign in to continue</p>
        </div>
        <div style={{marginBottom:12}}>
          <label style={S.fl}>Username</label>
          <input style={S.inp} value={loginUser} onChange={e=>{setLoginUser(e.target.value);setLoginErr("");}} placeholder="Enter username" autoCapitalize="none" autoCorrect="off"/>
        </div>
        <div style={{marginBottom:16}}>
          <label style={S.fl}>PIN</label>
          <input style={S.inp} type="password" inputMode="numeric" value={loginPin} onChange={e=>{setLoginPin(e.target.value);setLoginErr("");}} placeholder="Enter PIN" maxLength={8}
            onKeyDown={e=>{if(e.key==="Enter")doLogin();}}/>
        </div>
        {loginErr && <div style={{color:"#ef4444",fontSize:12,marginBottom:10,textAlign:"center"}}>{loginErr}</div>}
        <button type="button" onClick={doLogin} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#2563EB,#1D4ED8)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          Sign In
        </button>
        <div style={{marginTop:20,padding:12,background:"rgba(255,255,255,.03)",borderRadius:8,border:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{fontSize:10,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em",fontWeight:600}}>Default Accounts</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"2px 12px",fontSize:11}}>
            <span style={{color:"#64748b",fontWeight:600}}>Username</span>
            <span style={{color:"#64748b",fontWeight:600}}>PIN</span>
            <span style={{color:"#64748b",fontWeight:600}}>Role</span>
            {(users||DEFAULT_USERS).map(u => (
              <React.Fragment key={u.id}>
                <span style={{color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{u.username}</span>
                <span style={{color:"#475569",fontFamily:"'JetBrains Mono',monospace"}}>{u.pin}</span>
                <span style={{color:"#94a3b8"}}>{ROLES.find(r=>r.key===u.role)?.label||u.role}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = curRole?.tabs || ROLES[0].tabs;

  // ── New Project ──────────────────────────────────────────
  if (view === "new") return (
    <div style={S.app}>{globalCSS}
      <Hdr role={curRole} user={userName} onSw={doLogout} onBack={()=>{setView("dash");setNewName("");setNewAddr("");}} title="New Lead"/>
      <div className="proj-cnt cnt-wrap" style={S.cnt}>
        <Sec title="RISE Lead → Create Project">
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>Enter customer name & address from RISE. Add ST ID after creating in ServiceTitan.</p>
          <F label="Customer Name *" value={newName} onChange={setNewName}/>
          <div style={{height:10}}/>
          <F label="Address *" value={newAddr} onChange={setNewAddr}/>
          <div style={{marginTop:16,display:"flex",gap:8}}>
            <button style={{...S.btn,opacity:newName&&newAddr?1:.4,padding:"10px 20px",fontSize:14}}
              disabled={!newName||!newAddr}
              onClick={() => {
                const p = blank(); p.customerName = newName; p.address = newAddr;
                p.activityLog = [{ts:new Date().toISOString(),txt:"Lead created from RISE",by:userName,role}];
                up(prev => [p,...prev]);
                setSelId(p.id); setView("proj"); setTab("info");
                setNewName(""); setNewAddr("");
              }}>Create Lead</button>
            <button style={{...S.ghost,padding:"10px 16px"}} onClick={()=>{setView("dash");setNewName("");setNewAddr("");}}>Cancel</button>
          </div>
        </Sec>
      </div>
    </div>
  );

  // ── Project Detail ──────────────────────────────────────
  if (view === "proj" && proj) {
    const stage = STAGES[proj.currentStage];
    const alerts = getAlerts(proj);

    return (
      <div style={S.app}>{globalCSS}
        <Hdr role={curRole} user={userName} onSw={doLogout}
          onBack={()=>{setView("dash");setTab("info");}}
          title={proj.customerName||"Unnamed"} sub={proj.address}
          badge={<span style={{...S.bdg,background:stage.color}}>{stage.icon} {stage.label}</span>}
          actions={<><button style={{...S.ghost,padding:"5px 8px",fontSize:10}} onClick={()=>exportProjectPhotos(proj)}>📷 Photos</button><button style={{...S.ghost,padding:"5px 8px",fontSize:10}} onClick={()=>exportProjectForms(proj)}>📄 Forms</button></>}
        />
        {/* Stage bar */}
        <div className="stage-bar" style={S.stBar}>
          {STAGES.map(s => (
            <div key={s.id} style={{
              ...S.stStep,
              background: s.id <= proj.currentStage ? s.color : "rgba(255,255,255,0.04)",
              color: s.id <= proj.currentStage ? "#fff" : "#475569",
            }} title={s.label}>
              <span style={{fontSize:12}}>{s.icon}</span>
              <span style={{fontSize:7,lineHeight:1,textAlign:"center"}}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="alert-bar" style={S.alertBar}>
            {alerts.map((a,i) => (
              <div key={i} style={{marginRight:8}}>
                {a.type === "advance" ? (
                  <button style={{...S.btn,padding:"5px 12px",fontSize:11}} onClick={() => {
                    upP(proj.id, {currentStage:a.stage, stageHistory:[...proj.stageHistory,{s:a.stage,at:new Date().toISOString()}]});
                    addLog(proj.id, `Advanced → ${STAGES[a.stage].label}`);
                  }}>⬆ {a.msg}</button>
                ) : (
                  <span style={{fontSize:11,color:a.type==="warn"?"#fbbf24":"#93c5fd"}}>⚠ {a.msg}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="tab-bar" style={S.tabR}>
          {tabs.map(t => (
            <button key={t} className="tab-btn" style={{...S.tabB,...(tab===t?S.tabA:{})}} onClick={()=>setTab(t)}>
              {TAB_META[t]?.icon} {TAB_META[t]?.label}
            </button>
          ))}
        </div>

        <div className="proj-cnt cnt-wrap" style={S.cnt}>
          {tab==="info" && <InfoTab p={proj} u={c=>upC(proj.id,c)} role={role} onLog={t=>addLog(proj.id,t)} onDel={()=>{up(p=>p.filter(x=>x.id!==proj.id));setView("dash");}}/>}
          {tab==="scheduling" && <SchedTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)}/>}
          {tab==="assessment" && <AuditTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)} user={userName}/>}
          {tab==="photos" && <PhotoTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)} user={userName} role={role}/>}
          {tab==="scope" && <ScopeTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)}/>}
          {tab==="install" && <InstallTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)} user={userName} role={role} appSettings={appSettings}/>}
          {tab==="hvac" && <HVACTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)} user={userName} role={role}/>}
          {tab==="qaqc" && <QAQCTab p={proj} u={c=>upC(proj.id,c)}/>}
          {tab==="closeout" && <CloseoutTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)}/>}
          {tab==="log" && <LogTab p={proj} onLog={t=>addLog(proj.id,t)}/>}
        </div>
      </div>
    );
  }

  // ── HVAC Tech Dedicated View ──────────────────────────
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
              addLog(pr.id,`📸 Replacement: ${replItems.find(x=>x.id===id)?.l||id}`);
            };
            img.src=e.target.result;
          };
          reader.readAsDataURL(file);
        };

        // ── Replacement Install View ──
        if (isReplPhase) {
          return (
            <div style={S.app}>{globalCSS}
              <Hdr role={curRole} user={userName} onSw={doLogout}
                onBack={()=>setSelId(null)}
                title={pr.customerName||"Unnamed"} sub={`Replacement Install — ${hv.replaceType||"Equipment"}`}
                badge={<span style={{...S.bdg,background:"#22c55e"}}>✅ Approved</span>}
              />
              <div className="proj-cnt cnt-wrap" style={S.cnt}>
                {/* Replacement info */}
                <Sec title="🔄 Replacement Install">
                  <div style={{padding:"8px 12px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:8,marginBottom:10}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#22c55e"}}>✅ Replacement Approved — {hv.replaceType}</div>
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
                <Sec title={<span>📷 Replacement Photos <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{replTaken}/{replItems.length}</span></span>}>
                  <div style={S.prog}><div style={{...S.progF,width:`${replItems.length?(replTaken/replItems.length)*100:0}%`,background:"linear-gradient(90deg,#22c55e,#16a34a)"}}/></div>
                  {replSections.map(([cat,items])=>{
                    const cd=items.filter(i=>hasPhoto(pr.photos,i.id)).length;
                    return <div key={cat} style={{marginTop:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#22c55e",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                        <span>{cat.replace("HVAC Replacement — ","")}</span><span style={{color:cd===items.length?"#22c55e":"#64748b"}}>{cd}/{items.length}</span>
                      </div>
                      {items.map(it=>{
                        const photos=getPhotos(pr.photos,it.id);
                        const has=photos.length>0;
                        return <div key={it.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                          <div style={{width:48,height:48,borderRadius:6,border:`1px dashed ${has?"rgba(34,197,94,.3)":"rgba(255,255,255,.1)"}`,background:has?"rgba(34,197,94,.04)":"rgba(255,255,255,.02)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                            {has ? <img src={photos[photos.length-1].d} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:5}} alt=""/> :
                              <label style={{fontSize:10,color:"#64748b",cursor:"pointer",textAlign:"center",padding:4}}>📸 Tap<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compressRepl(it.id,e.target.files?.[0]);e.target.value="";}}/></label>
                            }
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,color:has?"#e2e8f0":"#64748b"}}>{has?"✓ ":""}{it.l}</div>
                            {has && <div style={{fontSize:9,color:"#475569"}}>{photos.length} photo{photos.length>1?"s":""}</div>}
                          </div>
                          {has && <label style={{fontSize:10,color:"#60A5FA",cursor:"pointer"}}>＋<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compressRepl(it.id,e.target.files?.[0]);e.target.value="";}}/></label>}
                        </div>;
                      })}
                    </div>;
                  })}
                </Sec>

                {/* Mark replacement complete */}
                <div style={{padding:"12px 0"}}>
                  <button type="button" style={{...S.btn,width:"100%",padding:"12px",fontSize:14,opacity:replTaken>=3?1:.4}} disabled={replTaken<3} onClick={()=>{
                    upC(pr.id,{hvac:{...hv,replInstallComplete:true,replInstallDate:new Date().toISOString(),replInstallBy:userName}});
                    addLog(pr.id,`✅ Replacement install documented: ${hv.replaceType} — ${replTaken} photos`);
                    setSelId(null);
                  }}>✓ Mark Replacement Install Complete</button>
                  {replTaken<3 && <div style={{fontSize:10,color:"#f59e0b",textAlign:"center",marginTop:4}}>Take at least 3 photos to complete</div>}
                </div>
              </div>
            </div>
          );
        }

        // ── Standard Tune & Clean View ──
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
                      addLog(pr.id,`📸 ${hvacItems.find(x=>x.id===id)?.l||id}`);
                    };
                    img.src=e.target.result;
                  };
                  reader.readAsDataURL(file);
                };
                return <div style={{marginTop:12}}>
                  <Sec title={<span>📷 HVAC Photos <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{taken}/{hvacItems.length}</span></span>}>
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
                                <label style={{fontSize:10,color:"#64748b",cursor:"pointer",textAlign:"center",padding:4}}>📸 Tap<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compress(it.id,e.target.files?.[0]);e.target.value="";}}/></label>
                              }
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:11,color:has?"#e2e8f0":"#64748b"}}>{has?"✓ ":""}{it.l}</div>
                              {has && <div style={{fontSize:9,color:"#475569"}}>{photos.length} photo{photos.length>1?"s":""}</div>}
                            </div>
                            {has && <label style={{fontSize:10,color:"#60A5FA",cursor:"pointer"}}>＋<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compress(it.id,e.target.files?.[0]);e.target.value="";}}/></label>}
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

    // HVAC Home — full view with tracking
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
        <Hdr role={curRole} user={userName} onSw={doLogout} title="🔧 HVAC Dashboard"
          sub={`${userName} · ${new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}`}
        />

        <div style={{padding:"0 16px"}}>
          {/* ── KPI Row ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:8,marginBottom:8}}>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#f59e0b"}}>{tuneJobs.length}</div><div style={kpiLbl}>Tune & Clean</div></div>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#22c55e"}}>{replJobs.length}</div><div style={kpiLbl}>Repl Install</div></div>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#fbbf24"}}>{replPending.length}</div><div style={kpiLbl}>Repl Pending</div></div>
            <div style={{...crd,...kpiBox,marginBottom:0}}><div style={{...kpiNum,color:"#94a3b8"}}>{completedJobs.length}</div><div style={kpiLbl}>Done</div></div>
          </div>

          {/* ── Replacement Request Tracker ── */}
          {allRepl.length > 0 && <div style={{...crd,background:"rgba(245,158,11,.04)",borderColor:"rgba(245,158,11,.2)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>🔄 Replacement Requests</div>
            {replPending.length > 0 && <>
              <div style={{fontSize:9,fontWeight:600,color:"#fbbf24",marginBottom:4}}>⏳ AWAITING APPROVAL</div>
              {replPending.map(pr=>{
                const hv=pr.hvac||{};
                return <div key={pr.id} style={{padding:"6px 8px",background:"rgba(245,158,11,.06)",borderRadius:6,marginBottom:4,border:"1px solid rgba(245,158,11,.15)",cursor:"pointer"}} onClick={()=>setSelId(pr.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600}}>{pr.customerName}</div>
                    <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(245,158,11,.15)",color:"#fbbf24",fontWeight:600}}>PENDING</span>
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{hv.replaceType} · {hv.replacePriority}</div>
                  <div style={{fontSize:9,color:"#64748b",marginTop:1}}>Submitted {hv.replaceRequestDate?new Date(hv.replaceRequestDate).toLocaleDateString():""}</div>
                </div>;
              })}
            </>}
            {replApproved.length > 0 && <>
              <div style={{fontSize:9,fontWeight:600,color:"#22c55e",marginBottom:4,marginTop:replPending.length?8:0}}>✅ APPROVED</div>
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
              <div style={{fontSize:9,fontWeight:600,color:"#ef4444",marginBottom:4,marginTop:8}}>❌ DENIED</div>
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

          {/* ── Notifications ── */}
          {myNotifications.length > 0 && <div style={{...crd,background:"rgba(37,99,235,.04)",borderColor:"rgba(37,99,235,.2)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#93C5FD",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>🔔 Updates For You</div>
            {myNotifications.map((n,i) => (
              <div key={i} style={{padding:"6px 8px",borderRadius:6,marginBottom:4,cursor:"pointer",
                background:n.status==="approved"?"rgba(34,197,94,.06)":"rgba(239,68,68,.06)",
                border:`1px solid ${n.status==="approved"?"rgba(34,197,94,.2)":"rgba(239,68,68,.2)"}`
              }} onClick={()=>setSelId(n.proj.id)}>
                <div style={{fontSize:12,fontWeight:600,color:n.status==="approved"?"#22c55e":"#ef4444"}}>
                  {n.status==="approved"?"✅":"❌"} {n.type} — {n.status.toUpperCase()}
                </div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{n.proj.customerName} · {n.proj.address}</div>
              </div>
            ))}
          </div>}

          {/* ── Tune & Clean Jobs ── */}
          {tuneJobs.length > 0 && <>
            <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,marginTop:4}}>🔧 Tune & Clean</div>
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
                      <div style={{fontSize:9,color:pc===totalHvacPhotos?"#22c55e":"#64748b",marginTop:4}}>📷 {pc}/{totalHvacPhotos}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                    {hv.techName && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(255,255,255,.05)",color:"#94a3b8"}}>Tech: {hv.techName}</span>}
                    {replSt==="pending" && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(245,158,11,.15)",color:"#fbbf24"}}>🔄 Repl Pending</span>}
                  </div>
                </button>
              );
            })}
          </>}

          {/* ── Replacement Install Jobs ── */}
          {replJobs.length > 0 && <>
            <div style={{fontSize:11,fontWeight:700,color:"#22c55e",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,marginTop:12}}>🔄 Replacement Install</div>
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
                      <div style={{fontSize:11,color:"#22c55e",marginTop:3,fontWeight:600}}>{hv.replaceType} — Approved</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <span style={{...S.bdg,background:"#22c55e",fontSize:9}}>✅ Install</span>
                      <div style={{fontSize:9,color:rpc>=3?"#22c55e":"#64748b",marginTop:4}}>📷 {rpc}/{replPhotos.length}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </>}

          {tuneJobs.length===0 && replJobs.length===0 && <div style={{textAlign:"center",padding:40,color:"#64748b"}}>
            <div style={{fontSize:32}}>🔧</div>
            <div style={{fontSize:13,marginTop:8}}>No HVAC jobs assigned right now.</div>
            <div style={{fontSize:11,color:"#475569",marginTop:4}}>Jobs appear here when projects reach the Tune & Clean stage.</div>
          </div>}
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────
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
        actions={<>{role==="admin" && <><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={()=>setShowSettings(!showSettings)}>⚙️ Settings</button><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={()=>setShowUsers(!showUsers)}>👥 Users</button><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={exportData}>📥 Data</button><button style={{...S.ghost,padding:"6px 10px",fontSize:11}} onClick={exportPhotos}>📷 Photos</button></>}<button style={{...S.btn,padding:"8px 16px",fontSize:13}} onClick={()=>setView("new")}>+ New Lead</button></>}
      />

      {/* ── User Management (Admin only) ── */}
      {showUsers && role === "admin" && <UserMgmt users={users} onSave={saveUserList} onDelete={async (id) => { await dbDeleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }} onClose={()=>setShowUsers(false)}/>}

      {showSettings && role === "admin" && (() => {
        const saveSetting = (k,v) => {
          const ns = {...appSettings, [k]:v};
          setAppSettings(ns);
          saveSettings(ns);
        };
        return <div style={{...S.card,margin:"0 16px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>⚙️ Settings</div>
            <button style={{...S.ghost,padding:"4px 10px",fontSize:11}} onClick={()=>setShowSettings(false)}>✕ Close</button>
          </div>

          <div style={{fontSize:11,fontWeight:600,color:"#93C5FD",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Notifications</div>
          <div style={{fontSize:10,color:"#64748b",marginBottom:6}}>COR and replacement request emails go to these addresses. Separate multiple with commas.</div>
          <F label="Notification Email(s)" value={appSettings.notifyEmail||""} onChange={v=>saveSetting("notifyEmail",v)} placeholder="dave@company.com, manager@company.com"/>
          <div style={{marginTop:8}}>
            <F label="CC Email(s) (optional)" value={appSettings.notifyCc||""} onChange={v=>saveSetting("notifyCc",v)} placeholder="backup@company.com"/>
          </div>

          {appSettings.notifyEmail && <div style={{marginTop:10,padding:"6px 10px",background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.2)",borderRadius:6,fontSize:11,color:"#22c55e"}}>
            ✓ Emails will be sent to: {appSettings.notifyEmail}
          </div>}
          {!appSettings.notifyEmail && <div style={{marginTop:10,padding:"6px 10px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.2)",borderRadius:6,fontSize:11,color:"#f59e0b"}}>
            ⚠ No notification email set — COR emails will use the server default (ADMIN_EMAIL env var)
          </div>}
        </div>;
      })()}

      {alertCount > 0 && (
        <div style={S.readyBan} onClick={() => setFilter(filter === "alerts" ? "all" : "alerts")}>
          <span style={{fontSize:18}}>🔔</span>
          <span style={{flex:1,fontSize:13}}><b>{alertCount}</b> need{alertCount>1?"":"s"} attention</span>
          <span style={{fontSize:11,color:"#fde68a"}}>{filter==="alerts"?"Show all":"Filter"} →</span>
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

      {/* ── Ops Dashboard ── */}
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

        // Aging / stuck — days in current stage
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

        // Average days to complete (created → stage 8)
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
            <div style={{...card,...kpi,marginBottom:0}}><div style={{...kpiN,color:"#f59e0b"}}>{avgDays||"—"}</div><div style={kpiL}>Avg Days</div></div>
          </div>

          {/* Action Items */}
          {(needsScheduling>0||needsInstallSched>0||hazards.length>0) && <div style={{...card,background:"rgba(239,68,68,.06)",borderColor:"rgba(239,68,68,.2)"}}>
            <div style={{...hdr,color:"#ef4444"}}>⚡ Action Required</div>
            {needsScheduling>0 && <div style={{...row,color:"#fca5a5"}}><span>Needs assessment scheduling</span><b>{needsScheduling}</b></div>}
            {needsInstallSched>0 && <div style={{...row,color:"#fca5a5"}}><span>Needs install scheduling</span><b>{needsInstallSched}</b></div>}
            {hazards.length>0 && <div style={{...row,color:"#fca5a5"}}><span>⛔ Hazard flags (K&T/asbestos/mold)</span><b>{hazards.length}</b></div>}
          </div>}

          {/* ══ PENDING CHANGE ORDER REQUESTS — urgent review panel ══ */}
          {(role==="admin"||role==="scope") && (()=>{
            const allPendingCOs = [];
            projects.forEach(pr => (pr.changeOrders||[]).forEach(c => {
              if (c.status==="pending") allPendingCOs.push({...c, proj: pr});
            }));
            if (allPendingCOs.length === 0) return null;
            return <div style={{...card,background:"rgba(249,115,22,.08)",borderColor:"rgba(249,115,22,.4)",borderWidth:2,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#f97316,#fbbf24,#f97316,#fbbf24)",backgroundSize:"200% 100%",animation:"coSlide 2s linear infinite"}}/>
              <div style={{...hdr,color:"#f97316",fontSize:12}}>🔶 PENDING CHANGE ORDER REQUESTS — {allPendingCOs.length} AWAITING REVIEW</div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:8}}>Crews are waiting. Review and respond quickly.</div>
              {allPendingCOs.sort((a,b)=>new Date(a.at)-new Date(b.at)).map(c => {
                const pr = c.proj;
                return <div key={c.id} style={{padding:"8px 10px",background:"rgba(0,0,0,.2)",borderRadius:6,marginBottom:6,border:"1px solid rgba(249,115,22,.2)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#f97316",cursor:"pointer"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("install");}}>{pr.customerName||"Unnamed"} — {pr.address||""}</div>
                    <span style={{fontSize:9,color:"#64748b"}}>{Math.floor((Date.now()-new Date(c.at))/(1000*60))} min ago</span>
                  </div>
                  <div style={{fontSize:11,color:"#e2e8f0",lineHeight:1.4,marginBottom:4}}>{c.text}</div>
                  {c.photo && <img src={c.photo} style={{maxWidth:"100%",maxHeight:120,borderRadius:4,marginBottom:4,border:"1px solid rgba(255,255,255,.1)"}} alt="COR"/>}
                  <div style={{fontSize:9,color:"#64748b"}}>By {c.by} · {new Date(c.at).toLocaleString()}</div>
                  <div style={{marginTop:6,display:"flex",gap:6}}>
                    <button type="button" style={{flex:1,padding:"8px",borderRadius:6,border:"1px solid rgba(34,197,94,.4)",background:"rgba(34,197,94,.1)",color:"#22c55e",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("install");}}>Open → Review</button>
                  </div>
                </div>;
              })}
            </div>;
          })()}

          {/* ══ PENDING REPLACEMENT REQUESTS ══ */}
          {(role==="admin"||role==="scope") && (()=>{
            const pendRepl = projects.filter(pr=>(pr.hvac||{}).replaceRequestStatus==="pending");
            if (pendRepl.length === 0) return null;
            return <div style={{...card,background:"rgba(245,158,11,.06)",borderColor:"rgba(245,158,11,.3)"}}>
              <div style={{...hdr,color:"#f59e0b"}}>🔄 REPLACEMENT REQUESTS — {pendRepl.length} AWAITING REVIEW</div>
              {pendRepl.map(pr => {
                const hv = pr.hvac||{};
                return <div key={pr.id} style={{padding:"8px 10px",background:"rgba(0,0,0,.15)",borderRadius:6,marginBottom:6,border:"1px solid rgba(245,158,11,.15)"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#fbbf24",cursor:"pointer"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("hvac");}}>{pr.customerName||"Unnamed"} — {pr.address||""}</div>
                  <div style={{fontSize:11,color:"#e2e8f0",marginTop:3}}><b>{hv.replaceType}</b> · {hv.replacePriority}</div>
                  {hv.replaceJustification && <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{hv.replaceJustification}</div>}
                  <div style={{fontSize:9,color:"#64748b",marginTop:3}}>By {hv.replaceRequestBy} · {hv.replaceRequestDate?new Date(hv.replaceRequestDate).toLocaleString():""}</div>
                  <button type="button" style={{marginTop:6,width:"100%",padding:"8px",borderRadius:6,border:"1px solid rgba(245,158,11,.4)",background:"rgba(245,158,11,.1)",color:"#fbbf24",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>{setSelId(pr.id);setView("proj");setTab("hvac");}}>Open → Review</button>
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
              <div style={{...hdr,color:"#f59e0b"}}>⏳ Aging Projects</div>
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
        <input style={S.sInp} placeholder="Search name, address, RISE, ST…" value={search} onChange={e => setSearch(e.target.value)}/>
        {(filter !== "all" || search) && <button style={S.ghost} onClick={() => {setFilter("all");setSearch("");}}>Clear</button>}
      </div>

      {sorted.length === 0 ? (
        <div style={S.empty}>
          <p style={{fontSize:32}}>📂</p>
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
                    {p.flagged && <span>⚠️</span>}
                    <span className="c-name" style={S.cName}>{p.customerName}</span>
                  </div>
                  <span style={{...S.bdg,background:st.color,fontSize:10}}>{st.icon} {st.label}</span>
                </div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{p.address}</div>
                {al.length > 0 && (
                  <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                    {al.map((a,i) => <span key={i} style={{...S.tBadge,...(a.type==="co"?{background:"rgba(249,115,22,.15)",color:"#f97316",border:"1px solid rgba(249,115,22,.3)"}:a.type==="repl"?{background:"rgba(245,158,11,.15)",color:"#fbbf24",border:"1px solid rgba(245,158,11,.3)"}:a.type==="repl_done"?{background:"rgba(34,197,94,.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,.3)"}:{})}}>{a.type==="advance"?"⬆":a.type==="co"?"🔶":a.type==="repl"||a.type==="repl_done"?"🔄":"🔔"} {a.msg}</span>)}
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

// ═══════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════
