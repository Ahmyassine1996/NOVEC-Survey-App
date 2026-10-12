import {clone,now,uuid} from './core.js';
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
export const settingsDefaults={missionCode:'ABHL175',investigator:'',transcriptionUrl:'',audioLanguage:'fr',autoTranscribe:false};
export async function getSettings(){return {...settingsDefaults,...(await get('meta','settings'))?.value};}
export const setSettings=value=>put('meta',{id:'settings',value});
export const setLast=id=>put('meta',{id:'lastRecord',value:id});
export async function blobDataURL(blob){return new Promise((res,rej)=>{const reader=new FileReader();reader.onload=()=>res(reader.result);reader.onerror=()=>rej(reader.error);reader.readAsDataURL(blob);});}
export async function dataURLBlob(url){if(!/^data:(image\/(jpeg|png|webp)|audio\/[\w.+-]+|video\/mp4|video\/webm)(;[^,]*)?;base64,/i.test(url))throw Error('Format de média non autorisé.');const [head,body]=url.split(',');const bytes=Uint8Array.from(atob(body),c=>c.charCodeAt(0));return new Blob([bytes],{type:head.slice(5).split(';')[0]});}
export async function mediaBlob(ref){if(ref.dataUrl)return dataURLBlob(ref.dataUrl);return (await get('media',ref.id))?.blob||null;}
