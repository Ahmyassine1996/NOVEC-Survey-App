import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {VERSION,newRecord,newCourse,newStructure,refreshBusinessCodes,watercourseToken,validate,trashTarget,removeTarget,restoreTarget,uuid} from '../js/core.js';
import {wordBytes,csvTables,geoJSON} from '../js/exports.js';
import {readZIP} from '../js/zip-read.js';
const make=()=>{const r=newRecord({missionCode:'N2266',investigator:'Terrain'});Object.assign(r.locality,{provinceCode:'TET',province:'Tétouan',name:'Tétouan',code:'TET091',referenceId:'L091'});return r;};
test('V1.8 : noms, numéros, OH, et identifiants backend compacts',()=>{
 assert.equal(VERSION,'1.8.0');const r=make(),w=newCourse(r,1);r.watercourses.push(w);const s=newStructure(r,w);w.structures.push(s);
 assert.equal(w.code,'TET-TETOUAN-CE1');assert.equal(s.code,'TET-TETOUAN-CE1-OH1');
 const old={id:r.id,course:w.id,structure:s.id};
 w.name='Oued Martil';refreshBusinessCodes(r);
 assert.equal(w.code,'TET-TETOUAN-MARTIL');assert.equal(s.code,'TET-TETOUAN-MARTIL-OH1');
 assert.equal(r.id,old.id);assert.equal(w.id,old.course);assert.equal(s.id,old.structure);
 assert.ok(r.id.length<36);assert.notEqual(uuid(),uuid());assert.ok(w.previousCodes.includes('TET-TETOUAN-CE1'));
});
test('V1.8 : deux cours homonymes, renommage, suppression, code non réutilisé',()=>{
 const r=make(),a=newCourse(r,1);a.type='Oued';a.name='Oued Martil';r.watercourses.push(a);refreshBusinessCodes(r);
 const b=newCourse(r,2);b.type='Oued';b.name='Oued Martil';r.watercourses.push(b);refreshBusinessCodes(r);
 assert.equal(a.code,'TET-TETOUAN-MARTIL');assert.equal(b.code,'TET-TETOUAN-MARTIL-2');
 const removed=removeTarget(r,trashTarget(r,a.id));const c=newCourse(removed,3);c.type='Oued';c.name='Martil';removed.watercourses.push(c);refreshBusinessCodes(removed);
 assert.equal(c.code,'TET-TETOUAN-MARTIL-3');
 const restored=restoreTarget(removed,{record:r,target:trashTarget(r,a.id)});
 assert.equal(restored.watercourses.length,3);
 assert.equal(restored.watercourses[0].id,a.id);
});
test('V1.8 : noms accentués et cours d’eau sans nom',()=>{
 assert.equal(watercourseToken('Oued Bou Aassila'),'BOU-AASSILA');
 assert.equal(watercourseToken('Chaâba'),'');
 const r=make(),a=newCourse(r,1);r.watercourses.push(a);refreshBusinessCodes(r);
 assert.equal(a.code,'TET-TETOUAN-CE1');
});
test('V1.8 : un autre enregistrement ne partage pas les identifiants internes',()=>{
 const a=make(),b=make(),x=newCourse(a,1),y=newCourse(b,1);a.watercourses.push(x);b.watercourses.push(y);
 assert.equal(x.code,y.code);assert.notEqual(x.id,y.id);assert.notEqual(a.id,b.id);
});
test('V1.8 : Word hiérarchisé, sans UUID visible, deux photos dans la même rangée',async()=>{
 const r=make();const w=newCourse(r,1);w.name='Oued Martil';w.type='Oued';r.watercourses.push(w);refreshBusinessCodes(r);
 const s=newStructure(r,w);s.type='Pont';s.condition='Non observable';w.structures.push(s);refreshBusinessCodes(r);
 const pic='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOjXHxkAAAAASUVORK5CYII=';
 w.photos=[{id:uuid(),kind:'photo',dataUrl:pic,width:800,height:600,photoType:'Amont'},{id:uuid(),kind:'photo',dataUrl:pic,width:600,height:800,photoType:'Aval'}];
 const zip=readZIP(new Uint8Array(await wordBytes(r)));
 const doc=new TextDecoder().decode(zip.get('word/document.xml'));
 assert.match(doc,/2\. Oued — Oued Martil/);assert.match(doc,/2\.1\. Ouvrage OH1/);
 assert.match(doc,/TET-TETOUAN-MARTIL-OH1/);
 assert.match(doc,/Photo 1 — Amont/);assert.match(doc,/Photo 2 — Aval/);
 assert.match(doc,/<w:gridCol w:w="4650"\/>/);
 assert.doesNotMatch(doc,new RegExp(r.id));assert.doesNotMatch(doc,new RegExp(w.id));
 assert.ok(zip.has('word/footer1.xml'));assert.ok(zip.has('word/media/image1.png'));assert.equal(validate(r).errors.length,0);
 assert.equal(csvTables([r])['02_COURS_EAU.csv'][1][1],w.code);
 assert.equal(geoJSON([r]).features[2].properties.code,s.code);
});
test('V1.8 : aucun appel obligatoire au terme « facultatif » dans le formulaire',async()=>{
 const app=await fs.readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.doesNotMatch(app,/facultatif/i);
 assert.match(app,/Enregistrer et terminer la visite/);
 assert.match(app,/Fiches de localités supprimées/);
});
