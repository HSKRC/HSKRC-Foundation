(function(){
"use strict";
const cfg=window.FOUNDATION_REGISTER_CONFIG;
if(!cfg) throw new Error("Missing register configuration.");
const db=window.foundationSupabase;
let records=[];
let saveTimers=new Map();
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function fieldHtml(field,value){
  const val=value??""; const a='data-col="'+field.key+'"';
  if(field.type==="select") return '<select '+a+'>'+field.options.map(o=>'<option'+(String(o)===String(val)?' selected':'')+'>'+esc(o)+'</option>').join("")+'</select>';
  if(field.type==="textarea") return '<textarea '+a+'>'+esc(val)+'</textarea>';
  const type=field.type||"text"; const extra=type==="number"?' step="0.01" min="0"':"";
  return '<input '+a+' type="'+type+'" value="'+esc(val)+'"'+extra+'>';
}
function renderRow(rec){
  const tr=document.createElement("tr"); tr.dataset.id=rec.id;
  tr.innerHTML=cfg.fields.map(f=>'<td>'+fieldHtml(f,rec[f.key])+'</td>').join("")+'<td class="no-print"><button class="remove" type="button">×</button></td>';
  tr.querySelector(".remove").addEventListener("click",()=>removeRecord(rec.id));
  tr.querySelectorAll("[data-col]").forEach(el=>{
    const event=el.tagName==="SELECT"||el.type==="date"||el.type==="number"?"change":"input";
    el.addEventListener(event,()=>scheduleSave(tr,rec.id));
  });
  document.querySelector("#rows").appendChild(tr);
}
function rowPayload(tr){
  const payload={};
  cfg.fields.forEach(f=>{
    const el=tr.querySelector('[data-col="'+f.key+'"]'); let v=el?el.value:"";
    if(f.type==="number") v=v===""?null:Number(v);
    if(f.type==="date") v=v||null;
    payload[f.key]=v===""?null:v;
  });
  return payload;
}
function scheduleSave(tr,id){clearTimeout(saveTimers.get(id));saveTimers.set(id,setTimeout(()=>saveRecord(tr,id),550));setStatus("Saving…");}
async function saveRecord(tr,id){
  saveTimers.delete(id); const payload=rowPayload(tr);
  const {data,error}=await db.from(cfg.table).update(payload).eq("id",id).select().single();
  if(error){setStatus("Save failed",true);return alert("Could not save this row: "+error.message)}
  const i=records.findIndex(r=>r.id===id); if(i>=0) records[i]=data;
  updateSummary();setStatus("Saved • "+new Date().toLocaleTimeString());
}
async function addRecord(seed={}){
  const {data,error}=await db.from(cfg.table).insert(Object.assign({},cfg.defaults||{},seed)).select().single();
  if(error)return alert("Could not add record: "+error.message);
  records.push(data);renderRow(data);updateSummary();setStatus("Saved");
}
async function removeRecord(id){
  if(!confirm("Delete this record from the central Foundation database?"))return;
  const {error}=await db.from(cfg.table).delete().eq("id",id);
  if(error)return alert("Could not delete: "+error.message);
  records=records.filter(r=>r.id!==id);document.querySelector('tr[data-id="'+id+'"]')?.remove();updateSummary();setStatus("Deleted");
}
async function loadRecords(){
  await foundationAuth.requireAdmin();
  const {data,error}=await db.from(cfg.table).select("*").order("created_at",{ascending:true});
  if(error)return showFatal(error.message);
  records=data||[];document.querySelector("#rows").innerHTML="";records.forEach(renderRow);updateSummary();setStatus("Central database connected");
  document.querySelector("#loading")?.remove();checkLegacy();
}
function updateSummary(){if(typeof window.updateRegisterSummary==="function")window.updateRegisterSummary(records)}
function setStatus(msg,bad=false){const e=document.querySelector("#saved");if(e){e.textContent=msg;e.style.color=bad?"#9b1c1c":"#666"}}
function showFatal(msg){const e=document.querySelector("#loading");if(e)e.innerHTML="<b>Could not load register.</b><br>"+esc(msg)}
function csvCell(v){return '"'+String(v??"").replace(/"/g,'""')+'"'}
function exportCSV(){
  const headers=cfg.fields.map(f=>f.label),rows=records.map(r=>cfg.fields.map(f=>r[f.key]??""));
  const csv=[headers,...rows].map(r=>r.map(csvCell).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=cfg.exportName+".csv";a.click();URL.revokeObjectURL(url);
}
async function importLegacy(){
  if(!cfg.legacyKey||!cfg.legacyMap)return;
  let old=[];try{old=JSON.parse(localStorage.getItem(cfg.legacyKey)||"[]")}catch(_){}
  if(!old.length)return alert("No old local records were found on this device.");
  if(!confirm("Import "+old.length+" local record(s) into the central database? Existing central records will remain."))return;
  const rows=old.map(r=>{const p=Object.assign({},cfg.defaults||{});Object.entries(cfg.legacyMap).forEach(([oldKey,newKey])=>{let v=r[oldKey];if(v==="")v=null;if(cfg.numberKeys?.includes(newKey)&&v!=null)v=Number(v);p[newKey]=v});return p});
  const {data,error}=await db.from(cfg.table).insert(rows).select();
  if(error)return alert("Import failed: "+error.message);
  records.push(...(data||[]));(data||[]).forEach(renderRow);updateSummary();setStatus("Imported "+data.length+" local records");
}
function checkLegacy(){if(!cfg.legacyKey)return;try{const old=JSON.parse(localStorage.getItem(cfg.legacyKey)||"[]"),b=document.querySelector("#legacyImport");if(b&&Array.isArray(old)&&old.length)b.hidden=false}catch(_){}}
window.addRegisterRecord=()=>addRecord();
window.exportRegisterCSV=exportCSV;
window.importLegacyRegister=importLegacy;
window.signOutFoundation=()=>foundationAuth.signOut();
window.addEventListener("DOMContentLoaded",loadRecords);
})();