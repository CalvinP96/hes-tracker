import { PROGRAM, EE_MEASURES, STAGES } from '../constants/index.js';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
export const fmts = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "";

export function getPhotos(photos, id) {
  const v = photos?.[id];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (v.d) return [v];
  return [];
}
export function hasPhoto(photos, id) { return getPhotos(photos, id).length > 0; }
export function photoCount(photos, id) { return getPhotos(photos, id).length; }

export function calcRtoAdd(section, preR) {
  const rule = PROGRAM[section];
  if (!rule) return null;
  const pre = Number(preR) || 0;
  if (pre > rule.threshold && section !== "kneeWall" && section !== "extWall1" && section !== "extWall2" && section !== "fnd") return null;
  if (section === "kneeWall" && pre >= 20) return null;
  if ((section === "extWall1" || section === "extWall2") && pre > 0) return null;
  if (section === "fnd" && pre >= 10) return null;
  return Math.max(0, rule.target - pre);
}

// Get resolved qty for a measure (override or auto-calculated)
export function getResolvedQty(p,m) {
  const s = p.scope2026 || {};
  const aq = {};
  const atticAdd=Number(s.attic?.addR||0),atticPre=Number(s.attic?.preR||0);
  if(atticAdd>0&&s.attic?.sqft){if(atticPre<=11)aq["Attic Insulation (0-R11)"]=Number(s.attic.sqft);else if(atticPre<=19)aq["Attic Insulation (R12-19)"]=Number(s.attic.sqft);}
  if(Number(s.fnd?.addR||0)>0||(s.fnd?.preR!==undefined&&Number(s.fnd.preR||0)===0&&(Number(s.fnd?.aboveSqft||0)+Number(s.fnd?.belowSqft||0))>0)){const b=(Number(s.fnd?.aboveSqft||0)+Number(s.fnd?.belowSqft||0));if(b>0)aq["Basement Wall Insulation"]=b;}
  if(s.fnd?.crawlR!==undefined&&Number(s.fnd.crawlR||0)===0){const c=(Number(s.fnd?.crawlAbove||0)+Number(s.fnd?.crawlBelow||0));if(c>0)aq["Crawl Space Wall Insulation"]=c;}
  if(Number(s.kneeWall?.addR||0)>0&&s.kneeWall?.sqft)aq["Knee Wall Insulation"]=Number(s.kneeWall.sqft);
  const w1=Number(s.extWall1?.addR||0)>0&&s.extWall1?.sqft?Math.round(Number(s.extWall1.sqft)*0.84):0;
  const w2=Number(s.extWall2?.addR||0)>0&&s.extWall2?.sqft?Math.round(Number(s.extWall2.sqft)*0.86):0;
  if(w1+w2>0)aq["Injection Foam Walls"]=w1+w2;
  if(s.fnd?.bandAccess&&Number(s.fnd?.bandR||0)===0&&s.fnd?.bandLnft)aq["Rim Joist Insulation"]=Number(s.fnd.bandLnft);
  if(s.fnd?.crawlBandAccess&&Number(s.fnd?.crawlBandR||0)===0&&s.fnd?.crawlBandLnft)aq["Rim Joist Insulation"]=(aq["Rim Joist Insulation"]||0)+Number(s.fnd.crawlBandLnft);
  if(Number(s.collar?.addR||0)>0&&s.collar?.sqft)aq["Attic Insulation (R12-19)"]=(aq["Attic Insulation (R12-19)"]||0)+Number(s.collar.sqft);
  if(Number(s.outerCeiling?.addR||0)>0&&s.outerCeiling?.sqft)aq["Attic Insulation (R12-19)"]=(aq["Attic Insulation (R12-19)"]||0)+Number(s.outerCeiling.sqft);
  if(s.htg?.replaceRec)aq[s.htg?.system==="Boiler"?"Boiler Replacement":"Furnace Replacement"]=1;
  if(s.dhw?.replaceRec)aq["Water Heater Replacement"]=1;
  if(s.clg?.replaceRec)aq["Central AC Replacement"]=1;
  aq["Air Sealing"]=1;
  // Duct sealing removed from measures per business decision
  if(s.coNeeded&&Number(s.coNeeded)>0)aq["CO Detector (Hardwired)"]=Number(s.coNeeded);
  if(s.smokeNeeded&&Number(s.smokeNeeded)>0)aq["Smoke Detector (Hardwired)"]=Number(s.smokeNeeded);
  if(s.doorSweeps&&Number(s.doorSweeps)>0)aq["Door Sweeps"]=Number(s.doorSweeps);
  
  if(s.dhw?.flueRepair)aq["Flue Repairs"]=1;
  const mq=p.measureQty||{};
  return mq[m]!==undefined?mq[m]:(aq[m]!==undefined?String(aq[m]):"");
}
export function measUnit(m){if(m.includes("Insulation")&&!m.includes("Rim"))return"sqft";if(m.includes("Rim Joist"))return"lnft";if(m.includes("Foam Walls"))return"sqft";return"ea";}

