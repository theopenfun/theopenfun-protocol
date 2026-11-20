import sharp from 'sharp'; import fs from 'fs'; import path from 'path';
const dir='brand';
for (const f of fs.readdirSync(dir)) {
  const p=path.join(dir,f); const buf=fs.readFileSync(p);
  const isPng = buf.slice(1,4).toString()==='PNG';
  let ihdr='';
  if(isPng){ ihdr=`IHDR ${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)} bitDepth=${buf[24]} colourType=${buf[25]} (${({0:'grey',2:'RGB',3:'palette',4:'grey+A',6:'RGBA'})[buf[25]]})`; }
  const {data,info}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const hist=new Array(8).fill(0); let blackTrans=0, N=info.width*info.height;
  const cnt=new Map();
  for(let i=0;i<N;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2],a=data[i*4+3];
    hist[a>>5]++; if(a===0&&r+g+b===0) blackTrans++;
    if(a>200){const k=((r>>3)<<10)|((g>>3)<<5)|(b>>3); cnt.set(k,(cnt.get(k)||0)+1);} }
  const top=[...cnt].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>'#'+[(k>>10)<<3|4,((k>>5)&31)<<3|4,(k&31)<<3|4].map(x=>x.toString(16).padStart(2,'0')).join('')+':'+(v/N*100).toFixed(1)+'%');
  console.log(f,'\n ',isPng?ihdr:'JPEG '+info.width+'x'+info.height,'\n  alpha hist(8 bins):',hist.join(','),'\n  pure-black fully-transparent px:',blackTrans,'\n  dominant opaque:',top.join(' '));
}
