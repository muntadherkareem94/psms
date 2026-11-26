import { appId, getFirebaseConfig } from './firebase-config.js';
const legacyDashboards = {
            'General Practice': 'general-practice-dashboard.html',
            'Cardiology': 'cardiology-dashboard.html',
            'Pediatrics': 'pediatrics-dashboard.html',
            'Dermatology': 'dermatology-dashboard.html',
            'Orthopedics': 'orthopedics-dashboard.html',
            'Neurology': 'neurology-dashboard.html',
            'Oncology': 'oncology-dashboard.html',
            'Gastroenterology': 'gastroenterology-dashboard.html',
            'Ophthalmology': 'ophthalmology-dashboard.html',
            'ENT': 'ent-dashboard.html', 
            'Gynecology': 'gynecology-dashboard.html',
            'Urology': 'urology-dashboard.html',
            'Psychiatry': 'psychiatry-dashboard.html',
            'General Surgery': 'general-surgery-dashboard.html',
            'Plastic Surgery': 'plastic-surgery-dashboard.html',
            'Neurosurgery': 'neurosurgery-dashboard.html',
            'Thoracic Surgery': 'thoracic-surgery-dashboard.html',
            'Vascular Surgery': 'vascular-surgery-dashboard.html',
            'Cardiothoracic Surgery': 'cardiothoracic-surgery-dashboard.html', 
            'Critical Care': 'critical-care-dashboard.html', 
            'Emergency Medicine': 'emergency-medicine-dashboard.html', 
            'Intensive Care Medicine': 'doctor-dashboard.html' 
        };

