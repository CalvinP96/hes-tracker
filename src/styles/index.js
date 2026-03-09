// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
export const S = {
  app: { fontFamily:"'DM Sans',sans-serif", background:"#0b0e18", minHeight:"100vh", color:"#e2e8f0", paddingBottom:60, overflowX:"hidden" },
  center: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0b0e18" },
  spin: { width:24, height:24, border:"3px solid #1e293b", borderTopColor:"#2563EB", borderRadius:"50%", animation:"spin .7s linear infinite" },

  // Role picker
  rpWrap: { maxWidth:440, margin:"0 auto", padding:"48px 20px" },
  logoBox: { width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#DC2626,#B91C1C)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, margin:"0 auto" },
  rCard: { display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, cursor:"pointer", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", width:"100%" },

  // Header
  hdr: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,.06)", background:"rgba(11,14,24,.95)", flexWrap:"wrap", gap:6 },
  hT: { fontSize:16, fontWeight:700, margin:0, color:"#f1f5f9" },
  hS: { fontSize:11, color:"#64748b", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  back: { background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:18, fontFamily:"'DM Sans',sans-serif", padding:"4px 6px", minWidth:44, minHeight:44, display:"flex", alignItems:"center", justifyContent:"center" },
  rChip: { background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, padding:"6px 12px", color:"#e2e8f0", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", minHeight:36 },
  bdg: { padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:600, whiteSpace:"nowrap", color:"#fff" },

  // Buttons
  btn: { background:"linear-gradient(135deg,#2563EB,#1D4ED8)", color:"#fff", border:"none", padding:"8px 16px", borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", minHeight:36 },
  ghost: { background:"none", border:"1px solid rgba(255,255,255,.12)", color:"#94a3b8", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", minHeight:36 },

  // Dashboard
  readyBan: { display:"flex", alignItems:"center", gap:8, padding:"10px 16px", background:"linear-gradient(135deg,rgba(245,158,11,.1),rgba(234,179,8,.05))", borderBottom:"1px solid rgba(245,158,11,.2)", cursor:"pointer" },
  alertBar: { padding:"8px 16px", display:"flex", gap:6, flexWrap:"wrap", borderBottom:"1px solid rgba(255,255,255,.04)", background:"rgba(255,255,255,.01)" },
  alertBox: { display:"flex", alignItems:"flex-start", gap:8, padding:12, background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.2)", borderRadius:10, marginBottom:12 },
  pipe: { display:"flex", gap:4, padding:"8px 16px", overflowX:"auto", borderBottom:"1px solid rgba(255,255,255,.04)", WebkitOverflowScrolling:"touch" },
  chip: { display:"flex", alignItems:"center", gap:3, padding:"6px 10px", borderRadius:6, border:"1px solid", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", minHeight:32, whiteSpace:"nowrap" },
  chipN: { fontSize:10, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" },
  sRow: { display:"flex", gap:6, padding:"8px 16px" },
  sInp: { flex:1, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:8, padding:"10px 12px", color:"#e2e8f0", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none" },
  list: { display:"flex", flexDirection:"column", gap:4, padding:"4px 16px" },
  card: { background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:"12px 14px", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif", width:"100%", color:"#e2e8f0", minHeight:44 },
  cTop: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 },
  cName: { fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  cMeta: { display:"flex", gap:8, marginTop:5, fontSize:10, color:"#64748b", fontFamily:"'JetBrains Mono',monospace", flexWrap:"wrap" },
  tBadge: { fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(245,158,11,.15)", color:"#fbbf24", fontWeight:600 },
  empty: { textAlign:"center", padding:50 },

  // Stage bar
  stBar: { display:"flex", gap:3, padding:"8px 16px", overflowX:"auto", WebkitOverflowScrolling:"touch" },
  stStep: { display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 3px", borderRadius:5, flex:1, minWidth:36 },

  // Tabs
  tabR: { display:"flex", gap:0, padding:"0 16px", borderBottom:"2px solid rgba(255,255,255,.08)", overflowX:"auto", WebkitOverflowScrolling:"touch", position:"sticky", top:0, zIndex:99, background:"rgba(11,14,24,.98)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" },
  tabB: { padding:"12px 16px", background:"none", border:"none", borderBottom:"3px solid transparent", color:"#64748b", cursor:"pointer", fontSize:14, fontFamily:"'DM Sans',sans-serif", fontWeight:500, whiteSpace:"nowrap", minHeight:46 },
  tabA: { color:"#e2e8f0", borderBottomColor:"#2563EB", fontWeight:600 },
  cnt: { padding:"12px 16px" },

  // Sections
  sec: { background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:"14px 14px 12px", marginBottom:8 },
  secT: { fontSize:13, fontWeight:600, color:"#f1f5f9", margin:"0 0 10px", lineHeight:1.3 },

  // Form fields
  gr: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:8 },
  fl: { fontSize:10, fontWeight:500, color:"#94a3b8", marginBottom:3, display:"block", textTransform:"uppercase", letterSpacing:".04em" },
  inp: { width:"100%", background:"#1e293b", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, padding:"8px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box", minHeight:38, WebkitAppearance:"none", colorScheme:"dark" },
  ta: { width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, padding:"8px 10px", color:"#e2e8f0", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box", minHeight:44 },
  ck: { fontSize:12, color:"#cbd5e1", cursor:"pointer", display:"flex", alignItems:"center", padding:"4px 0", minHeight:32, gap:0 },
  ckG: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"0px 8px" },

  // Diagnostics
  calc: { marginTop:8, padding:"8px 10px", background:"rgba(255,255,255,.04)", borderRadius:8, fontSize:12, fontFamily:"'JetBrains Mono',monospace", display:"flex", flexWrap:"wrap", gap:4 },
  cazR: { display:"flex", alignItems:"center", gap:6, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,.04)", flexWrap:"wrap" },
  qqR: { display:"flex", alignItems:"center", gap:6, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,.04)", flexWrap:"wrap" },

  // Photos
  phRow: { display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,.04)" },
  cBtn: { width:40, height:40, borderRadius:8, border:"1px dashed rgba(37,99,235,.4)", background:"rgba(37,99,235,.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18 },
  uBtn: { width:40, height:40, borderRadius:8, border:"1px dashed rgba(255,255,255,.15)", background:"rgba(255,255,255,.04)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18 },
  thBtn: { width:44, height:44, borderRadius:8, border:"2px solid #22c55e", padding:0, cursor:"pointer", overflow:"hidden", background:"#000" },
  th: { width:"100%", height:"100%", objectFit:"cover" },
  camOv: { position:"fixed", top:0, left:0, right:0, bottom:0, background:"#000", zIndex:9999, display:"flex", flexDirection:"column", fontFamily:"'DM Sans',sans-serif", color:"#e2e8f0" },
  camH: { display:"flex", alignItems:"center", gap:8, padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,.1)", background:"rgba(0,0,0,.8)" },
  camB: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" },
  vid: { width:"100%", height:"100%", objectFit:"cover" },
  camF: { display:"flex", justifyContent:"center", padding:"20px 16px 36px", background:"rgba(0,0,0,.8)" },
  snapB: { width:68, height:68, borderRadius:"50%", border:"4px solid #fff", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:3 },
  snapI: { width:"100%", height:"100%", borderRadius:"50%", background:"#fff" },

  // Progress
  prog: { width:"100%", height:4, background:"rgba(255,255,255,.06)", borderRadius:2, overflow:"hidden" },
  progF: { height:"100%", background:"#22c55e", borderRadius:2, transition:"width .3s" },

  // Summary
  sumG: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 },
  si: { background:"rgba(255,255,255,.03)", borderRadius:8, padding:"8px 10px", border:"1px solid rgba(255,255,255,.06)", display:"flex", flexDirection:"column" },

  // Log
  logR: { display:"flex", gap:6, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,.04)", alignItems:"baseline", flexWrap:"wrap" },
  logT: { fontSize:10, color:"#64748b", fontFamily:"'JetBrains Mono',monospace", minWidth:80 },
  logB: { fontSize:10, color:"#60A5FA", fontStyle:"italic" },
};

export const globalCSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes coSlide{0%{background-position:0% 50%}100%{background-position:200% 50%}}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}html{color-scheme:dark}body{margin:0}input,select,textarea,button{font-size:16px;color-scheme:dark}select option{background:#1e293b;color:#e2e8f0}

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
`;
