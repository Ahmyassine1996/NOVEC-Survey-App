export const VERSION = '1.5.0';
export const now = () => new Date().toISOString();
export const localDate = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const clone = value => structuredClone(value);
export const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const slug = value => norm(value).toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'');
export const uuid = () => crypto.randomUUID();
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function compactUUID(id) {
  let n=BigInt('0x'+id.replace(/-/g,'')), text='';
  const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  for(let i=0;i<26;i++){ text=alphabet[Number(n&31n)]+text; n>>=5n; }
  return text;
}
export async function stableUUID(seed) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(seed));
  return [...new Uint8Array(digest).slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export const codeFor = (record,kind,id) => `${record.missionCode}-${record.locality.provinceCode}-${record.locality.code}-${kind}-${compactUUID(id)}`;
export function newRecord(settings) {
  return {id:uuid(),schemaVersion:2,version:VERSION,missionCode:slug(settings.missionCode||'ABHL175'),status:'draft',createdAt:now(),updatedAt:now(),_rev:0,
    locality:{visitDate:localDate(),investigator:settings.investigator||'',province:'',provinceCode:'',commune:'',name:'',type:'',code:'',referenceId:'',gps:null,comments:'',visitStatus:'Visite réalisée'},watercourses:[],noCourse:false,audios:[],photos:[]};
}
export const coursePrefix = record => `${record.locality.provinceCode}-${record.locality.code}`;
export const shortCourseCode = (record,number) => `${coursePrefix(record)}-${String(number).padStart(3,'0')}`;
export function applyInvestigator(record,settings){if(!record.locality.investigator?.trim()&&settings.investigator?.trim()){record.locality.investigator=settings.investigator.trim();return true;}return false;}
export function newCourse(record,number=1) {
  const id=uuid();return {id,code:shortCourseCode(record,number),createdAt:now(),name:'',type:'',gps:null,photos:[],audios:[],structures:[],events:[],observations:{},exposure:[],comments:''};
}
export function newStructure(record,course) {
  const id=uuid();return {id,code:`${course.code}-OH${String((course.nextStructureNumber=(course.nextStructureNumber||0)+1)).padStart(2,'0')}`,courseId:course.id,type:'',gps:null,photos:[],audios:[],dimensions:{},comments:''};
}
export function newEvent(){return {id:uuid(),source:'',year:'',datePrecision:'Inconnue',damages:[],photos:[],audios:[],gps:null,comments:''};}
export function entities(record){const list=[record];for(const w of record.watercourses||[]){list.push(w,...w.structures||[],...w.events||[]);}return list;}
export function mediaRefs(record){return entities(record).flatMap(e=>[...(e.photos||[]),...(e.audios||[])]);}
export const observations=[['bankErosion','Érosion / effondrement de berge'],['bedErosion','Incision / érosion du fond'],['deposits','Dépôts de sédiments'],['debris','Embâcles / végétaux coincés'],['waste','Déchets dans le lit'],['overflow','Traces de débordement'],['construction','Construction dans le lit ou à proximité']];
export const exposures=['Habitations','Route / piste','Cultures','Équipement public','Réseaux','Aucun enjeu visible','Non observable'];
export const damages=['Maisons inondées','Route coupée','Dégâts agricoles','Érosion / effondrement','Ouvrage endommagé','Réseaux touchés','Autre','Aucun dégât connu','Inconnu'];
export const dimensionRules={Buse:[['openings','Nombre de buses'],['diameter','Diamètre intérieur des buses (m)'],['length','Longueur de traversée (m)']],Dalot:[['openings','Nombre d’ouvertures du dalot'],['width','Largeur intérieure par ouverture (m)'],['height','Hauteur intérieure par ouverture (m)'],['length','Longueur de traversée (m)']],Pont:[['openings','Nombre de travées / ouvertures'],['spanLength','Portée libre par travée (m)'],['height','Hauteur libre sous le pont (m)'],['width','Largeur du tablier (m)'],['length','Longueur totale du pont (m)']], 'Radier submersible':[['width','Largeur de passage (m)'],['length','Longueur (m)']],Canal:[['width','Largeur au fond (m)'],['height','Profondeur (m)']],Seuil:[['width','Largeur (m)'],['height','Hauteur visible (m)']],Barrage:[['width','Longueur de crête (m)'],['height','Hauteur visible (m)']],Autre:[]};
export const openingRules={Buse:[['diameter','Diamètre intérieur (m)']],Dalot:[['width','Largeur (m)'],['height','Hauteur (m)']],Pont:[['spanLength','Portée libre (m)'],['height','Hauteur libre (m)']]};
export function activeDimensions(s){const ignored=s.openingMode==='different'?(openingRules[s.type]||[]).map(x=>x[0]):[];return (dimensionRules[s.type]||[]).filter(([k])=>!ignored.includes(k));}
export function openingRows(s){return s.openingMode==='different'?(s.openingDimensions?.[s.type]||[]).slice(0,Math.min(100,Number(s.dimensions?.openings)||0)):[];}
export function structureSummary(s){const d=s.dimensions||{},n=d.openings;let text=n?`${n} ${s.type==='Buse'?'buse(s)':s.type==='Pont'?'travée(s)':'ouverture(s)'}`:'';
 if(s.openingMode==='different')text+=' · dimensions différentes';else if(s.type==='Buse'&&d.diameter)text+=` · Ø ${d.diameter} m`;else if(s.type==='Dalot'&&d.width&&d.height)text+=` · ${d.width} × ${d.height} m`;else if(s.type==='Pont'&&d.spanLength)text+=` · portée ${d.spanLength} m`;
 return `${text?text+' · ':''}${(s.photos||[]).length} photo(s)`;}
export function validate(record){
 const issues=[],l=record.locality;const add=(message,entity=record.id,field='',severity='error')=>issues.push({message,entity,field,severity});
 if(!/^[A-Z0-9-]{2,24}$/.test(record.missionCode))add('Renseigner le code mission.',record.id,'missionCode');
 if(!l.investigator?.trim())add('Renseigner le nom de l’enquêteur.',record.id,'locality.investigator');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(l.visitDate))add('Renseigner la date de visite.',record.id,'locality.visitDate');
 if(!l.name||!l.province||!l.code)add('Choisir la province et la localité.');
 if(!record.watercourses.length&&!record.noCourse&&l.visitStatus==='Visite réalisée')add('Ajouter un cours d’eau ou indiquer qu’aucun n’a été repéré.');
 for(const [i,w] of record.watercourses.entries()){
  const title=w.name||`Cours d’eau ${i+1}`;
  if(!w.type)add(`${title} : choisir le type.`,w.id,'type');
  if(!w.gps)add(`${title} : position du cours d’eau à compléter.`,w.id,'gps','warning');
  if(!w.photos.length)add(`${title} : aucune photo.`,w.id,'','warning');
  for(const [j,s] of (w.structures||[]).entries()){
   const name=`${s.type||'Ouvrage'} ${s.code||`${i+1}.${j+1}`}`;
   if(!s.type)add(`${name} : choisir le type.`,s.id,'type');
   let measured=false;
   for(const [key,label] of activeDimensions(s)){const v=s.dimensions?.[key];if(v!==''&&v!=null){if(key!=='openings')measured=true;if(!Number.isFinite(Number(v))||Number(v)<=0||(key==='openings'&&!Number.isInteger(Number(v))))add(`${name} : ${label} invalide.`,s.id,`dimensions.${key}`);}}
   if(s.openingMode==='different'&&openingRules[s.type]){
    const n=Number(s.dimensions?.openings);if(!Number.isInteger(n)||n<1||n>100)add(`${name} : indiquer 1 à 100 ouvertures pour les détailler.`,s.id,'dimensions.openings');
    for(const [i,row] of openingRows(s).entries())for(const [k,label] of openingRules[s.type]){const v=row[k];if(v!==''&&v!=null){measured=true;if(!Number.isFinite(Number(v))||Number(v)<=0)add(`${name}, ouverture ${i+1} : ${label} invalide.`,s.id,`openingDimensions.${s.type}.${i}.${k}`);}}
   }
   if(measured&&!s.measurementMethod)add(`${name} : préciser si les dimensions sont mesurées ou estimées.`,s.id,'measurementMethod');
  }
  for(const e of w.events||[]){if(e.height!==''&&e.height!=null&&(!Number.isFinite(Number(e.height))||Number(e.height)<0||!e.heightMethod||!e.heightReference?.trim()))add(`Crue de ${title} : hauteur, méthode et référence à préciser.`,e.id,'height');if(!e.source)add(`Crue de ${title} : préciser la source.`,e.id,'source');if(e.year&&(!/^\d{4}$/.test(e.year)||Number(e.year)<1800||Number(e.year)>new Date().getFullYear()))add(`Crue de ${title} : année invalide.`,e.id,'year');}
 }
 for(const m of mediaRefs(record)){if(m.kind==='audio'&&m.transcript&&m.transcriptStatus!=='validated')add('Une transcription reste à vérifier.',m.id,'transcript','warning');if(m.kind!=='audio'&&!m.gps)add('Une photo reste sans position GPS.',m.id,'','warning');}
 return {issues,errors:issues.filter(x=>x.severity==='error').map(x=>x.message),warnings:issues.filter(x=>x.severity==='warning').map(x=>x.message)};
}
// Corbeille : snapshots conservés, mais retrait/restauration limités à la cible.
export function trashTarget(record,id){
 if(record.id===id)return {kind:'record',id,label:record.locality.name||'Visite'};
 for(const parent of entities(record))for(const key of ['watercourses','structures','events','photos','audios']){const value=parent[key]?.find(x=>x.id===id);if(value)return {kind:key,id,parentId:parent.id,label:value.code||value.name||({photos:'Photo',audios:'Note vocale',events:'Témoignage'}[key])||'Élément',index:parent[key].indexOf(value)};}
 throw Error('Élément introuvable.');
}
export function removeTarget(record,target){if(target.kind==='record')return null;const copy=clone(record),parent=entities(copy).find(x=>x.id===target.parentId);if(!parent?.[target.kind]?.some(x=>x.id===target.id))throw Error('Élément déjà retiré.');parent[target.kind]=parent[target.kind].filter(x=>x.id!==target.id);copy.status='draft';return copy;}
export function restoreTarget(current,entry){
 const t=entry.target;if(!t)throw Error('Archive complète : utiliser la restauration de version.');
 if(t.kind==='record'){if(current)throw Error('Cette fiche existe déjà.');return clone(entry.record);}
 if(!current)throw Error('Restaurer d’abord la fiche de localité depuis la corbeille.');
 const copy=clone(current),parent=entities(copy).find(x=>x.id===t.parentId),original=entities(entry.record).find(x=>x.id===t.parentId)?.[t.kind]?.find(x=>x.id===t.id);
 if(!parent)throw Error('Restaurer d’abord le cours d’eau ou l’ouvrage parent.');if(!original)throw Error('Archive incomplète.');
 if([...entities(copy),...mediaRefs(copy)].some(x=>x.id===t.id))throw Error('Cet élément est déjà présent.');
 const existingIds=new Set([...entities(copy),...mediaRefs(copy)].map(x=>x.id));const restoredIds=[];const collect=o=>{restoredIds.push(o.id);for(const k of ['watercourses','structures','events','photos','audios'])for(const child of o[k]||[])collect(child);};collect(original);if(restoredIds.some(id=>existingIds.has(id)))throw Error('Un élément de cette archive existe déjà dans la fiche.');const items=parent[t.kind]||[];items.splice(Math.min(t.index||0,items.length),0,clone(original));parent[t.kind]=items;copy.status='draft';return copy;
}
export function requireValidImport(value){
  const records=Array.isArray(value)?value:value?.records;
  if(!Array.isArray(records)||records.length>10000)throw Error('Format de sauvegarde inconnu ou volume excessif.');
  const ids=new Set();
  for(const r of records){
    if(!r||typeof r.id!=='string'||!r.locality||typeof r.locality!=='object'||!Array.isArray(r.watercourses))throw Error('Fiche invalide dans la sauvegarde.');
    if(r.schemaVersion&&r.schemaVersion>2)throw Error('Cette sauvegarde provient d’une version plus récente.');
    if(r.schemaVersion!=null&&![1,2].includes(r.schemaVersion))throw Error('Version de sauvegarde non reconnue.');
    for(const k of ['name','province','commune','visitDate','investigator','comments'])if(r.locality[k]!=null&&typeof r.locality[k]!=='string')throw Error('Champ administratif invalide.');
    if(r.schemaVersion===2&&!/^[A-Z0-9-]{2,24}$/.test(r.missionCode||''))throw Error('Code mission invalide.');
    if(ids.has(r.id))throw Error('Deux fiches de la sauvegarde ont le même identifiant.');ids.add(r.id);
    for(const w of r.watercourses){if(!w||typeof w.id!=='string'||!Array.isArray(w.structures||[])||!Array.isArray(w.events||[])||!Array.isArray(w.exposure||[]))throw Error('Cours d’eau invalide.');}
    for(const e of entities(r)){if(e.openingDimensions!=null&&(typeof e.openingDimensions!=='object'||Object.values(e.openingDimensions).some(rows=>!Array.isArray(rows)||rows.length>100||rows.some(row=>!row||typeof row!=='object'))))throw Error('Dimensions des ouvertures invalides.');if(e.damages!=null&&(!Array.isArray(e.damages)||e.damages.some(v=>typeof v!=='string')))throw Error('Liste de dommages invalide.');if(e.dimensions!=null&&(typeof e.dimensions!=='object'||Array.isArray(e.dimensions)))throw Error('Dimensions invalides.');}
    for(const e of entities(r))for(const key of ['photos','audios'])if(e[key]!=null&&!Array.isArray(e[key]))throw Error('Liste de médias invalide.');
    const entityIds=new Set();
    for(const e of [...entities(r),...mediaRefs(r)]){if(!e||typeof e.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(e.id))throw Error('Identifiant non valide dans la sauvegarde.');if(entityIds.has(e.id))throw Error('Identifiant répété à l’intérieur d’une fiche.');entityIds.add(e.id);}
    if(r.schemaVersion===2){for(const e of entities(r).filter(e=>e!==r&&(e.structures||e.dimensions)))if(typeof e.code!=='string'||!e.code.trim())throw Error('Code permanent absent d’une fiche récente.');}
  }
  return records;
}
export async function migrateRecord(input,catalog){
  if(input.schemaVersion===2)return clone(input);
  const r=clone(input),l=r.locality||{};
  const matches=catalog.localities.filter(x=>norm(x.name)===norm(l.name)&&norm(x.province)===norm(l.province)&&(!l.commune||norm(x.commune)===norm(l.commune)));
  const ref=matches.length===1?matches[0]:null, p=catalog.provinces.find(x=>norm(x.name)===norm(l.province));
  r.schemaVersion=2;r.version=VERSION;r.missionCode=slug(r.missionCode||'ABHL175');r._rev=0;
  r.legacy={...clone(input),migrationAt:now()};r.status='draft';
  r.locality={...l,referenceId:ref?.id||'',provinceCode:ref?.provinceCode||p?.code||slug(l.province).slice(0,5)||'PROV',code:ref?.code||`HL${(await stableUUID('locality:'+r.id)).slice(0,8).toUpperCase()}`,visitStatus:'Visite réalisée',comments:l.comments||''};
  r.photos=r.photos||[];r.audios=[];r.noCourse=false;
  for(const w of r.watercourses){
    w.code=codeFor(r,'CE',await stableUUID(r.id+':'+w.id));w.photos=w.photos||[];w.audios=[];w.events=[];w.observations={};w.exposure=[];w.structures=w.structures||[];
    w.type=w.type==='Oued principal'?'Oued':w.type==='Chaâba'?'Chaâba':w.type?'Autre':'';
    for(const s of w.structures){s.code=codeFor(r,'OH',await stableUUID(r.id+':'+w.id+':'+s.id));s.photos=s.photos||[];s.audios=[];s.dimensions={};s.legacyCondition=s.condition;s.condition='';}
  }
  return r;
}
