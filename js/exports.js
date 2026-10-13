import {VERSION,now,clone,mediaRefs,entities,requireValidImport,migrateRecord,observations,dimensionRules,slug} from './core.js';
import {getAll,blobDataURL,dataURLBlob,mediaBlob,batchImport,get} from './storage.js';
import {zipStore,strBytes,wordP,wordKVTable,wordImage,xmlEscape} from './word-base.js';
import {gpsText} from './media.js';
export function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export async function backup(records=null){
  const list=records||await getAll(),history=records?[]:await getAll('history'),ids=new Set([...list,...history.map(x=>x.record)].flatMap(mediaRefs).filter(m=>!m.dataUrl&&m.recordingState!=='empty').map(m=>m.id));const media=[];
  for(const id of ids){const m=await get('media',id);if(!m?.blob)throw Error('Un média est manquant. Réécoutez les enregistrements interrompus avant de sauvegarder.');media.push({id,kind:m.kind,createdAt:m.createdAt,dataUrl:await blobDataURL(m.blob)});}
  return {format:'NOVEC_SURVEY_BACKUP',schemaVersion:2,appVersion:VERSION,exportedAt:now(),records:clone(list),media,history};
}
export async function exportBackup(records=null){const data=await backup(records);download(new Blob([JSON.stringify(data)],{type:'application/json'}),`NOVEC_Sauvegarde_${new Date().toISOString().slice(0,10)}${records?'_visite':''}.json`);return data;}
export async function importBackup(file,catalog,choose){
  if(file.size>250*1024*1024)throw Error('Sauvegarde trop volumineuse (250 Mo). Importez des sauvegardes par visite.');
  let payload;try{payload=JSON.parse(await file.text());}catch{throw Error('Le fichier ne contient pas un JSON valide.');}
  const raw=requireValidImport(payload),existing=await getAll(),byId=new Map(existing.map(r=>[r.id,r]));let skipped=0;const candidates=[];
  for(const r of raw){const old=byId.get(r.id);if(old&&JSON.stringify({...old,_rev:0})===JSON.stringify({...r,_rev:0})){skipped++;continue;}candidates.push(r);}
  const conflicts=candidates.filter(r=>byId.has(r.id)).length;
  const replace=conflicts?await choose(conflicts):false;
  const selected=candidates.filter(r=>!byId.has(r.id)||replace);skipped+=candidates.length-selected.length;
  const records=[];for(const r of selected)records.push(await migrateRecord(r,catalog));
  // Check global identifier collisions before the transaction; never rename an imported code silently.
  const retained=existing.filter(r=>!records.some(x=>x.id===r.id)),codes=new Map();
  for(const r of [...retained,...records])for(const e of entities(r).slice(1)){if(!e.code)continue;const previous=codes.get(r.missionCode+':'+e.code);if(previous&&previous!==`${r.id}:${e.id}`)throw Error(`Code déjà utilisé dans une autre fiche : ${e.code}. Import annulé, vérifier les fichiers sources.`);codes.set(r.missionCode+':'+e.code,`${r.id}:${e.id}`);}
  const history=[];
  if(payload.history!=null&&!Array.isArray(payload.history))throw Error('Archives invalides.');
  if((payload.history||[]).length>10000)throw Error('Trop d’archives dans la sauvegarde.');
  for(const h of payload.history||[]){if(!h||typeof h.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(h.id)||typeof h.at!=='string')throw Error('Archive invalide.');requireValidImport([h.record]);const existingHistory=await get('history',h.id);if(existingHistory&&JSON.stringify(existingHistory)!==JSON.stringify(h))throw Error('Une archive de même identifiant est différente.');history.push(h);}
  const needed=new Set([...records,...history.map(h=>h.record)].flatMap(mediaRefs).filter(m=>!m.dataUrl&&m.recordingState!=='empty').map(m=>m.id));
  if(payload.media!=null&&!Array.isArray(payload.media))throw Error('Liste des médias invalide.');
  const media=[],seen=new Set();for(const m of payload.media||[]){if(!needed.has(m.id))continue;if(seen.has(m.id))throw Error('Média en double dans la sauvegarde.');seen.add(m.id);const blob=await dataURLBlob(m.dataUrl);const stored=await get('media',m.id);if(stored?.blob){const [a,b]=await Promise.all([stored.blob.arrayBuffer(),blob.arrayBuffer()]);const aa=new Uint8Array(a),bb=new Uint8Array(b);if(aa.length!==bb.length||aa.some((x,i)=>x!==bb[i]))throw Error('Un média de même identifiant a un contenu différent. Import annulé.');}media.push({id:m.id,kind:m.kind,createdAt:m.createdAt,blob});}
  for(const id of needed)if(!seen.has(id)&&!(await get('media',id))?.blob)throw Error('Sauvegarde incomplète : un média est absent.');
  await batchImport(records,media,true,history);return {imported:records.length,skipped};
}
export function csv(rows){return '\uFEFF'+rows.map(row=>row.map(value=>{let s=Array.isArray(value)?value.join(' | '):String(value??'');if(typeof value==='string'&&/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');}
export function csvTables(records,paths={}){
  const tables={
    '01_LOCALITES.csv':[['ID_VISITE','MISSION','ID_REFERENTIEL','CODE_LOCALITE','DATE','ENQUETEUR','PROVINCE','CODE_PROVINCE','COMMUNE','LOCALITE','TYPE_DU','PHASE','VISITE','STATUT','LAT','LON','PRECISION_M','SOURCE_GPS','DATE_GPS','AUCUN_COURS_REPERE','COMMENTAIRE']],
    '02_COURS_EAU.csv':[['ID_CE','CODE_CE','ID_VISITE','NOM','TYPE','SITUATION','LAT','LON','PRECISION_M','ENJEUX_VISIBLES','COMMENTAIRE']],
    '03_OUVRAGES.csv':[['ID_OH','CODE_OH','ID_CE','CODE_CE','ID_VISITE','TYPE','MATERIAU','ETAT_VISIBLE','OBSTRUCTION','DEBORDEMENT_VISIBLE','METHODE_DIMENSIONS','LARGEUR_M','HAUTEUR_M','DIAMETRE_M','NB_OUVERTURES','PORTEE_M','LONGUEUR_M','LAT','LON','PRECISION_M','COMMENTAIRE']],
    '04_CRUES.csv':[['ID_CRUE','ID_CE','CODE_CE','ID_VISITE','SOURCE','ANNEE','PRECISION_DATE','DOMMAGES_RAPPORTES','REPERE','HAUTEUR_M','REFERENCE_HAUTEUR','METHODE_HAUTEUR','LAT','LON','COMMENTAIRE']],
    '05_MEDIAS.csv':[['ID_MEDIA','ID_VISITE','ID_PARENT','CODE_PARENT','NATURE','FICHIER','CHEMIN_EXPORT','TYPE_PHOTO','DATE_AJOUT','LAT','LON','PRECISION_M','SIGNIFICATION_GPS','ORIGINE']],
    '06_AUDIOS.csv':[['ID_AUDIO','ID_VISITE','ID_PARENT','LANGUE','DUREE_S','ETAT_AUDIO','ETAT_TRANSCRIPTION','TRANSCRIPTION_BRUTE','TRANSCRIPTION_CORRIGEE','DATE_VALIDATION']]
  };
  for(const r of records){const l=r.locality,g=l.gps||{};
    tables['01_LOCALITES.csv'].push([r.id,r.missionCode,l.referenceId,l.code,l.visitDate,l.investigator,l.province,l.provinceCode,l.commune,l.name,l.type,l.phase,l.visitStatus,r.status,g.lat,g.lon,g.accuracy,g.source,g.at,r.noCourse,l.comments]);
    for(const w of r.watercourses){const g=w.gps||{};tables['02_COURS_EAU.csv'].push([w.id,w.code,r.id,w.name,w.type,w.situation,g.lat,g.lon,g.accuracy,w.exposure,w.comments]);
      for(const s of w.structures||[]){const g=s.gps||{},d=s.dimensions||{},active=Object.fromEntries((dimensionRules[s.type]||[]).map(([k])=>[k,d[k]]));tables['03_OUVRAGES.csv'].push([s.id,s.code,w.id,w.code,r.id,s.type,s.material,s.condition,s.obstruction,s.overflow,s.measurementMethod,active.width,active.height,active.diameter,active.openings,active.spanLength,active.length,g.lat,g.lon,g.accuracy,s.comments]);}
      for(const e of w.events||[])tables['04_CRUES.csv'].push([e.id,w.id,w.code,r.id,e.source,e.year,e.datePrecision,e.damages,e.marker,e.height,e.heightReference,e.heightMethod,e.gps?.lat,e.gps?.lon,e.comments]);
    }
    for(const e of entities(r))for(const m of [...e.photos||[],...e.audios||[]]){const g=m.gps||{};tables['05_MEDIAS.csv'].push([m.id,r.id,e.id,e.code,m.kind||'photo',m.fileName,paths[m.id]||'',m.photoType,m.createdAt,g.lat,g.lon,g.accuracy,m.gpsMeaning,m.origin]);if(m.kind==='audio')tables['06_AUDIOS.csv'].push([m.id,r.id,e.id,m.language,m.duration,m.recordingState,m.transcriptStatus,m.transcriptOriginal,m.transcript,m.validatedAt]);}
  }return tables;
}
export function geoJSON(records){const features=[];for(const r of records){for(const e of entities(r)){const g=e===r?r.locality.gps:e.gps;const valid=g&&Number.isFinite(g.lat)&&Number.isFinite(g.lon)&&Math.abs(g.lat)<=90&&Math.abs(g.lon)<=180;features.push({type:'Feature',id:e.id,geometry:valid?{type:'Point',coordinates:[g.lon,g.lat]}:null,properties:{id:e.id,code:e.code||r.locality.code,visitId:r.id,mission:r.missionCode,province:r.locality.province,locality:r.locality.name,name:e.name||'',type:e===r?'Visite':e.structures?'Cours d’eau':e.dimensions?'Ouvrage':'Crue',accuracy:g?.accuracy??null,positionSource:g?.source||null}});}}return {type:'FeatureCollection',features};}
export async function exportBundle(records){
  const files=[],paths={},seen=new Set();
  for(const r of records)for(const m of mediaRefs(r)){
    if(m.recordingState==='empty'||seen.has(m.id))continue;seen.add(m.id);const blob=await mediaBlob(m);if(!blob)throw Error('Un média est manquant ; export annulé.');
    const ext=m.kind==='audio'?(blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':blob.type.includes('mpeg')?'mp3':blob.type.includes('wav')?'wav':'webm'):(blob.type.includes('png')?'png':'jpg');
    const name=`medias/${slug(m.id)}.${ext}`;paths[m.id]=name;files.push({name,data:new Uint8Array(await blob.arrayBuffer())});
  }
  files.unshift(...Object.entries(csvTables(records,paths)).map(([name,rows])=>({name,data:strBytes(csv(rows))})));
  files.push({name:'07_POINTS_WGS84.geojson',data:strBytes(JSON.stringify(geoJSON(records)))});
  files.push({name:'LISEZ_MOI.txt',data:strBytes('CSV séparés par point-virgule, UTF-8. Coordonnées GeoJSON : WGS84 longitude, latitude. La colonne CHEMIN_EXPORT du tableau MEDIAS donne le chemin exact de chaque fichier. Les transcriptions doivent être relues. Pour restaurer dans l’application, utiliser la sauvegarde JSON complète. Les champs historiques de v0.5 sont conservés dans la sauvegarde JSON.')});
  download(new Blob([zipStore(files)],{type:'application/zip'}),`NOVEC_Exports_${new Date().toISOString().slice(0,10)}.zip`);
}
export async function wordBytes(r){
  let body=wordP('NOVEC SURVEY',{center:true,bold:true,size:32,color:'215D60'})+wordP('Fiche de reconnaissance terrain',{center:true,size:25})+wordKVTable([['Mission',r.missionCode],['Visite',r.id],['Localité',r.locality.name],['Province / commune',`${r.locality.province} / ${r.locality.commune||'À compléter'}`],['Enquêteur',r.locality.investigator],['Date',r.locality.visitDate],['Statut',r.status==='completed'?'Terminée':'Brouillon'],['Conditions de visite',r.locality.visitStatus],['GPS',gpsText(r.locality.gps)],['Observations',r.locality.comments]]);
  const images=[],rels=[];
  const appendMedia=async e=>{for(const p of e.photos||[]){const blob=await mediaBlob(p);if(!blob)throw Error('Photo absente : '+p.id);const n=images.length+1,rel='rId'+n,ext=blob.type.includes('png')?'png':'jpg',name=`image${n}.${ext}`;images.push({name:'word/media/'+name,data:new Uint8Array(await blob.arrayBuffer())});rels.push(`<Relationship Id="${rel}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`);let img=wordImage(rel,name,`${p.photoType||'Photo'} — ${p.id}`,gpsText(p.gps));if(p.width&&p.height){const h=Math.round(4800000*p.height/p.width);const scale=Math.min(1,6000000/h);img=img.replaceAll('4800000',String(Math.round(4800000*scale))).replaceAll('3600000',String(Math.round(h*scale)));}body+=img;}for(const a of e.audios||[]){body+=wordP(`Note vocale ${a.id}`,{bold:true});body+=wordP(`Transcription ${a.transcriptStatus==='validated'?'validée':'à vérifier / en attente'} : ${a.transcript||'Non disponible'}`);}};
  await appendMedia(r);
  for(const [i,w] of r.watercourses.entries()){
    body+=wordP(`${i+1}. ${w.type||'Cours d’eau'} — ${w.name||'Sans nom connu'}`,{bold:true,size:25,keep:true})+wordKVTable([['Code',w.code],['GPS',gpsText(w.gps)],['Situation',w.situation],['Enjeux visibles',(w.exposure||[]).join(', ')],['Note',w.comments]]);await appendMedia(w);
    for(const s of w.structures||[]){body+=wordP('Ouvrage — '+(s.type||''),{bold:true,size:22,keep:true})+wordKVTable([['Code',s.code],['Matériau',s.material],['GPS',gpsText(s.gps)],['État visible',s.condition],['Obstruction',s.obstruction],['Traces de débordement',s.overflow],['Méthode dimensions',s.measurementMethod],...(dimensionRules[s.type]||[]).map(([k,v])=>[v,s.dimensions?.[k]]),['Note',s.comments]]);await appendMedia(s);}
    for(const e of w.events||[]){body+=wordP('Crue connue / témoignage',{bold:true,size:22,keep:true})+wordKVTable([['Source',e.source],['Année',e.year||'Inconnue'],['Précision',e.datePrecision],['Dommages rapportés',(e.damages||[]).join(', ')],['Repère',e.marker],['Hauteur (m)',e.height],['Référence de hauteur',e.heightReference],['Méthode',e.heightMethod],['GPS',gpsText(e.gps)],['Note',e.comments]]);await appendMedia(e);}
  }
  if(r.legacy)body+=wordP('Données historiques de la version précédente',{bold:true,size:22})+wordP(JSON.stringify(r.legacy,(k,v)=>k==='dataUrl'?'[photo conservée]':v));
  body+='<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="900" w:bottom="850" w:left="900"/></w:sectPr>';
  const document=`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}</w:body></w:document>`;
  const types='<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  const relRoot='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  return zipStore([{name:'[Content_Types].xml',data:strBytes(types)},{name:'_rels/.rels',data:strBytes(relRoot+'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')},{name:'word/document.xml',data:strBytes(document)},{name:'word/_rels/document.xml.rels',data:strBytes(relRoot+rels.join('')+'</Relationships>')},...images]);
}
export async function exportWord(r){download(new Blob([await wordBytes(r)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),`Fiche_NOVEC_${slug(r.locality.provinceCode||r.locality.province)}_${slug(r.locality.code||r.id.slice(0,8))}_${slug(r.locality.name).slice(0,45)||'Visite'}.docx`);}


// Un ZIP lisible : un dossier par localité, contenant la fiche Word, les CSV,
// les points GeoJSON et les médias originaux (JPG avec coordonnées EXIF).
export async function buildLocalityZIP(records){
  const files=[];
  for(const r of records){
    const existing=new Set();
    const paths={};
    const folder=`${slug(r.locality?.province||'PROVINCE').slice(0,24)||'PROVINCE'}/${slug(r.locality?.name||'LOCALITE').slice(0,44)||'LOCALITE'}_${r.id.slice(0,8)}/`;
    const getMediaOwners=[];
    for(const e of entities(r)) for(const m of [...(e.photos||[]),...(e.audios||[])])getMediaOwners.push({e,m});
    for(const {e,m} of getMediaOwners){
      if(m.recordingState==='empty'||existing.has(m.id))continue;existing.add(m.id);
      const blob=await mediaBlob(m);if(!blob)throw Error(`Média absent dans ${r.locality?.name||'la fiche'} : ${m.id}`);
      const ext=m.kind==='audio'?(blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':blob.type.includes('mpeg')?'mp3':blob.type.includes('wav')?'wav':'webm'):(blob.type.includes('png')?'png':'jpg');
      const parent=slug(e.code||e.name||'LOCALITE').slice(0,58)||'LOCALITE';
      const kind=m.kind==='audio'?'AUDIOS':'PHOTOS';
      const typ=slug(m.photoType||'PHOTO').slice(0,24)||'PHOTO';
      const name=`${folder}${kind}/${parent}_${typ}_${m.id.slice(0,8)}.${ext}`;
      paths[m.id]=name;
      files.push({name,data:new Uint8Array(await blob.arrayBuffer())});
    }
    files.push({name:`${folder}Fiche_${slug(r.locality?.name||'LOCALITE').slice(0,48)}.docx`,data:await wordBytes(r)});
    for(const [name,rows] of Object.entries(csvTables([r],paths))){
      files.push({name:`${folder}TABLEAUX/${name}`,data:strBytes(csv(rows))});
    }
    files.push({name:`${folder}SIG/POINTS_WGS84.geojson`,data:strBytes(JSON.stringify(geoJSON([r]),null,2))});
    files.push({name:`${folder}LIRE_EN_PREMIER.txt`,data:strBytes(
      `NOVEC Survey — ${r.locality?.name||'Localité'}\nMission : ${r.missionCode}\nDate : ${r.locality?.visitDate||''}\n`+
      'Le document Word contient les observations et les photos. Les photos JPG figurent aussi dans PHOTOS/ avec leurs métadonnées GPS EXIF lorsqu’elles ont été saisies par la version correspondante. Les CSV sont UTF-8 et séparés par des points-virgules. Le GeoJSON contient les points en WGS84. Cette exportation n’est PAS une sauvegarde restaurable ; utilisez la sauvegarde JSON dans Paramètres pour cela.\n')});
  }
  return new Blob([zipStore(files)],{type:'application/zip'});
}
export async function exportLocalityZIP(records){
  const blob=await buildLocalityZIP(records);
  const label=records.length===1?`_${slug(records[0].locality?.name||'LOCALITE').slice(0,55)}`:'_TOUTES_LOCALITES';
  download(blob,`NOVEC_Survey${label}_${new Date().toISOString().slice(0,10)}.zip`);
}
