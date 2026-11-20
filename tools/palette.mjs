import sharp from 'sharp';
const hex=(r,g,b)=>'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
async function px(p,pts){const {data,info}=await sharp(p).removeAlpha().raw().toBuffer({resolveWithObject:true});
 return pts.map(([x,y,n])=>{const x0=Math.round(x*info.width),y0=Math.round(y*info.height);let r=0,g=0,b=0,c=0;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const i=((y0+dy)*info.width+x0+dx)*3;r+=data[i];g+=data[i+1];b+=data[i+2];c++}
  return n+' '+hex(Math.round(r/c),Math.round(g/c),Math.round(b/c));});}
console.log('LOGO OPEN PNG.png (2000x2000)');
console.log((await px('brand/LOGO OPEN PNG.png',[[.02,.02,'bg corner'],[.5,.3,'face top'],[.5,.45,'inner shade'],[.36,.38,'highlight'],[.62,.7,'lower right shade'],[.5,.72,'base']])).join('\n'));
console.log('reference/OPEN 1 (1600x900)');
console.log((await px('reference/OPEN 1.jpg.jpeg',[[.5,.08,'deep bg'],[.3,.2,'bg mid'],[.6,.5,'bg right'],[.5,.85,'floor'],[.6,.96,'floor dark'],[.8,.45,'O face'],[.17,.94,'pill bg'],[.04,.95,'pill edge']])).join('\n'));
const m=await sharp('reference/OPEN 1.jpg.jpeg').resize(1,1).removeAlpha().raw().toBuffer(); console.log('mean',hex(...m));
