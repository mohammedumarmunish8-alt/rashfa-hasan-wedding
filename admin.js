import {shareText} from "./share-message.js?v=20261126";
import {firebaseConfig} from './firebase-config.js';
const $=s=>document.querySelector(s);let auth,fs,db,functionsApi,functionsClient;
const demo=!firebaseConfig?.apiKey;
$('#mode').textContent=demo?'Local preview: invitation links work, but RSVP records are stored only in each guest’s browser. Configure Firebase for shared records and secure administration.':'Firebase mode: only accounts with an admin custom claim can view guest records.';
$('#generate').onclick=()=>{const guest=$('#guest').value.trim();if(!guest){alert('Enter a guest name');return;}const u=new URL('index.html',location.href);u.searchParams.set('guest',guest);u.searchParams.set('from',$('#sender').value.trim());$('#link').value=u.href;};
$('#copy').onclick=async()=>{if(!$('#link').value)return;try{await navigator.clipboard.writeText($('#link').value);alert('Copied!');}catch{prompt('Copy this link',$('#link').value);}};
$('#share').onclick=async()=>{
  const link=$('#link').value;if(!link)return;
  const url=new URL(link), target='https://wa.me/?text='+encodeURIComponent(shareText(link));
  if(demo){window.open(target,'_blank','noopener,noreferrer');return;}
  if(!auth?.currentUser)return;
  const button=$('#share');button.disabled=true;$('#share-status').textContent='Recording sharing attempt…';
  const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
  try{
    await fs.addDoc(fs.collection(db,'invitationShares'),{uid:auth.currentUser.uid,email:auth.currentUser.email,guest:url.searchParams.get('guest'),invitedBy:url.searchParams.get('from')||'',createdAt:fs.serverTimestamp()});
    $('#share-status').textContent='Sharing attempt recorded. Complete sending in WhatsApp.';
    if(popup)popup.location.href=target;else location.href=target;
  }catch(e){if(popup)popup.close();$('#share-status').textContent='Could not record share: '+e.message;}
  finally{button.disabled=false;}
};
if(demo){$('#role-label').textContent='Local preview';$('#signin').classList.add('hidden');$('#invite-tools').classList.remove('hidden');$('#records').classList.remove('hidden');$('#rsvps').textContent='Local preview responses from this browser only:';const arr=JSON.parse(localStorage.getItem('rashfa_hasan_rsvp')||'[]');const ul=document.createElement('ul');arr.forEach(v=>{const li=document.createElement('li');li.textContent=`${v.name}: ${v.attendance==='yes'?'Attending':'Not attending'} (${v.guests} guests)`;ul.append(li);});$('#rsvps').append(ul);$('#wishes').textContent='In demo mode, guestbook entries are visible on the invitation in this browser.';$('#logout').hidden=true;}
else{$('#login').onclick=async()=>{try{const app=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');const au=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');fs=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');const a=app.getApps().length?app.getApp():app.initializeApp(firebaseConfig);auth=au.getAuth(a);db=fs.getFirestore(a);await au.signInWithEmailAndPassword(auth,$('#email').value,$('#password').value);const token=await auth.currentUser.getIdTokenResult(true);if(token.claims.admin!==true){await au.signOut(auth);throw Error('This account does not have administrator permission.');}$('#role-label').textContent=token.claims.role==='super_admin'?'Signed in as Super Admin':'Signed in as Regular Admin';if(token.claims.role==='super_admin'){ $('#manage-admins').classList.remove('hidden'); $('#share-report').classList.remove('hidden'); initShareReport(); initAdminManagement(a).catch(e=>$('#admin-status').textContent=e.message); }$('#signin').classList.add('hidden');$('#invite-tools').classList.remove('hidden');$('#records').classList.remove('hidden');await load();}catch(e){$('#status').textContent=e.message;}};$('#logout').onclick=async()=>{const au=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');await au.signOut(auth);location.reload();};}
async function load(){const r=await fs.getDocs(fs.collection(db,'rsvps'));$('#rsvps').replaceChildren();const table=document.createElement('table');table.innerHTML='<thead><tr><th>Name</th><th>Attendance</th><th>Guests</th></tr></thead>';const body=document.createElement('tbody');r.forEach(d=>{const v=d.data(),tr=document.createElement('tr');[v.name,v.attendance,v.guests].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td);});body.append(tr);});table.append(body);$('#rsvps').append(table);const w=await fs.getDocs(fs.collection(db,'wishes'));$('#wishes').replaceChildren();w.forEach(d=>{const v=d.data(),div=document.createElement('div');div.className='panel';const txt=document.createElement('p');txt.textContent=v.name+': '+v.message;const b=document.createElement('button');b.className='outline';b.textContent=v.approved?'Unpublish':'Approve';b.onclick=async()=>{await fs.updateDoc(d.ref,{approved:!v.approved});await load();};div.append(txt,b);$('#wishes').append(div);});}

