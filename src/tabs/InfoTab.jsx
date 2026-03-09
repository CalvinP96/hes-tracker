import React, { useState, useRef, useCallback, useEffect } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM, HVAC_BRANDS, COND_OPTS, YN_OPTS, HVAC_GUIDES } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
import { savePrint, printScope, photoPageHTML, sideBySideHTML, formPrintHTML } from "../export/savePrint.js";
import { exportProjectForms, exportProjectPhotos } from "../export/exportForms.js";

export function InfoTab({p,u,role,onLog,onDel}) {
  const [del,setDel] = useState(false);
  return (
    <div>
      <Sec title="Customer">
        <Gr><F label="Name" value={p.customerName} onChange={v=>u({customerName:v})}/><F label="Address" value={p.address} onChange={v=>u({address:v})}/></Gr>
        <Gr><F label="Phone" value={p.phone} onChange={v=>u({phone:v})}/><F label="Email" value={p.email} onChange={v=>u({email:v})}/></Gr>
      </Sec>
      <Sec title="System IDs">
        <p style={{fontSize:11,color:"#64748b",marginBottom:8}}>Lookup customer in ST, enter IDs here</p>
        <Gr><F label="RISE PID" value={p.riseId} onChange={v=>u({riseId:v})}/><F label="ServiceTitan ID" value={p.stId} onChange={v=>u({stId:v})}/><F label="Utility" value={p.utility} onChange={v=>u({utility:v})} placeholder="Nicor, ComEd…"/></Gr>
      </Sec>

      <Sec title="Flags & Notes">
        <CK checked={p.flagged} onChange={v=>u({flagged:v})} label="⚠️ Flag this project"/>
        {p.flagged && <div style={{marginTop:6}}><F label="Reason" value={p.flagReason} onChange={v=>u({flagReason:v})}/></div>}
        <div style={{marginTop:8}}><label style={S.fl}>Notes</label><textarea style={S.ta} value={p.internalNotes} onChange={e=>u({internalNotes:e.target.value})} rows={3}/></div>
      </Sec>
      {role === "admin" && (
        <Sec title="Danger Zone" danger>
          {!del ? <button style={{...S.ghost,color:"#ef4444",borderColor:"#ef4444"}} onClick={()=>setDel(true)}>Delete Project</button> : (
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button style={{...S.btn,background:"#ef4444"}} onClick={onDel}>Confirm Delete</button>
              <button style={S.ghost} onClick={()=>setDel(false)}>Cancel</button>
            </div>
          )}
        </Sec>
      )}
    </div>
  );
}
