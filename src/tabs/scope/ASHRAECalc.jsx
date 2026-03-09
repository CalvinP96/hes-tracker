import React from "react";
import { PROGRAM } from "../../constants/index.js";
import { Sec, Rec } from "../../components/ui.jsx";

export function ASHRAECalc({p, u, onLog, s, sn}) {
  return (
    <Sec title="ASHRAE 62.2-2016 Ventilation">
      {(() => {
        const a = p.audit || {};
        const baseSqft = Number(p.sqft) || 0;
        const finBasement = s.fnd?.type === "Finished" ? (Number(s.fnd?.aboveSqft)||0) + (Number(s.fnd?.belowSqft)||0) : 0;
        const Afl = baseSqft + finBasement;
        const Nbr = Number(s.bedrooms) || 0;
        const preQ50 = Number(p.preCFM50) || 0;
        const sqft = Number(p.sqft) || 0;
        const canAirSeal = s.ashrae?.canAirSeal !== undefined ? s.ashrae.canAirSeal : (preQ50 > 0 && sqft > 0 && preQ50 >= sqft * PROGRAM.airSealMinCFM50pct);
        const Q50 = canAirSeal ? Math.round(preQ50 * (1 - PROGRAM.airSealGoal / 100)) : preQ50;
        const st = Number(p.stories) || 1;
        const H = st >= 2 ? 16 : st >= 1.5 ? 14 : 8;
        const Hr = 8.202;
        const wsf = 0.56;

        // Fan flows from assessment, overridable
        // Raw values to check presence (blank = no fan = no requirement)
        const kRaw = s.ashrae?.kitchenCFM ?? a.kitchenFan ?? "";
        const b1Raw = s.ashrae?.bath1CFM ?? a.bathFan1 ?? "";
        const b2Raw = s.ashrae?.bath2CFM ?? a.bathFan2 ?? "";
        const b3Raw = s.ashrae?.bath3CFM ?? a.bathFan3 ?? "";
        const kPresent = String(kRaw).trim() !== "";
        const b1Present = String(b1Raw).trim() !== "";
        const b2Present = String(b2Raw).trim() !== "";
        const b3Present = String(b3Raw).trim() !== "";
        const kCFM = Number(kRaw) || 0;
        const b1 = Number(b1Raw) || 0;
        const b2 = Number(b2Raw) || 0;
        const b3 = Number(b3Raw) || 0;
        const kWin = s.ashrae?.kWin || false;
        const b1Win = s.ashrae?.b1Win || false;
        const b2Win = s.ashrae?.b2Win || false;
        const b3Win = s.ashrae?.b3Win || false;

        /* ══ ASHRAE 62.2-2016 CALCULATIONS ══
           Section 4.1.1 — Total Required Ventilation Rate
           Qtot = 0.03 × Afl + 7.5 × (Nbr + 1)
           (Nbr = number of bedrooms, Nocc = Nbr + 1)

           Infiltration Credit
           Qinf = 0.052 × Q50 × wsf × (H / 8.2)^0.4

           Local Ventilation — Alternative Compliance:
           Intermittent exhaust rates: Kitchen 100 CFM, Bath 50 CFM
           Deficit = max(0, required - measured). Window = 20 CFM credit.
           Blank = no fan = no requirement.
           Alternative compliance supplement = totalDeficit × 0.25
           (converts intermittent deficit to continuous equivalent)

           Qfan = Qtot + supplement - Qinf
        */

        // Infiltration credit
        const Qinf_eff = Q50 > 0 ? 0.052 * Q50 * wsf * Math.pow(H / 8.2, 0.4) : 0;

        // Qtot (Eq 4.1a)
        const Qtot = (Afl > 0) ? 0.03 * Afl + 7.5 * (Nbr + 1) : 0;

        // Local ventilation deficits — Alternative Compliance
        // Intermittent rates: Kitchen 100 CFM, Bath 50 CFM
        // Window = 20 CFM credit. Blank = no fan = no requirement.
        const kReq = kPresent ? 100 : 0;
        const b1Req = b1Present ? 50 : 0;
        const b2Req = b2Present ? 50 : 0;
        const b3Req = b3Present ? 50 : 0;
        const kDef = !kPresent ? 0 : Math.max(0, kReq - (kWin ? 20 : kCFM));
        const b1Def = !b1Present ? 0 : Math.max(0, b1Req - (b1Win ? 20 : b1));
        const b2Def = !b2Present ? 0 : Math.max(0, b2Req - (b2Win ? 20 : b2));
        const b3Def = !b3Present ? 0 : Math.max(0, b3Req - (b3Win ? 20 : b3));
        const totalDef = kDef + b1Def + b2Def + b3Def;

        // Alternative compliance supplement (intermittent → continuous: ×0.25)
        const supplement = totalDef * 0.25;

        // Infiltration credit — existing: FULL credit
        const Qinf_credit = Qinf_eff;

        // Required mechanical ventilation rate
        const Qfan = Qtot + supplement - Qinf_credit;

        // Fan setting selector (continuous run: 50 / 80 / 110 CFM)
        const FAN_SETTINGS = [50, 80, 110];
        const recFan = FAN_SETTINGS.find(f => f >= Qfan) || FAN_SETTINGS[FAN_SETTINGS.length - 1];

        const R = v => Math.round(v * 100) / 100;
        const Ri = v => Math.round(v);

        // Styles
        const hdr = {fontSize:13,fontWeight:700,color:"#60A5FA",margin:"14px 0 6px",borderBottom:"1px solid rgba(37,99,235,.25)",paddingBottom:4};
        const row = {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",fontSize:12,borderBottom:"1px solid rgba(255,255,255,.04)"};
        const lbl = {color:"#94a3b8",flex:1};
        const val = {fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#e2e8f0",textAlign:"right"};
        const eq = {fontSize:10,color:"#475569",padding:"1px 0 5px 12px",fontFamily:"'JetBrains Mono',monospace",borderLeft:"2px solid rgba(37,99,235,.15)"};
        const autoBox = {background:"rgba(37,99,235,.06)",borderRadius:6,padding:"6px 10px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,fontSize:13,color:"#e2e8f0",textAlign:"center"};
        const autoSub = {fontSize:9,color:"#64748b",textAlign:"center",marginTop:2};
        const resultBox = {background:"rgba(37,99,235,.08)",border:"2px solid rgba(37,99,235,.3)",borderRadius:8,padding:12,marginTop:8};
        const solverBox = (c) => ({background:`rgba(${c},.04)`,border:`1px solid rgba(${c},.2)`,borderRadius:8,padding:10,marginTop:10});
        const { S } = require("../../styles/index.js");

        return (
          <div>
            {/* ══ CONFIGURATION ══ */}
            <div style={hdr}>Configuration</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 16px",fontSize:12}}>
              <div style={row}><span style={lbl}>Construction</span><span style={val}>Existing</span></div>
              <div style={row}><span style={lbl}>Dwelling unit</span><span style={val}>Detached</span></div>
              <div style={row}><span style={lbl}>Infiltration credit</span><span style={val}>Yes</span></div>
              <div style={row}><span style={lbl}>Alt. compliance</span><span style={val}>Yes</span></div>
              <div style={row}><span style={lbl}>Weather station</span><span style={val}>Chicago Midway AP</span></div>
              <div style={row}><span style={lbl}>wsf [1/hr]</span><span style={{...val,color:"#60A5FA"}}>{wsf}</span></div>
            </div>

            {/* ══ BUILDING INPUTS ══ */}
            <div style={hdr}>Building Inputs</div>
            <div className="ashrae-inputs" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Floor area [ft²]</div><div style={autoBox}>{Afl||"—"}</div><div style={autoSub}>{finBasement > 0 ? `${baseSqft} + ${finBasement} fin. bsmt` : "← Sq Footage"}</div></div>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Nocc (occupants)</div><div style={autoBox}>{Nbr + 1}</div><div style={autoSub}>{Nbr} bedrooms + 1 = {Nbr + 1}</div></div>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Height [ft]</div><div style={autoBox}>{H}</div><div style={autoSub}>{st>=2?"2-story":"1"+(st>=1.5?".5":"")+"-story"}</div></div>
              <div><div style={{fontSize:10,color:"#94a3b8",marginBottom:3}}>Q50 [CFM] — est. post</div><div style={{...autoBox,color:canAirSeal?"#f59e0b":"#e2e8f0"}}>{Q50||"—"}</div><div style={autoSub}>{canAirSeal ? `${preQ50} × 0.75 (25% reduction)` : `${preQ50} (no air seal)`}</div>
                <label style={{display:"flex",alignItems:"center",gap:4,marginTop:4,fontSize:10,color:canAirSeal?"#f59e0b":"#64748b",cursor:"pointer",justifyContent:"center"}}>
                  <input type="checkbox" checked={!!canAirSeal} onChange={e=>sn("ashrae","canAirSeal",e.target.checked)} style={{accentColor:"#2563EB",width:13,height:13}}/>
                  Air seal eligible
                </label>
              </div>
            </div>

            {/* ══ LOCAL VENTILATION ══ */}
            <div style={hdr}>Local Ventilation — Alternative Compliance</div>
            <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>Blank = no fan = no requirement. Openable window = 20 CFM credit. Kitchen: 100 CFM · Bath: 50 CFM (intermittent rates)</div>
            <div style={{fontSize:9,color:"#f59e0b",marginBottom:6}}>⚠ If a fan is present but not operational or CFM is unknown, enter 0.</div>
            <div className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",fontSize:11,alignItems:"center"}}>
              <span style={{fontWeight:600,color:"#64748b"}}></span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Fan Flow [CFM]</span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center",fontSize:9}}>Window</span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Req'd</span>
              <span style={{fontWeight:600,color:"#64748b",textAlign:"center"}}>Deficit</span>
            </div>
            {[
              {n:"Kitchen",v:kCFM,k:"kitchenCFM",ak:"kitchenFan",w:kWin,wk:"kWin",r:kReq,d:kDef,present:kPresent},
              {n:"Bath #1",v:b1,k:"bath1CFM",ak:"bathFan1",w:b1Win,wk:"b1Win",r:b1Req,d:b1Def,present:b1Present},
              {n:"Bath #2",v:b2,k:"bath2CFM",ak:"bathFan2",w:b2Win,wk:"b2Win",r:b2Req,d:b2Def,present:b2Present},
              {n:"Bath #3",v:b3,k:"bath3CFM",ak:"bathFan3",w:b3Win,wk:"b3Win",r:b3Req,d:b3Def,present:b3Present},
            ].map(f=>(
              <div key={f.n} className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",alignItems:"center",marginBottom:2}}>
                <span style={{fontSize:12,color:"#cbd5e1"}}>{f.n}</span>
                <input style={{...S.inp,textAlign:"center",fontSize:12}} value={s.ashrae?.[f.k]??a[f.ak]??""} onChange={e=>sn("ashrae",f.k,e.target.value)} placeholder="blank = none"/>
                <div style={{textAlign:"center"}}><input type="checkbox" checked={f.w} onChange={e=>sn("ashrae",f.wk,e.target.checked)} style={{accentColor:"#60A5FA"}}/></div>
                <div style={{textAlign:"center",fontSize:11,color:f.present?"#64748b":"#475569"}}>{f.present?f.r:"—"}</div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:!f.present?"#475569":f.d>0?"#f59e0b":"#22c55e"}}>{f.present?f.d:"—"}</div>
              </div>
            ))}
            <div className="ashrae-grid" style={{display:"grid",gridTemplateColumns:"80px 1fr 60px 50px 55px",gap:"2px 6px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:4,marginTop:4}}>
              <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0"}}>Total</span>
              <span></span><span></span><span></span>
              <div style={{textAlign:"center",fontSize:14,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:totalDef>0?"#f59e0b":"#22c55e"}}>{Ri(totalDef)}</div>
            </div>

            {/* ══ RESULTS ══ */}
            <div style={resultBox}>
              <div style={{fontSize:13,fontWeight:700,color:"#3B82F6",marginBottom:4}}>Dwelling-Unit Ventilation Results</div>
              <div style={{fontSize:9,color:canAirSeal?"#f59e0b":"#64748b",marginBottom:8}}>Using {canAirSeal ? `estimated post Q50: ${preQ50} × 0.75 = ${Q50} CFM` : `pre-work Q50: ${preQ50} CFM (no air seal)`}</div>

              <div style={row}><span style={lbl}>Infiltration credit, Qinf [CFM]</span><span style={val}>{R(Qinf_eff)}</span></div>
              <div style={eq}>= 0.052 × Q50 × wsf × (H / 8.2)^0.4<br/>= 0.052 × {Q50} × {wsf} × ({H} / 8.2)^0.4</div>

              <div style={row}><span style={lbl}>Total required ventilation rate, Qtot [CFM]</span><span style={val}>{R(Qtot)}</span></div>
              <div style={eq}>= 0.03 × Afl + 7.5 × (Nbr + 1)<br/>= 0.03 × {Afl} + 7.5 × ({Nbr} + 1)<br/>= {R(0.03*Afl)} + {R(7.5*(Nbr+1))}</div>

              <div style={row}><span style={lbl}>Total local ventilation deficit [CFM]</span><span style={val}>{Ri(totalDef)}</span></div>
              <div style={eq}>= Σ max(0, req − measured) per fan<br/>Kitchen {kReq} − {kCFM} = {kDef} · Bath1 {b1Req} − {b1} = {b1Def} · Bath2 {b2Req} − {b2} = {b2Def} · Bath3 {b3Req} − {b3} = {b3Def}</div>

              <div style={row}><span style={lbl}>Alternative compliance supplement [CFM]</span><span style={val}>{R(supplement)}</span></div>
              <div style={eq}>= totalDeficit × 0.25 (intermittent → continuous)<br/>= {Ri(totalDef)} × 0.25</div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0 4px",borderTop:"2px solid rgba(37,99,235,.4)",marginTop:8}}>
                <span style={{fontWeight:700,color:"#e2e8f0",fontSize:13}}>Required mech. ventilation, Qfan [CFM]</span>
                <span style={{fontWeight:800,color:Qfan < PROGRAM.fanMinCFM ? "#22c55e" : "#3B82F6",fontSize:18,fontFamily:"'JetBrains Mono',monospace"}}>{R(Qfan)}</span>
              </div>
              <div style={eq}>= Qtot + supplement − Qinf<br/>= {R(Qtot)} + {R(supplement)} − {R(Qinf_credit)}</div>
              {Qfan < PROGRAM.fanMinCFM && <div style={{marginTop:6,padding:"8px 12px",background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.3)",borderRadius:6,fontSize:12,color:"#22c55e",fontWeight:600}}>✓ Qfan below {PROGRAM.fanMinCFM} CFM — no mechanical ventilation fan required</div>}
            </div>

            {/* ══ DWELLING-UNIT VENTILATION RUN-TIME SOLVER ══ */}
            {Qfan >= PROGRAM.fanMinCFM && <div style={solverBox("37,99,235")}>
              <div style={{fontSize:12,fontWeight:700,color:"#60A5FA",marginBottom:6}}>Dwelling-Unit Ventilation Run-Time Solver</div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:8}}>Select fan setting. Recommended = lowest setting ≥ Qfan ({R(Qfan)} CFM). All fans run continuous.</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {FAN_SETTINGS.map(cfm => {
                  const meets = cfm >= Qfan && Qfan > 0;
                  const isRec = cfm === recFan && Qfan > 0;
                  const sel = Number(s.ashrae?.fanSetting) === cfm;
                  return <button key={cfm} type="button" onClick={()=>sn("ashrae","fanSetting",cfm)} style={{
                    flex:1,padding:"10px 8px",borderRadius:8,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                    border:sel?`2px solid ${isRec?"#22c55e":"#60A5FA"}`:`1px solid ${meets?"rgba(34,197,94,.3)":"rgba(255,255,255,.1)"}`,
                    background:sel?(isRec?"rgba(34,197,94,.15)":"rgba(37,99,235,.15)"):"rgba(255,255,255,.03)",
                    color:sel?(isRec?"#22c55e":"#93C5FD"):meets?"#86efac":"#64748b",textAlign:"center"
                  }}>
                    <div style={{fontSize:18,fontWeight:700}}>{cfm}</div>
                    <div style={{fontSize:10}}>CFM</div>
                    {isRec && <div style={{fontSize:9,marginTop:2,color:"#22c55e",fontWeight:600}}>✓ REC</div>}
                    {!meets && Qfan > 0 && <div style={{fontSize:9,marginTop:2,color:"#ef4444"}}>Below Qfan</div>}
                  </button>;
                })}
              </div>
              {Number(s.ashrae?.fanSetting) > 0 && Qfan > 0 && (() => {
                const fan = Number(s.ashrae.fanSetting);
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
                  <div style={eq}>= Qfan ÷ fan capacity × 60<br/>= {R(Qfan)} ÷ {fan} × 60 = {minPerHr} min/hr</div>
                  <div style={{marginTop:6,fontSize:10,color:fan >= Qfan ? "#22c55e" : "#f59e0b",fontWeight:600}}>
                    {fan >= Qfan ? `✓ Continuous (60 min/hr) exceeds minimum ${minPerHr} min/hr` : `⚠ Fan setting below Qfan — does not meet requirement`}
                  </div>
                </div>;
              })()}
            </div>}

            <p style={{fontSize:9,color:"#475569",marginTop:10,textAlign:"right"}}>ASHRAE 62.2-2016 · Local Ventilation Alternative Compliance · basc.pnnl.gov/redcalc</p>
          </div>
        );
      })()}
    </Sec>
  );
}
