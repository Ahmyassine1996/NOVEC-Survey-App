import {uuid,now,mediaRefs} from './core.js';
import {put,getAll,remove,mediaBlob} from './storage.js';
export const gpsText = gps => !gps?'Position non relevée':`${Number(gps.lat).toFixed(6)}, ${Number(gps.lon).toFixed(6)}${gps.accuracy!=null?` · précision ±${Math.round(gps.accuracy)} m`:gps.source==='manual'?' · point saisi manuellement':' · précision inconnue'}`;
export function getGPS(){return new Promise((resolve,reject)=>{
  if(!navigator.geolocation){reject(Error('GPS indisponible sur ce navigateur.'));return;}
  navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy,at:new Date(p.timestamp).toISOString(),source:'device'}),e=>reject(Error(e.code===1?'Accès à la localisation refusé. Autorisez-le dans le navigateur ou saisissez les coordonnées.':e.code===3?'Le GPS ne répond pas. Réessayez à ciel ouvert.':'Position GPS indisponible.')),{enableHighAccuracy:true,timeout:12000,maximumAge:0});
});}
export async function photoFromFile(file,owner,origin='gallery'){
  if(file.size>40*1024*1024)throw Error('Photo trop volumineuse (40 Mo maximum).');
  if(!file.type.startsWith('image/'))throw Error('Sélectionner une image.');
  const u=URL.createObjectURL(file),image=new Image();
  try{await new Promise((res,rej)=>{image.onload=res;image.onerror=()=>rej(Error('Image non lisible. Utiliser JPEG, PNG ou WebP.'));image.src=u;});
    const scale=Math.min(1,1800/Math.max(image.naturalWidth,image.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(image.naturalWidth*scale));c.height=Math.max(1,Math.round(image.naturalHeight*scale));c.getContext('2d').drawImage(image,0,0,c.width,c.height);
    const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',.85));if(!blob)throw Error('Compression de la photo impossible.');
    const id=uuid(),meta={id,kind:'photo',createdAt:now(),ownerId:owner.id,photoType:'Vue générale',origin,gps:null,gpsMeaning:'Position au moment de l’ajout',fileName:`PHOTO_${id}.jpg`,width:c.width,height:c.height};
    await put('media',{id,blob,kind:'photo',createdAt:meta.createdAt});return meta;
  }finally{URL.revokeObjectURL(u);}
}
let active=null;
export const isRecording=()=>!!active;
export async function startRecording({record,owner,language,save,onTick,onFinish,onError}){
  if(active)throw Error('Un enregistrement est déjà en cours.');
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('Enregistrement non disponible. Vous pouvez joindre un audio enregistré avec le téléphone.');
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  const type=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  let recorder;try{recorder=new MediaRecorder(stream,type?{mimeType:type,audioBitsPerSecond:64000}:undefined);}catch(e){stream.getTracks().forEach(t=>t.stop());throw e;}
  const note={id:uuid(),kind:'audio',ownerId:owner.id,createdAt:now(),language,recordingState:'recording',transcriptStatus:'pending',transcript:'',transcriptOriginal:'',gps:null,duration:0,mimeType:recorder.mimeType};
  owner.audios=owner.audios||[];owner.audios.push(note);
  try{await save();}catch(e){stream.getTracks().forEach(t=>t.stop());owner.audios=owner.audios.filter(x=>x.id!==note.id);throw e;}
  const chunks=[],started=Date.now();let serial=Promise.resolve(),index=0,failed=false,resolveDone,rejectDone;
  const done=new Promise((res,rej)=>{resolveDone=res;rejectDone=rej;});done.catch(()=>{});
  active={recorder,note,done,stopping:false};
  recorder.ondataavailable=e=>{if(!e.data.size)return;chunks.push(e.data);const chunk={id:`${note.id}:${index++}`,noteId:note.id,index:index-1,blob:e.data,mimeType:recorder.mimeType};serial=serial.then(()=>put('chunks',chunk)).catch(err=>{failed=true;onError(Error('Stockage audio indisponible : '+err.message));if(recorder.state!=='inactive')recorder.stop();});};
  recorder.onerror=()=>{failed=true;if(recorder.state!=='inactive')recorder.stop();};
  let wakeLock=null;try{wakeLock=await navigator.wakeLock?.request('screen');}catch{}
  const timer=setInterval(()=>{note.duration=Math.round((Date.now()-started)/1000);onTick(note.duration);if(note.duration>=180)stopRecording().catch(onError);},500);
  const hidden=()=>{if(document.visibilityState==='hidden'){failed=true;stopRecording().catch(onError);}};
  document.addEventListener('visibilitychange',hidden);
  recorder.onstop=async()=>{
    clearInterval(timer);document.removeEventListener('visibilitychange',hidden);stream.getTracks().forEach(t=>t.stop());try{await wakeLock?.release();}catch{}
    try{await serial;const blob=new Blob(chunks,{type:recorder.mimeType});if(!blob.size)throw Error('Aucun son enregistré. Réessayez et vérifiez le microphone.');
      await put('media',{id:note.id,blob,kind:'audio',createdAt:note.createdAt});note.mimeType=blob.type;note.fileName=`AUDIO_${note.id}.${audioExtension(blob.type)}`;note.duration=Math.round((Date.now()-started)/1000);note.recordingState=failed?'interrupted':'saved';await save();
      for(let i=0;i<index;i++)await remove('chunks',`${note.id}:${i}`);active=null;await onFinish(note);resolveDone(note);
    }catch(e){note.recordingState=chunks.length?'interrupted':'empty';active=null;try{await save();}catch{}onError(e);rejectDone(e);}
  };
  stream.getAudioTracks()[0].onended=()=>{failed=true;stopRecording().catch(onError);};
  try{recorder.start(1000);onTick(0);getGPS().then(g=>{note.gps=g;return save();}).catch(()=>{});}catch(e){clearInterval(timer);document.removeEventListener('visibilitychange',hidden);stream.getTracks().forEach(t=>t.stop());try{await wakeLock?.release();}catch{}active=null;note.recordingState='empty';await save();throw e;}
  return note;
}
export async function stopRecording(){if(!active)return;const state=active;if(!state.stopping&&state.recorder.state!=='inactive'){state.stopping=true;state.recorder.stop();}return state.done;}
export const audioExtension=mime=>mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':mime.includes('mpeg')?'mp3':mime.includes('wav')?'wav':'webm';
export async function attachAudio(file,owner,language){if(file.size>24*1024*1024)throw Error('Audio trop volumineux (24 Mo maximum).');if(!/^(audio\/|video\/(mp4|webm))/.test(file.type))throw Error('Format audio non pris en charge.');const id=uuid();await put('media',{id,kind:'audio',blob:file,createdAt:now()});return {id,kind:'audio',createdAt:now(),ownerId:owner.id,language,mimeType:file.type,fileName:`AUDIO_${id}.${audioExtension(file.type)}`,recordingState:'saved',transcriptStatus:'pending',transcript:'',transcriptOriginal:''};}
export async function recoverAudio(records,save){
  const chunks=await getAll('chunks');let recovered=0;
  for(const r of records){let changed=false;for(const note of mediaRefs(r).filter(m=>m.kind==='audio')){
    const parts=chunks.filter(c=>c.noteId===note.id).sort((a,b)=>a.index-b.index);
    if(note.recordingState==='recording'||parts.length){const existing=await mediaBlob(note);if(parts.length&&!existing){const blob=new Blob(parts.map(p=>p.blob),{type:parts[0].mimeType});await put('media',{id:note.id,blob,kind:'audio',createdAt:note.createdAt});note.mimeType=blob.type;note.fileName=`AUDIO_${note.id}.${audioExtension(blob.type)}`;}
      note.recordingState=(existing||parts.length)?'interrupted':'empty';changed=true;recovered++;
    }
  }if(changed){await save(r);for(const note of mediaRefs(r))for(const p of chunks.filter(c=>c.noteId===note.id))await remove('chunks',p.id);}}
  return recovered;
}
export function validateEndpoint(value){if(!value)return '';const u=new URL(value);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('Le service de transcription doit utiliser HTTPS.');if(u.username||u.password||u.search||u.hash)throw Error('URL sans identifiant, paramètres ou fragment.');return u.href;}
export async function transcribe(note,settings,token){
  if(!settings.transcriptionUrl)throw Error('Configurez le service de transcription dans Réglages.');
  if(!navigator.onLine)throw Error('Transcription en attente de connexion. L’audio est conservé.');
  const blob=await mediaBlob(note);if(!blob?.size)throw Error('Fichier audio introuvable.');if(blob.size>24*1024*1024)throw Error('Audio trop volumineux pour ce service (24 Mo maximum).');
  const body=new FormData();body.append('file',blob,note.fileName||`audio.${audioExtension(blob.type)}`);if(note.language!=='auto')body.append('language',note.language);
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),120000);
  const previousText=note.transcript||'';
  try{const response=await fetch(validateEndpoint(settings.transcriptionUrl),{method:'POST',body,headers:token?{Authorization:`Bearer ${token}`}:{},signal:abort.signal,credentials:'omit'});if(!response.ok)throw Error(response.status===401?'Code d’accès du service incorrect ou absent.':response.status===415?'Format non transcrit par ce service. Exporter puis convertir en WAV ou M4A.':`Service de transcription indisponible (${response.status}).`);const result=await response.json();if(typeof result.text!=='string'||!result.text.trim())throw Error('Aucun texte reconnu. Réécoutez l’audio.');note.transcriptOriginal=result.text;if((note.transcript||'')===previousText)note.transcript=result.text;note.transcriptStatus='review';note.transcribedAt=now();note.transcriptionError='';return result.text;
  }finally{clearTimeout(timer);}
}
