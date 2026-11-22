import {firebaseConfig} from './firebase-config.js';
const $=s=>document.querySelector(s);let auth,fs,db,functionsApi,functionsClient;
const demo=!firebaseConfig?.apiKey;
$('#mode').textContent=demo?'Local preview: invitation links work, but RSVP records are stored only in each guest’s browser. Configure Firebase for shared records and secure administration.':'Firebase mode: only accounts with an admin custom claim can view guest records.';
$('#generate').onclick=()=>{const guest=$('#guest').value.trim();if(!guest){alert('Enter a guest name');return;}const u=new URL('index.html',location.href);u.searchParams.set('guest',guest);u.searchParams.set('from',$('#sender').value.trim());$('#link').value=u.href;};
$('#copy').onclick=async()=>{if(!$('#link').value)return;try{await navigator.clipboard.writeText($('#link').value);alert('Copied!');}catch{prompt('Copy this link',$('#link').value);}};
$('#share').onclick=()=>{if(!$('#link').value)return;window.open('https://wa.me/?text='+encodeURIComponent('Assalamu Alaikum, we are pleased to invite you and your family to the Nikah of Fathima Rashfa and Hassan Zubeir. Your presence and duas would be greatly appreciated.\n\n'+$('#link').value),'_blank','noopener,noreferrer');};
if(demo){$('#role-label').textContent=token.claims.role==='super_admin'?'Signed in as Super Admin':'Signed in as Regular Admin';if(token.claims.role==='super_admin'){ $('#manage-admins').classList.remove('hidden');await initAdminManagement(a); }$('#signin').classList.add('hidden');$('#invite-tools').classList.remove('hidden');$('#records').classList.remove('hidden');$('#rsvps').textContent='Local preview responses from this browser only:';const arr=JSON.parse(localStorage.getItem('rashfa_hasan_rsvp')||'[]');const ul=document.createElement('ul');arr.forEach(v=>{const li=document.createElement('li');li.textContent=`${v.name}: ${v.attendance==='yes'?'Attending':'Not attending'} (${v.guests} guests)`;ul.append(li);});$('#rsvps').append(ul);$('#wishes').textContent='In demo mode, guestbook entries are visible on the invitation in this browser.';$('#logout').hidden=true;}
else{$('#login').onclick=async()=>{try{const app=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');const au=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');fs=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');const a=app.initializeApp(firebaseConfig);auth=au.getAuth(a);db=fs.getFirestore(a);await au.signInWithEmailAndPassword(auth,$('#email').value,$('#password').value);const token=await auth.currentUser.getIdTokenResult(true);if(token.claims.admin!==true){await au.signOut(auth);throw Error('This account does not have administrator permission.');}$('#role-label').textContent=token.claims.role==='super_admin'?'Signed in as Super Admin':'Signed in as Regular Admin';if(token.claims.role==='super_admin'){ $('#manage-admins').classList.remove('hidden');await initAdminManagement(a); }$('#signin').classList.add('hidden');$('#invite-tools').classList.remove('hidden');$('#records').classList.remove('hidden');await load();}catch(e){$('#status').textContent=e.message;}};$('#logout').onclick=async()=>{const au=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js');await au.signOut(auth);location.reload();};}
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
