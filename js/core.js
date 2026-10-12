export const VERSION = '1.0.0';
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
export function newCourse(record) {
  const id=uuid();return {id,code:codeFor(record,'CE',id),createdAt:now(),name:'',type:'',gps:null,photos:[],audios:[],structures:[],events:[],observations:{},exposure:[],comments:''};
}
export function newStructure(record,course) {
  const id=uuid();return {id,code:codeFor(record,'OH',id),courseId:course.id,type:'',gps:null,photos:[],audios:[],dimensions:{},comments:''};
}
export function newEvent(){return {id:uuid(),source:'',year:'',datePrecision:'Inconnue',damages:[],photos:[],audios:[],gps:null,comments:''};}
export function entities(record){const list=[record];for(const w of record.watercourses||[]){list.push(w,...w.structures||[],...w.events||[]);}return list;}
export function mediaRefs(record){return entities(record).flatMap(e=>[...(e.photos||[]),...(e.audios||[])]);}
export const observations=[['bankErosion','Érosion / effondrement de berge'],['bedErosion','Incision / érosion du fond'],['deposits','Dépôts de sédiments'],['debris','Embâcles / végétaux coincés'],['waste','Déchets dans le lit'],['overflow','Traces de débordement'],['construction','Construction dans le lit ou à proximité']];
export const exposures=['Habitations','Route / piste','Cultures','Équipement public','Réseaux','Aucun enjeu visible','Non observable'];
export const damages=['Maisons inondées','Route coupée','Dégâts agricoles','Érosion / effondrement','Ouvrage endommagé','Réseaux touchés','Autre','Aucun dégât connu','Inconnu'];
export const dimensionRules={Buse:[['diameter','Diamètre intérieur (m)'],['openings','Nombre de buses'],['length','Longueur de traversée (m)']],Dalot:[['width','Largeur intérieure par ouverture (m)'],['height','Hauteur intérieure (m)'],['openings','Nombre d’ouvertures'],['length','Longueur de traversée (m)']],Pont:[['spanLength','Portée libre par travée (m)'],['openings','Nombre d’ouvertures'],['height','Hauteur libre observée (m)']], 'Radier submersible':[['width','Largeur de passage (m)'],['length','Longueur (m)']],Canal:[['width','Largeur au fond (m)'],['height','Profondeur (m)']],Seuil:[['width','Largeur (m)'],['height','Hauteur visible (m)']],Barrage:[['width','Longueur de crête (m)'],['height','Hauteur visible (m)']],Autre:[]};
export function validate(record){
  const errors=[],warnings=[];const l=record.locality;
  if(!/^[A-Z0-9-]{2,24}$/.test(record.missionCode)) errors.push('Renseigner un code mission de 2 à 24 caractères.');
  if(!l.investigator.trim()) errors.push('Renseigner le nom de l’enquêteur.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(l.visitDate)) errors.push('Renseigner la date de visite.');
  if(!l.name||!l.province||!l.code) errors.push('Choisir la province et la localité.');
  if(!record.watercourses.length&&!record.noCourse&&l.visitStatus==='Visite réalisée') errors.push('Ajouter un cours d’eau ou indiquer qu’aucun n’a été repéré.');
  if(!l.gps) warnings.push('Position de la visite non relevée.');
  if(!l.commune) warnings.push('Commune absente du référentiel : à compléter au bureau.');
  for(const [i,w] of record.watercourses.entries()){
    if(!w.type) errors.push(`Cours d’eau ${i+1} : choisir le type.`);
    if(!w.gps) warnings.push(`Cours d’eau ${i+1} : position non relevée.`);
    if(!w.photos.length) warnings.push(`Cours d’eau ${i+1} : aucune photo.`);
    for(const [j,s] of (w.structures||[]).entries()){
      if(!s.type) errors.push(`Ouvrage ${i+1}.${j+1} : choisir le type.`);
      for(const [key,label] of dimensionRules[s.type]||[]){const v=s.dimensions?.[key];if(v!==''&&v!=null&&(!Number.isFinite(Number(v))||Number(v)<=0||(key==='openings'&&!Number.isInteger(Number(v)))))errors.push(`Ouvrage ${i+1}.${j+1} : ${label} invalide.`);}
      if(Object.entries(s.dimensions||{}).some(([k,v])=>(dimensionRules[s.type]||[]).some(([key])=>k===key)&&v!==''&&v!=null)&&!s.measurementMethod)errors.push(`Ouvrage ${i+1}.${j+1} : préciser si les dimensions sont mesurées ou estimées.`);
    }
    for(const e of w.events||[]){if(e.height!==''&&e.height!=null&&(!Number.isFinite(Number(e.height))||Number(e.height)<0||!e.heightMethod||!e.heightReference?.trim()))errors.push(`Crue du cours d’eau ${i+1} : hauteur, méthode et référence à préciser.`);if(!e.source)errors.push(`Crue du cours d’eau ${i+1} : préciser la source.`);if(e.year&&(!/^\d{4}$/.test(e.year)||Number(e.year)<1800||Number(e.year)>new Date().getFullYear()))errors.push(`Crue du cours d’eau ${i+1} : année invalide.`);}
  }
  for(const m of mediaRefs(record)){if(m.kind==='audio'&&m.transcript&&m.transcriptStatus!=='validated') warnings.push('Une transcription reste à vérifier.');if(['interrupted','empty'].includes(m.recordingState))warnings.push('Un enregistrement audio interrompu a été récupéré : le réécouter.');}
  return {errors,warnings:[...new Set(warnings)]};
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
    for(const e of entities(r)){if(e.damages!=null&&(!Array.isArray(e.damages)||e.damages.some(v=>typeof v!=='string')))throw Error('Liste de dommages invalide.');if(e.dimensions!=null&&(typeof e.dimensions!=='object'||Array.isArray(e.dimensions)))throw Error('Dimensions invalides.');}
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
