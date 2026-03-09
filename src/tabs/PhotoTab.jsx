import React, { useState, useRef, useCallback } from "react";
import { S } from "../styles/index.js";
import { STAGES, ROLES, EE_MEASURES, HS_MEASURES, DOCS, PHOTO_SECTIONS, CAZ_ITEMS, QAQC_SECTIONS, FI_SAFETY, FI_INSUL, FI_CONTRACTOR_CK, PROGRAM } from "../constants/index.js";
import { uid, fmts, getPhotos, hasPhoto, photoCount, getResolvedQty, measUnit, calcRtoAdd, calcStage, getAlerts } from "../helpers/index.js";
import { Rec, InsulRec, Sec, Gr, F, Sel, CK, BtnGrp, SigPad, PrintBtn, SI } from "../components/ui.jsx";
export function PhotoTab({p,u,onLog,user,role}) {
  const [prev, setPrev] = useState(null); // {id, idx}
  const [viewMode, setViewMode] = useState("role"); // role | all | compare
  const allItems = Object.entries(PHOTO_SECTIONS).flatMap(([cat,items])=>items.map(i=>({...i,cat})));
  const preSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.includes("(Pre)"));
  const postSections = Object.entries(PHOTO_SECTIONS).filter(([cat]) => cat.includes("(Post)"));
  const preItems = preSections.flatMap(([,items])=>items);
  const postItems = postSections.flatMap(([,items])=>items);
  const preTaken = preItems.filter(i=>hasPhoto(p.photos,i.id)).length;
  const postTaken = postItems.filter(i=>hasPhoto(p.photos,i.id)).length;
  const totalTaken = preTaken + postTaken;

  const compressAndSave = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type === "image/gif") {
        const existing = getPhotos(p.photos, id);
        const newEntry = {d:e.target.result,at:new Date().toISOString(),by:user};
        u({photos:{...p.photos,[id]:[...existing, newEntry]}});
        const it = allItems.find(x=>x.id===id);
        onLog(`ðŸ“¸ ${it?.l||id} (${existing.length+1})`);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxW = 1600;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        const compressed = c.toDataURL("image/jpeg", 0.7);
        const existing = getPhotos(p.photos, id);
        const newEntry = {d:compressed,at:new Date().toISOString(),by:user};
        u({photos:{...p.photos,[id]:[...existing, newEntry]}});
        const it = allItems.find(x=>x.id===id);
        onLog(`ðŸ“¸ ${it?.l||id} (${existing.length+1})`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = (id, idx) => {
    const arr = getPhotos(p.photos, id).filter((_,i)=>i!==idx);
    const it = allItems.find(x=>x.id===id);
    u({photos:{...p.photos,[id]:arr.length?arr:undefined}});
    onLog(`ðŸ—‘ï¸ Removed ${it?.l||id}`);
    setPrev(null);
  };

  // Preview overlay
  if (prev) {
    const arr = getPhotos(p.photos, prev.id);
    const ph = arr[prev.idx];
    const it = allItems.find(x=>x.id===prev.id);
    return (
      <div style={S.camOv}>
        <div style={S.camH}>
          <button style={{...S.back,fontSize:18}} onClick={()=>setPrev(null)}>â† Back</button>
          <div style={{flex:1,textAlign:"center",fontWeight:600,fontSize:14}}>{it?.l} {arr.length>1?`(${prev.idx+1}/${arr.length})`:""}</div>
          <button style={{...S.ghost,color:"#ef4444",borderColor:"#ef4444",padding:"4px 10px"}} onClick={()=>deletePhoto(prev.id,prev.idx)}>Delete</button>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"#000",padding:8,position:"relative"}}>
          {ph?.d && <img src={ph.d} style={{maxWidth:"100%",maxHeight:"80vh",borderRadius:8}} alt=""/>}
          {arr.length > 1 && prev.idx > 0 && <button onClick={()=>setPrev({...prev,idx:prev.idx-1})} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",color:"#fff",border:"none",borderRadius:"50%",width:36,height:36,fontSize:18,cursor:"pointer"}}>â€¹</button>}
          {arr.length > 1 && prev.idx < arr.length-1 && <button onClick={()=>setPrev({...prev,idx:prev.idx+1})} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",color:"#fff",border:"none",borderRadius:"50%",width:36,height:36,fontSize:18,cursor:"pointer"}}>â€º</button>}
        </div>
        <div style={{padding:12,textAlign:"center",fontSize:11,color:"#94a3b8"}}>{ph?.by} · {ph?.at&&new Date(ph.at).toLocaleString()}</div>
      </div>
    );
  }

  // â”€â”€ Photo row helper â”€â”€
  const PhotoRow = ({it}) => {
    const arr = getPhotos(p.photos, it.id);
    const has = arr.length > 0;
    return (
      <div style={S.phRow}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,color:has?"#22c55e":"#cbd5e1"}}>{has?"âœ“":"â—‹"} {it.l} {arr.length>1?<span style={{fontSize:10,color:"#60A5FA"}}>({arr.length})</span>:""}</div>
          <div style={{fontSize:10,color:"#64748b"}}>{it.p==="pre"?"ðŸ“‹ Pre":"ðŸ—ï¸ Post"}{has&&arr[0].by?` · ${arr[0].by}`:""}</div>
        </div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {arr.map((ph,idx) => <button key={idx} style={S.thBtn} onClick={()=>setPrev({id:it.id,idx})}><img src={ph.d} style={S.th} alt=""/></button>)}
          <label style={S.cBtn} title={has?"Add another":"Take photo"}>
            {has?"ï¼‹":"ðŸ“·"}
            <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{compressAndSave(it.id,e.target.files?.[0]);e.target.value="";}}/>
          </label>
          <label style={S.uBtn} title="Upload from gallery">
            ðŸ“
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{compressAndSave(it.id,e.target.files?.[0]);e.target.value="";}}/>
          </label>
        </div>
      </div>
    );
  };

  // â”€â”€ Side-by-side comparison pairs â”€â”€
  const buildPairs = () => {
    const pairs = [];
    const usedPost = new Set();
    preSections.forEach(([preCat, preItms]) => {
      const catBase = preCat.replace(/ \(Pre\)| \(Post\)/g,"");
      const postMatch = postSections.find(([postCat]) => postCat.replace(/ \(Pre\)| \(Post\)/g,"") === catBase);
      preItms.forEach(preIt => {
        const preArr = getPhotos(p.photos, preIt.id);
        // find best post match: same base label or just first in matching category
        let postIt = null;
        if (postMatch) {
          postIt = postMatch[1].find(po => !usedPost.has(po.id) && hasPhoto(p.photos, po.id));
          if (postIt) usedPost.add(postIt.id);
        }
        if (preArr.length > 0 || postIt) {
          pairs.push({ preCat: catBase, preIt, postIt, preArr, postArr: postIt ? getPhotos(p.photos, postIt.id) : [] });
        }
      });
    });
    // Remaining post photos with no pre match
    postSections.forEach(([postCat, postItms]) => {
      postItms.filter(po => !usedPost.has(po.id) && hasPhoto(p.photos, po.id)).forEach(po => {
        usedPost.add(po.id);
        pairs.push({ preCat: postCat.replace(/ \(Pre\)| \(Post\)/g,""), preIt: null, postIt: po, preArr: [], postArr: getPhotos(p.photos, po.id) });
      });
    });
    return pairs;
  };

  // â”€â”€ Tab button style â”€â”€
  const tabBtn = (mode, label, icon) => ({
    flex:1,padding:"8px 4px",borderRadius:6,border:`1px solid ${viewMode===mode?"rgba(37,99,235,.5)":"rgba(255,255,255,.1)"}`,
    background:viewMode===mode?"rgba(37,99,235,.15)":"transparent",color:viewMode===mode?"#93C5FD":"#64748b",
    fontSize:11,fontWeight:viewMode===mode?700:500,cursor:"pointer",textAlign:"center",fontFamily:"'DM Sans',sans-serif"
  });

  return (
    <div>
      {/* â”€â”€ HEADER â”€â”€ */}
      <Sec title={<span>Photos <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{totalTaken}/{allItems.length}</span></span>}>
        <div style={S.prog}><div style={{...S.progF,width:`${allItems.length?(totalTaken/allItems.length)*100:0}%`,background:"linear-gradient(90deg,#2563EB,#3B82F6)"}}/></div>

        {/* View mode toggle */}
        <div style={{display:"flex",gap:4,marginTop:10}}>
          <button type="button" onClick={()=>setViewMode("role")} style={tabBtn("role")}>ðŸ“‹ By Role</button>
          <button type="button" onClick={()=>setViewMode("all")} style={tabBtn("all")}>ðŸ“‚ All</button>
          <button type="button" onClick={()=>setViewMode("compare")} style={tabBtn("compare")}>â†” Side-by-Side</button>
        </div>

        {/* Print / Compile buttons */}
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
          <PrintBtn label="Print Pre" onClick={()=>savePrint(photoPageHTML("Pre-Install Photos",p.photos,allItems.filter(i=>i.p==="pre"),p))}/>
          <PrintBtn label="Print Post" onClick={()=>savePrint(photoPageHTML("Post-Install Photos",p.photos,allItems.filter(i=>i.p==="post"),p))}/>
          <PrintBtn label="Print Side-by-Side" onClick={()=>savePrint(sideBySideHTML(p.photos,allItems,p))}/>
          <PrintBtn label="Print All" onClick={()=>savePrint(photoPageHTML("All Photos â€” Complete",p.photos,allItems,p))}/>
        </div>
      </Sec>

      {/* â•â•â• VIEW: BY ROLE â•â•â• */}
      {viewMode === "role" && <>
        {/* ASSESSOR â€” Pre Photos */}
        <Sec title={<span style={{color:"#2563EB"}}>ðŸ“‹ Assessor â€” Pre-Install <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{preTaken}/{preItems.length}</span></span>}>
          <div style={S.prog}><div style={{...S.progF,width:`${preItems.length?(preTaken/preItems.length)*100:0}%`,background:"linear-gradient(90deg,#2563EB,#3B82F6)"}}/></div>
          {preSections.map(([cat,items]) => {
            const cd = items.filter(i=>hasPhoto(p.photos,i.id)).length;
            return (
              <div key={cat} style={{marginTop:10}}>
                <div style={{fontSize:11,fontWeight:700,color:"#60A5FA",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                  <span>{cat}</span><span style={{color:cd===items.length?"#22c55e":"#64748b"}}>{cd}/{items.length}</span>
                </div>
                {items.map(it => <PhotoRow key={it.id} it={it}/>)}
              </div>
            );
          })}
        </Sec>

        {/* INSTALL CREW â€” Post Photos */}
        <Sec title={<span style={{color:"#f97316"}}>ðŸ—ï¸ Install Crew â€” Post-Install <span style={{fontWeight:400,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{postTaken}/{postItems.length}</span></span>}>
          <div style={S.prog}><div style={{...S.progF,width:`${postItems.length?(postTaken/postItems.length)*100:0}%`,background:"linear-gradient(90deg,#f97316,#eab308)"}}/></div>
          {postSections.map(([cat,items]) => {
            const cd = items.filter(i=>hasPhoto(p.photos,i.id)).length;
            return (
              <div key={cat} style={{marginTop:10}}>
                <div style={{fontSize:11,fontWeight:700,color:"#f97316",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                  <span>{cat}</span><span style={{color:cd===items.length?"#22c55e":"#64748b"}}>{cd}/{items.length}</span>
                </div>
                {items.map(it => <PhotoRow key={it.id} it={it}/>)}
              </div>
            );
          })}
        </Sec>
      </>}

      {/* â•â•â• VIEW: ALL â•â•â• */}
      {viewMode === "all" && Object.entries(PHOTO_SECTIONS).map(([cat,items]) => {
        const cd = items.filter(i=>hasPhoto(p.photos,i.id)).length;
        return (
          <Sec key={cat} title={<span>{cat} <span style={{fontWeight:400,color:cd===items.length?"#22c55e":"#94a3b8"}}>{cd}/{items.length}</span></span>}>
            {items.map(it => <PhotoRow key={it.id} it={it}/>)}
          </Sec>
        );
      })}

      {/* â•â•â• VIEW: SIDE-BY-SIDE â•â•â• */}
      {viewMode === "compare" && (() => {
        const pairs = buildPairs();
        if (pairs.length === 0) return <Sec title="Side-by-Side Comparison"><p style={{color:"#64748b",fontSize:12,textAlign:"center",padding:20}}>No photos to compare yet. Take pre and post photos to see side-by-side.</p></Sec>;
        // Group by category
        const grouped = {};
        pairs.forEach(pr => { if (!grouped[pr.preCat]) grouped[pr.preCat] = []; grouped[pr.preCat].push(pr); });
        return Object.entries(grouped).map(([catBase, catPairs]) => (
          <Sec key={catBase} title={<span>â†” {catBase}</span>}>
            {catPairs.map((pr, pi) => (
              <div key={pi} style={{marginBottom:12,border:"1px solid rgba(255,255,255,.08)",borderRadius:8,overflow:"hidden"}}>
                {/* Labels */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{padding:"6px 8px",background:"rgba(37,99,235,.08)",fontSize:10,fontWeight:700,color:"#60A5FA",textAlign:"center"}}>
                    ðŸ“‹ PRE â€” {pr.preIt?.l || "â€”"}
                  </div>
                  <div style={{padding:"6px 8px",background:"rgba(249,115,22,.08)",fontSize:10,fontWeight:700,color:"#f97316",textAlign:"center"}}>
                    ðŸ—ï¸ POST â€” {pr.postIt?.l || "â€”"}
                  </div>
                </div>
                {/* Images */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minHeight:100}}>
                  {/* Pre side */}
                  <div style={{borderRight:"1px solid rgba(255,255,255,.06)",padding:4,display:"flex",flexDirection:"column",gap:4,alignItems:"center",justifyContent:"center"}}>
                    {pr.preArr.length > 0 ? pr.preArr.map((ph,idx) => (
                      <button key={idx} onClick={()=>setPrev({id:pr.preIt.id,idx})} style={{background:"none",border:"none",padding:0,cursor:"pointer",width:"100%"}}>
                        <img src={ph.d} style={{width:"100%",maxHeight:200,objectFit:"contain",borderRadius:4}} alt=""/>
                      </button>
                    )) : <div style={{color:"#475569",fontSize:11,padding:20}}>No pre photo</div>}
                  </div>
                  {/* Post side */}
                  <div style={{padding:4,display:"flex",flexDirection:"column",gap:4,alignItems:"center",justifyContent:"center"}}>
                    {pr.postArr.length > 0 ? pr.postArr.map((ph,idx) => (
                      <button key={idx} onClick={()=>setPrev({id:pr.postIt.id,idx})} style={{background:"none",border:"none",padding:0,cursor:"pointer",width:"100%"}}>
                        <img src={ph.d} style={{width:"100%",maxHeight:200,objectFit:"contain",borderRadius:4}} alt=""/>
                      </button>
                    )) : <div style={{color:"#475569",fontSize:11,padding:20}}>No post photo</div>}
                  </div>
                </div>
                {/* Metadata */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:"1px solid rgba(255,255,255,.04)",fontSize:9,color:"#475569"}}>
                  <div style={{padding:"3px 8px"}}>{pr.preArr[0]?.by||""}{pr.preArr[0]?.at?` · ${new Date(pr.preArr[0].at).toLocaleDateString()}`:""}</div>
                  <div style={{padding:"3px 8px"}}>{pr.postArr[0]?.by||""}{pr.postArr[0]?.at?` · ${new Date(pr.postArr[0].at).toLocaleDateString()}`:""}</div>
                </div>
              </div>
            ))}
          </Sec>
        ));
      })()}
    </div>
  );
}


