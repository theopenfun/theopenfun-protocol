import http from 'http'; import fs from 'fs'; import path from 'path';
const dir=path.resolve(process.argv[2]||'dist'), port=+process.argv[3]||5173;
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(dir,u);
 if(!f.startsWith(dir)||!fs.existsSync(f)){r.writeHead(404);return r.end('nf');}r.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(port,()=>console.log('serving',dir,port));
