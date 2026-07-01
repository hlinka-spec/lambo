let CASE = null;
let editingEventIndex = null;
let editingDamageIndex = null;
let editingContactIndex = null;
let adminMode = false;

const $ = (id)=>document.getElementById(id);
const money = (n)=> Number(n||0).toLocaleString('en-US');

async function init(){
  try{
    const saved = localStorage.getItem('urusCaseBookData');
    if(saved){ CASE = JSON.parse(saved); }
    else{
      const r = await fetch('/content/case.json?x=' + Date.now());
      CASE = await r.json();
      saveLocal();
    }
  }catch(e){
    document.body.innerHTML = '<p style="padding:20px;color:white">Could not load case data.</p>';
    return;
  }
  render();
}

function saveLocal(){ localStorage.setItem('urusCaseBookData', JSON.stringify(CASE)); }
function resetLocal(){ if(confirm('Reset local edits and reload original content/case.json?')){localStorage.removeItem('urusCaseBookData'); location.reload();}}

function render(){
  const total = CASE.damages.reduce((s,d)=>s+Number(d.amount||0),0);
  const events = CASE.events || [];
  document.title = CASE.site.title;
  $('app').innerHTML = `
  <div class="site ${adminMode ? 'off' : 'on'}" id="site">
    <header class="hero">
      <div class="hero-in">
        <div class="kicker">Confidential Legal Case File</div>
        <h1>${esc(CASE.site.title)}</h1>
        <div class="sub">${esc(CASE.site.subtitle)} · VIN: ${esc(CASE.site.vin)} · Owner: ${esc(CASE.site.owner)}</div>
        <div class="chips">
          <span class="chip">Status: ${esc(CASE.site.status)}</span>
          <span class="chip">Purchase: AED ${money(CASE.site.purchasePrice)}</span>
          <span class="chip">Repair: AED ${money(CASE.site.repairEstimate)}</span>
          <span class="chip">Distance: ${esc(CASE.site.distance)}</span>
        </div>
      </div>
    </header>
    <nav class="nav">
      <a href="#dashboard">Dashboard</a><a href="#timeline">Timeline</a><a href="#damages">Damages</a><a href="#contacts">Contacts</a>
      <button onclick="showAdmin()">Admin</button><button onclick="window.print()">Export / Print PDF</button>
    </nav>
    <main class="wrap">
      <section class="section" id="dashboard">
        <h2>Dashboard</h2>
        <div class="grid">
          <div class="card metric"><span class="muted">Total damages</span><b>AED ${money(total)}</b></div>
          <div class="card metric"><span class="muted">Timeline events</span><b>${events.length}</b></div>
          <div class="card metric"><span class="muted">Repair estimate</span><b>AED ${money(CASE.site.repairEstimate)}</b></div>
        </div>
        <div class="card" style="margin-top:16px"><h3>Executive Summary</h3><p>${esc(CASE.summary)}</p></div>
      </section>
      <section class="section" id="timeline"><h2>Timeline</h2><div class="timeline">${events.map(renderEvent).join('')}</div></section>
      <section class="section" id="damages"><h2>Damages / Costs</h2>${renderDamages()}</section>
      <section class="section" id="contacts"><h2>Contacts</h2><div class="grid">${(CASE.contacts||[]).map(c=>`<div class="card"><h3>${esc(c.name)}</h3><p class="muted">${esc(c.role)}</p><p>${esc(c.email)} ${esc(c.phone)}</p><p>${esc(c.notes)}</p></div>`).join('')}</div></section>
    </main>
    <footer>Confidential Case Book · Stored locally in this browser unless you export JSON.</footer>
    <div class="lightbox" id="lightbox" onclick="closeLightbox()"><button onclick="closeLightbox();event.stopPropagation()">Close ✕</button><img id="lightboxImg" src=""></div>
  </div>
  <div class="admin ${adminMode ? 'on' : ''}" id="admin">${renderAdmin()}</div>`;
}

