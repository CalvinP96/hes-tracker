import React, { useState, useRef } from "react";
import { S } from "../styles/index.js";
import { ROLES, PROGRAM } from "../constants/index.js";
import { uid } from "../helpers/index.js";

export function Rec({type,children}) {
  const colors = {
    rec: {bg:"rgba(34,197,94,.1)",border:"rgba(34,197,94,.3)",color:"#22c55e",icon:"✓"},
    warn: {bg:"rgba(245,158,11,.1)",border:"rgba(245,158,11,.3)",color:"#f59e0b",icon:"⚠"},
    info: {bg:"rgba(37,99,235,.1)",border:"rgba(37,99,235,.3)",color:"#60A5FA",icon:"ℹ"},
    flag: {bg:"rgba(239,68,68,.1)",border:"rgba(239,68,68,.3)",color:"#ef4444",icon:"⛔"},
  };
  const c = colors[type] || colors.info;
  return <div style={{marginTop:6,padding:"6px 10px",borderRadius:6,background:c.bg,border:`1px solid ${c.border}`,fontSize:11,color:c.color,lineHeight:1.4}}>{c.icon} {children}</div>;
}

export function InsulRec({section, preR, addR}) {
  const rule = PROGRAM[section];
  if (!rule) return null;
  const pre = Number(preR) || 0;
  const add = Number(addR) || 0;
  const total = pre + add;
  const suggested = calcRtoAdd(section, preR);
  const recs = [];

  if (preR && suggested !== null && suggested > 0) {
    recs.push({t:"rec", m:`${rule.label}. Existing R-${pre} → add R-${suggested} to reach R-${rule.target}.`});
  }
  if (preR && suggested === null) {
    recs.push({t:"info", m:`Existing R-${pre} — above threshold. Insulation not required per program rules.`});
  }
  if (preR && addR && total < rule.target && suggested !== null) {
    recs.push({t:"warn", m:`R-${add} to add will reach R-${total}, short of R-${rule.target} target. Consider increasing to R-${suggested}.`});
  }
  if (preR && addR && total >= rule.target) {
    recs.push({t:"rec", m:`Total R-${total} meets/exceeds R-${rule.target} target. ✓`});
  }
  return recs.map((r,i) => <Rec key={i} type={r.t}>{r.m}</Rec>);
}

export function UserMgmt({users, onSave, onDelete, onClose}) {
  const [edit, setEdit] = useState(null); // user object being edited/created
  const [confirmDel, setConfirmDel] = useState(null);

  const startNew = () => setEdit({id:uid(), name:"", username:"", pin:"", role:"installer", isNew:true});
  const startEdit = (u) => setEdit({...u, isNew:false});
  const doSave = () => {
    if (!edit.name.trim() || !edit.username.trim() || !edit.pin.trim()) return;
    // Check for duplicate username
    const dup = users.find(u => u.username.toLowerCase() === edit.username.trim().toLowerCase() && u.id !== edit.id);
    if (dup) { alert("Username already taken"); return; }
    const clean = {id:edit.id, name:edit.name.trim(), username:edit.username.trim().toLowerCase(), pin:edit.pin.trim(), role:edit.role};
    if (edit.isNew) onSave([...users, clean]);
    else onSave(users.map(u => u.id === edit.id ? clean : u));
    setEdit(null);
  };
  const doDelete = (id) => { if(onDelete) onDelete(id); setConfirmDel(null); };

  const row = {display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,.06)"};
  const badge = (r) => {const m=ROLES.find(x=>x.key===r); return <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(37,99,235,.15)",color:"#93C5FD"}}>{m?.icon} {m?.label||r}</span>;};

  return (
    <Sec title={<span>👥 User Management <button type="button" onClick={onClose} style={{float:"right",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:14}}>✕</button></span>}>
      {!edit ? <>
        {users.map(u => (
          <div key={u.id} style={row}>
            {confirmDel === u.id ? (
              <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#ef4444"}}>Delete {u.name}?</span>
                <button type="button" onClick={()=>doDelete(u.id)} style={{padding:"3px 8px",borderRadius:4,border:"1px solid rgba(239,68,68,.4)",background:"rgba(239,68,68,.1)",color:"#ef4444",fontSize:10,fontWeight:700,cursor:"pointer"}}>Yes</button>
                <button type="button" onClick={()=>setConfirmDel(null)} style={{padding:"3px 8px",borderRadius:4,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#94a3b8",fontSize:10,cursor:"pointer"}}>No</button>
              </div>
            ) : <>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600}}>{u.name}</div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"'JetBrains Mono',monospace"}}>{u.username} · PIN: {u.pin}</div>
              </div>
              {badge(u.role)}
              <button type="button" onClick={()=>startEdit(u)} style={{background:"none",border:"none",color:"#60A5FA",cursor:"pointer",fontSize:12}}>✏️</button>
              <button type="button" onClick={()=>setConfirmDel(u.id)} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12}}>🗑️</button>
            </>}
          </div>
        ))}
        <button type="button" onClick={startNew} style={{...S.btn,width:"100%",marginTop:8,padding:"10px",fontSize:13}}>+ Add User</button>
      </> : <>
        <div style={{marginBottom:8}}>
          <label style={S.fl}>Name</label>
          <input style={S.inp} value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} placeholder="Full name"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <div><label style={S.fl}>Username</label><input style={S.inp} value={edit.username} onChange={e=>setEdit({...edit,username:e.target.value})} placeholder="username" autoCapitalize="none"/></div>
          <div><label style={S.fl}>PIN</label><input style={S.inp} value={edit.pin} onChange={e=>setEdit({...edit,pin:e.target.value})} placeholder="1234" inputMode="numeric" maxLength={8}/></div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={S.fl}>Role</label>
          <select style={{...S.inp,cursor:"pointer",appearance:"auto",WebkitAppearance:"menulist"}} value={edit.role} onChange={e=>setEdit({...edit,role:e.target.value})}>
            {ROLES.map(r => <option key={r.key} value={r.key}>{r.icon} {r.label}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button type="button" onClick={doSave} style={{...S.btn,flex:1,padding:"10px"}}>{edit.isNew?"Add User":"Save Changes"}</button>
          <button type="button" onClick={()=>setEdit(null)} style={{...S.ghost,flex:1,padding:"10px"}}>Cancel</button>
        </div>
      </>}
    </Sec>
  );
}

