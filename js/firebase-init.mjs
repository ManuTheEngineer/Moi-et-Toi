// ===== FIREBASE MODULAR SDK WRAPPER (#19) =====
// Gradual migration: import this module instead of using compat globals.
// Usage: import { app, db, auth, dbRef, dbPush, dbSet, dbOnValue } from './firebase-init.mjs';
//
// Migration steps:
// 1. Convert each JS file to ESM (add type="module" to script tags)
// 2. Replace firebase.database().ref('path') with dbRef('path')
// 3. Replace .on('value', cb) with dbOnValue(ref, cb)
// 4. Replace .push(data) with dbPush(ref, data)
// 5. Replace .set(data) with dbSet(ref, data)
// 6. Replace firebase.auth() calls with auth equivalents
// 7. Once all files migrated, remove compat CDN scripts

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, onValue, off, query, orderByChild, limitToLast, update, remove, onDisconnect } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

let app, db, auth;

export function initFirebase(config) {
  app = initializeApp(config);
  db = getDatabase(app);
  auth = getAuth(app);
  return { app, db, auth };
}

// Database helpers — drop-in replacements for compat API
export function dbRef(path) { return ref(db, path); }
export function dbPush(refOrPath, data) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return push(r, data);
}
export function dbSet(refOrPath, data) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return set(r, data);
}
export function dbGet(refOrPath) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return get(r);
}
export function dbOnValue(refOrPath, callback) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return onValue(r, callback);
}
export function dbOff(refOrPath) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return off(r);
}
export function dbQuery(refOrPath, ...constraints) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return query(r, ...constraints);
}
export function dbUpdate(refOrPath, data) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return update(r, data);
}
export function dbRemove(refOrPath) {
  const r = typeof refOrPath === 'string' ? ref(db, refOrPath) : refOrPath;
  return remove(r);
}

// Auth helpers
export function authSignIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
export function authSignOut() {
  return signOut(auth);
}
export function authOnStateChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

// Re-export Firebase modular functions for direct use
export { orderByChild, limitToLast, onDisconnect };
export { app, db, auth };