window.psmsWorkspaceStarted = true;
const $ = id => document.getElementById(id);
const gate = $('gate'), app = $('app'), patientForm = $('patientForm'), consultForm = $('consultForm');
const patientDialog = $('patientDialog'), consultDialog = $('consultDialog'), deleteDialog = $('deleteDialog');
const fieldIds = {
  name:'fieldName', dateOfBirth:'fieldDob', gender:'fieldGender', contactNumber:'fieldPhone', address:'fieldAddress',
  medicalHistory:'fieldMedicalHistory', history:'fieldHistory', currentMedication:'fieldMedication', allergies:'fieldAllergies',
  physicalExam:'fieldExam', investigation:'fieldInvestigation', treatment:'fieldTreatment'
};
const specialties = [...new Set([...Object.keys(legacyDashboards), 'Internal Medicine'])].sort();
let authApi, fs, auth, db, uid = null, profile = null, epoch = 0, unsubscribers = [];
let patients = [], consults = [], patientState = 'loading', consultState = 'loading', page = 1, pageSize = 12;
let editing = null, readOnly = false, deleting = null, patientBusy = false, consultBusy = false, deleteBusy = false, recipientEpoch = 0, recipients = new Map();
let selectedView = 'patients', signingOut = false;
const string = value => value == null ? '' : String(value);
const trim = value => string(value).trim();
const localToday = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
function dateString(value) {
  const s = string(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const d = new Date(s+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === s ? s : '';
}
function latestVisit(record) {
  return [dateString(record.lastVisit), dateString(record.lastVisitDate)].sort().pop() || '';
}
function patientAge(value) {
  const s = dateString(value);
  if (!s || s > localToday()) return '';
  const [y,m,d] = s.split('-').map(Number), [ty,tm,td] = localToday().split('-').map(Number);
  return ty-y-(tm<m || (tm===m && td<d) ? 1:0);
}
function notice(message, isError = false, id = 'notice') {
  const el = $(id); el.textContent = message; el.classList.toggle('error', isError); el.hidden = !message;
}
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = string(text);
  return el;
}
function action(label, callback, className = 'tiny-button') {
  const b = element('button', className, label); b.type = 'button'; b.addEventListener('click', callback); return b;
}
function deadline(promise, ms = 20000) {
  let timer;
  return Promise.race([promise,new Promise((_,reject) => { timer = setTimeout(() => reject(new Error('Connection timed out')),ms); })]).finally(()=>clearTimeout(timer));
}
function current(token = epoch) { return token === epoch && !!uid && auth?.currentUser?.uid === uid; }
function active(token = epoch) { return current(token) && profile?.role === 'doctor' && !profile.deactivated; }
function profileRef(id) { return fs.doc(db,'artifacts/'+appId+'/public/data/doctors',id); }
function ownCollection(name) { return fs.collection(db,'artifacts/'+appId+'/doctors/'+uid+'/'+name); }
function ownPatient(id) { return fs.doc(db,'artifacts/'+appId+'/doctors/'+uid+'/patients',id); }
function validDoctor(data) { return data?.role === 'doctor' && !data.deactivated; }
function removeListeners() { for (const unsub of unsubscribers) { try { unsub(); } catch (_) {} } unsubscribers = []; }
function clearAll() {
  removeListeners(); ++recipientEpoch; uid = null; profile = null; patients = []; consults = []; editing = null; deleting = null; page = 1;
  patientBusy = false; consultBusy = false; deleteBusy = false; readOnly = false;
  recipients.clear(); patientState = 'loading'; consultState = 'loading';
  app.hidden = true; app.inert = true;
  $('patientRows').replaceChildren(); $('consultList').replaceChildren(); $('searchPatients').value = '';
  $('recipientDoctor').replaceChildren(new Option('Choose specialty first',''));
  $('recipientDoctor').disabled = true;
  for (const dialog of [patientDialog,consultDialog,deleteDialog]) if (dialog.open) dialog.close();
  patientForm.reset(); consultForm.reset(); $('deleteText').textContent = '';
  $('greeting').textContent='Welcome back'; $('sidebarName').textContent='Doctor'; $('sidebarSpecialty').textContent='Specialty';
  $('headerSpecialty').textContent='DOCTOR WORKSPACE'; $('avatar').textContent='D'; $('legacyLink').href='doctor-dashboard.html';
  $('totalPatients').textContent='—'; $('visitsToday').textContent='—'; $('pendingConsults').textContent='—';
  notice(''); notice('',false,'patientFormError'); notice('',false,'consultFormError'); notice('',false,'deleteError');
}
function gateState(title, message, failed = false) {
  gate.hidden = false; $('gateTitle').textContent=title; $('gateText').textContent=message;
  document.querySelector('.gate-card .spinner').hidden=failed; $('gateRetry').hidden=!failed; $('gateLogin').hidden=!failed;
}
function showApp() { app.hidden=false; app.inert=false; gate.hidden=true; }
function login(message) {
  try { if (message) sessionStorage.setItem('loginErrorMessage', message); } catch (_) {}
  window.location.replace('index.html');
}
async function rejectAccount(message) {
  signingOut=true; ++epoch; clearAll(); gateState('Access unavailable',message,true);
  try { await authApi.signOut(auth); } catch (_) { login(message); return; }
  login(message);
}
function setProfile(data) {
  profile = data;
  const name = trim(data.name) || 'Doctor';
  const displayedName = /^dr\.?\s/i.test(name) ? name : 'Dr. '+name;
  const specialty = trim(data.speciality) || 'General practice';
  $('greeting').textContent='Welcome back, '+displayedName;
  $('sidebarName').textContent=displayedName; $('sidebarSpecialty').textContent=specialty;
  $('headerSpecialty').textContent=specialty+' workspace'; $('avatar').textContent=name.slice(0,1).toUpperCase();
  $('legacyLink').href=Object.hasOwn(legacyDashboards,specialty) ? legacyDashboards[specialty] : 'doctor-dashboard.html';
  if (!specialties.includes(specialty)) {
    specialties.push(specialty); specialties.sort();
    fillSpecialties();
  }
}
function fillSpecialties() {
  const select = $('recipientSpecialty'), oldValue = select.value;
  select.replaceChildren(new Option('Choose specialty',''),...specialties.map(x=>new Option(x,x)));
  if (specialties.includes(oldValue)) select.value=oldValue;
}
function updateStats() {
  $('totalPatients').textContent=patientState==='ready'?patients.length:'—';
  $('visitsToday').textContent=patientState==='ready'?patients.filter(p=>latestVisit(p)===localToday()).length:'—';
  $('pendingConsults').textContent=consultState==='ready'?consults.filter(c=>string(c.status).toLowerCase()==='pending').length:'—';
}
function showView(view) {
  selectedView=view;
  $('patientsView').hidden=view!=='patients'; $('consultationsView').hidden=view!=='consultations';
  for (const button of document.querySelectorAll('[data-view]')) {
    const isCurrent=button.dataset.view===view;
    button.classList.toggle('current',isCurrent);
    if(isCurrent)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
}
function renderPatients() {
  const status=$('patientStatus'), rows=$('patientRows'), table=$('patientTableWrap'), paging=$('pagination');
  rows.replaceChildren(); table.hidden=true; paging.hidden=true; status.hidden=false; updateStats();
  $('newPatientButton').disabled=patientState!=='ready';
  if(patientState!=='ready') {
    status.textContent=patientState==='error'?'Could not load patient records. Reconnect or refresh to retry.':'Waiting for patient records from the server…';
    return;
  }
  const q=trim($('searchPatients').value).toLocaleLowerCase();
  const filtered=patients.filter(p=>!q || [p.name,p.contactNumber,p.id].some(v=>string(v).toLocaleLowerCase().includes(q)))
    .sort((a,b)=>latestVisit(b).localeCompare(latestVisit(a)) || string(a.name).localeCompare(string(b.name)));
  if(!filtered.length){ status.textContent=patients.length?'No records match your search.':'No patient records yet. Select New patient to get started.'; return; }
  const maxPage=Math.max(1,Math.ceil(filtered.length/pageSize));
  page=Math.min(maxPage,Math.max(1,page));
  for(const patient of filtered.slice((page-1)*pageSize,page*pageSize)){
    const row=element('tr');
    const age=patientAge(patient.dateOfBirth);
    const heading=patient.name || 'Unnamed patient';
    row.append(element('td','',heading),element('td','',(age===''?'—':age+' y')+' / '+(patient.gender||'—')),element('td','',patient.contactNumber||'—'),element('td','',latestVisit(patient)||'—'));
    const td=element('td','right'), buttons=element('div','row-actions');
    buttons.append(action('View',()=>openPatient(patient.id,true)),action('Edit',()=>openPatient(patient.id,false)),action('Delete',()=>openDelete(patient.id),'tiny-button delete')); td.append(buttons);row.append(td);rows.append(row);
  }
  table.hidden=false;status.hidden=true;paging.hidden=false;
  $('pageText').textContent='Showing '+((page-1)*pageSize+1)+'–'+Math.min(page*pageSize,filtered.length)+' of '+filtered.length;
  $('prevPage').disabled=page<=1;$('nextPage').disabled=page>=maxPage;
}
function renderConsults() {
  const list=$('consultList'), status=$('consultStatus');list.replaceChildren();status.hidden=false;updateStats();
  if(consultState!=='ready'){
    status.textContent=consultState==='error'?'Consultations are unavailable. Your account may not have access.':'Waiting for consultations from the server…';
    return;
  }
  if(!consults.length){status.textContent='No received consultations yet.';return;}
  status.hidden=true;
  const seconds=c=>Number(c.timestamp?.seconds)||0;
  for(const c of [...consults].sort((a,b)=>seconds(b)-seconds(a))){
    const card=element('article','consult-card');
    card.append(element('h3','',c.subject||'Consultation'),element('p','muted','From: '+(c.fromDoctorName||'Doctor')+(c.fromDoctorSpecialty?' · '+c.fromDoctorSpecialty:'')),element('p','', 'Patient: '+(c.patientName||'—')),element('p','',c.message||''));
    let when='';try{when=c.timestamp?.toDate()?.toLocaleString()||'';}catch(_){}
    const statusText=c.status||'Unknown';
    card.append(element('span',statusText==='pending'?'tag':'tag neutral',statusText),element('p','muted',when));
    list.append(card);
  }
}
function listenData(token) {
  unsubscribers.push(fs.onSnapshot(ownCollection('patients'),{includeMetadataChanges:true},snap=>{
    if(!active(token))return;
    if(snap.metadata.fromCache){patients=[];patientState='loading';renderPatients();return;}
    patients=snap.docs.map(d=>({...d.data(),id:d.id})); patientState='ready';renderPatients();
  },()=>{if(active(token)){patients=[];patientState='error';renderPatients();}}));
  unsubscribers.push(fs.onSnapshot(ownCollection('received_consults'),{includeMetadataChanges:true},snap=>{
    if(!active(token))return;
    if(snap.metadata.fromCache){consults=[];consultState='loading';renderConsults();return;}
    consults=snap.docs.map(d=>({...d.data(),id:d.id})); consultState='ready';renderConsults();
  },()=>{if(active(token)){consults=[];consultState='error';renderConsults();}}));
}
async function handleSession(user) {
  const token=++epoch; clearAll();
  if(!user){ if(!signingOut)login(); return; }
  if(signingOut)return;
  gateState('Opening your workspace','Verifying your account securely…');
  uid=user.uid;
  try {
    const snap=await deadline(fs.getDocFromServer(profileRef(uid)));
    if(!current(token))return;
    if(!snap.exists() || !validDoctor(snap.data())){
      await rejectAccount(snap.exists()&&snap.data().deactivated?'Your account is deactivated. Please contact support.':'This workspace requires an active doctor account.'); return;
    }
    // The restored cardiology workflow stores structured clinical records.
    // Never edit these records with the simplified workspace form.
    if (snap.data().speciality === 'Cardiology') { window.location.replace('cardiology-dashboard.html'); return; }
    setProfile(snap.data());fillSpecialties();showView('patients');renderPatients();renderConsults();
    unsubscribers.push(fs.onSnapshot(profileRef(uid),{includeMetadataChanges:true},s=>{
      if(!current(token) || s.metadata.fromCache) return;
      if(!s.exists() || !validDoctor(s.data())) { rejectAccount('Your doctor account is no longer active. Please contact support.'); return; }
      setProfile(s.data());
    },()=>{if(current(token)){++epoch;clearAll();gateState('Account verification failed','Reconnect and retry to verify your access.',true);}}));
    listenData(token);showApp();
  } catch (_) { if(current(token)){++epoch;clearAll();gateState('Unable to verify your account','Check your connection and retry. Your records have not been modified.',true);} }
}
async function start() {
  try {
    const [appApi,a,f]=await deadline(Promise.all([
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js')
    ]));
    authApi=a;fs=f; const firebase=appApi.initializeApp(getFirebaseConfig());auth=a.getAuth(firebase);db=f.getFirestore(firebase);
    const initial=typeof __initial_auth_token!=='undefined'?__initial_auth_token:null;
    if(initial){try{await deadline(a.signInWithCustomToken(auth,initial));}catch(_){}}
    await deadline(auth.authStateReady());
    authApi.onAuthStateChanged(auth,handleSession,error=>{++epoch;clearAll();gateState('Connection unavailable','Unable to establish your session. Retry to continue.',true);});
  } catch(_){gateState('Connection unavailable','Check your internet connection and retry.',true);}
}
function patientMode(view, busy = false) {
  readOnly=view; patientBusy=busy;
  for(const id of [...Object.values(fieldIds),'fieldVisit'])$(id).disabled=view||busy;
  $('editViewedPatient').hidden=!view; $('savePatient').hidden=view;
  $('savePatient').disabled=busy; $('savePatient').textContent=busy?'Saving…':'Save patient';
  for(const b of patientDialog.querySelectorAll('[data-close]'))b.disabled=busy;
}
function openPatient(id=null, view=false) {
  if(!active() || patientState!=='ready' || patientBusy)return;
  const p=id?patients.find(x=>x.id===id):null;
  if(id&&!p){notice('This patient record is no longer available.',true);return;}
  editing=p?{id:p.id, original:{...p}}:null;
  patientForm.reset();
  for(const [key,field] of Object.entries(fieldIds))$(field).value=key==='dateOfBirth'?dateString(p?.[key]):string(p?.[key]);
  $('fieldVisit').value=latestVisit(p||{});
  $('fieldDob').max=localToday();
  $('patientTitle').textContent=!p?'New patient':view?'Patient details':'Edit patient record';
  const dateConflict=p&&dateString(p.lastVisit)&&dateString(p.lastVisitDate)&&p.lastVisit!==p.lastVisitDate;
  $('recordHint').hidden=!dateConflict;
  $('recordHint').textContent=dateConflict?'This older record contains two different visit dates. The latest date is displayed. Both original dates are preserved unless you change this field.':'';
  notice('',false,'patientFormError');patientMode(view);patientDialog.showModal();
}
function changedRecord(original, values, newVisit, specialty) {
  if(!original)return {...values,lastVisit:newVisit,lastVisitDate:newVisit,specialty};
  const patch={};
  for(const [key,value] of Object.entries(values)){
    const before=key==='dateOfBirth'?dateString(original[key]):string(original[key]);
    if(value!==before)patch[key]=value;
  }
  if(newVisit!==latestVisit(original)){patch.lastVisit=newVisit;patch.lastVisitDate=newVisit;}
  return patch;
}
patientForm.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!active()||patientBusy||readOnly||patientState!=='ready'||!patientForm.reportValidity())return;
  const values={};for(const [key,field]of Object.entries(fieldIds))values[key]=string($(field).value);
  values.name=values.name.trim(); values.contactNumber=values.contactNumber.trim();
  if(!values.name||!dateString(values.dateOfBirth)||values.dateOfBirth>localToday()||!values.gender){notice('Enter a valid name, date of birth and sex.',true,'patientFormError');return;}
  const newVisit=$('fieldVisit').value;
  if(newVisit&&!dateString(newVisit)){notice('Enter a valid visit date.',true,'patientFormError');return;}
  const token=epoch, record=editing;
  const patch=changedRecord(record?.original,values,newVisit,profile.speciality||'');
  if(record&&!Object.keys(patch).length){patientDialog.close();return;}
  if(record){
    const latest=patients.find(p=>p.id===record.id);
    if(!latest){notice('This record is no longer available.',true,'patientFormError');return;}
    if(Object.keys(patch).some(k=>string(latest[k])!==string(record.original[k])&&string(latest[k])!==string(patch[k]))){notice('This record changed while you were editing. Close and reopen it before saving.',true,'patientFormError');return;}
  }
  patientMode(false,true);notice('',false,'patientFormError');
  try{
    if(record)await fs.updateDoc(ownPatient(record.id),patch); else await fs.addDoc(ownCollection('patients'),patch);
    if(!active(token))return;
    patientMode(false,false);patientDialog.close();notice(record?'Patient record updated.':'Patient record added.');
  } catch(_){if(active(token))notice('Unable to save the patient record. Check your connection and permissions.',true,'patientFormError');}
  finally{if(active(token))patientMode(false,false);}
});
$('editViewedPatient').addEventListener('click',()=>{if(!active()||!editing)return;$('patientTitle').textContent='Edit patient record';patientMode(false);});
function openDelete(id){
  if(!active()||patientState!=='ready'||deleteBusy)return;
  deleting=patients.find(p=>p.id===id);if(!deleting)return;
  $('deleteText').textContent='Delete the record for '+(deleting.name||'this patient')+'?';notice('',false,'deleteError');deleteDialog.showModal();
}
$('confirmDelete').addEventListener('click',async()=>{
  if(!active()||!deleting||deleteBusy||patientState!=='ready')return;
  const token=epoch,id=deleting.id;
  if(!patients.some(p=>p.id===id)){deleteDialog.close();return;}
  deleteBusy=true;$('confirmDelete').disabled=true;$('confirmDelete').textContent='Deleting…';
  for(const b of deleteDialog.querySelectorAll('[data-close]'))b.disabled=true;
  try{await fs.deleteDoc(ownPatient(id));if(active(token)){deleteDialog.close();notice('Patient record deleted.');}}
  catch(_){if(active(token))notice('Unable to delete this record.',true,'deleteError');}
  finally{if(active(token)){deleteBusy=false;$('confirmDelete').disabled=false;$('confirmDelete').textContent='Delete record';for(const b of deleteDialog.querySelectorAll('[data-close]'))b.disabled=false;}}
});
function setConsultBusy(value){
  consultBusy=value;
  for(const id of ['recipientSpecialty','consultPatientName','consultSubject','consultMessage','confirmShare'])$(id).disabled=value;
  $('recipientDoctor').disabled=value||!recipients.size;
  $('sendConsult').disabled=value||!recipients.size;
  $('sendConsult').textContent=value?'Sending…':'Send consultation';
  for(const b of consultDialog.querySelectorAll('[data-close]'))b.disabled=value;
}
function resetRecipients(text='Choose specialty first'){
  recipients.clear();$('recipientDoctor').replaceChildren(new Option(text,''));$('recipientDoctor').disabled=true;$('sendConsult').disabled=true;
}
function openConsult(){
  if(!active()||consultBusy)return;
  ++recipientEpoch;consultForm.reset();resetRecipients();notice('',false,'consultFormError');setConsultBusy(false);consultDialog.showModal();
}
$('recipientSpecialty').addEventListener('change',async()=>{
  const specialty=$('recipientSpecialty').value,version=++recipientEpoch,token=epoch;
  resetRecipients(specialty?'Finding doctors…':'Choose specialty first');notice('',false,'consultFormError');
  if(!active(token)||!specialty)return;
  try{
    const collection=fs.collection(db,'artifacts/'+appId+'/public/data/doctors');
    const q=fs.query(collection,fs.where('speciality','==',specialty),fs.where('deactivated','==',false));
    const snap=await deadline(fs.getDocsFromServer(q));
    if(!active(token)||version!==recipientEpoch||!consultDialog.open)return;
    const doctors=snap.docs.filter(d=>d.id!==uid&&validDoctor(d.data())&&d.data().speciality===specialty).map(d=>({id:d.id,name:trim(d.data().name)||'Doctor'}));
    resetRecipients(doctors.length?'Choose doctor':'No other active doctors found');
    for(const d of doctors.sort((a,b)=>a.name.localeCompare(b.name))){
      recipients.set(d.id,d);
      const duplicate=doctors.filter(x=>x.name===d.name).length>1;
      $('recipientDoctor').append(new Option(d.name+(duplicate?' · '+('ID '+d.id.slice(-6)):''),d.id));
    }
    if(recipients.size){$('recipientDoctor').disabled=false;$('sendConsult').disabled=false;}
  }catch(_){if(active(token)&&version===recipientEpoch){resetRecipients('Unable to load doctors');notice('Could not load the selected specialty. Try again.',true,'consultFormError');}}
});
consultForm.addEventListener('submit',async e=>{
  e.preventDefault();if(!active()||consultBusy||!consultForm.reportValidity())return;
  const token=epoch,recipient=$('recipientDoctor').value,specialty=$('recipientSpecialty').value,patientName=trim($('consultPatientName').value),subject=trim($('consultSubject').value),message=trim($('consultMessage').value);
  if(!recipients.has(recipient)||!patientName||!subject||!message||!$('confirmShare').checked){notice('Select a doctor and complete all fields.',true,'consultFormError');return;}
  setConsultBusy(true);notice('',false,'consultFormError');
  try{
    const snap=await deadline(fs.getDocFromServer(profileRef(recipient)));
    if(!active(token))return;
    if(!snap.exists()||!validDoctor(snap.data())||snap.data().speciality!==specialty){notice('This doctor is no longer available. Select another doctor.',true,'consultFormError');return;}
    const dest=fs.collection(db,'artifacts/'+appId+'/doctors/'+recipient+'/received_consults');
    await fs.addDoc(dest,{fromDoctorId:uid,fromDoctorName:trim(profile.name)||'Doctor',fromDoctorSpecialty:profile.speciality||'',toDoctorId:recipient,toSpecialty:specialty,patientName,subject,message,status:'pending',timestamp:fs.serverTimestamp()});
    if(active(token)){setConsultBusy(false);consultDialog.close();notice('Consultation sent to the selected doctor.');}
  }catch(_){if(active(token))notice('Unable to send consultation. Check your connection and permissions.',true,'consultFormError');}
  finally{if(active(token))setConsultBusy(false);}
});
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>{const d=$(b.dataset.close);if(d===patientDialog&&patientBusy||d===consultDialog&&consultBusy||d===deleteDialog&&deleteBusy)return;d.close();});
for(const [d,busy]of [[patientDialog,()=>patientBusy],[consultDialog,()=>consultBusy],[deleteDialog,()=>deleteBusy]])d.addEventListener('cancel',e=>{if(busy())e.preventDefault();});
patientDialog.addEventListener('close',()=>{editing=null;patientForm.reset();$('recordHint').textContent='';$('recordHint').hidden=true;notice('',false,'patientFormError');patientMode(false);});
consultDialog.addEventListener('close',()=>{++recipientEpoch;consultForm.reset();resetRecipients();notice('',false,'consultFormError');setConsultBusy(false);});
deleteDialog.addEventListener('close',()=>{deleting=null;$('deleteText').textContent='';notice('',false,'deleteError');deleteBusy=false;$('confirmDelete').disabled=false;$('confirmDelete').textContent='Delete record';for(const b of deleteDialog.querySelectorAll('[data-close]'))b.disabled=false;});
$('searchPatients').addEventListener('input',()=>{page=1;renderPatients();});
$('prevPage').addEventListener('click',()=>{page--;renderPatients();});
$('nextPage').addEventListener('click',()=>{page++;renderPatients();});
$('newPatientButton').addEventListener('click',()=>openPatient());
$('newConsultButton').addEventListener('click',openConsult);
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>showView(button.dataset.view));
$('logoutButton').addEventListener('click',async()=>{
  if(!auth||signingOut)return;signingOut=true;++epoch;clearAll();gateState('Signing out','Closing your session…');
  try{await authApi.signOut(auth);login();}
  catch(_){signingOut=false;gateState('Unable to sign out','Reconnect and retry before leaving a shared device.',true);}
});
$('gateRetry').addEventListener('click',()=>window.location.reload());
window.addEventListener('pagehide',()=>{++epoch;clearAll();});
window.addEventListener('pageshow',e=>{if(e.persisted)window.location.reload();});
start();
