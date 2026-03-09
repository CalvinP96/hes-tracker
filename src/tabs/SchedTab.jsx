import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function SchedTab({p,u,onLog}) {
  const alerts = getAlerts(p).filter(a => a.type === "schedule");
  const showInstall = p.scopeApproved || p.currentStage >= 4;
  return (
    <div>
      {alerts.length > 0 && <div style={S.alertBox}><span style={{fontSize:18}}>ðŸ””</span><div style={{flex:1}}>{alerts.map((a,i)=><div key={i} style={{fontSize:12,color:"#fde68a"}}>â€¢ {a.msg}</div>)}</div></div>}
      <Sec title="Assessment">
        <F label="Assessment Date" value={p.assessmentDate} onChange={v=>{u({assessmentDate:v,assessmentScheduled:!!v});if(v)onLog(`Assessment scheduled: ${fmts(v)}`);}} type="date"/>
        <div style={{marginTop:6}}><textarea style={S.ta} value={p.scheduleNotes} onChange={e=>u({scheduleNotes:e.target.value})} rows={2} placeholder="Customer availability, access notesâ€¦"/></div>
      </Sec>
      {showInstall ? (
        <Sec title="Install Scheduling">
          <Gr>
            <F label="Install Date" value={p.installDate} onChange={v=>{u({installDate:v});if(v)onLog(`Install scheduled: ${fmts(v)}`);}} type="date"/>
            <F label="Tune/Clean" value={p.tuneCleanDate} onChange={v=>u({tuneCleanDate:v})} type="date"/>
            <F label="Final Insp." value={p.finalInspDate} onChange={v=>u({finalInspDate:v})} type="date"/>
          </Gr>
          <div style={{marginTop:8}}>
            <CK checked={p.installScheduled} onChange={v=>{u({installScheduled:v});if(v)onLog("Install confirmed in ST");}} label="Install Confirmed in ST"/>
          </div>
        </Sec>
      ) : (
        <Sec title="Install Scheduling">
          <p style={{fontSize:12,color:"#64748b"}}>Install scheduling opens after scope is approved.</p>
        </Sec>
      )}
    </div>
  );
}