// Administrator role changes are made ONLY through server-side callable functions.
async function initAdminManagement(app){
  functionsApi=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js');
  functionsClient=functionsApi.getFunctions(app,'us-central1');
  $('#refresh-admins').onclick=refreshAdmins;
  $('#grant-admin').onclick=async()=>{
    const email=$('#admin-email').value.trim(),role=$('#admin-role').value;
    if(!email || !confirm(`Assign ${role} to ${email}?`))return;
    await runAdminCall('setWeddingAdminRole',{email,role});
  };
  await refreshAdmins();
}
async function runAdminCall(name,data){
  const status=$('#admin-status');status.textContent='Working…';
  try{
    const result=await functionsApi.httpsCallable(functionsClient,name)(data);
    status.textContent='Operation completed.';await refreshAdmins();return result.data;
  }catch(err){status.textContent='Error: '+err.message;return null;}
}
async function refreshAdmins(){
  const target=$('#admin-list');target.replaceChildren();
  try{
    const {data}=await functionsApi.httpsCallable(functionsClient,'listWeddingAdmins')({});
    const table=document.createElement('table');
    const head=document.createElement('tr');
    for(const name of ['Account','Role','Action']){const th=document.createElement('th');th.textContent=name;head.append(th);}table.append(head);
    for(const user of data.admins){
      const tr=document.createElement('tr');
      for(const value of [user.email||user.uid,user.role]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
      const td=document.createElement('td');
      if(user.uid===auth.currentUser.uid){td.textContent='Your account';}
      else{const b=document.createElement('button');b.className='outline';b.textContent='Revoke';b.onclick=async()=>{if(confirm('Remove administrator access from '+(user.email||user.uid)+'?'))await runAdminCall('revokeWeddingAdmin',{uid:user.uid});};td.append(b);}
      tr.append(td);table.append(tr);
    }target.append(table);
  }catch(err){$('#admin-status').textContent='Unable to load admins: '+err.message;}
}

let shareRows=[];
function initShareReport(){
  $('#refresh-shares').onclick=loadShareReport;
  for(const id of ['#share-search','#share-start','#share-end'])$(id).addEventListener('input',renderShareReport);
  $('#export-shares').onclick=()=>{
    const safe=v=>{let t=String(v??'');if(/^[\s]*[=+@-]/.test(t)||/^[\t\r\n]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';};
    const csv=[['Administrator','Guest','Invited by','Time (local)'],...filteredShares().map(r=>[r.email,r.guest,r.invitedBy,r.createdAt?.toDate().toLocaleString()||'Pending'])].map(row=>row.map(safe).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='invitation-sharing-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };loadShareReport();
}
async function loadShareReport(){
  $('#report-status').textContent='Loading…';
  try{const snap=await fs.getDocs(fs.query(fs.collection(db,'invitationShares'),fs.orderBy('createdAt','desc')));shareRows=snap.docs.map(d=>d.data());renderShareReport();$('#report-status').textContent='Report refreshed.';}
  catch(e){shareRows=[];renderShareReport();$('#report-status').textContent='Unable to load report: '+e.message;}
}
function filteredShares(){const q=$('#share-search').value.trim().toLowerCase(),start=$('#share-start').value,end=$('#share-end').value;return shareRows.filter(r=>{const d=r.createdAt?.toDate();const day=d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'';return (!q||[r.email,r.guest,r.invitedBy].some(v=>String(v).toLowerCase().includes(q)))&&(!start||day>=start)&&(!end||day<=end);});}
function renderShareReport(){const rows=filteredShares(), totals=new Map();for(const r of rows)totals.set(r.email,(totals.get(r.email)||0)+1);$('#share-count').textContent=rows.length;$('#admin-count').textContent=totals.size;const summary=$('#share-summary');summary.replaceChildren();for(const [email,count] of totals){const p=document.createElement('p');p.textContent=`${email}: ${count} sharing attempt(s)`;summary.append(p);}const body=$('#share-body');body.replaceChildren();for(const r of rows){const tr=document.createElement('tr');for(const v of [r.email,r.guest,r.invitedBy,r.createdAt?.toDate().toLocaleString()||'Pending']){const td=document.createElement('td');td.textContent=v;tr.append(td);}body.append(tr);}$('#share-empty').hidden=rows.length!==0;}
