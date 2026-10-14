import {clone,now,uuid,coursePrefix,shortCourseCode,refreshBusinessCodes,trashTarget,removeTarget,restoreTarget,entities,mediaRefs} from './core.js';
let db;
export function openDB(){return new Promise((resolve,reject)=>{
  const req=indexedDB.open('novec-survey-db',2);
  req.onupgradeneeded=()=>{const d=req.result;for(const name of ['localities','media','chunks','meta','history'])if(!d.objectStoreNames.contains(name))d.createObjectStore(name,{keyPath:'id'});};
  req.onsuccess=()=>{db=req.result;db.onversionchange=()=>{db.close();window.dispatchEvent(new Event('databaseversionchange'));};resolve(db);};
  req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Fermer les autres onglets NOVEC Survey, puis recharger.'));
});}
export function getAll(store='localities'){return new Promise((res,rej)=>{const q=db.transaction(store).objectStore(store).getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
export function get(store,id){return new Promise((res,rej)=>{const q=db.transaction(store).objectStore(store).get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
export function put(store,value){return new Promise((res,rej)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).put(value);t.oncomplete=()=>res(value);t.onabort=t.onerror=()=>rej(t.error||Error('Écriture interrompue.'));});}
export function remove(store,id){return new Promise((res,rej)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).delete(id);t.oncomplete=res;t.onabort=t.onerror=()=>rej(t.error||Error('Suppression interrompue.'));});}
export function saveRecord(record){return new Promise((res,rej)=>{
  const copy=clone(record),t=db.transaction('localities','readwrite'),s=t.objectStore('localities');let conflict=false,operationError=null;
  const q=s.get(copy.id);q.onsuccess=()=>{try{const old=q.result;if(old&&(old._rev||0)!==(copy._rev||0)){conflict=true;t.abort();return;}const content=r=>JSON.stringify(r,(k,v)=>['_rev','updatedAt'].includes(k)?undefined:v);if(old&&content(old)===content(copy)){Object.assign(copy,old);return;}copy._rev=(old?._rev||0)+1;copy.updatedAt=now();s.put(copy);}catch(error){operationError=error;t.abort();}};
  t.oncomplete=()=>res(copy);t.onabort=t.onerror=()=>rej(conflict?Error('Cette fiche a changé dans un autre onglet. Exporter votre travail puis rouvrir la fiche.'):operationError||t.error||Error('Enregistrement interrompu.'));
});}
export function batchImport(records,media=[],archive=true,history=[]){return new Promise((res,rej)=>{
  const t=db.transaction(['localities','media','history'],'readwrite'),s=t.objectStore('localities');let operationError=null;
  for(const record of records){const q=s.get(record.id);q.onsuccess=()=>{try{if(q.result&&archive)t.objectStore('history').put({id:uuid(),record:q.result,at:now(),reason:'Avant migration ou import'});s.put({...record,_rev:(q.result?._rev||0)+1});}catch(error){operationError=error;t.abort();}};}
  for(const m of media)t.objectStore('media').put(m);
  for(const h of history)t.objectStore('history').put(h);
  t.oncomplete=res;t.onabort=t.onerror=()=>rej(operationError||t.error||Error('Import annulé ; aucune fiche modifiée.'));
});}
export async function migrateAll(catalog,migrate){const list=await getAll();const changed=[];for(const r of list)if(r.schemaVersion!==2)changed.push(await migrate(r,catalog));if(changed.length)await batchImport(changed);return changed.length;}
export const settingsDefaults={missionCode:'ABHL175',investigator:'',transcriptionUrl:'',audioLanguage:'fr',autoTranscribe:false,archiveOnDelete:true,archiveChanges:true};
export async function getSettings(){return {...settingsDefaults,...(await get('meta','settings'))?.value};}
export const setSettings=value=>put('meta',{id:'settings',value});
export const setLast=id=>put('meta',{id:'lastRecord',value:id});
export async function blobDataURL(blob){return new Promise((res,rej)=>{const reader=new FileReader();reader.onload=()=>res(reader.result);reader.onerror=()=>rej(reader.error);reader.readAsDataURL(blob);});}
export async function dataURLBlob(url){if(!/^data:(image\/(jpeg|png|webp)|audio\/[\w.+-]+|video\/mp4|video\/webm)(;[^,]*)?;base64,/i.test(url))throw Error('Format de média non autorisé.');const [head,body]=url.split(',');const bytes=Uint8Array.from(atob(body),c=>c.charCodeAt(0));return new Blob([bytes],{type:head.slice(5).split(';')[0]});}
export async function mediaBlob(ref){if(ref.dataUrl)return dataURLBlob(ref.dataUrl);return (await get('media',ref.id))?.blob||null;}

// A transaction reserves numbers permanently, including after removal of a course.
export function reserveCourseNumber(record,start=1){return new Promise((resolve,reject)=>{
 const prefix=coursePrefix(record),id='sequence:'+record.missionCode+':'+prefix;
 const t=db.transaction(['meta','localities','history'],'readwrite'),meta=t.objectStore('meta');
 let pending=3,maximum=Math.max(0,Number(start||1)-1),answer;
 const scan=r=>{if(r?.missionCode!==record.missionCode)return;if(r.locality?.referenceId!==record.locality?.referenceId||r.locality?.name!==record.locality?.name)return;for(const w of r.watercourses||[]){const suffix=w.code?.startsWith(prefix+'-')?w.code.slice(prefix.length+1):'';const oldCode=w.code?.startsWith(r.locality.provinceCode+'-'+r.locality.code+'-')?w.code:'';const match=suffix.match(/^CE(\d+)$/)||oldCode.match(/-(\d+)$/);if(match)maximum=Math.max(maximum,Number(match[1]));if(w.sequenceNumber)maximum=Math.max(maximum,Number(w.sequenceNumber));}};
 const done=()=>{if(--pending===0){answer=maximum+1;meta.put({id,value:answer});}};
 const q=meta.get(id);q.onsuccess=()=>{maximum=Math.max(maximum,q.result?.value||0);done();};
 const a=t.objectStore('localities').getAll();a.onsuccess=()=>{a.result.forEach(scan);done();};
 const h=t.objectStore('history').getAll();h.onsuccess=()=>{h.result.forEach(x=>scan(x.record));done();};
 t.oncomplete=()=>resolve(answer);t.onerror=t.onabort=()=>reject(t.error||Error('Numérotation interrompue.'));
});}
// Converts readable business codes only. Internal entity IDs and media links are never changed.
export async function simplifyCodes(){
 const records=await getAll();let count=0;
 for(const r of records){const before=clone(r);if(refreshBusinessCodes(r)){
   await put('history',{id:uuid(),record:before,at:now(),reason:'Avant harmonisation des codes v1.8'});
   await saveRecord(r);count++;
 }}return count;
}

export function trashRecord(record,id,{withEntry=false}={}){return new Promise((resolve,reject)=>{
 const before=clone(record),target=trashTarget(before,id),after=removeTarget(before,target),entry={id:uuid(),record:before,target,at:now(),reason:'Corbeille',kind:'trash'};
 const t=db.transaction(['localities','history'],'readwrite'),s=t.objectStore('localities');let problem;
 const q=s.get(record.id);q.onsuccess=()=>{try{if(!q.result||(q.result._rev||0)!==(record._rev||0))throw Error('La fiche a changé. Rouvrez-la.');t.objectStore('history').put(entry);if(after){after._rev=(q.result._rev||0)+1;after.updatedAt=now();s.put(after);}else s.delete(record.id);}catch(e){problem=e;t.abort();}};
 t.oncomplete=()=>resolve(withEntry?{record:after,entryId:entry.id}:after);t.onerror=t.onabort=()=>reject(problem||t.error||Error('Suppression annulée.'));
});}

// Only media belonging to removed snapshots are candidates. Current records,
// retained versions and other trash entries protect their referenced media.
// All reads and deletes share one transaction, including audio recovery chunks.
export function purgeTrash(ids){return new Promise((resolve,reject)=>{
 const t=db.transaction(['localities','history','media','chunks'],'readwrite');
 const h=t.objectStore('history'),selected=ids?new Set(ids):null;
 let pending=2,records,history,problem;const result={entries:0,media:0,bytes:0};
 const finish=()=>{if(--pending)return;try{
  const removed=history.filter(x=>x.kind==='trash'&&!x.restoredAt&&(!selected||selected.has(x.id)));
  const removedIds=new Set(removed.map(x=>x.id)),keep=new Set([...records,...history.filter(x=>!removedIds.has(x.id)).map(x=>x.record)].flatMap(mediaRefs).map(m=>m.id));
  const candidates=new Set(removed.flatMap(x=>mediaRefs(x.record)).flatMap(m=>[m.id,...(m.previousMediaIds||[])]).filter(id=>!keep.has(id)));
  for(const entry of removed)h.delete(entry.id);result.entries=removed.length;
  for(const id of candidates){const q=t.objectStore('media').get(id);q.onsuccess=()=>{if(q.result){result.media++;result.bytes+=q.result.blob?.size||0;t.objectStore('media').delete(id);}};}
  const cursor=t.objectStore('chunks').openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;if(candidates.has(c.value.noteId)){result.bytes+=c.value.blob?.size||0;c.delete();}c.continue();};
 }catch(e){problem=e;t.abort();}};
 const a=t.objectStore('localities').getAll();a.onsuccess=()=>{records=a.result;finish();};
 const b=h.getAll();b.onsuccess=()=>{history=b.result;finish();};
 t.oncomplete=()=>resolve(result);t.onerror=t.onabort=()=>reject(problem||t.error||Error('Nettoyage annulé. La corbeille est conservée.'));
});}

// Compact fingerprint of exported content. Navigating without edits does not
// change revisions; a changed record, restored item or emptied trash does.
export function backupSignature(){return new Promise((resolve,reject)=>{
 const t=db.transaction(['localities','history']),parts={};
 for(const name of ['localities','history']){const q=t.objectStore(name).getAll();q.onsuccess=()=>{parts[name]=q.result.map(x=>name==='localities'?[x.id,x._rev||0]:[x.id,x.restoredAt||'']).sort((a,b)=>a[0].localeCompare(b[0]));};}
 t.oncomplete=()=>resolve(JSON.stringify([parts.localities,parts.history]));t.onerror=t.onabort=()=>reject(t.error);
});}
export function restoreTrash(id){return new Promise((resolve,reject)=>{
 const t=db.transaction(['localities','history'],'readwrite'),s=t.objectStore('localities'),h=t.objectStore('history');let problem,result;
 const q=h.get(id);q.onsuccess=()=>{const entry=q.result;if(!entry||entry.restoredAt){problem=Error('Élément déjà restauré ou introuvable.');t.abort();return;}const a=s.getAll();a.onsuccess=()=>{try{const current=a.result.find(r=>r.id===entry.record.id);result=restoreTarget(current,entry);refreshBusinessCodes(result);const codes=new Map();for(const r of [...a.result.filter(r=>r.id!==result.id),result])for(const e of entities(r)){if(!e.code)continue;const key=r.id+':'+e.code;if(codes.has(key)&&codes.get(key)!==e.id)throw Error('Code déjà utilisé : '+e.code);codes.set(key,e.id);}result._rev=(current?._rev||0)+1;result.updatedAt=now();s.put(result);h.put({...entry,restoredAt:now()});}catch(e){problem=e;t.abort();}};};
 t.oncomplete=()=>resolve(result);t.onerror=t.onabort=()=>reject(problem||t.error||Error('Restauration annulée.'));
});}
