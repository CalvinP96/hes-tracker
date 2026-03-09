import React, { useState, useEffect, useCallback, useRef } from "react";
import { loadUsers, saveUser, deleteUser as dbDeleteUser, loadProjects, saveProjects, getSession, setSession, setSessionNav, loadSettings, saveSettings } from "./db.js";
import { STAGES, ROLES, TAB_META, DEFAULT_USERS } from "./constants/index.js";
import { uid, fmts, blank, calcStage, getAlerts, getPhotos, hasPhoto } from "./helpers/index.js";
import { S, globalCSS } from "./styles/index.js";
import { Hdr, Sec, Gr, F, CK, UserMgmt, SI } from "./components/ui.jsx";
import { InfoTab } from "./tabs/InfoTab.jsx";
import { SchedTab } from "./tabs/SchedTab.jsx";
import { AuditTab } from "./tabs/AuditTab.jsx";
import { PhotoTab } from "./tabs/PhotoTab.jsx";
import { ScopeTab } from "./tabs/ScopeTab.jsx";
import { InstallTab } from "./tabs/InstallTab.jsx";
import { HVACTab } from "./tabs/HVACTab.jsx";
import { QAQCTab } from "./tabs/QAQCTab.jsx";
import { CloseoutTab } from "./tabs/CloseoutTab.jsx";
import { LogTab } from "./tabs/LogTab.jsx";
import { exportData, exportPhotos, exportProjectPhotos, exportProjectForms } from "./export/exportForms.js";
import { printScope, photoPageHTML, sideBySideHTML } from "./export/savePrint.js";

// ── Inline views (extracted below) ──────────────────────────
// HVACDashboard and OpsDashboard remain inline for now until
// further refactoring isolates their state dependencies.

