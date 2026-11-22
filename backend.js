// To enable shared RSVP and guestbook, fill firebase-config.js and deploy with Firebase rules.
import {firebaseConfig} from './firebase-config.js';
export const backendMode=firebaseConfig?.apiKey?'firebase':'demo';
const key='rashfa_hasan_';let db;
async function getDb(){if(!db){const app=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');const fs=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');db={fs,store:fs.getFirestore(app.initializeApp(firebaseConfig))};}return db;}
function localRead(type){try{return JSON.parse(localStorage.getItem(key+type)||'[]');}catch{return [];}}
function localSave(type,item){const items=localRead(type);items.unshift(item);localStorage.setItem(key+type,JSON.stringify(items));}
export async function saveRsvp(item){if(backendMode==='demo')return localSave('rsvp',item);const {fs,store}=await getDb();return fs.addDoc(fs.collection(store,'rsvps'),item);}
export async function saveWish(item){if(backendMode==='demo')return localSave('wishes',item);const {fs,store}=await getDb();return fs.addDoc(fs.collection(store,'wishes'),{...item,approved:false});}
export async function listWishes(){if(backendMode==='demo')return localRead('wishes');const {fs,store}=await getDb();const q=fs.query(fs.collection(store,'wishes'),fs.where('approved','==',true),fs.limit(20));const docs=await fs.getDocs(q);return docs.docs.map(d=>d.data()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
