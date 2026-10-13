import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const MAX=24*1024*1024;
export function createHandler({apiKey,accessToken,allowedOrigin,model='gpt-4o-mini-transcribe',fetcher=fetch,limitPerHour=120}){
  if(!apiKey||!accessToken||accessToken.length<32||!allowedOrigin)throw Error('OPENAI_API_KEY, TRANSCRIPTION_ACCESS_TOKEN (32 caractères minimum) et ALLOWED_ORIGIN sont obligatoires.');
  let inFlight=0,hourStart=Date.now(),requests=0;
  const token=Buffer.from('Bearer '+accessToken);
  return async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
    const origin=req.headers.origin;
    const send=(status,value)=>{res.writeHead(status);res.end(JSON.stringify(value));};
    if(origin&&origin!==allowedOrigin){send(403,{error:'Origine non autorisée.'});return;}
    if(origin){res.setHeader('Access-Control-Allow-Origin',allowedOrigin);res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');}
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    if(req.url==='/health'&&req.method==='GET'){send(200,{ok:true});return;}
    if(req.url!=='/transcribe'||req.method!=='POST'){send(404,{error:'Route inconnue.'});return;}
    const received=Buffer.from(req.headers.authorization||'');if(received.length!==token.length||!timingSafeEqual(received,token)){send(401,{error:'Accès refusé.'});return;}
    if(Date.now()-hourStart>3600000){hourStart=Date.now();requests=0;}
    if(requests>=limitPerHour||inFlight>=2){send(429,{error:'Limite temporaire atteinte. Réessayer plus tard.'});return;}
    if(!req.headers['content-type']?.startsWith('multipart/form-data')){send(400,{error:'Formulaire multipart attendu.'});return;}
    if(Number(req.headers['content-length']||0)>MAX+1024*1024){send(413,{error:'Audio trop volumineux.'});return;}
    inFlight++;requests++;
    try{
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX+1024*1024){send(413,{error:'Audio trop volumineux.'});return;}chunks.push(chunk);}
      const request=new Request('http://localhost/transcribe',{method:'POST',headers:{'Content-Type':req.headers['content-type']},body:Buffer.concat(chunks)});
      const form=await request.formData(),file=form.get('file'),language=form.get('language');
      if(!(file instanceof Blob)||file.size===0||file.size>MAX){send(400,{error:'Fichier audio vide ou trop volumineux.'});return;}
      const ext=(file.name||'').toLowerCase().split('.').at(-1);if(!['mp3','mp4','mpeg','mpga','m4a','wav','webm'].includes(ext)){send(415,{error:'Format non transcrit. Utiliser MP3, M4A, WAV ou WebM.'});return;}
      if(language&&!['fr','ar'].includes(language)){send(400,{error:'Langue non autorisée.'});return;}
      const upstream=new FormData();upstream.append('file',file,'note.'+ext);upstream.append('model',model);upstream.append('response_format','json');if(language)upstream.append('language',language);
      const response=await fetcher('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+apiKey},body:upstream,signal:AbortSignal.timeout(110000)});
      if(!response.ok){send(response.status===429?429:502,{error:'Le fournisseur de transcription a refusé ou interrompu la demande.'});return;}
      const result=await response.json();if(typeof result.text!=='string'){send(502,{error:'Réponse de transcription invalide.'});return;}send(200,{text:result.text});
    }catch{if(!res.headersSent)send(502,{error:'La transcription n’a pas abouti. L’audio reste sur votre appareil.'});}
    finally{inFlight--;}
  };
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
  const handler=createHandler({apiKey:process.env.OPENAI_API_KEY,accessToken:process.env.TRANSCRIPTION_ACCESS_TOKEN,allowedOrigin:process.env.ALLOWED_ORIGIN,model:process.env.TRANSCRIPTION_MODEL||'gpt-4o-mini-transcribe',limitPerHour:Number(process.env.MAX_REQUESTS_PER_HOUR||120)});
  const server=http.createServer(handler);server.requestTimeout=130000;server.headersTimeout=30000;server.listen(Number(process.env.PORT||8080),'0.0.0.0',()=>console.log('Service de transcription prêt. Aucun audio ni texte journalisé.'));
}
