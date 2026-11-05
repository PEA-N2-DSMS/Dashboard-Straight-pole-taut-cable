'use strict';
const SHEET='1Am1dLRE4o1UoCGm01wMSrtXiJC8DGSMW5NmWV97sGSw';
const $=id=>document.getElementById(id);
let data=[],page=0,loading=false;
const size=25;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isPlan=r=>Boolean(r[2]||r[3]);
const status=r=>r[5]||(isPlan(r)?'ยังไม่ระบุสถานะ':'ยังไม่มีแผน');
function options(id,values){const old=$(id).value;$(id).innerHTML='<option value="">ทั้งหมด</option>'+[...new Set(values)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'th')).map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');if([...$(id).options].some(o=>o.value===old))$(id).value=old;}
function render(){
 const q=$('search').value.trim().toLocaleLowerCase('th'),group=$('group').value,st=$('status').value;
 const base=data.filter(r=>(!q||r.join(' ').toLocaleLowerCase('th').includes(q))&&(!group||r[4]===group)&&(!st||status(r)===st));
 const plans=base.filter(isPlan),plannedOffices=new Set(data.filter(isPlan).map(r=>r[0]));
 $('total').textContent=plans.length.toLocaleString('th');$('pt').textContent=plans.filter(r=>r[2]).length.toLocaleString('th');$('missing').textContent=plans.filter(r=>!r[2]).length.toLocaleString('th');
 $('empty').textContent=new Set(base.filter(r=>!isPlan(r)&&!plannedOffices.has(r[0])).map(r=>r[0]).filter(Boolean)).size.toLocaleString('th');
 const mode=$('mode').value,filtered=base.filter(r=>mode==='all'||(mode==='plans'?isPlan(r):!isPlan(r)&&!plannedOffices.has(r[0])));
 const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);
 $('rows').innerHTML=filtered.slice(page*size,(page+1)*size).map(r=>'<tr>'+r.slice(0,5).map(c=>'<td>'+esc(c||'—')+'</td>').join('')+'<td><span class="badge '+(/แล้วเสร็จ|เสร็จสิ้น|จ่าย/.test(status(r))?'green':/รอ|นำเข้า/.test(status(r))?'orange':'gray')+'">'+esc(status(r))+'</span></td></tr>').join('')||'<tr><td colspan="6">ไม่พบรายการตามเงื่อนไข</td></tr>';
 $('count').textContent='พบ '+filtered.length.toLocaleString('th')+' รายการ · หน้า '+(page+1)+' / '+pages;$('prev').disabled=page===0;$('next').disabled=page>=pages-1;
}
function load(){
 if(loading)return;loading=true;$('refresh').disabled=true;
 const cb='peaSheet'+Date.now(),script=document.createElement('script');let timer;
 function done(){clearTimeout(timer);script.remove();delete window[cb];loading=false;$('refresh').disabled=false;}
 function fail(){done();$('message').className='message error';$('message').textContent='อ่านข้อมูลไม่ได้ กรุณาตรวจว่าชีตเปิดให้ทุกคนที่มีลิงก์ดูได้ แล้วกดอัปเดตข้อมูลอีกครั้ง'+(data.length?' · กำลังแสดงข้อมูลจากการดึงครั้งก่อน':'');if(!data.length){$('rows').innerHTML='<tr><td colspan="6">ยังไม่สามารถเชื่อมต่อ Google Sheets ได้</td></tr>';$('updated').textContent='เชื่อมต่อไม่สำเร็จ';}}
 window[cb]=response=>{try{if(response.status==='error'||!response.table)throw Error('Sheet unavailable');const rows=response.table.rows.map(row=>Array.from({length:6},(_,i)=>String(row.c[i]?.f??row.c[i]?.v??'').trim())).filter(r=>r.some(Boolean));data=rows.filter(r=>!(r[0]==='กฟฟ.'&&r[2]==='เลขใบงาน PT'));options('group',data.map(r=>r[4]));options('status',data.map(status));$('message').className='message';$('message').textContent='เชื่อมต่อ Google Sheets สำเร็จ · ข้อมูลล่าสุดที่ดึงจากชีต โดยไม่แก้ไขข้อมูลต้นฉบับ';$('updated').textContent='ดึงข้อมูลล่าสุด '+new Date().toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});render();done();}catch(e){fail();}};
 script.onerror=fail;script.src='https://docs.google.com/spreadsheets/d/'+SHEET+'/gviz/tq?sheet='+encodeURIComponent('แผนงานปี 70')+'&headers=1&tq='+encodeURIComponent('select A,B,C,D,E,F')+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&_='+Date.now();timer=setTimeout(fail,20000);document.head.appendChild(script);
}
['search','group','status','mode'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;render();}));
$('prev').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};$('refresh').onclick=load;load();setInterval(()=>{if(!document.hidden)load();},300000);
