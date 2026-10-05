const fs=require('fs'),http=require('http'),path=require('path');const root=process.cwd();
const mock=`
 const vacio={docs:[],size:0,empty:true,forEach(){}};
 const q={get:async()=>vacio,onSnapshot(f){f(vacio);return()=>{};},where(){return this;},orderBy(){return this;},limit(){return this;},doc(){return {get:async()=>({exists:false}),set:async()=>{throw Error('Prueba visual: escrituras bloqueadas');}}}};
 const base={collection:()=>q,runTransaction:async()=>{throw Error('Prueba visual: escrituras bloqueadas');}};
 const u={uid:'ZS4cI7hnMXVPpCaQECFg208TLbL2'},au={currentUser:u,onAuthStateChanged(f){setTimeout(()=>f(u),0);},signOut(){location.reload();}};
 window.firebase={initializeApp(){},auth:()=>au,firestore:Object.assign(()=>base,{FieldValue:{serverTimestamp:()=>new Date()}})};
 document.addEventListener('DOMContentLoaded',()=>{const p=document.createElement('p');p.style='background:#fff0d8;padding:12px;font-weight:600';p.textContent='PRUEBA VISUAL AISLADA · Datos vacíos simulados · Sin conexión a Firebase';document.querySelector('.main').prepend(p);});
`;
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1:9016');
 if(u.pathname==='/__qa__/admin.html'){
  let h=fs.readFileSync(path.join(root,'admin.html'),'utf8').replace('<head>','<head><base href="/">');
  h=h.replace(/<script src="https:\/\/www.gstatic.com\/firebasejs\/[^" ]+"><\/script>/g,'');
  h=h.replace('<script>\n  const firebaseConfig',()=>'<script>'+mock+'</script><script>\n  const firebaseConfig');
  h=h.replace('<script>\r\n  const firebaseConfig',()=>'<script>'+mock+'</script><script>\r\n  const firebaseConfig');
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(h);return;
 }
 const p=path.resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const f=fs.readFileSync(p);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'application/octet-stream');res.end(f);}catch{res.writeHead(404);res.end();}
}).listen(9016,'127.0.0.1',()=>console.log('Vista aislada: http://127.0.0.1:9016/__qa__/admin.html'));
