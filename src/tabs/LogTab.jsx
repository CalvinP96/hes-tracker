import React, { useState, useRef, useCallback, useEffect } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM, HVAC_BRANDS, COND_OPTS, YN_OPTS, HVAC_GUIDES } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
import { savePrint, printScope, photoPageHTML, sideBySideHTML, formPrintHTML } from "../export/savePrint.js";
import { exportProjectForms, exportProjectPhotos } from "../export/exportForms.js";

export function LogTab({p,onLog}) {
  const [n, setN] = useState("");
  return (
    <div>
      <Sec title="Add Note">
        <div style={{display:"flex",gap:6}}>
          <input style={{...S.inp,flex:1}} value={n} onChange={e=>setN(e.target.value)} placeholder="What happened?"/>
          <button style={{...S.btn,padding:"8px 14px",opacity:n?1:.4}} disabled={!n} onClick={()=>{onLog(n);setN("");}}>Add</button>
        </div>
      </Sec>
      <Sec title={`History (${p.activityLog.length})`}>
        {p.activityLog.length === 0 ? <p style={{color:"#64748b",fontSize:12}}>No activity yet.</p> : (
          p.activityLog.map((a,i) => (
            <div key={i} style={S.logR}>
              <span style={S.logT}>{new Date(a.ts).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span>
              <span style={{fontSize:12,flex:1}}>{a.txt}</span>
              {a.by && <span style={S.logB}>{a.by}{a.role?` (${a.role})`:""}</span>}
            </div>
          ))
        )}
      </Sec>
    </div>
  );
}
