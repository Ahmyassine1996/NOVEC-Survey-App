import test from 'node:test';
import assert from 'node:assert/strict';
import {newRecord,newCourse,newStructure} from '../js/core.js';
import {buildLocalityZIP} from '../js/exports.js';

function demo(id,name){
 const r=newRecord({missionCode:'N2266',investigator:'Enqueteur Test'});
 r.locality={...r.locality,name,province:'Taroudannt',provinceCode:'TAR',commune:'Commune test',code:'LOC01'};
 r.locality.gps={lat:30.4,lon:-8.7,accuracy:5};
 r.id=id;
 const w=newCourse(r,1);w.type='Oued';w.name='Oued Test';
 const s=newStructure(r,w);s.type='Buse';s.dimensions={diameter:1.2,openings:2};s.measurementMethod='Mesure au ruban / télémètre';w.structures.push(s);
 r.watercourses.push(w);
 return r;
}

test('ZIP complet contient un dossier distinct par localité, chaque Word, CSV et GeoJSON',async()=>{
 const blob=await buildLocalityZIP([demo('record-a-123','Localite A'),demo('record-b-456','Localite B')]);
 const bytes=new Uint8Array(await blob.arrayBuffer());
 assert.ok(bytes.length>4000);
 const text=new TextDecoder('utf-8',{fatal:false}).decode(bytes);
 for(const term of ['LOCALITE-A','LOCALITE-B','Fiche_','01_LOCALITES.csv','SIG/POINTS_WGS84.geojson','LIRE_EN_PREMIER.txt'])assert.ok(text.includes(term),term);
 if(process.env.TEST_ZIP_OUTPUT){const fs=await import('node:fs/promises');await fs.writeFile(process.env.TEST_ZIP_OUTPUT,bytes);}
});
