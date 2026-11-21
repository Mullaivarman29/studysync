
const firebaseConfig = {
  apiKey: "AIzaSyBGD-eaTYrevzfr9puUCrXFt5rR3eLTOM0",
  authDomain: "studysync-46e4d.firebaseapp.com",
  projectId: "studysync-46e4d",
  storageBucket: "studysync-46e4d.firebasestorage.app",
  messagingSenderId: "386281427766",
  appId: "1:386281427766:web:7af6c6d1d88f03aa57d997",
  measurementId: "G-8G3067C83Q"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
