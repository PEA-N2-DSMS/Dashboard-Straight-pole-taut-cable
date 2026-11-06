'use strict';
const SHEET='1Am1dLRE4o1UoCGm01wMSrtXiJC8DGSMW5NmWV97sGSw';
const $=id=>document.getElementById(id);
let data=[],page=0,loading=false;
const size=25;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isPlan=r=>Boolean(r[2]||r[3]);
const status=r=>r[5]||(isPlan(r)?'ยังไม่ระบุสถานะ':'ยังไม่มีแผน');
function options(id,values){const old=$(id).value;$(id).innerHTML='<option value="">ทั้งหมด</option>'+[...new Set(values)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'th')).map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');if([...$(id).options].some(o=>o.value===old))$(id).value=old;}
function officeStats(rows){
 const map=new Map();
 for(const r of rows){if(!r[0])continue;const key=r[4]+'|'+r[0];if(!map.has(key))map.set(key,{name:r[0],group:r[4],rows:[],plans:[]});const o=map.get(key);o.rows.push(r);if(isPlan(r))o.plans.push(r);}
 return [...map.values()];
}
function syncOffices(){options('office',data.filter(r=>!$('group').value||r[4]===$('group').value).map(r=>r[0]));}
function render(){
 const q=$('search').value.trim().toLocaleLowerCase('th'),group=$('group').value,office=$('office').value,st=$('status').value;
 const allOffices=officeStats(data),submittedKeys=new Set(allOffices.filter(o=>o.plans.length).map(o=>o.group+'|'+o.name));
 const sent=r=>submittedKeys.has(r[4]+'|'+r[0]);
 const scope=data.filter(r=>(!group||r[4]===group)&&(!office||r[0]===office));
 const scopedOffices=officeStats(scope).filter(o=>!q||o.rows.some(r=>r.join(' ').toLocaleLowerCase('th').includes(q)));
 const keys=new Set(scopedOffices.map(o=>o.group+'|'+o.name)),base=scope.filter(r=>keys.has(r[4]+'|'+r[0]));
 const plans=base.filter(isPlan),done=scopedOffices.filter(o=>o.plans.length).length;
 $('total').textContent=base.length.toLocaleString('th');$('officeTotal').textContent=scopedOffices.length.toLocaleString('th');$('submitted').textContent=done.toLocaleString('th');$('empty').textContent=(scopedOffices.length-done).toLocaleString('th');$('planTotal').textContent=plans.length.toLocaleString('th');
 $('planMeta').textContent='มี PT '+plans.filter(r=>r[2]).length+' · ยังไม่มี PT '+plans.filter(r=>!r[2]).length+' รายการ';
 const groupNames=[...new Set(data.map(r=>r[4]))].filter(Boolean);
 $('groups').innerHTML=groupNames.map(g=>{const os=allOffices.filter(o=>o.group===g),s=os.filter(o=>o.plans.length).length,p=os.reduce((n,o)=>n+o.plans.length,0);return '<article class="groupcard '+(g===group?'active':'')+'"><h3>'+esc(g)+'</h3><div class="groupstats"><span>ทั้งหมด <b>'+os.length+'</b> แห่ง</span><span>ส่งแล้ว <b>'+s+'</b></span><span class="warn">ยังไม่ส่ง <b>'+(os.length-s)+'</b></span></div><div class="trackbar"><span style="width:'+(os.length?s/os.length*100:0)+'%"></span></div><p class="muted">ได้รับ '+p+' แผน · '+data.filter(r=>r[4]===g).length+' รายการในชีต</p><div class="groupactions"><button data-group="'+esc(g)+'" data-mode="all">ดูจุดย่อย</button><button data-group="'+esc(g)+'" data-mode="empty">ติดตามที่ยังไม่ส่ง ('+(os.length-s)+')</button></div></article>';}).join('');
 const mode=$('mode').value;
 const filtered=base.filter(r=>(!q||r.join(' ').toLocaleLowerCase('th').includes(q))&&(!st||status(r)===st)&&(mode==='all'||(mode==='plans'?isPlan(r):mode==='submitted'?sent(r):!sent(r))));
 const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);
 $('rows').innerHTML=filtered.slice(page*size,(page+1)*size).map(r=>'<tr class="'+(!sent(r)?'rowmissing':'')+'">'+r.slice(0,5).map(c=>'<td>'+esc(c||'—')+'</td>').join('')+'<td><span class="badge '+(sent(r)?'green':'orange')+'">'+(sent(r)?'ส่งแล้ว':'ยังไม่ส่งแผน')+'</span></td><td>'+esc(r[5]||'—')+'</td></tr>').join('')||'<tr><td colspan="7">ไม่พบรายการตามเงื่อนไข</td></tr>';
 $('count').textContent='พบ '+filtered.length.toLocaleString('th')+' รายการ · '+new Set(filtered.map(r=>r[4]+'|'+r[0])).size+' หน่วยงาน · หน้า '+(page+1)+' / '+pages;$('prev').disabled=page===0;$('next').disabled=page>=pages-1;
}
function load(){
 if(loading)return;loading=true;$('refresh').disabled=true;
 const cb='peaSheet'+Date.now(),script=document.createElement('script');let timer;
 function done(){clearTimeout(timer);script.remove();delete window[cb];loading=false;$('refresh').disabled=false;}
 function fail(){done();$('message').className='message error';$('message').textContent='อ่านข้อมูลไม่ได้ กรุณาตรวจว่าชีตเปิดให้ทุกคนที่มีลิงก์ดูได้ แล้วกดอัปเดตข้อมูลอีกครั้ง'+(data.length?' · กำลังแสดงข้อมูลจากการดึงครั้งก่อน':'');if(!data.length){$('rows').innerHTML='<tr><td colspan="7">ยังไม่สามารถเชื่อมต่อ Google Sheets ได้</td></tr>';$('updated').textContent='เชื่อมต่อไม่สำเร็จ';}}
 window[cb]=response=>{try{if(response.status==='error'||!response.table)throw Error('Sheet unavailable');const rows=response.table.rows.map(row=>Array.from({length:6},(_,i)=>String(row.c[i]?.f??row.c[i]?.v??'').trim())).filter(r=>r.some(Boolean));data=rows.filter(r=>!(r[0]==='กฟฟ.'&&r[2]==='เลขใบงาน PT'));options('group',data.map(r=>r[4]));options('status',data.map(status));syncOffices();$('message').className='message';$('message').textContent='เชื่อมต่อ Google Sheets สำเร็จ · ข้อมูลล่าสุดที่ดึงจากชีต โดยไม่แก้ไขข้อมูลต้นฉบับ';$('updated').textContent='ดึงข้อมูลล่าสุด '+new Date().toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});render();done();}catch(e){fail();}};
 script.onerror=fail;script.src='https://docs.google.com/spreadsheets/d/'+SHEET+'/gviz/tq?sheet='+encodeURIComponent('แผนงานปี 70')+'&headers=1&tq='+encodeURIComponent('select A,B,C,D,E,F')+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&_='+Date.now();timer=setTimeout(fail,20000);document.head.appendChild(script);
}
['search','group','office','status','mode'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;if(id==='group'){$('office').value='';syncOffices();}render();}));
$('groups').onclick=e=>{const button=e.target.closest('button[data-group]');if(!button)return;$('group').value=button.dataset.group;$('office').value='';$('search').value='';$('status').value='';$('mode').value=button.dataset.mode;syncOffices();page=0;render();$('search').scrollIntoView({behavior:'smooth',block:'center'});};
$('reset').onclick=()=>{['search','group','office','status'].forEach(id=>$(id).value='');$('mode').value='all';syncOffices();page=0;render();};
$('prev').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};$('refresh').onclick=load;load();setInterval(()=>{if(!document.hidden)load();},300000);