function renderEvent(ev, i){
  return `<article class="event">
    <div class="date">${esc(ev.date)}<br><span class="badge ${ev.status}">${esc(ev.status)}</span></div>
    <div>
      <span class="badge source">${esc(ev.id)}</span><span class="badge source">${esc(ev.source)}</span>
      <h3>${esc(ev.title)}</h3>
      <p>${nl(ev.description)}</p>
      ${ev.legal ? `<p class="legal"><b>Legal significance:</b> ${nl(ev.legal)}</p>` : ''}
      ${media(ev)}
    </div>
  </article>`;
}
function media(ev){
  let out='';
  const imgs=ev.photos||[], docs=ev.documents||[], aud=ev.audio||[], vids=ev.videos||[];
  if(imgs.length) out += `<div class="media">${imgs.map(x=>`<img src="${attr(x)}" onclick="openLightbox('${attr(x)}')" title="Click to enlarge">`).join('')}</div>`;
  if(docs.length) out += docs.map(x=>`<a class="filelink" href="${attr(x)}" target="_blank">Open document</a>`).join('');
  if(aud.length) out += `<div class="media">${aud.map(x=>`<audio controls src="${attr(x)}"></audio>`).join('')}</div>`;
  if(vids.length) out += `<div class="media">${vids.map(x=>`<video controls src="${attr(x)}"></video>`).join('')}</div>`;
  return out;
}
function renderDamages(){
 const total = CASE.damages.reduce((s,d)=>s+Number(d.amount||0),0);
 return `<div class="tablewrap"><table><thead><tr><th>Item</th><th>Amount</th><th>Evidence</th><th>Notes</th></tr></thead><tbody>
 ${CASE.damages.map(d=>`<tr><td>${esc(d.item)}</td><td>${esc(d.currency)} ${money(d.amount)}</td><td>${esc(d.evidence)}</td><td>${esc(d.notes)}</td></tr>`).join('')}
 <tr><th>Total</th><th>AED ${money(total)}</th><th></th><th></th></tr>
 </tbody></table></div>`;
}

function renderAdmin(){
 return `<div class="wrap">
  <h2>Admin Panel</h2>
  <div class="note">Edits are saved in this browser. To move them to another computer or preserve them permanently, click <b>Export JSON</b> and replace <b>content/case.json</b> in GitHub.</div>
  <div class="toolbar"><button class="btn" onclick="showSite()">Back to Case Book</button><button class="btn primary" onclick="saveLocal(); render()">Save</button><button class="btn" onclick="exportJSON()">Export JSON</button><label class="btn">Import JSON<input type="file" accept=".json" onchange="importJSON(event)" style="display:none"></label><button class="btn danger" onclick="resetLocal()">Reset</button></div>
  <div class="admin-panel">
    <h3>Main details</h3>
    <div class="formgrid">
      ${input('Title','site.title',CASE.site.title)}
      ${input('Subtitle','site.subtitle',CASE.site.subtitle)}
      ${input('VIN','site.vin',CASE.site.vin)}
      ${input('Owner','site.owner',CASE.site.owner)}
      ${input('Status','site.status',CASE.site.status)}
      ${input('Purchase Price','site.purchasePrice',CASE.site.purchasePrice,'number')}
      ${input('Repair Estimate','site.repairEstimate',CASE.site.repairEstimate,'number')}
      ${input('Distance','site.distance',CASE.site.distance)}
    </div>
    <label>Executive Summary</label><textarea onchange="setPath('summary',this.value)">${esc(CASE.summary)}</textarea>
  </div>
  <div class="admin-panel" style="margin-top:18px">
    <h3>Timeline Events</h3>
    <button class="btn primary" onclick="newEvent()">+ New Event</button>
    ${renderEventForm()}
    <div class="admin-list">${CASE.events.map((ev,i)=>`<div class="admin-row"><div><b>${esc(ev.id)} — ${esc(ev.title)}</b><br><small>${esc(ev.date)} · ${esc(ev.status)}</small></div><div class="toolbar"><button class="btn" onclick="editEvent(${i})">Edit</button><button class="btn danger" onclick="deleteEvent(${i})">Delete</button></div></div>`).join('')}</div>
  </div>
  <div class="admin-panel" style="margin-top:18px">
    <h3>Damages</h3><button class="btn primary" onclick="newDamage()">+ New Cost</button>
    ${renderDamageForm()}
    <div class="admin-list">${CASE.damages.map((d,i)=>`<div class="admin-row"><div><b>${esc(d.item)}</b><br><small>${esc(d.currency)} ${money(d.amount)}</small></div><div class="toolbar"><button class="btn" onclick="editDamage(${i})">Edit</button><button class="btn danger" onclick="deleteDamage(${i})">Delete</button></div></div>`).join('')}</div>
  </div>
 </div>`;
}

