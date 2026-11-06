'use strict';
const SHEET='1Am1dLRE4o1UoCGm01wMSrtXiJC8DGSMW5NmWV97sGSw';
const $=id=>document.getElementById(id);
let data=[],page=0,loading=false;
let size=6,groupPage=0,detailPage=0,activeTab='groups';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isPlan=r=>Boolean(r[2]||r[3]);
const planClass=r=>r[1]&&r[2]&&r[3]?'complete':r[1]&&!r[2]?'memoOnly':r[2]&&!r[1]?'ptOnly':isPlan(r)?'partial':'empty';
const classLabel=r=>({complete:'มีครบ: บันทึก + ชื่องาน + PT',memoOnly:'มีบันทึก · ยังไม่มี PT ใน MJM',ptOnly:'มี PT · ยังไม่มีเลขบันทึก',partial:'ข้อมูลแผนยังไม่ครบ',empty:'ยังไม่ส่งแผน'}[planClass(r)]);
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
 $('submitted').textContent=done.toLocaleString('th');$('empty').textContent=(scopedOffices.length-done).toLocaleString('th');
 for(const kind of ['memoOnly','complete','ptOnly'])$(kind).textContent=plans.filter(r=>planClass(r)===kind).length.toLocaleString('th');
 $('districtTotal').textContent=allOffices.length.toLocaleString('th');
 $('coverage').textContent='เขต 2: '+allOffices.length+' การไฟฟ้าไม่นับซ้ำ / '+new Set(data.map(r=>r[4]).filter(Boolean)).size+' จุดรวมงาน · ส่งแล้วและยังไม่ส่งนับเป็นการไฟฟ้า · แต่ละการไฟฟ้าส่งได้หลายแผน';
 $('planMeta').textContent='จำนวนแผนที่ได้รับ '+plans.length+' แผน (แยกจากจำนวนการไฟฟ้า) · มี PT '+plans.filter(r=>r[2]).length+' · ยังไม่มี PT '+plans.filter(r=>!r[2]).length+' รายการ';
 const groupNames=[...new Set(data.map(r=>r[4]))].filter(Boolean);const groupSize=window.innerWidth<600?4:window.innerWidth<1000||window.innerHeight<1050?6:12;groupPage=Math.min(groupPage,Math.max(0,Math.ceil(groupNames.length/groupSize)-1));$('groupPageText').textContent='จุดรวมงาน '+(groupPage*groupSize+1)+'–'+Math.min((groupPage+1)*groupSize,groupNames.length)+' / '+groupNames.length;$('groupPrev').disabled=groupPage===0;$('groupNext').disabled=(groupPage+1)*groupSize>=groupNames.length;$('groupPager').hidden=groupNames.length<=groupSize;
 $('groups').innerHTML=groupNames.slice(groupPage*groupSize,(groupPage+1)*groupSize).map(g=>{const os=allOffices.filter(o=>o.group===g),s=os.filter(o=>o.plans.length).length,p=os.reduce((n,o)=>n+o.plans.length,0);return '<article class="groupcard '+(g===group?'active':'')+'"><h3>'+esc(g)+'</h3><div class="groupstats"><span>ทั้งหมด <b>'+os.length+'</b> แห่ง</span><span>ส่งแล้ว <b>'+s+'</b></span><span class="warn">ยังไม่ส่ง <b>'+(os.length-s)+'</b></span></div><div class="trackbar"><span style="width:'+(os.length?s/os.length*100:0)+'%"></span></div><p class="muted">ได้รับ '+p+' แผน · '+data.filter(r=>r[4]===g).length+' รายการในชีต</p><div class="groupactions"><button data-group="'+esc(g)+'" data-mode="all">ดูจุดย่อย</button><button data-group="'+esc(g)+'" data-mode="empty">ติดตามที่ยังไม่ส่ง ('+(os.length-s)+')</button></div></article>';}).join('');
 const mode=$('mode').value;
 const filtered=base.filter(r=>(!q||r.join(' ').toLocaleLowerCase('th').includes(q))&&(!st||status(r)===st)&&(mode==='all'||(mode==='plans'?isPlan(r):mode==='submitted'?sent(r):!sent(r))));
 if(activeTab==='plans'){const wrap=$('plansPanel').querySelector('.tablewrap');size=Math.max(1,Math.floor((wrap.clientHeight-43)/56));}
 const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages-1);
 $('rows').innerHTML=filtered.slice(page*size,(page+1)*size).map(r=>'<tr class="'+(!sent(r)?'rowmissing':'')+'">'+r.slice(0,5).map(c=>'<td title="'+esc(c||'—')+'">'+esc(c||'—')+'</td>').join('')+'<td><span class="badge '+(sent(r)?'green':'orange')+'">'+esc(classLabel(r))+'</span></td><td>'+esc(r[5]||'—')+'</td></tr>').join('')||'<tr><td colspan="7">ไม่พบรายการตามเงื่อนไข</td></tr>';
 $('count').textContent='พบ '+filtered.length.toLocaleString('th')+' รายการ · '+new Set(filtered.map(r=>r[4]+'|'+r[0])).size+' หน่วยงาน · หน้า '+(page+1)+' / '+pages;$('prev').disabled=page===0;$('next').disabled=page>=pages-1;
}

