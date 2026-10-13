import {clone,now,uuid,coursePrefix,shortCourseCode,trashTarget,removeTarget,restoreTarget,entities} from './core.js';
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
  const q=s.get(copy.id);q.onsuccess=()=>{try{const old=q.result;if(old&&(old._rev||0)!==(copy._rev||0)){conflict=true;t.abort();return;}copy._rev=(old?._rev||0)+1;copy.updatedAt=now();s.put(copy);}catch(error){operationError=error;t.abort();}};
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
 const scan=r=>{if(r?.missionCode!==record.missionCode)return;for(const w of r.watercourses||[]){if(w.code?.startsWith(prefix+'-')){const suffix=w.code.slice(prefix.length+1);if(/^\d+$/.test(suffix))maximum=Math.max(maximum,Number(suffix));}}};
 const done=()=>{if(--pending===0){answer=maximum+1;meta.put({id,value:answer});}};
 const q=meta.get(id);q.onsuccess=()=>{maximum=Math.max(maximum,q.result?.value||0);done();};
 const a=t.objectStore('localities').getAll();a.onsuccess=()=>{a.result.forEach(scan);done();};
 const h=t.objectStore('history').getAll();h.onsuccess=()=>{h.result.forEach(x=>scan(x.record));done();};
 t.oncomplete=()=>resolve(answer);t.onerror=t.onabort=()=>reject(t.error||Error('Numérotation interrompue.'));
});}
export async function simplifyCodes(){
 const records=await getAll(),seen=new Set();let count=0;
 for(const r of records){let changed=false;const before=clone(r);
  for(const w of r.watercourses||[]){const prefix=coursePrefix(r),suffix=w.code?.startsWith(prefix+'-')?w.code.slice(prefix.length+1):'',key=r.missionCode+':'+w.code;
   if(!/^\d+$/.test(suffix)||seen.has(key)){w.previousCodes=[...new Set([...(w.previousCodes||[]),w.code].filter(Boolean))];w.code=shortCourseCode(r,await reserveCourseNumber(r));changed=true;count++;}
   seen.add(r.missionCode+':'+w.code);
   let n=Math.max(w.nextStructureNumber||0,...(w.structures||[]).map(x=>{const suffix=x.code?.startsWith(w.code+'-OH')?x.code.slice((w.code+'-OH').length):'';return /^\d+$/.test(suffix)?Number(suffix):0;}));
   for(const structure of w.structures||[]){const suffix=structure.code?.startsWith(w.code+'-OH')?structure.code.slice((w.code+'-OH').length):'';if(!/^\d+$/.test(suffix)){structure.previousCodes=[...new Set([...(structure.previousCodes||[]),structure.code].filter(Boolean))];structure.code=`${w.code}-OH${String(++n).padStart(2,'0')}`;changed=true;}}
   if(w.nextStructureNumber!==n){w.nextStructureNumber=n;changed=true;}

  }
  if(changed){await put('history',{id:uuid(),record:before,at:now(),reason:'Avant simplification des codes v1.1'});await saveRecord(r);}
 }
 return count;
}

export function trashRecord(record,id){return new Promise((resolve,reject)=>{
 const before=clone(record),target=trashTarget(before,id),after=removeTarget(before,target),entry={id:uuid(),record:before,target,at:now(),reason:'Corbeille',kind:'trash'};
 const t=db.transaction(['localities','history'],'readwrite'),s=t.objectStore('localities');let problem;
 const q=s.get(record.id);q.onsuccess=()=>{try{if(!q.result||(q.result._rev||0)!==(record._rev||0))throw Error('La fiche a changé. Rouvrez-la.');t.objectStore('history').put(entry);if(after){after._rev=(q.result._rev||0)+1;after.updatedAt=now();s.put(after);}else s.delete(record.id);}catch(e){problem=e;t.abort();}};
 t.oncomplete=()=>resolve(after);t.onerror=t.onabort=()=>reject(problem||t.error||Error('Suppression annulée.'));
});}
export function restoreTrash(id){return new Promise((resolve,reject)=>{
 const t=db.transaction(['localities','history'],'readwrite'),s=t.objectStore('localities'),h=t.objectStore('history');let problem,result;
 const q=h.get(id);q.onsuccess=()=>{const entry=q.result;if(!entry||entry.restoredAt){problem=Error('Élément déjà restauré ou introuvable.');t.abort();return;}const a=s.getAll();a.onsuccess=()=>{try{const current=a.result.find(r=>r.id===entry.record.id);result=restoreTarget(current,entry);const codes=new Map();for(const r of [...a.result.filter(r=>r.id!==result.id),result])for(const e of entities(r)){if(!e.code)continue;const key=r.missionCode+':'+e.code;if(codes.has(key)&&codes.get(key)!==e.id)throw Error('Code déjà utilisé : '+e.code);codes.set(key,e.id);}result._rev=(current?._rev||0)+1;result.updatedAt=now();s.put(result);h.put({...entry,restoredAt:now()});}catch(e){problem=e;t.abort();}};};
 t.oncomplete=()=>resolve(result);t.onerror=t.onabort=()=>reject(problem||t.error||Error('Restauration annulée.'));
});}
