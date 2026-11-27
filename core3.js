// ==CORE3== เลข 3 ตัว ตรง/โต๊ด (ไฟล์อิสระ ยังไม่ได้เชื่อมกับ index.html)
const TYPE3=['ตรง','โต๊ด'];
function norm3(s){
  return String(s).replace(/[๐-๙]/g,c=>'๐๑๒๓๔๕๖๗๘๙'.indexOf(c)).replace(/[０-９]/g,c=>String(c.charCodeAt(0)-0xFF10))
    .replace(/＝/g,'=').replace(/：/g,':').replace(/[\u0e47-\u0e4b]/g,'').replace(/฿|บาท/g,' ');
}
function kind3(s){const k=norm3(s).trim();return k==='ตรง'||k==='ต'?'ตรง':(k==='โตด'||k==='ด'?'โต๊ด':null)}
function canonTod(n){return String(n).split('').sort().join('')}
function permCount(n){const a=String(n).split('');return new Set([a[0]+a[1]+a[2],a[0]+a[2]+a[1],a[1]+a[0]+a[2],a[1]+a[2]+a[0],a[2]+a[0]+a[1],a[2]+a[1]+a[0]]).size}
function satang3(s){
  s=String(s);
  const ok=s.includes(',')?/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s):/^\d+(\.\d{1,2})?$/.test(s);
  if(!ok)return null;
  const v=Math.round(parseFloat(s.replace(/,/g,''))*100);
  return v>0?v:null;
}
function tok3(rest){
  const re=/(\s+)|(ตรง|โตด|ต|ด)|(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)|([=:])|([xX×])|(.)/g;
  const out=[];
  for(const m of rest.matchAll(re)){
    if(m[1])continue;
    if(m[2])out.push({k:'L',v:kind3(m[2])});
    else if(m[3])out.push({k:'N',v:m[3]});
    else if(m[4])out.push({k:'S'});
    else if(m[5])out.push({k:'X'});
    else out.push({k:'O',v:m[6]});
  }
  return out;
}
function parseText3(text,mode){
  const rows=[],held=[],warnings=[];
  const fixed=mode?kind3(mode):null;
  let ctx=null,ctxBad=false;
  const hold=(raw,reason)=>held.push({raw,reason});
  for(const raw of String(text).split(/\r?\n/)){
    const s=norm3(raw).trim();
    if(!s)continue;
    const h=s.match(/^(ตรง|โตด|ต|ด)\s*[:=]?$/);
    if(h){ctx=kind3(h[1]);ctxBad=!!fixed&&fixed!==ctx;continue}
    if(ctxBad){hold(raw,'หัวข้อขัดกับโหมดที่เลือก');continue}
    const eff=fixed||ctx;
    const m=s.match(/^(\d+)(.*)$/);
    if(!m){hold(raw,'ต้องขึ้นต้นด้วยเลข 3 หลัก');continue}
    const num=m[1];
    if(num.length!==3){hold(raw,'เลขต้องเป็น 3 หลัก');continue}
    let t=tok3(m[2]);
    if(t.some(x=>x.k==='O')){hold(raw,'มีข้อความที่อ่านไม่ได้');continue}
    if(t[0]&&(t[0].k==='S'||t[0].k==='X'))t=t.slice(1);
    const out=[];
    if(t.some(x=>x.k==='L')){
      t=t.filter(x=>x.k!=='S');
      if(t.some(x=>x.k==='X')||t.length%2||t.length>4){hold(raw,'รูปแบบไม่ชัด');continue}
      let bad=null;const seen=new Set();
      for(let i=0;i<t.length;i+=2){
        const L=t[i],N=t[i+1];
        if(L.k!=='L'||!N||N.k!=='N'){bad='รูปแบบไม่ชัด';break}
        if(seen.has(L.v)){bad='ด้านซ้ำในบรรทัดเดียว';break}
        seen.add(L.v);
        if(fixed&&L.v!==fixed){bad='ด้านขัดกับโหมดที่เลือก';break}
        const a=satang3(N.v);
        if(a===null){bad='ยอดไม่ถูกต้อง';break}
        out.push([L.v,a]);
      }
      if(bad){hold(raw,bad);continue}
    }else if(eff){
      if(t.length!==1||t[0].k!=='N'){hold(raw,'โหมดเฉพาะด้านใส่ยอดเดียว');continue}
      const a=satang3(t[0].v);
      if(a===null){hold(raw,'ยอดไม่ถูกต้อง');continue}
      out.push([eff,a]);
    }else{
      if(t.length===3&&t[0].k==='N'&&t[1].k==='X'&&t[2].k==='N'){
        const a=satang3(t[0].v),b=satang3(t[2].v);
        if(a===null||b===null){hold(raw,'ยอดไม่ถูกต้อง');continue}
        out.push(['ตรง',a],['โต๊ด',b]);
      }else{hold(raw,t.length===1?'ไม่ระบุว่าตรงหรือโต๊ด':'รูปแบบไม่ชัด');continue}
    }
    for(const [ty,a] of out){
      rows.push({number:ty==='โต๊ด'?canonTod(num):num,entered:num,type:ty,amount:a/100,raw});
      if(ty==='โต๊ด'&&permCount(num)===1)warnings.push({raw,msg:'เลขตอง โต๊ดเท่ากับตรง'});
    }
  }
  return {rows,held,warnings};
}
function mergePlan3(existing,incoming){
  const key=(ty,n)=>ty+'|'+(ty==='โต๊ด'?canonTod(n):n);
  const old=new Map(existing.map(e=>[key(e.type,e.number),Math.round(e.amount*100)]));
  const add=new Map(),order=[];
  for(const r of incoming){
    const k=key(r.type,r.number);
    if(!add.has(k)){add.set(k,0);order.push([k,r.type,r.type==='โต๊ด'?canonTod(r.number):r.number])}
    add.set(k,add.get(k)+Math.round(r.amount*100));
  }
  return order.map(([k,ty,n])=>{
    const o=old.has(k)?old.get(k):null,a=add.get(k);
    return {number:n,type:ty,old:o===null?null:o/100,add:a/100,next:((o||0)+a)/100};
  });
}
function totals3(entries){
  let st=0,td=0;
  for(const e of entries){const a=Math.round(e.amount*100);if(e.type==='ตรง')st+=a;else if(e.type==='โต๊ด')td+=a}
  return {straight:st/100,tod:td/100,rows:entries.length};
}
function validEntry3(e){
  return !!e&&typeof e.entry_id==='string'&&typeof e.slip_id==='string'&&TYPE3.includes(e.type)
    &&/^\d{3}$/.test(e.number)&&(e.type==='ตรง'||e.number===canonTod(e.number))
    &&Number.isFinite(e.amount)&&e.amount>0&&Math.abs(e.amount*100-Math.round(e.amount*100))<1e-6;
}
// ==END CORE3==
if(typeof module!=='undefined')module.exports={norm3,kind3,canonTod,permCount,satang3,parseText3,mergePlan3,totals3,validEntry3};