export default function App() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState(null);
  const [curUser, setCurUser] = useState(null);
  const [view, setView] = useState("dash");
  const [selId, setSelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("info");
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginErr, setLoginErr] = useState("");
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
      let userList = u && u.length > 0 ? [...u] : [...DEFAULT_USERS];
      DEFAULT_USERS.forEach(du => {
        if (!userList.find(x => x.id === du.id || x.username === du.username)) {
          userList.push(du);
        }
      });
      setUsers(userList);
      if (u && u.length > 0 && userList.length > u.length) {
        for (const nu of userList.filter(x => !u.find(y => y.id === x.id))) {
          saveUser(nu);
        }
      }
      const session = getSession();
      if (session?.userId) {
        const found = userList.find(x => x.id === session.userId);
        if (found) {
          setCurUser(found);
          const urlParams = new URLSearchParams(window.location.search);
          const deepProject = urlParams.get("project");
          const deepTab = urlParams.get("tab");
          if (deepProject) {
            setView("proj"); setSelId(deepProject);
            if (deepTab) setTab(deepTab);
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            if (session.view) setView(session.view);
            if (session.selId) setSelId(session.selId);
            if (session.tab) setTab(session.tab);
          }
        }
      } else {
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

  useEffect(() => {
    if (curUser) setSessionNav({ view, selId, tab });
  }, [view, selId, tab, curUser]);

  const save = useCallback((p) => {
    if(tmr.current) clearTimeout(tmr.current);
    tmr.current = setTimeout(() => saveProjects(p), 400);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && curUser) {
        loadProjects().then(p => {
          if (p) setProjects(prev => {
            const fresh = p.filter(x => x.id !== "__app_settings__");
            return fresh.map(fp => {
              const local = prev.find(lp => lp.id === fp.id);
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
    for (const u of list) { await saveUser(u); }
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

  const cssEl = <style>{globalCSS}</style>;

  // ── Login ────────────────────────────────────────────────
  const doLogin = () => {
    if (!users) return;
    const found = users.find(u => u.username.toLowerCase() === loginUser.trim().toLowerCase() && u.pin === loginPin);
    if (found) {
      setCurUser(found); setLoginErr(""); setLoginUser(""); setLoginPin("");
      setSession(found.id);
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

  const doLogout = () => { setCurUser(null); setView("dash"); setSelId(null); setSession(null); };

  if (!curUser) return (
    <div style={S.app}>{cssEl}
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
                <span style={{color:"#94a3b8"}}>{u.username}</span>
                <span style={{color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{u.pin}</span>
                <span style={{color:"#64748b"}}>{u.role}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── HVAC Tech dedicated view ─────────────────────────────
  if (role === "hvac") {
    // Pass through to full App for HVAC tech — they use project list + HVACTab
    // (inline here since it depends on full projects/state)
    const hvacProjects = projects.filter(p => {
      const s = p.currentStage;
      return s >= 2 && s <= 6;
    });
    return (
      <div style={S.app}>{cssEl}
        <Hdr role={curRole} user={userName} onSw={doLogout} title="HVAC Dashboard"/>
        <div style={{padding:"8px 16px"}}>
          {hvacProjects.length === 0 && <div style={S.empty}><div style={{fontSize:32,marginBottom:8}}>🔧</div><div style={{color:"#64748b"}}>No active projects</div></div>}
          {hvacProjects.map(p => {
            const alerts = getAlerts(p);
            return (
              <button key={p.id} style={S.card} onClick={()=>{setSelId(p.id);setView("proj");setTab("hvac");}}>
                <div style={S.cTop}>
                  <span style={S.cName}>{p.customerName||"(no name)"}</span>
                  <span style={{...S.bdg,background:STAGES[p.currentStage]?.color+"33",color:STAGES[p.currentStage]?.color}}>{STAGES[p.currentStage]?.label}</span>
                </div>
                <div style={S.cMeta}><span>{p.address}</span></div>
                {alerts.map((a,i) => <div key={i} style={{fontSize:11,color:"#fbbf24",marginTop:3}}>⚠ {a.msg}</div>)}
              </button>
            );
          })}
        </div>
        {view === "proj" && proj && (
          <div style={{position:"fixed",inset:0,background:S.app.background,zIndex:100,overflowY:"auto"}}>
            <Hdr role={curRole} user={userName} onSw={doLogout} onBack={()=>setView("dash")} title={proj.customerName||"Project"} sub={proj.address}/>
            <HVACTab p={proj} u={c=>upC(proj.id,c)} onLog={t=>addLog(proj.id,t)} user={curUser} role={role}/>
          </div>
        )}
      </div>
    );
  }

  // ── New Project ──────────────────────────────────────────
  const createProject = () => {
    if (!newName.trim()) return;
    const p = blank();
    p.customerName = newName.trim();
    p.address = newAddr.trim();
    setProjects(prev => { const n = [p, ...prev]; save(n); return n; });
    setNewName(""); setNewAddr("");
    setSelId(p.id); setView("proj"); setTab("info");
    addLog(p.id, "Project created");
  };

  // ── Project Detail ───────────────────────────────────────
  if (view === "proj" && proj) {
    const tabs = curRole?.tabs || [];
    const alerts = getAlerts(proj);
    const u = (c) => upC(proj.id, c);
    const log = (t) => addLog(proj.id, t);

    return (
      <div style={S.app}>{cssEl}
        <Hdr role={curRole} user={userName} onSw={doLogout} onBack={()=>{setView("dash");}}
          title={proj.customerName||"Project"}
          sub={proj.address}
          badge={<span style={{...S.bdg,background:STAGES[proj.currentStage]?.color+"33",color:STAGES[proj.currentStage]?.color,fontSize:10}}>{STAGES[proj.currentStage]?.icon} {STAGES[proj.currentStage]?.label}</span>}
          actions={<>
            {alerts.filter(a=>a.type==="advance").map((a,i)=>(
              <button key={i} style={{...S.btn,fontSize:11,padding:"5px 10px",background:"#f59e0b",color:"#000"}} onClick={()=>upP(proj.id,{currentStage:a.stage})}>↑ {a.msg}</button>
            ))}
          </>}
        />

        {/* Stage bar */}
        <div className="stage-bar" style={S.stBar}>
          {STAGES.map(st => (
            <div key={st.id} style={{...S.stStep,opacity:proj.currentStage===st.id?1:proj.currentStage>st.id?.6:.3,cursor:"pointer"}} onClick={()=>upP(proj.id,{currentStage:st.id})}>
              <span style={{fontSize:14}}>{st.icon}</span>
              <span style={{fontSize:8,color:proj.currentStage===st.id?st.color:"#64748b",fontWeight:proj.currentStage===st.id?700:400}}>{st.label}</span>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.filter(a=>a.type!=="advance").length > 0 && (
          <div className="alert-bar" style={S.alertBar}>
            {alerts.filter(a=>a.type!=="advance").map((a,i) => (
              <span key={i} style={{fontSize:11,padding:"3px 8px",borderRadius:5,background:"rgba(245,158,11,.1)",color:"#fbbf24",border:"1px solid rgba(245,158,11,.2)"}}>{a.msg}</span>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar" style={S.tabR}>
          {tabs.map(t => (
            <button key={t} className="tab-btn" style={{...S.tabB,...(tab===t?S.tabA:{})}} onClick={()=>setTab(t)}>
              {TAB_META[t]?.icon} {TAB_META[t]?.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={S.cnt}>
          {tab==="info"       && <InfoTab       p={proj} u={u} role={role} onLog={log} onDel={()=>{setProjects(prev=>{const n=prev.filter(x=>x.id!==proj.id);save(n);return n;});setView("dash");}}/>}
          {tab==="scheduling" && <SchedTab      p={proj} u={u} onLog={log}/>}
          {tab==="assessment" && <AuditTab      p={proj} u={u} onLog={log} user={curUser}/>}
          {tab==="photos"     && <PhotoTab      p={proj} u={u} onLog={log} user={curUser} role={role}/>}
          {tab==="scope"      && <ScopeTab      p={proj} u={u} onLog={log}/>}
          {tab==="install"    && <InstallTab    p={proj} u={u} onLog={log} user={curUser} role={role} appSettings={appSettings}/>}
          {tab==="hvac"       && <HVACTab       p={proj} u={u} onLog={log} user={curUser} role={role}/>}
          {tab==="qaqc"       && <QAQCTab       p={proj} u={u}/>}
          {tab==="closeout"   && <CloseoutTab   p={proj} u={u} onLog={log}/>}
          {tab==="log"        && <LogTab        p={proj} onLog={log}/>}
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const stageMatch = filter === "all" ? true : p.currentStage === Number(filter);
    const searchMatch = !search || p.customerName?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase()) || p.riseId?.toLowerCase().includes(search.toLowerCase());
    return stageMatch && searchMatch;
  });

  // Count by stage
  const stageCounts = STAGES.map(st => ({ ...st, count: projects.filter(p => p.currentStage === st.id).length }));

  return (
    <div style={S.app}>{cssEl}
      <Hdr role={curRole} user={userName} onSw={doLogout} title="HES Retrofits"
        actions={<>
          {role==="admin" && <button style={S.rChip} onClick={()=>setShowUsers(!showUsers)}>👥</button>}
          {role==="admin" && <button style={S.rChip} onClick={()=>setShowSettings(!showSettings)}>⚙️</button>}
        </>}
      />

      {showUsers && users && (
        <div style={{padding:"8px 16px"}}>
          <UserMgmt
            users={users}
            onSave={saveUserList}
            onDelete={async (id) => { await dbDeleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }}
            onClose={()=>setShowUsers(false)}
          />
        </div>
      )}

      {showSettings && (
        <div style={{padding:"8px 16px"}}>
          <Sec title="⚙️ Settings">
            <div style={{marginBottom:8}}>
              <label style={S.fl}>COR Notification Email</label>
              <input style={S.inp} value={appSettings.corEmail||""} onChange={e=>setAppSettings(p=>({...p,corEmail:e.target.value}))} placeholder="ops@example.com"/>
            </div>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <button style={S.btn} onClick={async()=>{await saveSettings(appSettings);setShowSettings(false);}}>Save</button>
              <button style={S.ghost} onClick={()=>setShowSettings(false)}>Cancel</button>
            </div>
          </Sec>
        </div>
      )}

      {/* Pipeline filter */}
      <div className="pipe-bar" style={S.pipe}>
        <button className="pipe-chip" style={{...S.chip,borderColor:filter==="all"?"#2563EB":"rgba(255,255,255,.08)",color:filter==="all"?"#60A5FA":"#64748b",background:filter==="all"?"rgba(37,99,235,.1)":"transparent"}} onClick={()=>setFilter("all")}>
          All <span style={S.chipN}>{projects.length}</span>
        </button>
        {stageCounts.map(st => (
          <button key={st.id} className="pipe-chip" style={{...S.chip,borderColor:filter===String(st.id)?st.color:"rgba(255,255,255,.08)",color:filter===String(st.id)?st.color:"#64748b",background:filter===String(st.id)?st.color+"22":"transparent"}} onClick={()=>setFilter(filter===String(st.id)?"all":String(st.id))}>
            {st.icon} <span style={S.chipN}>{st.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-row" style={S.sRow}>
        <input className="search-inp" style={S.sInp} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, address, RISE ID…"/>
        {search && <button style={S.ghost} onClick={()=>setSearch("")}>✕</button>}
      </div>

      {/* New project */}
      {(role==="admin"||role==="scheduler") && (
        <div style={{padding:"4px 16px 8px",display:"flex",gap:6,flexWrap:"wrap"}}>
          <input style={{...S.sInp,flex:2,minWidth:120}} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Customer name…" onKeyDown={e=>{if(e.key==="Enter")createProject();}}/>
          <input style={{...S.sInp,flex:3,minWidth:140}} value={newAddr} onChange={e=>setNewAddr(e.target.value)} placeholder="Address…" onKeyDown={e=>{if(e.key==="Enter")createProject();}}/>
          <button style={S.btn} onClick={createProject}>+ Add</button>
        </div>
      )}

      {/* Export (admin only) */}
      {role==="admin" && (
        <div style={{padding:"0 16px 8px",display:"flex",gap:4,flexWrap:"wrap"}}>
          <button style={{...S.ghost,fontSize:11}} onClick={()=>exportData(projects)}>📤 Export JSON</button>
          <button style={{...S.ghost,fontSize:11}} onClick={()=>exportPhotos(projects)}>📷 Export Photos</button>
        </div>
      )}

      {/* Project list */}
      <div className="proj-list" style={S.list}>
        {filtered.length === 0 && <div style={S.empty}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{color:"#64748b"}}>{search?"No results":"No projects yet"}</div></div>}
        {filtered.map(p => {
          const alerts = getAlerts(p);
          const advAlert = alerts.find(a=>a.type==="advance");
          return (
            <button key={p.id} className="proj-card" style={S.card} onClick={()=>{setSelId(p.id);setView("proj");setTab("info");}}>
              <div style={S.cTop}>
                <span className="c-name" style={S.cName}>{p.customerName||"(no name)"}</span>
                <span style={{...S.bdg,background:STAGES[p.currentStage]?.color+"33",color:STAGES[p.currentStage]?.color,fontSize:9}}>{STAGES[p.currentStage]?.icon} {STAGES[p.currentStage]?.label}</span>
              </div>
              <div style={S.cMeta}>
                <span>{p.address}</span>
                {p.riseId && <span>RISE: {p.riseId}</span>}
                {p.assessmentDate && <span>Assess: {fmts(p.assessmentDate)}</span>}
                {p.installDate && <span>Install: {fmts(p.installDate)}</span>}
              </div>
              {p.flagged && <span style={{...S.tBadge,marginTop:4,display:"inline-block"}}>⚠ Flagged</span>}
              {advAlert && <div style={{fontSize:11,color:"#fbbf24",marginTop:3}}>↑ {advAlert.msg}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
