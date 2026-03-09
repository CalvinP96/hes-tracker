import React from "react";
import { Sec, Gr, F, Sel, CK, Rec, InsulRec } from "../../components/ui.jsx";
import { S } from "../../styles/index.js";

export function InsulationSpec({p, u, onLog, s, ss, sn}) {
  return (
    <>
      {/* ══ PAGE 4: ATTIC ══ */}
      <Sec title="Attic">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0px 8px",marginBottom:8}}>
          <CK checked={s.attic?.finished} onChange={v=>sn("attic","finished",v)} label="Finished"/>
          <CK checked={s.attic?.unfinished} onChange={v=>sn("attic","unfinished",v)} label="Unfinished"/>
          <CK checked={s.attic?.flat} onChange={v=>sn("attic","flat",v)} label="Flat"/>
        </div>
        <Gr><F label="Sq Footage" value={s.attic?.sqft||""} onChange={v=>sn("attic","sqft",v)} num/><F label="Existing R-Value" value={s.attic?.preR||""} onChange={v=>sn("attic","preR",v)} num/><F label="R-Value to Add" value={s.attic?.addR||""} onChange={v=>sn("attic","addR",v)} num/><F label="Total R" computed={s.attic?.preR||s.attic?.addR ? "R-"+(Number(s.attic?.preR||0)+Number(s.attic?.addR||0)) : "—"} suffix="auto"/></Gr>
        <div style={{marginTop:8}}><Gr>
          <F label="Recessed Lighting Qty" value={s.attic?.recessQty||""} onChange={v=>sn("attic","recessQty",v)}/>
          <F label="Storage Created" value={s.attic?.storage||""} onChange={v=>sn("attic","storage",v)} num/>
        </Gr></div>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.attic?.ductwork} onChange={v=>sn("attic","ductwork",v)} label="Ductwork Present"/>
          <CK checked={s.attic?.floorBoards} onChange={v=>sn("attic","floorBoards",v)} label="Floor Boards"/>
          <CK checked={s.attic?.moldPresent} onChange={v=>sn("attic","moldPresent",v)} label="Mold Present"/>
          <CK checked={s.attic?.vermPresent} onChange={v=>sn("attic","vermPresent",v)} label="Vermiculite Present"/>
          <CK checked={s.attic?.knobTube} onChange={v=>sn("attic","knobTube",v)} label="Knob & Tube"/>
        </div>
        {s.attic?.ductwork && <Gr><Sel label="Duct Condition" value={s.attic?.condition||""} onChange={v=>sn("attic","condition",v)} opts={["Good","Poor"]}/><F label="Duct LnFt to Air Seal" value={s.attic?.lnftAirSeal||""} onChange={v=>sn("attic","lnftAirSeal",v)} num/></Gr>}
        <div style={{marginTop:6}}><Gr>
          <F label="Existing Ventilation" value={s.attic?.existVent||""} onChange={v=>sn("attic","existVent",v)}/>
          <F label="Needed Ventilation" value={s.attic?.needVent||""} onChange={v=>sn("attic","needVent",v)}/>
          <F label="Access Location" value={s.attic?.accessLoc||""} onChange={v=>sn("attic","accessLoc",v)}/>
        </Gr></div>
        <textarea style={{...S.ta,marginTop:6}} value={s.attic?.notes||""} onChange={e=>sn("attic","notes",e.target.value)} rows={2} placeholder="Attic notes…"/>
        <InsulRec section="attic" preR={s.attic?.preR} addR={s.attic?.addR}/>
        {s.attic?.ceilingCond==="Poor" && <Rec type="warn">Poor ceiling condition — consider fiberglass instead of cellulose (cellulose weighs ~2x fiberglass for same R-value).</Rec>}
        {s.attic?.floorBoards && <Rec type="info">Floor boards present — dense pack at 3.5 lbs/ft³ unless homeowner agrees to remove flooring and blow to R-49.</Rec>}
        {s.attic?.knobTube && <Rec type="flag">KNOB & TUBE in attic — insulation CANNOT proceed until remediated by licensed electrician.</Rec>}
        {s.attic?.vermPresent && <Rec type="flag">VERMICULITE in attic — do NOT disturb. Abatement required before insulation.</Rec>}
        {s.attic?.moldPresent && <Rec type="flag">MOLD in attic — remediation required before insulation work.</Rec>}
      </Sec>

      {/* ══ PAGE 4: COLLAR BEAM ══ */}
      <Sec title="Collar Beam">
        <Gr><F label="Sq Footage" value={s.collar?.sqft||""} onChange={v=>sn("collar","sqft",v)} num/><F label="Pre-Existing R" value={s.collar?.preR||""} onChange={v=>sn("collar","preR",v)} num/><F label="R-Value to Add" value={s.collar?.addR||""} onChange={v=>sn("collar","addR",v)} num/><F label="Total R" computed={s.collar?.preR||s.collar?.addR ? "R-"+(Number(s.collar?.preR||0)+Number(s.collar?.addR||0)) : "—"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.collar?.accessible} onChange={v=>sn("collar","accessible",v)} label="Accessible"/>
          <CK checked={s.collar?.cutIn} onChange={v=>sn("collar","cutIn",v)} label="Cut In Needed"/>
          <CK checked={s.collar?.ductwork} onChange={v=>sn("collar","ductwork",v)} label="Ductwork"/>
        </div>
        {s.collar?.ductwork && <div style={{marginTop:6}}><Gr><Sel label="Condition" value={s.collar?.condition||""} onChange={v=>sn("collar","condition",v)} opts={["Good","Poor"]}/><F label="Ln Ft Air Seal" value={s.collar?.lnftAirSeal||""} onChange={v=>sn("collar","lnftAirSeal",v)} num/></Gr></div>}
        <InsulRec section="collar" preR={s.collar?.preR} addR={s.collar?.addR}/>
      </Sec>

      {/* ══ PAGE 4: OUTER CEILING JOISTS ══ */}
      <Sec title="Outer Ceiling Joists">
        <Gr><F label="Sq Ft" value={s.outerCeiling?.sqft||""} onChange={v=>sn("outerCeiling","sqft",v)} num/><F label="Pre-Existing R" value={s.outerCeiling?.preR||""} onChange={v=>sn("outerCeiling","preR",v)} num/><F label="R to Add" value={s.outerCeiling?.addR||""} onChange={v=>sn("outerCeiling","addR",v)} num/><F label="Total R" computed={s.outerCeiling?.preR||s.outerCeiling?.addR ? "R-"+(Number(s.outerCeiling?.preR||0)+Number(s.outerCeiling?.addR||0)) : "—"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.outerCeiling?.accessible} onChange={v=>sn("outerCeiling","accessible",v)} label="Accessible"/>
          <CK checked={s.outerCeiling?.cutIn} onChange={v=>sn("outerCeiling","cutIn",v)} label="Cut In"/>
          <CK checked={s.outerCeiling?.floorBoards} onChange={v=>sn("outerCeiling","floorBoards",v)} label="Floor Boards"/>
          <CK checked={s.outerCeiling?.ductwork} onChange={v=>sn("outerCeiling","ductwork",v)} label="Ductwork"/>
        </div>
        {s.outerCeiling?.ductwork && <div style={{marginTop:6}}><Gr><Sel label="Condition" value={s.outerCeiling?.condition||""} onChange={v=>sn("outerCeiling","condition",v)} opts={["Good","Poor"]}/><F label="Ln Ft Air Seal" value={s.outerCeiling?.lnftAirSeal||""} onChange={v=>sn("outerCeiling","lnftAirSeal",v)} num/></Gr></div>}
        <InsulRec section="outerCeiling" preR={s.outerCeiling?.preR} addR={s.outerCeiling?.addR}/>
      </Sec>

      <Sec title="Knee Walls">
        <Gr><F label="Sq Ft" value={s.kneeWall?.sqft||""} onChange={v=>sn("kneeWall","sqft",v)} num/><F label="Pre-Existing R" value={s.kneeWall?.preR||""} onChange={v=>sn("kneeWall","preR",v)} num/><F label="R to Add" value={s.kneeWall?.addR||""} onChange={v=>sn("kneeWall","addR",v)} num/><F label="Total R" computed={s.kneeWall?.preR||s.kneeWall?.addR ? "R-"+(Number(s.kneeWall?.preR||0)+Number(s.kneeWall?.addR||0)) : "—"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.kneeWall?.densePack} onChange={v=>sn("kneeWall","densePack",v)} label="Dense Pack"/>
          <CK checked={s.kneeWall?.rigidFoam} onChange={v=>sn("kneeWall","rigidFoam",v)} label="Rigid Foam Board"/>
          <CK checked={s.kneeWall?.tyvek} onChange={v=>sn("kneeWall","tyvek",v)} label="Tyvek Needed"/>
          <CK checked={s.kneeWall?.fgBatts} onChange={v=>sn("kneeWall","fgBatts",v)} label="Fiberglass Batts"/>
        </div>
        <div style={{marginTop:6}}><Sel label="Wall Type" value={s.kneeWall?.wallType||""} onChange={v=>sn("kneeWall","wallType",v)} opts={["Drywall","Plaster"]}/></div>
        {s.kneeWall?.tyvek && <div style={{marginTop:6}}><F label="Tyvek Sq Ft" value={s.kneeWall?.tyvekSqft||""} onChange={v=>sn("kneeWall","tyvekSqft",v)} num/></div>}
        <InsulRec section="kneeWall" preR={s.kneeWall?.preR} addR={s.kneeWall?.addR}/>
        {s.kneeWall?.preR && Number(s.kneeWall?.preR)===0 && <Rec type="info">Knee wall cavity must have no existing thermal resistance to qualify. Insulate to R-11 or greater (R-13+5 or R-20 preferred).</Rec>}
      </Sec>

      <Sec title="Exterior Walls — 1st Floor">
        <Gr><F label="Sq Ft" value={s.extWall1?.sqft||""} onChange={v=>sn("extWall1","sqft",v)} num/><F label="Pre-Existing R" value={s.extWall1?.preR||""} onChange={v=>sn("extWall1","preR",v)} num/><F label="R to Add" value={s.extWall1?.addR||""} onChange={v=>sn("extWall1","addR",v)} num/><F label="Win/Door SqFt" computed={s.extWall1?.sqft ? Math.round(Number(s.extWall1.sqft)*0.16) : "—"}/><F label="Total R" computed={s.extWall1?.preR||s.extWall1?.addR ? "R-"+(Number(s.extWall1?.preR||0)+Number(s.extWall1?.addR||0)) : "—"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.extWall1?.densePack} onChange={v=>sn("extWall1","densePack",v)} label="Dense Pack"/>
          <CK checked={s.extWall1?.phenolic} onChange={v=>sn("extWall1","phenolic",v)} label="Phenolic Foam"/>
        </div>
        <div style={{marginTop:6}}><Gr>
          <Sel label="Cladding" value={s.extWall1?.cladding||""} onChange={v=>sn("extWall1","cladding",v)} opts={["Vinyl","Masonry","Other"]}/>
          <Sel label="Insulate From" value={s.extWall1?.insulFrom||""} onChange={v=>sn("extWall1","insulFrom",v)} opts={["Interior","Exterior"]}/>
          <Sel label="Wall Type" value={s.extWall1?.wallType||""} onChange={v=>sn("extWall1","wallType",v)} opts={["Drywall","Plaster"]}/>
          <F label="Drilled Hole Location" value={s.extWall1?.drillLoc||""} onChange={v=>sn("extWall1","drillLoc",v)}/>
          {s.extWall1?.cladding==="Other"&&<F label="Other Cladding" value={s.extWall1?.otherClad||""} onChange={v=>sn("extWall1","otherClad",v)}/>}
        </Gr></div>
        <div style={{marginTop:4}}><CK checked={s.extWall1?.ownerPrep} onChange={v=>sn("extWall1","ownerPrep",v)} label="Informed owner about prep"/></div>
        <InsulRec section="extWall1" preR={s.extWall1?.preR} addR={s.extWall1?.addR}/>
        {s.extWall1?.preR && Number(s.extWall1.preR) > 0 && <Rec type="info">Walls may only be insulated if no existing insulation or existing is in poor condition.</Rec>}
      </Sec>

      <Sec title="Exterior Walls — 2nd Floor">
        <Gr><F label="Sq Ft" value={s.extWall2?.sqft||""} onChange={v=>sn("extWall2","sqft",v)} num/><F label="Pre-Existing R" value={s.extWall2?.preR||""} onChange={v=>sn("extWall2","preR",v)} num/><F label="R to Add" value={s.extWall2?.addR||""} onChange={v=>sn("extWall2","addR",v)} num/><F label="Win/Door SqFt" computed={s.extWall2?.sqft ? Math.round(Number(s.extWall2.sqft)*0.14) : "—"}/><F label="Total R" computed={s.extWall2?.preR||s.extWall2?.addR ? "R-"+(Number(s.extWall2?.preR||0)+Number(s.extWall2?.addR||0)) : "—"} suffix="auto"/></Gr>
        <div style={{marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.extWall2?.densePack} onChange={v=>sn("extWall2","densePack",v)} label="Dense Pack"/>
          <CK checked={s.extWall2?.phenolic} onChange={v=>sn("extWall2","phenolic",v)} label="Phenolic Foam"/>
        </div>
        <div style={{marginTop:6}}><Gr>
          <Sel label="Cladding" value={s.extWall2?.cladding||""} onChange={v=>sn("extWall2","cladding",v)} opts={["Vinyl","Masonry","Other"]}/>
          <Sel label="Insulate From" value={s.extWall2?.insulFrom||""} onChange={v=>sn("extWall2","insulFrom",v)} opts={["Interior","Exterior"]}/>
          <Sel label="Wall Type" value={s.extWall2?.wallType||""} onChange={v=>sn("extWall2","wallType",v)} opts={["Drywall","Plaster"]}/>
          <F label="Drilled Hole Location" value={s.extWall2?.drillLoc||""} onChange={v=>sn("extWall2","drillLoc",v)}/>
          {s.extWall2?.cladding==="Other"&&<F label="Other Cladding" value={s.extWall2?.otherClad||""} onChange={v=>sn("extWall2","otherClad",v)}/>}
        </Gr></div>
        <div style={{marginTop:4}}><CK checked={s.extWall2?.ownerPrep} onChange={v=>sn("extWall2","ownerPrep",v)} label="Informed owner about prep"/></div>
        <InsulRec section="extWall2" preR={s.extWall2?.preR} addR={s.extWall2?.addR}/>
      </Sec>

      <Sec title="Foundation / Crawl">
        <div style={{marginBottom:8}}><Sel label="Type" value={s.fnd?.type||""} onChange={v=>sn("fnd","type",v)} opts={["No Basement/Slab","Finished","Unfinished","w/ Framing"]}/></div>
        <Gr><F label="Above Grade SqFt" value={s.fnd?.aboveSqft||""} onChange={v=>sn("fnd","aboveSqft",v)} num/><F label="Below Grade SqFt" value={s.fnd?.belowSqft||""} onChange={v=>sn("fnd","belowSqft",v)} num/><F label="Pre-Existing R" value={s.fnd?.preR||""} onChange={v=>sn("fnd","preR",v)} num/></Gr>
        <div style={{marginTop:8}}><Sel label="Insulation Type" value={s.fnd?.insulType||""} onChange={v=>sn("fnd","insulType",v)} opts={["Fiberglass","Rigid Foam Board","None"]}/></div>
        <div style={{marginTop:8,fontSize:11,fontWeight:600,color:"#60A5FA",textTransform:"uppercase",letterSpacing:".05em"}}>Band Joists</div>
        <div style={{marginTop:4}}><CK checked={s.fnd?.bandAccess} onChange={v=>sn("fnd","bandAccess",v)} label="Access to Band Joists"/></div>
        {s.fnd?.bandAccess && <div style={{marginTop:4}}><Gr><F label="Linear Ft" value={s.fnd?.bandLnft||""} onChange={v=>sn("fnd","bandLnft",v)}/><F label="Pre-Existing R" value={s.fnd?.bandR||""} onChange={v=>sn("fnd","bandR",v)}/><Sel label="Insulation" value={s.fnd?.bandInsul||""} onChange={v=>sn("fnd","bandInsul",v)} opts={["Fiberglass","Rigid Foam Board","None"]}/></Gr></div>}

        <div style={{marginTop:10,fontSize:11,fontWeight:600,color:"#60A5FA",textTransform:"uppercase",letterSpacing:".05em"}}>Crawlspace</div>
        <div style={{marginTop:4,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0px 8px"}}>
          <CK checked={s.fnd?.vented} onChange={v=>sn("fnd","vented",v)} label="Vented"/>
          <CK checked={s.fnd?.vaporBarrier} onChange={v=>sn("fnd","vaporBarrier",v)} label="Vapor Barrier Needed"/>
          <CK checked={s.fnd?.waterIssues} onChange={v=>sn("fnd","waterIssues",v)} label="Water Issues"/>
          <CK checked={s.fnd?.crawlDuct} onChange={v=>sn("fnd","crawlDuct",v)} label="Ductwork"/>
        </div>
        <div style={{marginTop:6}}><Gr>
          <Sel label="Crawl Floor" value={s.fnd?.crawlFloor||""} onChange={v=>sn("fnd","crawlFloor",v)} opts={["Concrete","Dirt/Gravel"]}/>
          {s.fnd?.vented && <F label="# of Vents" value={s.fnd?.ventCount||""} onChange={v=>sn("fnd","ventCount",v)}/>}
          {s.fnd?.vaporBarrier && <F label="Barrier SqFt" value={s.fnd?.barrierSqft||""} onChange={v=>sn("fnd","barrierSqft",v)}/>}
          {s.fnd?.crawlDuct && <Sel label="Duct Condition" value={s.fnd?.ductCond||""} onChange={v=>sn("fnd","ductCond",v)} opts={["Good","Poor"]}/>}
        </Gr></div>
        <div style={{marginTop:6}}><Gr>
          <F label="Crawl Above Grade SqFt" value={s.fnd?.crawlAbove||""} onChange={v=>sn("fnd","crawlAbove",v)}/>
          <F label="Crawl Below Grade SqFt" value={s.fnd?.crawlBelow||""} onChange={v=>sn("fnd","crawlBelow",v)}/>
          <F label="Crawl Pre-Existing R" value={s.fnd?.crawlR||""} onChange={v=>sn("fnd","crawlR",v)}/>
        </Gr></div>
        <div style={{marginTop:6}}><CK checked={s.fnd?.crawlBandAccess} onChange={v=>sn("fnd","crawlBandAccess",v)} label="Crawl Band Joist Access"/></div>
        {s.fnd?.crawlBandAccess && <div style={{marginTop:4}}><Gr>
          <F label="Crawl Band LnFt" value={s.fnd?.crawlBandLnft||""} onChange={v=>sn("fnd","crawlBandLnft",v)}/>
          <F label="Crawl Band R" value={s.fnd?.crawlBandR||""} onChange={v=>sn("fnd","crawlBandR",v)}/>
          <Sel label="Crawl Band Insulation" value={s.fnd?.crawlBandInsul||""} onChange={v=>sn("fnd","crawlBandInsul",v)} opts={["Fiberglass","Rigid Foam Board","None"]}/>
        </Gr></div>}
        <div style={{marginTop:6}}><CK checked={s.fnd?.crawlWallsObstructed} onChange={v=>sn("fnd","crawlWallsObstructed",v)} label="Crawl walls insulated or obstructed already"/></div>
        <InsulRec section="fnd" preR={s.fnd?.preR} addR={null}/>
        {s.fnd?.preR && Number(s.fnd.preR) === 0 && <Rec type="rec">No existing basement wall insulation → eligible. Bring to min R-10/13. Rigid foam board or batt insulation.</Rec>}
        {s.fnd?.preR && Number(s.fnd.preR) >= 10 && <Rec type="info">Existing R-{s.fnd.preR} — basement wall insulation not needed.</Rec>}
        {s.fnd?.bandAccess && Number(s.fnd?.bandR||0) === 0 && <Rec type="rec">Rim joist has no insulation → insulate to min R-10. Batt insulation NOT allowed for rim joist.</Rec>}
        {s.fnd?.vaporBarrier && s.fnd?.crawlFloor==="Dirt/Gravel" && <Rec type="rec">Dirt/gravel crawl floor — vapor barrier (min 6 mil) required before wall insulation.</Rec>}
        {s.fnd?.crawlR !== undefined && Number(s.fnd?.crawlR||0) === 0 && <Rec type="rec">Crawlspace walls → insulate to R-15/19 with rigid foam board or 2-part spray foam. No fibrous insulation on crawl walls.</Rec>}
        {s.fnd?.waterIssues && <Rec type="flag">Water issues present — must be resolved before insulation work can proceed.</Rec>}
      </Sec>
    </>
  );
}
