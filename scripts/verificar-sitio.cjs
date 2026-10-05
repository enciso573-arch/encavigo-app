const fs=require('fs'),vm=require('vm'),path=require('path'),{JSDOM}=require('jsdom');
const archivos=['index.html','admin.html','negocios/index.html','registro.html','privacidad.html','dashboard.html'];let scripts=0,rutas=0;
for(const p of archivos){
 const h=fs.readFileSync(p,'utf8'),dom=new JSDOM(h,{url:'https://encavigo.test/'+p});
 for(const m of h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(m[2].trim()&&!m[1].includes('application/ld+json')){new vm.Script(m[2],{filename:p});scripts++;}}
 const ids=new Set();for(const e of dom.window.document.querySelectorAll('[id]')){if(ids.has(e.id))throw Error('ID repetido en '+p+': '+e.id);ids.add(e.id);}
 for(const e of dom.window.document.querySelectorAll('[src],[href]')){
  const v=e.getAttribute('src')||e.getAttribute('href');if(!v||/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(v))continue;
  const nombre=decodeURIComponent(v.split(/[?#]/)[0]);if(!nombre)continue;let destino=nombre==='/'?'index.html':nombre.startsWith('/')?nombre.slice(1):path.join(path.dirname(p),nombre);
  if(fs.existsSync(destino)&&fs.statSync(destino).isDirectory())destino=path.join(destino,'index.html');
  if(!fs.existsSync(destino))throw Error('Recurso local inexistente: '+p+' → '+destino);rutas++;
 }
 if(p==='admin.html'){const d=dom.window.document;for(const id of ['view-dashboard','view-codigos','view-choferes','view-cobros','view-analiticas'])if(!d.querySelector('.app-container').contains(d.getElementById(id)))throw Error('Vista fuera del panel: '+id);}
 dom.window.close();
}
for(const p of ['calculadora-promociones.js','admin-calculadora.js','operacion.js','publicidad.js','admin-operacion.js','admin-publicidad.js','reporte.js','admin-comisiones.js','comisiones.js','sesiones-servidor.js','sw.js','pasajero-ui.js']){new vm.Script(fs.readFileSync(p,'utf8'),{filename:p});scripts++;}
console.log('Sitio: '+scripts+' scripts válidos; '+rutas+' referencias locales existentes; IDs y vistas consistentes.');