export function Hdr({role,user,onSw,onBack,title,sub,badge,actions}) {
  return (
    <header className="hdr-bar" style={S.hdr}>
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
        {onBack && <button style={{...S.back,fontSize:20}} onClick={onBack}>←</button>}
        {!onBack && <img src="/logo.png" alt="" style={{height:22,opacity:.85}}/>}
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <h1 style={S.hT}>{title}</h1>{badge}
          </div>
          {sub && <p style={S.hS}>{sub}</p>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        {actions}
        <button style={S.rChip} onClick={onSw} title="Sign out">{role?.icon} {user} <span style={{fontSize:10,marginLeft:4,opacity:.6}}>↪</span></button>
      </div>
    </header>
  );
}

export function Sec({title,children,danger}) {
  return <div style={{...S.sec,...(danger?{borderColor:"rgba(239,68,68,.3)"}:{})}}><h3 style={{...S.secT,...(danger?{color:"#ef4444"}:{})}}>{title}</h3>{children}</div>;
}

export function Gr({children}) { return <div className="gr-wrap">{children}</div>; }

export function F({label,value,onChange,type="text",placeholder,num,computed,suffix}) {
  return <div style={{display:"flex",flexDirection:"column"}}>
    <label style={S.fl}>{label}</label>
    {computed !== undefined ? (
      <div style={{...S.inp,marginTop:"auto",background:"rgba(37,99,235,.08)",color:"#93C5FD"}}>{computed}{suffix && <span style={{fontSize:10,color:"#64748b",marginLeft:4}}>{suffix}</span>}</div>
    ) : (
      <input style={{...S.inp,marginTop:"auto"}} type={type} inputMode={num?"decimal":undefined} value={value||""} onChange={e=>{
        if(num){const v=e.target.value;if(v===""||/^-?\d*\.?\d*$/.test(v))onChange(v);}
        else onChange(e.target.value);
      }} placeholder={placeholder}/>
    )}
  </div>;
}

export function Sel({label,value,onChange,opts}) {
  const isOther = value && !opts.includes(value) && value !== "";
  return (
    <div style={{display:"flex",flexDirection:"column"}}>
      <label style={S.fl}>{label}</label>
      <select value={isOther?"__other__":value||""} onChange={e=>{
        if(e.target.value==="__other__") onChange("Other: ");
        else onChange(e.target.value);
      }} style={{...S.inp,cursor:"pointer",marginTop:"auto",appearance:"auto",WebkitAppearance:"menulist",color:value?"#e2e8f0":"#64748b"}}>
        <option value="" style={{background:"#1e293b",color:"#64748b"}}>— Select —</option>
        {opts.map(o => <option key={o} value={o} style={{background:"#1e293b",color:"#e2e8f0"}}>{o}</option>)}
        <option value="__other__" style={{background:"#1e293b",color:"#f59e0b"}}>Other (type in)</option>
      </select>
      {isOther && <input style={{...S.inp,marginTop:3,borderColor:"rgba(245,158,11,.4)"}} value={value} onChange={e=>onChange(e.target.value)} placeholder="Type custom value…"/>}
    </div>
  );
}

export function CK({checked,onChange,label,color,strike,small}) { return <label style={{...S.ck,fontSize:small?10:12,...(color?{color}:{}),cursor:"pointer",...(strike?{textDecoration:"line-through"}:{})}}><input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} style={{marginRight:6,accentColor:"#2563EB",width:small?14:16,height:small?14:16,flexShrink:0}}/><span style={{lineHeight:1.3}}>{label}</span></label>; }

