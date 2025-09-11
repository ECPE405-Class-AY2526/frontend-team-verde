
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
    getDatabase,
    ref,
    set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

// Your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyD0lf8GyLrcwiyRQSvCAMohWWWW71eo4vQ",
    authDomain: "verde-intel.firebaseapp.com",
    projectId: "verde-intel",
    storageBucket: "verde-intel.firebasestorage.app",
    messagingSenderId: "635682332679",
    appId: "1:635682332679:web:c8bd0add02a51864c6caa2",
    databaseURL: "https://verde-intel-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

function formatDateTime() {
    const now = new Date();
    return now.toLocaleString("en-US", {
        dateStyle: "medium",   // Sep 3, 2025
        timeStyle: "short"     // 3:25 PM
    });
}

// Save user to Firestore + Realtime DB
async function saveUserToDB(user) {
    try {
        // Firestore (merge keeps old data, updates lastLogin)
        await setDoc(
            doc(db, "users", user.email),
            {
                name: user.name,
                email: user.email,
                registrationDate: user.registrationDate,
                lastLogin: user.lastLogin
            },
            { merge: true } // ✅ only update changed fields
        );

        // Realtime Database
        await set(ref(rtdb, "users/" + user.email.replace(/\./g, "_")), {
            name: user.name,
            email: user.email,
            registrationDate: user.registrationDate,
            lastLogin: user.lastLogin
        });

        console.log("✅ User saved/updated to Firestore & Realtime DB");
    } catch (error) {
        console.error("Error saving user:", error);
        throw error;
    }
}


// Hook into your signup
window.handleSignup = async (event) => {
    event.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        // Create user with Firebase Auth
        await createUserWithEmailAndPassword(auth, email, password);

        const userData = {
            name: name,
            email: email,
            registrationDate: formatDateTime(),  // ✅ human-readable
            lastLogin: formatDateTime()          // ✅ human-readable
        };


        await saveUserToDB(userData);

        alert("✅ Account created!");
        userManager.showDashboard(userData);
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const userData = {
            name: firebaseUser.displayName || email.split("@")[0],
            email: firebaseUser.email,
            lastLogin: formatDateTime(),  // ✅ updates on every login
            registrationDate: firebaseUser.metadata?.creationTime
                ? new Date(firebaseUser.metadata.creationTime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                : formatDateTime()
        };

        await saveUserToDB(userData);

        alert("✅ Welcome back!");
        userManager.showDashboard(userData);
    } catch (error) {
        alert("Error: " + error.message);
    }
});


// Logout
window.logout = async () => {
    await signOut(auth);
    alert("You have been logged out!");
    showPage("home");
    document.getElementById("userMenu").style.display = "none";
};

// Auth state listener (optional)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.email);
    } else {
        console.log("No user signed in.");
    }
});
