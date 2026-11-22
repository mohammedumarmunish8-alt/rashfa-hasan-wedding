"use strict";
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getAuth}=require('firebase-admin/auth');
initializeApp();
const options={region:'us-central1',enforceAppCheck:false};
function requireSuper(request){
  if(!request.auth || request.auth.token.admin!==true || request.auth.token.role!=='super_admin')
    throw new HttpsError('permission-denied','Super Admin permission required.');
}
function validateRole(role){if(!['admin','super_admin'].includes(role))throw new HttpsError('invalid-argument','Invalid role.');}
exports.listWeddingAdmins=onCall(options,async(request)=>{
  requireSuper(request);const admins=[];let nextPageToken;
  do{const page=await getAuth().listUsers(1000,nextPageToken);for(const u of page.users){if(u.customClaims?.admin===true)admins.push({uid:u.uid,email:u.email||'',role:u.customClaims.role||'admin'});}nextPageToken=page.pageToken;}while(nextPageToken);
  return {admins};
});
exports.setWeddingAdminRole=onCall(options,async(request)=>{
  requireSuper(request);const {email,role}=request.data||{};validateRole(role);
  if(typeof email!=='string'||email.length>254||!email.includes('@'))throw new HttpsError('invalid-argument','Valid email required.');
  let user;try{user=await getAuth().getUserByEmail(email.trim());}catch{throw new HttpsError('not-found','Firebase Authentication user not found.');}
  const claims={...(user.customClaims||{}),admin:true,role};
  await getAuth().setCustomUserClaims(user.uid,claims);return {success:true};
});
exports.revokeWeddingAdmin=onCall(options,async(request)=>{
  requireSuper(request);const uid=request.data?.uid;
  if(typeof uid!=='string'||!uid)throw new HttpsError('invalid-argument','UID required.');
  if(uid===request.auth.uid)throw new HttpsError('failed-precondition','Cannot revoke your own account.');
  let user;try{user=await getAuth().getUser(uid);}catch{throw new HttpsError('not-found','User not found.');}
  const claims={...(user.customClaims||{})};delete claims.admin;delete claims.role;
  await getAuth().setCustomUserClaims(uid,claims);await getAuth().revokeRefreshTokens(uid);return {success:true};
});