export function BtnGrp({value,onChange,opts}) { return <div style={{display:"flex",gap:3}}>{opts.map(o=><button key={o.v} type="button" onClick={()=>onChange(value===o.v?"":o.v)} style={{padding:"7px 10px",borderRadius:6,border:value===o.v?`2px solid ${o.c}`:"1px solid rgba(255,255,255,.1)",background:value===o.v?`${o.c}22`:"rgba(255,255,255,.03)",color:value===o.v?o.c:"#64748b",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",minWidth:40,minHeight:36}}>{o.l}</button>)}</div>; }

export function SigPad({value, onChange, label}) {
  const [signing, setSigning] = useState(false);
  const canRef = useRef(null);
  const drawing = useRef(false);
  const lastPt = useRef(null);

  const startDraw = () => {
    const can = canRef.current; if (!can) return;
    const ctx = can.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,can.width,can.height);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  };

  const getPos = (e) => {
    const r = canRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const down = (e) => { e.preventDefault(); drawing.current = true; lastPt.current = getPos(e); };
  const move = (e) => {
    if (!drawing.current || !canRef.current) return;
    e.preventDefault();
    const ctx = canRef.current.getContext("2d");
    const pt = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pt.x, pt.y); ctx.stroke();
    lastPt.current = pt;
  };
  const up = () => { drawing.current = false; lastPt.current = null; };

  const save = () => {
    if (!canRef.current) return;
    onChange(canRef.current.toDataURL("image/png"));
    setSigning(false);
  };
  const clear = () => { onChange(""); };

  if (signing) {
    return (
      <div style={S.camOv}>
        <div style={S.camH}>
          <button style={{...S.back,fontSize:18}} onClick={()=>setSigning(false)}>✕ Cancel</button>
          <div style={{flex:1,textAlign:"center",fontWeight:600,fontSize:14}}>{label || "Sign"}</div>
          <button style={{...S.btn,padding:"6px 14px",minHeight:40}} onClick={save}>Done</button>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,background:"#0b0e18"}}>
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:8}}>Sign below with finger or stylus</p>
          <canvas ref={el=>{canRef.current=el;if(el){el.width=Math.min(600,window.innerWidth-40);el.height=180;startDraw();}}}
            style={{borderRadius:8,border:"2px solid #334155",touchAction:"none",cursor:"crosshair",background:"#fff"}}
            onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
            onTouchStart={down} onTouchMove={move} onTouchEnd={up}/>
          <button style={{...S.ghost,marginTop:10,fontSize:12}} onClick={()=>{if(canRef.current){const ctx=canRef.current.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canRef.current.width,canRef.current.height);}}}>Clear Pad</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{marginTop:8}}>
      <label style={S.fl}>{label || "Signature"}</label>
      {value ? (
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:"#fff",borderRadius:6,padding:4,border:"1px solid rgba(255,255,255,.1)"}}>
            <img src={value} style={{height:50,objectFit:"contain"}} alt="sig"/>
          </div>
          <button style={{...S.ghost,fontSize:10,padding:"4px 10px",minHeight:36}} onClick={clear}>Clear</button>
          <button style={{...S.ghost,fontSize:10,padding:"4px 10px",minHeight:36}} onClick={()=>setSigning(true)}>Re-sign</button>
        </div>
      ) : (
        <button style={{...S.btn,padding:"8px 16px",minHeight:44,WebkitTapHighlightColor:"transparent"}} onClick={()=>setSigning(true)}>✍️ Tap to Sign</button>
      )}
    </div>
  );
}

export function PrintBtn({onClick,label}) {
  return <button style={{...S.ghost,fontSize:11,padding:"6px 10px",display:"flex",alignItems:"center",gap:3}} onClick={onClick}>📄 {label||"Save / Print"}</button>;
}

export function SI({l,v,c}) { return <div style={S.si}><span style={{fontSize:9,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em"}}>{l}</span><span style={{fontSize:13,fontWeight:600,color:c||"#e2e8f0",marginTop:2}}>{v}</span></div>; }

