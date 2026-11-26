// Shared Firebase settings for the PSMS login and doctor workspace.
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
export function getFirebaseConfig() {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyDMIZubC87_z2tCnURoqQIJjCWPPdWFdnk",
    authDomain: "pcms-e1162.firebaseapp.com",
    projectId: "pcms-e1162",
    storageBucket: "pcms-e1162.firebasestorage.app",
    messagingSenderId: "383068543378",
    appId: "1:383068543378:web:00c7d2bf95f9ded63a494b",
    measurementId: "G-4C1P3GB6PP"
    };
    return firebaseConfig;
}
