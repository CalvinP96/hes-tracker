import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function CloseoutTab({p,u,onLog}) {
  const docDone = DOCS.filter(d => p.docsChecklist?.[d]).length;

  const getCloseoutHTML = () => {
    const docRows = DOCS.map(d => `<div class="row"><span class="lbl">${d}</span><span class="${p.docsChecklist?.[d]?"pass":"na"}">${p.docsChecklist?.[d]?"âœ“":"â€”"}</span></div>`).join("");
    const body = `<div class="sec"><h3>Documents (${docDone}/${DOCS.length})</h3>${docRows}</div>
      <div class="sec"><h3>Payment</h3><div class="row"><span class="lbl">Invoice</span><span class="val">${p.invoiceAmt?"$"+p.invoiceAmt:"â€”"}</span></div><div class="row"><span class="lbl">Submitted</span><span class="${p.paymentSubmitted?"pass":"na"}">${p.paymentSubmitted?"Yes":"No"}</span></div></div>
      <div class="sec"><h3>Summary</h3><div class="grid">
        <div class="row"><span class="lbl">Stage</span><span class="val">${STAGES[p.currentStage].label}</span></div>
        <div class="row"><span class="lbl">Measures</span><span class="val">${p.measures.length} EE + ${p.healthSafety.length} H&S</span></div>
        <div class="row"><span class="lbl">Blower Door</span><span class="val">${p.preCFM50&&p.postCFM50?p.preCFM50+"â†’"+p.postCFM50:"â€”"}</span></div>
        <div class="row"><span class="lbl">Scope</span><span class="${p.scopeApproved?"pass":"na"}">${p.scopeApproved?"Approved":"Pending"}</span></div>
        <div class="row"><span class="lbl">Final Insp</span><span class="${p.finalPassed?"pass":"na"}">${p.finalPassed?"Passed":"â€”"}</span></div>
      </div></div>`;
    return formPrintHTML("Project Closeout", p, body, p.custAuthSig);
  };

  return (
    <div>
      <Sec title={<span>Documents {docDone}/{DOCS.length}</span>}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={S.prog}><div style={{...S.progF,width:`${(docDone/DOCS.length)*100}%`}}/></div>
          <PrintBtn onClick={()=>savePrint(getCloseoutHTML())}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {DOCS.map(d => <CK key={d} checked={p.docsChecklist?.[d]} onChange={()=>u({docsChecklist:{...p.docsChecklist,[d]:!p.docsChecklist?.[d]}})} label={d} color={p.docsChecklist?.[d]?"#22c55e":null} strike={p.docsChecklist?.[d]}/>)}
        </div>
      </Sec>
      <Sec title="Install Notes"><textarea style={S.ta} value={p.installNotes} onChange={e=>u({installNotes:e.target.value})} rows={3} placeholder="Crew notesâ€¦"/></Sec>
      <Sec title="Payment">
        <Gr><F label="Invoice $" value={p.invoiceAmt} onChange={v=>u({invoiceAmt:v})}/><F label="Submit Date" value={p.paymentDate} onChange={v=>u({paymentDate:v})} type="date"/></Gr>
        <div style={{marginTop:8}}><CK checked={p.paymentSubmitted} onChange={v=>{u({paymentSubmitted:v});if(v)onLog("Payment submitted to RISE");}} label="Submitted to RISE"/></div>
      </Sec>
      <Sec title="Summary">
        <div style={S.sumG}>
          <SI l="Stage" v={STAGES[p.currentStage].label}/>
          <SI l="Measures" v={`${p.measures.length} EE + ${p.healthSafety.length} H&S`}/>
          <SI l="Blower Door" v={p.preCFM50&&p.postCFM50?`${p.preCFM50}â†’${p.postCFM50}`:"â€”"}/>
          <SI l="Scope" v={p.scopeApproved?"âœ“ Approved":"Pending"} c={p.scopeApproved?"#22c55e":"#94a3b8"}/>
          <SI l="Inspection" v={p.finalPassed?"âœ“ Passed":"â€”"} c={p.finalPassed?"#22c55e":"#94a3b8"}/>
          <SI l="Sign-off" v={p.customerSignoff?"âœ“":"â€”"} c={p.customerSignoff?"#22c55e":"#94a3b8"}/>
          <SI l="Photos" v={`${Object.keys(p.photos||{}).filter(k=>hasPhoto(p.photos,k)).length} slots`}/>
          <SI l="Payment" v={p.paymentSubmitted?`$${p.invoiceAmt}`:"Pending"} c={p.paymentSubmitted?"#22c55e":"#94a3b8"}/>
        </div>
      </Sec>
    </div>
  );
}


