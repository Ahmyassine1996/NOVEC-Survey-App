function xmlEscape(v) {
  return String(v ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function cleanFileName(v) {
  return String(v || 'Fiche')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g,'_')
    .replace(/\s+/g,'_').slice(0,100);
}
function strBytes(s) { return new TextEncoder().encode(s); }
function u16(n) { return new Uint8Array([n&255,(n>>>8)&255]); }
function u32(n) { return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]); }
function concatBytes(parts) {
  const len = parts.reduce((n,p)=>n+p.length,0);
  const out = new Uint8Array(len); let off=0;
  parts.forEach(p=>{ out.set(p,off); off+=p.length; }); return out;
}
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n=0;n<256;n++) {
    let c=n;
    for (let k=0;k<8;k++) c = (c&1) ? (0xEDB88320^(c>>>1)) : (c>>>1);
    table[n]=c>>>0;
  }
  return table;
})();
export function crc32(bytes) {
  let c=0xFFFFFFFF;
  for (let i=0;i<bytes.length;i++) c = CRC_TABLE[(c^bytes[i])&0xFF] ^ (c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
export function zipStore(files) {
  const localParts=[], centralParts=[]; let offset=0;
  files.forEach(file=>{
    const nameBytes=strBytes(file.name);
    const data=file.data instanceof Uint8Array ? file.data : strBytes(file.data);
    const crc=crc32(data);
    const local=concatBytes([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      nameBytes, data
    ]);
    localParts.push(local);
    const central=concatBytes([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes
    ]);
    centralParts.push(central);
    offset += local.length;
  });
  const centralData=concatBytes(centralParts);
  const end=concatBytes([
    u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),
    u32(centralData.length),u32(offset),u16(0)
  ]);
  return concatBytes([...localParts, centralData, end]);
}
function dataUrlBytes(dataUrl) {
  const b64 = dataUrl.split(',')[1] || '';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}
function wordRun(text, opts={}) {
  const bold = opts.bold ? '<w:b/>' : '';
  const size = opts.size ? `<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>` : '';
  const color = opts.color ? `<w:color w:val="${opts.color}"/>` : '';
  return `<w:r><w:rPr>${bold}${size}${color}<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}
function wordP(text='', opts={}) {
  const align = opts.center ? '<w:jc w:val="center"/>' : '';
  const before = opts.before || 0, after = opts.after ?? 80;
  const keep = opts.keep ? '<w:keepNext/>' : '';
  const pageBreak = opts.pageBreak ? '<w:pageBreakBefore/>' : '';
  const shade=opts.shade?`<w:shd w:fill="${opts.shade}"/>`:'';
  return `<w:p><w:pPr>${align}${keep}${pageBreak}${shade}<w:spacing w:before="${before}" w:after="${after}"/></w:pPr>${wordRun(text,opts)}</w:p>`;
}
function wordCell(text, label=false) {
  const shade = label ? '<w:shd w:fill="E9EFF2"/>' : '';
  return `<w:tc><w:tcPr><w:tcW w:w="${label?3200:6200}" w:type="dxa"/>${shade}</w:tcPr>${wordP(text ?? '', {bold:label, size:17, after:0})}</w:tc>`;
}
function wordKVTable(items) {
  const rows = items.filter(([a,b])=>b!==undefined&&b!==null&&String(b).trim()!=='').map(([a,b])=>`<w:tr><w:trPr><w:cantSplit/></w:trPr>${wordCell(a,true)}${wordCell(b,false)}</w:tr>`).join('');
  if(!rows)return '';
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>
    <w:top w:val="single" w:sz="4" w:color="777777"/><w:left w:val="single" w:sz="4" w:color="777777"/>
    <w:bottom w:val="single" w:sz="4" w:color="777777"/><w:right w:val="single" w:sz="4" w:color="777777"/>
    <w:insideH w:val="single" w:sz="4" w:color="AAAAAA"/><w:insideV w:val="single" w:sz="4" w:color="AAAAAA"/>
  </w:tblBorders></w:tblPr>${rows}</w:tbl>${wordP('',{after:80})}`;
}
function wordImage(relId, name, caption='', gpsTextValue='', dimensions={}) {
  const cx=dimensions.widthEMU||2550000, cy=dimensions.heightEMU||1700000;
  const photo=`<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="45" w:after="25"/></w:pPr><w:r><w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${relId==='rIdLogo'?90000:(relId.replace(/\D/g,'')||1)}" name="${xmlEscape(name)}"/>
      <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
        <pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="${xmlEscape(name)}"/><pic:cNvPicPr/></pic:nvPicPr>
        <pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
        <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
        </pic:pic>
      </a:graphicData></a:graphic>
    </wp:inline></w:drawing></w:r></w:p>`;
  return photo+(caption?wordP(`${caption}${gpsTextValue ? ' — '+gpsTextValue : ''}`, {center:true,size:15,color:'56646D',after:50}):'');
}
function wordPhotoGrid(photos){
  if(!photos.length)return '';
  let out='';
  for(let i=0;i<photos.length;i+=2){
    const cells=[photos[i],photos[i+1]].map(p=>`<w:tc><w:tcPr><w:tcW w:w="4650" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>${p||wordP('',{after:0})}</w:tc>`).join('');
    out+=`<w:tbl><w:tblPr><w:tblW w:w="9300" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4650"/><w:gridCol w:w="4650"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr>${cells}</w:tr></w:tbl>${wordP('',{after:70})}`;
  }
  return out;
}

function gpsForWord(g) {
  if (!g || g.lat===undefined || g.lon===undefined) return 'GPS non disponible';
  return `${Number(g.lat).toFixed(6)}, ${Number(g.lon).toFixed(6)} · précision ±${Math.round(g.accuracy||0)} m`;
}

export {xmlEscape,strBytes,dataUrlBytes,wordP,wordKVTable,wordImage,wordPhotoGrid,gpsForWord};