export function blank() {
  return {
    id: uid(), created: new Date().toISOString(), customerName: "", address: "",
    phone: "", email: "", riseId: "", stId: "", utility: "",
    sqft: "", stories: "", yearBuilt: "", homeType: "", occupants: "",
    currentStage: 0, stageHistory: [{s:0,at:new Date().toISOString()}],
    assessmentDate: "", installDate: "", tuneCleanDate: "", finalInspDate: "",
    assessmentScheduled: false, installScheduled: false, scheduleNotes: "",
    audit: { interior:{}, heating:{}, cooling:{}, dhw:{}, attic:{}, foundation:{}, doors:{}, notes:"" },
    preCFM50: "", postCFM50: "", preCFM25: "", postCFM25: "", bdLoc: "", extTemp: "",
    ventReq: "", ventMethod: "", ventResult: "", fanAdj: "", cazResults: {},
    measures: [], healthSafety: [], measureQty: {}, measureUnchecked: {}, hsUnchecked: {}, measureNotes: "", scopeVariances: "",
    riseStatus: "", scopeApproved: false, scopeDate: "", scopeNotes: "",
    mechNeeded: false, mechStatus: "", mechDate: "", mechNotes: "",
    fi: { safety:{}, blowerPre:"", blowerPost:"", ductPre:"", ductPost:"", thermoInstalled:"", followupNeeded:"", followupNotes:"" },
    qaqc: { scheduled:false, date:"", inspector:"", results:{}, notes:"", passed:null },
    scope2026: {},
    hvac: { furnace:{}, waterHeater:{}, condenser:{}, systemNotes:"", techName:"", completed:false, completedDate:"" },
    finalPassed: false, customerSignoff: false, installNotes: "",
    invoiceAmt: "", paymentSubmitted: false, paymentDate: "",
    docsChecklist: {}, photos: {}, activityLog: [], internalNotes: "",
    flagged: false, flagReason: "", changeOrders: [],
  };
}

export function calcStage(p) {
  // 7 Closeout — final passed + signed + payment
  if (p.finalPassed && p.customerSignoff && p.paymentSubmitted) return 7;
  // 6 Post-QC — post readings exist (work done, verifying)
  if (p.postCFM50) return 6;
  // 5 Install — install confirmed + date set
  if (p.installScheduled && p.installDate) return 5;
  // 4 Approve — RISE approved + mech sorted
  if (p.scopeApproved || p.riseStatus === "approved") {
    if (p.mechNeeded && p.mechStatus !== "approved") return 4; // waiting on mech
    return 4;
  }
  // 3 Scope — has measures or CFM50 or RISE pending
  if (p.riseStatus === "pending" || p.measures.length > 0 || p.preCFM50 || Object.keys(p.photos||{}).filter(k=>hasPhoto(p.photos,k)).length > 5) return 3;
  // 2 Assess — assessment scheduled/dated
  if (p.assessmentScheduled || p.assessmentDate) return 2;
  // 1 Schedule — has name + address
  if (p.customerName && p.address) return 1;
  // 0 Intake
  return 0;
}

export function getAlerts(p) {
  const a = [];
  const cs = calcStage(p);
  if (cs > p.currentStage) a.push({ type:"advance", msg:`Ready → ${STAGES[cs].label}`, stage:cs });
  if (p.customerName && p.address && !p.assessmentScheduled && !p.assessmentDate && p.currentStage < 2) a.push({ type:"schedule", msg:"Needs assessment scheduling" });
  if (p.scopeApproved && !p.installScheduled && !p.installDate && p.currentStage < 5) a.push({ type:"schedule", msg:"Needs install scheduling" });
  if (p.riseStatus === "corrections") a.push({ type:"warn", msg:"RISE corrections requested" });
  if (p.mechNeeded && !p.mechStatus) a.push({ type:"warn", msg:"Mech replacement needs approval" });
  const replSt = (p.hvac||{}).replaceRequestStatus;
  if (replSt==="pending") a.push({ type:"repl", msg:"🔄 Replacement request pending" });
  if (replSt==="approved" || replSt==="denied") {
    const replBy = (p.hvac||{}).replaceRequestBy;
    if (replBy) a.push({ type:"repl_done", msg:`🔄 Replacement ${replSt}` });
  }
  const pendingCO = (p.changeOrders||[]).filter(c=>c.status==="pending").length;
  if (pendingCO > 0) a.push({ type:"co", msg:`${pendingCO} COR${pendingCO>1?"s":""} pending` });
  return a;
}
