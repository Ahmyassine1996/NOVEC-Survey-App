/**
 * Inscrit un bloc EXIF GPS standard directement dans un JPEG (APP1 + TIFF little-endian).
 * Aucune dépendance externe, fonctionnement hors connexion. Les coordonnées proviennent
 * du GPS de l'appareil AU MOMENT de l'ajout du média, pas du lieu supposé de la photo.
 * Ne copie pas les autres métadonnées effacées par la compression Canvas.
 */
const enc = new TextEncoder();
const validGPS = g => g && Number.isFinite(Number(g.lat)) && Number.isFinite(Number(g.lon)) &&
  Math.abs(Number(g.lat))<=90 && Math.abs(Number(g.lon))<=180;

export function embedGPSInJPEG(bytes, gps, at=new Date().toISOString()) {
  if (!validGPS(gps)) throw Error('Coordonnées GPS non valides : géotag impossible.');
  const src=bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (src.length<4 || src[0]!==0xff || src[1]!==0xd8) throw Error('Le fichier compressé n’est pas un JPEG valide.');
  const date=new Date(at);
  if (!Number.isFinite(date.getTime())) throw Error('Date GPS invalide.');
  const dateTime=[date.getUTCFullYear(),String(date.getUTCMonth()+1).padStart(2,'0'),String(date.getUTCDate()).padStart(2,'0')].join(':')+' '+[date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds()].map(n=>String(n).padStart(2,'0')).join(':');
  const day=dateTime.slice(0,10);
  const gpsEntries=7+(Number.isFinite(Number(gps.accuracy))&&Number(gps.accuracy)>=0 ? 1 : 0);
  // IFD0: DateTime, ExifIFD pointer, GPSIFD pointer
  const ifd0Off=8, ifd0Size=2+3*12+4;
  const gpsOff=ifd0Off+ifd0Size, gpsSize=2+gpsEntries*12+4;
  const exifOff=gpsOff+gpsSize, exifSize=2+1*12+4;
  const initial=exifOff+exifSize;
  const buffer=new Uint8Array(initial+400);
  const dv=new DataView(buffer.buffer);
  const u16=(off,v)=>dv.setUint16(off,v,true), u32=(off,v)=>dv.setUint32(off,v>>>0,true);
  const typeASCII=2,typeBYTE=1,typeLONG=4,typeRATIONAL=5;
  const writeIFD=(off,entries)=>{u16(off,entries.length);entries.forEach((ent,i)=>{const t=off+2+i*12;u16(t,ent[0]);u16(t+2,ent[1]);u32(t+4,ent[2]);u32(t+8,ent[3]);});u32(off+2+entries.length*12,0);};
  buffer.set([0x49,0x49,0x2a,0,8,0,0,0],0);
  let ptr=initial;
  function reserve(bytes){const off=ptr;ptr+=bytes.length;if(ptr>buffer.length)throw Error('EXIF trop volumineux');buffer.set(bytes,off);if(ptr%2)ptr++;return off;}
  function ascii(s){return reserve(enc.encode(s+'\0'));}
  function fracTriplet(angle){
    const a=Math.abs(angle), deg=Math.floor(a), minf=(a-deg)*60, min=Math.floor(minf), secs=(minf-min)*60;
    const nums=[[deg,1],[min,1],[Math.round(secs*1e6),1e6]];
    const b=new Uint8Array(24),v=new DataView(b.buffer);
    nums.forEach(([n,d],i)=>{v.setUint32(i*8,n,true);v.setUint32(i*8+4,d,true);});
    return reserve(b);
  }
  function rational(number){const b=new Uint8Array(8),v=new DataView(b.buffer);v.setUint32(0,Math.round(number*1000),true);v.setUint32(4,1000,true);return reserve(b);}
  function fractionTime(){const b=new Uint8Array(24),v=new DataView(b.buffer);[date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds()].forEach((n,i)=>{v.setUint32(i*8,n,true);v.setUint32(i*8+4,1,true);});return reserve(b);}
  const dtOff=ascii(dateTime), originalOff=ascii(dateTime);
  const latOff=fracTriplet(Number(gps.lat)),lonOff=fracTriplet(Number(gps.lon));
  const timeOff=fractionTime(),dateOff=ascii(day.replaceAll(':','-'));
  const accuracy=Number(gps.accuracy), accAvailable=Number.isFinite(accuracy)&&accuracy>=0;
  const accOff=accAvailable?rational(accuracy):null;
  writeIFD(ifd0Off,[
    [0x0132,typeASCII,20,dtOff],
    [0x8769,typeLONG,1,exifOff],
    [0x8825,typeLONG,1,gpsOff]
  ]);
  // ASCII short strings <=4 bytes are stored in-place (NOT a pointer)
  const refInline=ref=>ref.charCodeAt(0);  // e.g. 0x0000004E (N) or 0x00000053 (S)
  const gpsTags=[
    [0x0000,typeBYTE,4,0x00000302],
    [0x0001,typeASCII,2,refInline(Number(gps.lat)>=0?'N':'S')],
    [0x0002,typeRATIONAL,3,latOff],
    [0x0003,typeASCII,2,refInline(Number(gps.lon)>=0?'E':'W')],
    [0x0004,typeRATIONAL,3,lonOff],
    [0x0007,typeRATIONAL,3,timeOff],
    [0x001d,typeASCII,11,dateOff]
  ];
  if(accAvailable)gpsTags.push([0x001f,typeRATIONAL,1,accOff]);
  gpsTags.sort((a,b)=>a[0]-b[0]);
  writeIFD(gpsOff,gpsTags);
  writeIFD(exifOff,[[0x9003,typeASCII,20,originalOff]]);
  const tiff=buffer.slice(0,ptr);
  const exifHeader=enc.encode('Exif\0\0');
  const segmentLength=2+exifHeader.length+tiff.length;
  if(segmentLength>65535)throw Error('Segment EXIF trop volumineux.');
  const app1=new Uint8Array(2+segmentLength);
  app1.set([0xff,0xe1,(segmentLength>>>8)&255,segmentLength&255],0);
  app1.set(exifHeader,4);app1.set(tiff,4+exifHeader.length);
  const output=new Uint8Array(src.length+app1.length);
  output.set(src.slice(0,2),0);output.set(app1,2);output.set(src.slice(2),2+app1.length);
  return output;
}
