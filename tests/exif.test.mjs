import test from 'node:test';
import assert from 'node:assert/strict';
import {embedGPSInJPEG} from '../js/exif-gps.js';
const read16=(v,o)=>v[o]|(v[o+1]<<8);
const read32=(v,o)=>((v[o]|(v[o+1]<<8)|(v[o+2]<<16)|(v[o+3]<<24))>>>0);
const ifd=(v,base,offset)=>{const n=read16(v,base+offset), r={};for(let i=0;i<n;i++){const o=base+offset+2+i*12;r[read16(v,o)]={type:read16(v,o+2),count:read32(v,o+4),value:read32(v,o+8)};}return r;};
test('EXIF GPS écrit dans JPEG, coordonnées WGS84 et précision conservées',()=>{
  const jpeg=Uint8Array.from([0xff,0xd8,0xff,0xd9]);
  const result=embedGPSInJPEG(jpeg,{lat:35.7654321,lon:-5.8765432,accuracy:4.8},'2026-10-12T16:04:00Z');
  assert.equal(result[0],255);assert.equal(result[1],216);assert.equal(result[2],255);assert.equal(result[3],225);
  assert.equal(new TextDecoder().decode(result.slice(6,10)),'Exif');
  const base=12;
  const top=ifd(result,base,8);assert.ok(top[0x8825]);
  const gps=ifd(result,base,top[0x8825].value);
  assert.ok(gps[2]);assert.ok(gps[4]);assert.ok(gps[31]);
  assert.equal(gps[1].value&255,'N'.charCodeAt(0));assert.equal(gps[3].value&255,'W'.charCodeAt(0));
  const latOff=base+gps[2].value;assert.equal(read32(result,latOff),35);
  assert.equal(read32(result,latOff+8),45);
  const errOff=base+gps[31].value;assert.equal(read32(result,errOff)/read32(result,errOff+4),4.8);
  assert.deepEqual(Array.from(result.slice(-2)),[255,217]);
});
test('Une photo sans GPS ne peut pas être géotaguée',()=>{
  assert.throws(()=>embedGPSInJPEG(Uint8Array.from([255,216,255,217]),null));
  assert.throws(()=>embedGPSInJPEG(Uint8Array.from([255,216,255,217]),{lat:95,lon:0}));
  assert.throws(()=>embedGPSInJPEG(Uint8Array.from([0,0,0]),{lat:0,lon:0}));
});