function showDetails(kind){
 const names={all:'รายชื่อ กฟฟ. แยกตามจุดรวมงาน',submitted:'กฟฟ. ที่ส่งแผนแล้ว',empty:'กฟฟ. ที่ยังไม่ส่งแผน',memoOnly:'มีเลขบันทึก แต่ยังไม่มีเลขแผน PT ใน MJM',complete:'มีครบ: เลขบันทึก + ชื่องาน + PT',ptOnly:'มี PT แต่ยังไม่มีเลขบันทึก'};
 const q=$('search').value.trim().toLocaleLowerCase('th'),g=$('group').value,o=$('office').value;
 const offices=officeStats(data.filter(r=>(!g||r[4]===g)&&(!o||r[0]===o))).filter(x=>!q||x.rows.some(r=>r.join(' ').toLocaleLowerCase('th').includes(q)));
 let body='',count=0;
 if(['all','submitted','empty'].includes(kind)){
 const os=offices.filter(x=>kind==='all'||(kind==='submitted'?x.plans.length:!x.plans.length));
 count=os.length;body='<table><thead><tr><th>จุดรวมงาน</th><th>การไฟฟ้า</th><th>จำนวนแผน</th><th>มีเลข PT</th><th>มีบันทึก ยังไม่มี PT</th><th>มีครบ</th><th>การส่งแผน</th></tr></thead><tbody>'+os.map(x=>'<tr><td>'+esc(x.group)+'</td><td>'+esc(x.name)+'</td><td>'+x.plans.length+'</td><td>'+x.plans.filter(r=>r[2]).length+'</td><td>'+x.plans.filter(r=>planClass(r)==='memoOnly').length+'</td><td>'+x.plans.filter(r=>planClass(r)==='complete').length+'</td><td><span class="badge '+(x.plans.length?'green':'orange')+'">'+(x.plans.length?'ส่งแล้ว':'ยังไม่ส่งแผน')+'</span></td></tr>').join('')+'</tbody></table>';
 }else{
 const rows=offices.flatMap(x=>x.plans).filter(r=>planClass(r)===kind);count=rows.length;
 body='<table><thead><tr><th>การไฟฟ้า</th><th>เลขที่บันทึก</th><th>เลข PT</th><th>ชื่องาน</th><th>จุดรวมงาน</th><th>สถานะงาน PT</th></tr></thead><tbody>'+rows.map(r=>'<tr>'+[r[0],r[1],r[2],r[3],r[4],r[5]].map(v=>'<td title="'+esc(v||'—')+'">'+esc(v||'—')+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 }
 $('detailTitle').textContent=names[kind]+' · '+count+(['all','submitted','empty'].includes(kind)?' กฟฟ.':' แผน');
 $('detailNote').textContent='ตามจุดรวมงาน จุดย่อย และคำค้นที่เลือก · ตรวจจากช่องข้อมูลใน Google Sheets เท่านั้น ยังไม่ได้ตรวจสถานะในระบบ MJM โดยตรง'+(kind==='all'?' · รวม '+officeStats(data).length+' การไฟฟ้าไม่นับซ้ำ ไม่ใช่จำนวนแผน':'');
 $('detailBody').innerHTML=count?body:'<p>ไม่พบรายการตามเงื่อนไข</p>';$('detailDialog').showModal();detailPage=0;paginateDetails();
}
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>showDetails(button.dataset.view));
$('closeDetail').onclick=()=>$('detailDialog').close();
$('detailDialog').addEventListener('click',event=>{
 if(event.target!==$('detailDialog'))return;
 const r=$('detailDialog').getBoundingClientRect();
 if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('detailDialog').close();
});


function switchTab(name){
 activeTab=name;for(const n of ['groups','plans','criteria']){$(n==='groups'?'groupPanel':n==='plans'?'plansPanel':'criteriaPanel').hidden=n!==name;$('tab-'+n).setAttribute('aria-selected',String(n===name));}render();
}
function paginateDetails(){
 const rows=[...$('detailBody').querySelectorAll('tbody tr')],perPage=Math.max(1,Math.floor(($('detailBody').clientHeight-43)/56));
 const pages=Math.max(1,Math.ceil(rows.length/perPage));detailPage=Math.min(detailPage,pages-1);
 rows.forEach((r,i)=>r.hidden=i<detailPage*perPage||i>=(detailPage+1)*perPage);
 $('detailCount').textContent=rows.length+' รายการ · หน้า '+(detailPage+1)+' / '+pages;$('detailPrev').disabled=detailPage===0;$('detailNext').disabled=detailPage>=pages-1;
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$('groupPrev').onclick=()=>{groupPage--;render();};$('groupNext').onclick=()=>{groupPage++;render();};
$('detailPrev').onclick=()=>{detailPage--;paginateDetails();};$('detailNext').onclick=()=>{detailPage++;paginateDetails();};
window.addEventListener('resize',()=>{page=0;render();if($('detailDialog').open)paginateDetails();});

function load(){
 if(loading)return;loading=true;$('refresh').disabled=true;
 const cb='peaSheet'+Date.now(),script=document.createElement('script');let timer;
 function done(){clearTimeout(timer);script.remove();delete window[cb];loading=false;$('refresh').disabled=false;}
 function fail(){done();$('message').className='message error';$('message').textContent='อ่านข้อมูลไม่ได้ กรุณาตรวจว่าชีตเปิดให้ทุกคนที่มีลิงก์ดูได้ แล้วกดอัปเดตข้อมูลอีกครั้ง'+(data.length?' · กำลังแสดงข้อมูลจากการดึงครั้งก่อน':'');if(!data.length){$('rows').innerHTML='<tr><td colspan="7">ยังไม่สามารถเชื่อมต่อ Google Sheets ได้</td></tr>';$('updated').textContent='เชื่อมต่อไม่สำเร็จ';}}
 window[cb]=response=>{try{if(response.status==='error'||!response.table)throw Error('Sheet unavailable');const rows=response.table.rows.map(row=>Array.from({length:6},(_,i)=>String(row.c[i]?.f??row.c[i]?.v??'').trim())).filter(r=>r.some(Boolean));data=rows.filter(r=>!(r[0]==='กฟฟ.'&&r[2]==='เลขใบงาน PT'));options('group',data.map(r=>r[4]));options('status',data.map(status));syncOffices();$('message').className='message';$('message').textContent='เชื่อมต่อ Google Sheets สำเร็จ · ข้อมูลล่าสุดที่ดึงจากชีต โดยไม่แก้ไขข้อมูลต้นฉบับ';$('updated').textContent='ดึงข้อมูลล่าสุด '+new Date().toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});render();done();}catch(e){fail();}};
 script.onerror=fail;script.src='https://docs.google.com/spreadsheets/d/'+SHEET+'/gviz/tq?sheet='+encodeURIComponent('แผนงานปี 70')+'&headers=1&tq='+encodeURIComponent('select A,B,C,D,E,F')+'&tqx='+encodeURIComponent('out:json;responseHandler:'+cb)+'&_='+Date.now();timer=setTimeout(fail,20000);document.head.appendChild(script);
}
['search','group','office','status','mode'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',()=>{page=0;if(id==='group'){$('office').value='';syncOffices();}render();}));
$('groups').onclick=e=>{const button=e.target.closest('button[data-group]');if(!button)return;$('group').value=button.dataset.group;$('office').value='';$('search').value='';$('status').value='';$('mode').value=button.dataset.mode;syncOffices();page=0;render();switchTab('plans');};
$('reset').onclick=()=>{['search','group','office','status'].forEach(id=>$(id).value='');$('mode').value='all';syncOffices();page=0;render();};
$('prev').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};$('refresh').onclick=load;load();setInterval(()=>{if(!document.hidden)load();},300000);
