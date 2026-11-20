// Derives logo sizes + traced favicon from brand/LOGO OPEN PNG...png (RGBA, transparent, pure-black transparent region).
// Resize is done on PREMULTIPLIED pixels so the black RGB under alpha=0 never bleeds into edges.
import sharp from 'sharp'; import fs from 'fs';
const SRC='brand/LOGO OPEN PNG...png';
const {data,info}=await sharp(SRC).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const W=info.width,H=info.height;
let x0=W,y0=H,x1=0,y1=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(data[(y*W+x)*4+3]>8){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
console.log('bbox',x0,y0,x1,y1);
const bw=x1-x0+1,bh=y1-y0+1,side=Math.max(bw,bh);
const pre=Buffer.alloc(side*side*4); // square canvas, centred, premultiplied
const ox=Math.floor((side-bw)/2),oy=Math.floor((side-bh)/2);
for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const s=((y0+y)*W+x0+x)*4,d=((y+oy)*side+x+ox)*4,a=data[s+3];
  pre[d]=Math.round(data[s]*a/255);pre[d+1]=Math.round(data[s+1]*a/255);pre[d+2]=Math.round(data[s+2]*a/255);pre[d+3]=a;}
function unpre(b){for(let i=0;i<b.length;i+=4){const a=b[i+3];if(a>0&&a<255){for(let k=0;k<3;k++)b[i+k]=Math.min(255,Math.round(b[i+k]*255/a));}}return b;}
async function size(n){
  return unpre(await sharp(pre,{raw:{width:side,height:side,channels:4,premultiplied:true}}).resize(n,n,{kernel:'lanczos3'}).raw().toBuffer());
}
for(const n of [512,192,96]){const b=await size(n);await sharp(b,{raw:{width:n,height:n,channels:4}}).png({compressionLevel:9}).toFile(`src/assets/logo-${n}.png`);}
// favicon trace: 32x32 grid, 1px pad
const N=32,inner=30; const small=await size(inner);
const g=(x,y)=>{x-=1;y-=1; if(x<0||y<0||x>=inner||y>=inner) return null; const i=(y*inner+x)*4; if(small[i+3]<12) return null; const q=v=>Math.min(255,Math.round(v/24)*24);return [q(small[i]),q(small[i+1]),q(small[i+2]),small[i+3]<128?128:255];};
const hx=c=>'#'+c.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
let rects='';
for(let y=0;y<N;y++){let x=0;while(x<N){const c=g(x,y);if(!c){x++;continue;}let e=x+1;while(e<N){const d=g(e,y);if(!d||hx(d)!==hx(c)||d[3]!==c[3])break;e++;}
  rects+=`<rect x="${x}" y="${y}" width="${e-x}" height="1" fill="${hx(c)}"${c[3]<255?` fill-opacity="${(c[3]/255).toFixed(2)}"`:''}/>`;x=e;}}
fs.writeFileSync('src/assets/favicon.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">${rects}</svg>`);
// fringe check: darkest RGB sum among partially transparent pixels in 512 logo
const b=await size(512);let minL=999;for(let i=0;i<b.length;i+=4){if(b[i+3]>0&&b[i+3]<255){minL=Math.min(minL,(b[i]+b[i+1]+b[i+2])/3);}}
console.log('min edge luminance (premult OK if >~100):',minL.toFixed(0));
// extra palette samples from reference art
const ref=await sharp('reference/OPEN 1.jpg.jpeg').removeAlpha().raw().toBuffer({resolveWithObject:true});
const px=(x,y)=>{const i=(y*1600+x)*3;return hx([ref.data[i],ref.data[i+1],ref.data[i+2]]);};
let best=null,bl=0;for(let y=60;y<300;y++)for(let x=100;x<900;x++){const i=(y*1600+x)*3,l=ref.data[i]+ref.data[i+1]+ref.data[i+2];if(l>bl){bl=l;best=px(x,y);}}
console.log('brightest grid line',best,'| glow near O',px(1030,430),'| pill border',px(52,850),'| floor reflection',px(1260,760),'| bg left',px(300,150));