function renderEventForm(){
 if(editingEventIndex===null) return '';
 const ev = editingEventIndex === -1 ? blankEvent() : CASE.events[editingEventIndex];
 return `<div class="card" style="margin:14px 0">
 <h3>${editingEventIndex===-1?'New Event':'Edit Event'}</h3>
 <div class="formgrid">
  ${field('Evidence ID','ev_id',ev.id)}${field('Date','ev_date',ev.date)}${field('Title','ev_title',ev.title)}
  ${field('Source','ev_source',ev.source)}
  <label>Status<select id="ev_status"><option ${ev.status==='completed'?'selected':''}>completed</option><option ${ev.status==='waiting'?'selected':''}>waiting</option><option ${ev.status==='action'?'selected':''}>action</option></select></label>
 </div>
 <label>Description</label><textarea id="ev_description">${esc(ev.description)}</textarea>
 <label>Legal significance</label><textarea id="ev_legal">${esc(ev.legal)}</textarea>
 <div class="formgrid">
  ${field('Photos URLs, comma separated','ev_photos',(ev.photos||[]).join(','))}
  ${field('PDF/Documents URLs, comma separated','ev_documents',(ev.documents||[]).join(','))}
  ${field('Audio URLs, comma separated','ev_audio',(ev.audio||[]).join(','))}
  ${field('Video URLs, comma separated','ev_videos',(ev.videos||[]).join(','))}
 </div>
 <p class="muted">For files, upload them to GitHub folder assets/photos, assets/documents, assets/audio or assets/videos, then write path like assets/photos/photo1.jpg.</p>
 <button class="btn primary" onclick="saveEventForm()">Save Event</button> <button class="btn" onclick="editingEventIndex=null; render()">Cancel</button>
 </div>`;
}
function blankEvent(){return {id:'E-000',date:'',title:'',source:'Buyer',status:'completed',description:'',legal:'',photos:[],documents:[],audio:[],videos:[]};}
function newEvent(){editingEventIndex=-1; render();}
function editEvent(i){editingEventIndex=i; render();}
function deleteEvent(i){if(confirm('Delete event?')){CASE.events.splice(i,1); saveLocal(); render();}}
function saveEventForm(){
 const ev={id:val('ev_id'),date:val('ev_date'),title:val('ev_title'),source:val('ev_source'),status:val('ev_status'),description:val('ev_description'),legal:val('ev_legal'),photos:list('ev_photos'),documents:list('ev_documents'),audio:list('ev_audio'),videos:list('ev_videos')};
 if(editingEventIndex===-1) CASE.events.push(ev); else CASE.events[editingEventIndex]=ev;
 editingEventIndex=null; saveLocal(); render();
}

function renderDamageForm(){
 if(editingDamageIndex===null) return '';
 const d = editingDamageIndex === -1 ? {item:'',amount:0,currency:'AED',evidence:'',notes:''} : CASE.damages[editingDamageIndex];
 return `<div class="card" style="margin:14px 0"><h3>${editingDamageIndex===-1?'New Cost':'Edit Cost'}</h3>
 <div class="formgrid">${field('Item','d_item',d.item)}${field('Amount','d_amount',d.amount,'number')}${field('Currency','d_currency',d.currency)}${field('Evidence','d_evidence',d.evidence)}</div>
 <label>Notes</label><textarea id="d_notes">${esc(d.notes)}</textarea>
 <button class="btn primary" onclick="saveDamageForm()">Save Cost</button> <button class="btn" onclick="editingDamageIndex=null; render()">Cancel</button></div>`;
}
function newDamage(){editingDamageIndex=-1; render();}
function editDamage(i){editingDamageIndex=i; render();}
function deleteDamage(i){if(confirm('Delete cost?')){CASE.damages.splice(i,1); saveLocal(); render();}}
function saveDamageForm(){const d={item:val('d_item'),amount:Number(val('d_amount')),currency:val('d_currency'),evidence:val('d_evidence'),notes:val('d_notes')}; if(editingDamageIndex===-1) CASE.damages.push(d); else CASE.damages[editingDamageIndex]=d; editingDamageIndex=null; saveLocal(); render();}

function showAdmin(){adminMode = true; render();}
function showSite(){adminMode = false; render();}
function setPath(path,value){const parts=path.split('.');let obj=CASE;while(parts.length>1)obj=obj[parts.shift()];obj[parts[0]]=value;saveLocal();}
function input(label,path,value,type='text'){return `<label>${label}<input type="${type}" value="${esc(value)}" onchange="setPath('${path}',this.value)"></label>`}
function field(label,id,value,type='text'){return `<label>${label}<input id="${id}" type="${type}" value="${esc(value||'')}"></label>`}
function val(id){return document.getElementById(id).value}
function list(id){return val(id).split(',').map(x=>x.trim()).filter(Boolean)}
function exportJSON(){const blob=new Blob([JSON.stringify(CASE,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='case.json';a.click();}
function importJSON(e){const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{CASE=JSON.parse(r.result); saveLocal(); render();}; r.readAsText(f);}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function attr(s){return esc(s).replace(/"/g,'&quot;')}
function nl(s){return esc(s).replace(/\n/g,'<br>')}
init();

function openLightbox(src){
  const box=document.getElementById('lightbox');
  const img=document.getElementById('lightboxImg');
  if(!box||!img) return;
  img.src=src;
  box.classList.add('on');
}
function closeLightbox(){
  const box=document.getElementById('lightbox');
  const img=document.getElementById('lightboxImg');
  if(!box||!img) return;
  box.classList.remove('on');
  img.src='';
}
