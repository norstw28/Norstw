const assert=require('assert');
const {parseText3:P,canonTod,permCount,mergePlan3,totals3,validEntry3}=require('./core3.js');
let pass=0,fail=0;
function T(n,f){try{f();pass++;console.log('OK  ',n)}catch(e){fail++;console.log('FAIL',n,e.message)}}
const NL=String.fromCharCode(10);
const R=(t,m)=>P(t,m).rows.map(r=>[r.number,r.type,r.amount]);
T('labeled both',()=>assert.deepStrictEqual(R('123 ตรง 50 โต๊ด 20'),[['123','ตรง',50],['123','โต๊ด',20]]));
T('labeled reverse order',()=>assert.deepStrictEqual(R('123 โต๊ด 20 ตรง 50'),[['123','โต๊ด',20],['123','ตรง',50]]));
T('abbreviations ต ด',()=>assert.deepStrictEqual(R('123ต50ด20'),[['123','ตรง',50],['123','โต๊ด',20]]));
T('tone mark variants',()=>assert.deepStrictEqual(R('123 โต้ด 5'),[['123','โต๊ด',5]]));
T('positional ตรงxโต๊ด',()=>assert.deepStrictEqual(R('123=50x20'),[['123','ตรง',50],['123','โต๊ด',20]]));
T('positional with spaces and ×',()=>assert.deepStrictEqual(R('123 50 × 20'),[['123','ตรง',50],['123','โต๊ด',20]]));
T('thai digits and commas',()=>assert.deepStrictEqual(R('๑๒๓ ตรง ๑,๒๐๐.๕๐'),[['123','ตรง',1200.5]]));
T('leading zero kept',()=>assert.strictEqual(R('007 ตรง 5')[0][0],'007'));
T('tod canonical sorted',()=>{const p=P('321 โต๊ด 20');assert.strictEqual(p.rows[0].number,'123');assert.strictEqual(p.rows[0].entered,'321')});
T('straight not sorted',()=>assert.strictEqual(R('321 ตรง 20')[0][0],'321'));
T('mode ตรง number+amount',()=>assert.deepStrictEqual(R(['123 10','456=20','789 x 30'].join(NL),'ตรง'),[['123','ตรง',10],['456','ตรง',20],['789','ตรง',30]]));
T('mode โต๊ด sorts',()=>assert.deepStrictEqual(R('321 10','โต๊ด'),[['123','โต๊ด',10]]));
T('mode with matching label',()=>assert.strictEqual(R('123 ตรง 50','ตรง').length,1));
T('context header',()=>assert.deepStrictEqual(R(['ตรง','123 10','โต๊ด:','321 5'].join(NL)),[['123','ตรง',10],['123','โต๊ด',5]]));
const holdCases=[['123 50',null],['123 ตรง 50 20',null],['12 ตรง 50',null],['1234 ตรง 50',null],['123',null],['123 ตรง',null],['123 ตรง 0',null],['123 ตรง -50',null],
 ['123 ตรง 50.555',null],['123 ตรง 1,2',null],['123 ตรง 50 ตรง 20',null],['123=50x0',null],['123=50x20x5',null],['abc ตรง 50',null],['123 บน 50',null],
 ['123 โต๊ด 50','ตรง'],['123 50 20','ตรง'],['123=50x20','ตรง'],['123 ตรง 5 โต๊ด 6','ตรง'],['โต๊ด'+NL+'123 50','ตรง']];
holdCases.forEach(([s,m])=>T('hold '+s.split(NL).join(' / ')+' ['+m+']',()=>{const p=P(s,m);assert.strictEqual(p.rows.length,0);assert.strictEqual(p.held.length,1)}));
T('2-digit text is held',()=>assert.strictEqual(P('12 บน 50').held.length,1));
T('nothing dropped silently',()=>{const p=P(['123 ตรง 10','xx','456 โต๊ด 5','789 50'].join(NL));assert.strictEqual(p.rows.length,2);assert.strictEqual(p.held.length,2)});
T('warn triple tod',()=>assert.strictEqual(P('111 โต๊ด 5').warnings.length,1));
T('perm counts',()=>assert.deepStrictEqual([permCount('123'),permCount('112'),permCount('111')],[6,3,1]));
T('canonTod',()=>assert.strictEqual(canonTod('931'),'139'));
T('merge tod permutations',()=>assert.deepStrictEqual(mergePlan3([{number:'123',type:'โต๊ด',amount:10}],P(['321 โต๊ด 5.5','123 ตรง 7','213 โต๊ด 1'].join(NL)).rows),[{number:'123',type:'โต๊ด',old:10,add:6.5,next:16.5},{number:'123',type:'ตรง',old:null,add:7,next:7}]));
T('merge no float drift',()=>assert.strictEqual(mergePlan3([{number:'123',type:'ตรง',amount:0.1}],[{number:'123',type:'ตรง',amount:0.2}])[0].next,0.3));
T('totals',()=>assert.deepStrictEqual(totals3([{type:'ตรง',amount:50},{type:'โต๊ด',amount:20.5},{type:'ตรง',amount:0.25}]),{straight:50.25,tod:20.5,rows:3}));
const ok={entry_id:'e',slip_id:'s',type:'โต๊ด',number:'123',amount:5};
T('validEntry3 ok',()=>assert(validEntry3(ok)));
[{...ok,number:'321'},{...ok,number:'12'},{...ok,amount:0},{...ok,amount:1.234},{...ok,type:'บน'}].forEach((e,i)=>T('validEntry3 bad '+i,()=>assert(!validEntry3(e))));
console.log('passed',pass,'failed',fail);if(fail)process.exit(1);
