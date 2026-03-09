import React from "react";
import { EE_MEASURES, HS_MEASURES, PROGRAM } from "../../constants/index.js";
import { Sec, Gr, F, CK } from "../../components/ui.jsx";
import { getResolvedQty, measUnit } from "../../helpers/index.js";
import { S } from "../../styles/index.js";

export function MeasureBuilder({p, u, onLog, s, ss}) {
  const tog = (list, m) => {
    const l = p[list].includes(m) ? p[list].filter(x=>x!==m) : [...p[list],m];
    u({[list]:l});
  };

  // EE Measures section
  const EEMeasuresContent = (() => {
    const aq = {};
    const atticAdd = Number(s.attic?.addR||0);
    const atticPre = Number(s.attic?.preR||0);
    if(atticAdd > 0 && s.attic?.sqft) {
      if(atticPre <= 11) aq["Attic Insulation (0-R11)"] = Number(s.attic.sqft);
      else if(atticPre <= 19) aq["Attic Insulation (R12-19)"] = Number(s.attic.sqft);
    }
    if(Number(s.fnd?.addR||0) > 0 || (s.fnd?.preR!==undefined && Number(s.fnd.preR||0)===0 && (Number(s.fnd?.aboveSqft||0)+Number(s.fnd?.belowSqft||0))>0)) {
      const bsmt = (Number(s.fnd?.aboveSqft||0)+Number(s.fnd?.belowSqft||0));
      if(bsmt>0) aq["Basement Wall Insulation"] = bsmt;
    }
    if(s.fnd?.crawlR!==undefined && Number(s.fnd.crawlR||0)===0) {
      const crawl = (Number(s.fnd?.crawlAbove||0)+Number(s.fnd?.crawlBelow||0));
      if(crawl>0) aq["Crawl Space Wall Insulation"] = crawl;
    }
    if(Number(s.kneeWall?.addR||0) > 0 && s.kneeWall?.sqft) aq["Knee Wall Insulation"] = Number(s.kneeWall.sqft);
    const w1net = Number(s.extWall1?.addR||0) > 0 && s.extWall1?.sqft ? Math.round(Number(s.extWall1.sqft)*0.84) : 0;
    const w2net = Number(s.extWall2?.addR||0) > 0 && s.extWall2?.sqft ? Math.round(Number(s.extWall2.sqft)*0.86) : 0;
    if(w1net+w2net>0) aq["Injection Foam Walls"] = w1net+w2net;
    if(s.fnd?.bandAccess && Number(s.fnd?.bandR||0)===0 && s.fnd?.bandLnft) aq["Rim Joist Insulation"] = Number(s.fnd.bandLnft);
    if(s.fnd?.crawlBandAccess && Number(s.fnd?.crawlBandR||0)===0 && s.fnd?.crawlBandLnft) {
      aq["Rim Joist Insulation"] = (aq["Rim Joist Insulation"]||0) + Number(s.fnd.crawlBandLnft);
    }
    if(Number(s.collar?.addR||0) > 0 && s.collar?.sqft) aq["Attic Insulation (R12-19)"] = (aq["Attic Insulation (R12-19)"]||0) + Number(s.collar.sqft);
    if(Number(s.outerCeiling?.addR||0) > 0 && s.outerCeiling?.sqft) aq["Attic Insulation (R12-19)"] = (aq["Attic Insulation (R12-19)"]||0) + Number(s.outerCeiling.sqft);
    // Mechanicals = 1 each
    if(s.htg?.replaceRec) aq[s.htg?.system==="Boiler"?"Boiler Replacement":"Furnace Replacement"] = 1;
    if(s.dhw?.replaceRec) aq["Water Heater Replacement"] = 1;
    if(s.clg?.replaceRec) aq["Central AC Replacement"] = 1;
    const ctVal = s.htg?.cleanTuneOverride!==undefined ? s.htg.cleanTuneOverride : (s.htg?.cleanTune || (Number(s.htg?.year||0) && (new Date().getFullYear()-Number(s.htg.year))>3 && s.htg?.fuel==="Natural Gas" && !s.htg?.replaceRec));
    if(ctVal) aq["Furnace Tune-Up"] = 1;
    aq["Air Sealing"] = 1;

    const mq = p.measureQty || {};
    const mu = p.measureUnchecked || {};
    const setQ = (m,v) => u({measureQty:{...mq,[m]:v}});
    const getQ = (m) => mq[m] !== undefined ? mq[m] : (aq[m] !== undefined ? String(aq[m]) : "");
    const isAuto = (m) => mq[m] === undefined && aq[m] !== undefined;
    const unit = (m) => {
      if(m.includes("Insulation") && !m.includes("Rim")) return "sqft";
      if(m.includes("Rim Joist")) return "lnft";
      if(m.includes("Foam Walls")) return "sqft";
      return "ea";
    };

    return <div style={{display:"grid",gap:4}}>
      {EE_MEASURES.map(m => {
        const inList = p.measures.includes(m);
        const autoOn = aq[m] !== undefined && !mu[m];
        const checked = inList || autoOn;
        const q = getQ(m);
        const autoQty = isAuto(m);
        const togM = () => {
          if(checked && autoOn && !inList) { u({measureUnchecked:{...mu,[m]:true}}); }
          else if(checked && inList && autoOn) { tog("measures",m); u({measureUnchecked:{...mu,[m]:true}}); }
          else if(checked && inList && !autoOn) { tog("measures",m); }
          else { const nu={...mu}; delete nu[m]; u({measureUnchecked:nu}); if(!inList) tog("measures",m); }
        };
        return <div key={m} style={{display:"flex",alignItems:"center",gap:6}}>
          <CK checked={checked} onChange={togM} label={m} color={checked?"#22c55e":null}/>
          {checked && !inList && autoOn && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
          {checked && <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
            <input style={{...S.inp,width:70,textAlign:"center",fontSize:11,background:autoQty?"rgba(37,99,235,.08)":"",color:autoQty?"#93C5FD":""}} inputMode="decimal" value={q} onChange={e=>{const v=e.target.value;if(v===""||/^-?\d*\.?\d*$/.test(v))setQ(m,v);}} placeholder="qty"/>
            <span style={{fontSize:9,color:"#64748b",minWidth:28}}>{unit(m)}</span>
            {autoQty && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
            {!autoQty && aq[m]!==undefined && <span style={{fontSize:8,color:"#60A5FA",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{const nq={...mq};delete nq[m];u({measureQty:nq});}} title="Reset to auto-calculated value">↻ auto</span>}
          </div>}
        </div>;
      })}
    </div>;
  })();

  // H&S Measures section
  const HSMeasuresContent = (() => {
    const aq = {};
    if(s.coNeeded && Number(s.coNeeded)>0) aq["CO Detector (Hardwired)"] = Number(s.coNeeded);
    if(s.smokeNeeded && Number(s.smokeNeeded)>0) aq["Smoke Detector (Hardwired)"] = Number(s.smokeNeeded);
    if(s.doorSweeps && Number(s.doorSweeps)>0) aq["Door Sweeps"] = Number(s.doorSweeps);

    if(s.dhw?.flueRepair) aq["Flue Repairs"] = 1;

    const mq = p.measureQty || {};
    const mu = p.hsUnchecked || {};
    const setQ = (m,v) => u({measureQty:{...mq,[m]:v}});
    const getQ = (m) => mq[m] !== undefined ? mq[m] : (aq[m] !== undefined ? String(aq[m]) : "");
    const isAuto = (m) => mq[m] === undefined && aq[m] !== undefined;

    return <div style={{display:"grid",gap:4}}>
      {HS_MEASURES.map(m => {
        const inList = p.healthSafety.includes(m);
        const autoOn = aq[m] !== undefined && !mu[m];
        const checked = inList || autoOn;
        const q = getQ(m);
        const autoQty = isAuto(m);
        const togM = () => {
          if(checked && autoOn && !inList) { u({hsUnchecked:{...mu,[m]:true}}); }
          else if(checked && inList && autoOn) { tog("healthSafety",m); u({hsUnchecked:{...mu,[m]:true}}); }
          else if(checked && inList && !autoOn) { tog("healthSafety",m); }
          else { const nu={...mu}; delete nu[m]; u({hsUnchecked:nu}); if(!inList) tog("healthSafety",m); }
        };
        return <div key={m} style={{display:"flex",alignItems:"center",gap:6}}>
          <CK checked={checked} onChange={togM} label={m} color={checked?"#f59e0b":null}/>
          {checked && !inList && autoOn && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
          {checked && <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:"auto"}}>
            <input style={{...S.inp,width:70,textAlign:"center",fontSize:11,background:autoQty?"rgba(37,99,235,.08)":"",color:autoQty?"#93C5FD":""}} inputMode="decimal" value={q} onChange={e=>{const v=e.target.value;if(v===""||/^-?\d*\.?\d*$/.test(v))setQ(m,v);}} placeholder="qty"/>
            <span style={{fontSize:9,color:"#64748b",minWidth:20}}>ea</span>
            {autoQty && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
            {!autoQty && aq[m]!==undefined && <span style={{fontSize:8,color:"#60A5FA",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{const nq={...mq};delete nq[m];u({measureQty:nq});}} title="Reset to auto-calculated value">↻ auto</span>}
          </div>}
        </div>;
      })}
    </div>;
  })();

  return (
    <>
      <Sec title={`Energy Efficiency Measures (${p.measures.length})`}>
        {EEMeasuresContent}
      </Sec>

      <Sec title={`Health & Safety Measures (${p.healthSafety.length})`}>
        {HSMeasuresContent}
      </Sec>

      <Sec title="Notes on Work">
        <textarea style={S.ta} value={p.measureNotes} onChange={e=>u({measureNotes:e.target.value})} rows={2} placeholder="Notes on work to be performed…"/>
      </Sec>

      <Sec title="Notes on Health & Safety">
        <textarea style={S.ta} value={s.hsNotes||""} onChange={e=>ss("hsNotes",e.target.value)} rows={2} placeholder="H&S notes…"/>
      </Sec>

      <Sec title="Insulation Quantities">
        <Gr>{["Attic (0-R11)","Attic (R12-19)","Basement Wall","Crawl Space Wall","Knee Wall","Floor Above Crawl","Rim Joist","Injection Foam Walls"].map(m =>
          <F key={m} label={`${m} ${m.includes("Rim Joist")?"LnFt":"SqFt"}`} value={s.insulQty?.[m]||""} onChange={v=>ss("insulQty",{...(s.insulQty||{}),[m]:v})}/>
        )}</Gr>
        <textarea style={{...S.ta,marginTop:6}} value={s.insulNotes||""} onChange={e=>ss("insulNotes",e.target.value)} rows={2} placeholder="Insulation notes…"/>
      </Sec>
    </>
  );
}
