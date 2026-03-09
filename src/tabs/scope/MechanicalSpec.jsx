import React from "react";
import { PROGRAM } from "../../constants/index.js";
import { Sec, Gr, F, Sel, CK, Rec } from "../../components/ui.jsx";
import { S } from "../../styles/index.js";

export function MechanicalSpec({p, u, onLog, s, ss, sn}) {
  return (
    <>
      {/* ══ PAGE 2: HEATING SYSTEM ══ */}
      <Sec title="Heating System Info">
        <Gr>
          <Sel label="Thermostat" value={s.htg?.thermostat||""} onChange={v=>sn("htg","thermostat",v)} opts={["Manual","Programmable","Smart"]}/>
          <Sel label="Fuel Type" value={s.htg?.fuel||""} onChange={v=>sn("htg","fuel",v)} opts={["Natural Gas","Electric","Propane","Oil","Other"]}/>
          <Sel label="System Type" value={s.htg?.system||""} onChange={v=>sn("htg","system",v)} opts={["Forced Air","Boiler","Other"]}/>
          <Sel label="Flue Condition" value={s.htg?.flue||""} onChange={v=>sn("htg","flue",v)} opts={["Good","Average","Poor"]}/>
        </Gr>
        <div style={{marginTop:8}}><Gr>
          <F label="Manufacturer" value={s.htg?.mfg||""} onChange={v=>sn("htg","mfg",v)}/>
          <F label="Install Year" value={s.htg?.year||""} onChange={v=>sn("htg","year",v)} num/>
          <F label="Age" computed={s.htg?.year ? (new Date().getFullYear()-Number(s.htg.year))+" yrs" : "—"}/>
          <F label="Condition" value={s.htg?.condition||""} onChange={v=>sn("htg","condition",v)}/>
        </Gr></div>
        <div style={{marginTop:8}}><Gr>
          <F label="BTU Input" value={s.htg?.btuIn||""} onChange={v=>sn("htg","btuIn",v)} num/>
          <F label="BTU Output" value={s.htg?.btuOut||""} onChange={v=>sn("htg","btuOut",v)} num/>
          <F label="AFUE" computed={s.htg?.btuIn && s.htg?.btuOut ? (Number(s.htg.btuOut)/Number(s.htg.btuIn)*100).toFixed(1)+"%" : "—"} suffix="auto"/>
          <F label="Draft" value={s.htg?.draft||""} onChange={v=>sn("htg","draft",v)} num/>
        </Gr></div>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.htg?.gasShutoff} onChange={v=>sn("htg","gasShutoff",v)} label="Gas Shut Off"/>
          <CK checked={s.htg?.asbestosPipes} onChange={v=>sn("htg","asbestosPipes",v)} label="Pipes Asbestos Wrapped"/>
          <CK checked={s.htg?.replaceRec} onChange={v=>sn("htg","replaceRec",v)} label="Replacement Recommended"/>
          {(()=>{
            const yr = Number(s.htg?.year||0);
            const age = yr ? new Date().getFullYear() - yr : 0;
            const autoOn = age > 3 && s.htg?.fuel==="Natural Gas" && !s.htg?.replaceRec;
            const val = s.htg?.cleanTuneOverride !== undefined ? s.htg.cleanTuneOverride : (autoOn || !!s.htg?.cleanTune);
            return <div style={{display:"flex",alignItems:"center",gap:4}}>
              <CK checked={val} onChange={v=>{u({scope2026:{...s,htg:{...(s.htg||{}),cleanTune:v,cleanTuneOverride:v}}});}} label="Clean & Tune"/>
              {autoOn && s.htg?.cleanTuneOverride===undefined && <span style={{fontSize:8,color:"#60A5FA"}}>auto</span>}
              {s.htg?.cleanTuneOverride!==undefined && autoOn && <span style={{fontSize:8,color:"#60A5FA",cursor:"pointer",textDecoration:"underline"}} onClick={()=>{u({scope2026:{...s,htg:{...(s.htg||{}),cleanTuneOverride:undefined,cleanTune:true}}});}}>↻ auto</span>}
            </div>;
          })()}
        </div>
        <textarea style={{...S.ta,marginTop:8}} value={s.htg?.notes||""} onChange={e=>sn("htg","notes",e.target.value)} rows={2} placeholder="Heating notes…"/>
        {(()=>{
          const recs = [];
          const afue = s.htg?.btuIn && s.htg?.btuOut ? Number(s.htg.btuOut)/Number(s.htg.btuIn)*100 : null;
          const fuel = s.htg?.fuel; const sys = s.htg?.system;
          if(fuel==="Electric") recs.push({t:"rec",m:"Electric resistance heat → eligible for heat pump replacement regardless of age/condition (ComEd)."});
          if(afue && afue < PROGRAM.furnaceMinAFUE && fuel==="Natural Gas") recs.push({t:"info",m:`AFUE ${afue.toFixed(1)}% — below ${PROGRAM.furnaceMinAFUE}% min for new furnace. Replacement only if failed/H&S risk and repair >$${PROGRAM.furnaceRepairCap}.`});
          if(afue && afue >= PROGRAM.furnaceMinAFUE) recs.push({t:"rec",m:`AFUE ${afue.toFixed(1)}% meets ≥${PROGRAM.furnaceMinAFUE}% program standard.`});
          if(sys==="Boiler" && afue && afue < PROGRAM.boilerMinAFUE) recs.push({t:"info",m:`Boiler AFUE ${afue.toFixed(1)}% — new boiler must be ≥${PROGRAM.boilerMinAFUE}%. Emergency replacement only.`});
          const furnAge = Number(s.htg?.year||0) ? new Date().getFullYear() - Number(s.htg.year) : 0;
          if(furnAge > 3 && fuel==="Natural Gas" && !s.htg?.replaceRec) recs.push({t:"rec",m:`Furnace is ${furnAge} yrs old (>3 yrs) → Clean & Tune auto-selected per program rules.`});
          if(s.htg?.cleanTune && fuel==="Natural Gas") recs.push({t:"info",m:`Furnace tune-up: must not have had tune-up within last 3 years.`});
          if(s.htg?.replaceRec && sys==="Boiler") recs.push({t:"rec",m:"System is Boiler → Boiler Replacement will be auto-selected in measures (not Furnace Replacement)."});
          if(s.htg?.replaceRec && sys!=="Boiler") recs.push({t:"rec",m:"System is Forced Air → Furnace Replacement will be auto-selected in measures. New furnace must be ≥95% AFUE."});
          if(sys==="Boiler" && p.measures.includes("Furnace Replacement")) recs.push({t:"flag",m:"⚠ Furnace Replacement is checked but system is Boiler — should be Boiler Replacement."});
          if(sys!=="Boiler" && sys && p.measures.includes("Boiler Replacement")) recs.push({t:"flag",m:"⚠ Boiler Replacement is checked but system is not a Boiler — should be Furnace Replacement."});
          return recs.map((r,i)=><Rec key={i} type={r.t}>{r.m}</Rec>);
        })()}
      </Sec>

      {/* ══ PAGE 2: COOLING SYSTEM ══ */}
      <Sec title="Cooling System Info">
        <Gr>
          <Sel label="Type" value={s.clg?.type||""} onChange={v=>sn("clg","type",v)} opts={["Central Air","Window Units","Mini Split","Heat Pump","None"]}/>
          <F label="Manufacturer" value={s.clg?.mfg||""} onChange={v=>sn("clg","mfg",v)}/>
          <F label="Install Year" value={s.clg?.year||""} onChange={v=>sn("clg","year",v)} num/>
          <F label="Age" computed={s.clg?.year ? (new Date().getFullYear()-Number(s.clg.year))+" yrs" : (s.clg?.age ? s.clg.age+" yrs" : "—")}/>
          <F label="SEER" value={s.clg?.seer||""} onChange={v=>sn("clg","seer",v)} num/>
          <F label="Condition" value={s.clg?.condition||""} onChange={v=>sn("clg","condition",v)}/>
          <Sel label="BTU Size" value={s.clg?.btu||""} onChange={v=>sn("clg","btu",v)} opts={["2 Ton (24k)","2.5 Ton (30k)","3 Ton (36k)","3.5 Ton (42k)"]}/>
        </Gr>
        <div style={{marginTop:6}}><CK checked={s.clg?.replaceRec} onChange={v=>sn("clg","replaceRec",v)} label="Replacement Recommended"/></div>
        {s.clg?.replaceRec && <div style={{marginTop:4}}><F label="Reason" value={s.clg?.replaceReason||""} onChange={v=>sn("clg","replaceReason",v)}/></div>}
      </Sec>

      {/* ══ PAGE 2: DOMESTIC HOT WATER ══ */}
      <Sec title="Domestic Hot Water Info">
        <Gr>
          <Sel label="Fuel" value={s.dhw?.fuel||""} onChange={v=>sn("dhw","fuel",v)} opts={["Natural Gas","Electric","Propane","Other"]}/>
          <Sel label="System Type" value={s.dhw?.system||""} onChange={v=>sn("dhw","system",v)} opts={["On Demand","Storage Tank","Indirect","Heat Pump","Other"]}/>
          <F label="Manufacturer" value={s.dhw?.mfg||""} onChange={v=>sn("dhw","mfg",v)}/>
          <F label="Install Year" value={s.dhw?.year||""} onChange={v=>sn("dhw","year",v)} num/>
          <F label="Age" computed={s.dhw?.year ? (new Date().getFullYear()-Number(s.dhw.year))+" yrs" : (s.dhw?.age ? s.dhw.age+" yrs" : "—")}/>
          <F label="Condition" value={s.dhw?.condition||""} onChange={v=>sn("dhw","condition",v)}/>
          <F label="Input BTU" value={s.dhw?.btuIn||""} onChange={v=>sn("dhw","btuIn",v)} num/>
          {(()=>{
            const key = `${s.dhw?.fuel||""}|${s.dhw?.system||""}`;
            const eff = PROGRAM.dhwEff[key];
            const btuIn = Number(s.dhw?.btuIn);
            const autoOut = eff && btuIn ? Math.round(btuIn * eff / 100) : null;
            return <>
              <F label="Output BTU" computed={autoOut ? autoOut.toLocaleString() : "—"} suffix={eff ? `${eff}% avg` : "select fuel+type"}/>
              <F label="Efficiency" computed={eff ? eff+"%" : "—"} suffix={eff ? `${s.dhw?.fuel} ${s.dhw?.system}` : "auto"}/>
            </>;
          })()}
        </Gr>
        {(()=>{
          const recs = [];
          const fuel = s.dhw?.fuel; const sys = s.dhw?.system;
          if(fuel==="Electric" && sys!=="Heat Pump") recs.push({t:"rec",m:"Electric resistance → eligible for Heat Pump WH replacement regardless of age/condition (ComEd). Must be Energy Star rated."});
          if(fuel==="Electric" && sys==="Heat Pump") recs.push({t:"info",m:"Heat Pump WH already installed — no replacement needed."});
          const key = `${fuel||""}|${sys||""}`;
          const eff = PROGRAM.dhwEff[key];
          if(fuel==="Natural Gas" && eff && eff/100 < PROGRAM.dhwMinEF) recs.push({t:"warn",m:`Avg efficiency ${eff}% (EF ~${(eff/100).toFixed(2)}) is below program minimum EF ≥0.67. If failed/H&S risk and repair >$650 → eligible for replacement.`});
          if(fuel==="Natural Gas" && eff && eff/100 >= PROGRAM.dhwMinEF) recs.push({t:"info",m:`Avg efficiency meets program minimum EF ≥0.67. Replacement only if failed/H&S and repair >$650.`});
          return recs.map((r,i)=><Rec key={i} type={r.t}>{r.m}</Rec>);
        })()}
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.dhw?.insulPipes} onChange={v=>sn("dhw","insulPipes",v)} label="Insulated Pipes"/>
          <CK checked={s.dhw?.flueRepair} onChange={v=>sn("dhw","flueRepair",v)} label="Flue Repair Needed"/>
          <CK checked={s.dhw?.replaceRec} onChange={v=>sn("dhw","replaceRec",v)} label="Replacement Recommended"/>
          <CK checked={s.dhw?.ductsSealed} onChange={v=>sn("dhw","ductsSealed",v)} label="Ducts Need Sealing"/>
        </div>
        {s.dhw?.replaceRec && <div style={{marginTop:6}}><F label="Reason" value={s.dhw?.replaceReason||""} onChange={v=>sn("dhw","replaceReason",v)}/></div>}
      </Sec>
    </>
  );
}
