// ================= FIREBASE CONFIG =================

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyALYRXOXr_jb8djjgNi_eu6AKheQUWvRoA",
    authDomain: "personalized-recommendersystem.firebaseapp.com",
    projectId: "personalized-recommendersystem",
    storageBucket: "personalized-recommendersystem.firebasestorage.app",
    messagingSenderId: "251161281833",
    appId: "1:251161281833:web:37ca8f03e0eb787ef8a338",
    measurementId: "G-V9ZQTK8FRM"
};

// ================= SUBJECT LIST =================

const subjects = [
    "AI",
    "Machine Learning",
    "Internet of Things",
    "Maths",
    "Electrical Engineering",
    "Physics",
    "Chemistry",
    "Biology",
    "Programming",
    "DSA",
    "Python",
    "OOP",
    "Operating System",
    "DBMS",
    "Computer Networks",
    "Cloud Computing",
    "Cyber Law",
    "Digital Electronics",
    "Discrete Maths",
    "COA",
    "Computer Graphics",
    "DAA"
];

const GUEST_ALLOWED_PAGES = ["academics.html", "career.html"];
const LOGIN_REQUIRED_PAGES = ["planner.html", "community.html", "dashboard.html"];

let firebaseAuthCache = null;

// ================= HELPERS =================

function normalizePageName(page) {
    return (page || "").split("/").pop().split("?")[0].split("#")[0];
}

function isGuestAllowedPage(page) {
    return GUEST_ALLOWED_PAGES.includes(normalizePageName(page));
}

function getRedirectPage() {
    return localStorage.getItem("redirectPage") || "Home.html";
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user")) || null;
    } catch (error) {
        return null;
    }
}

function saveLoggedInUser(user, mode) {
    const userData = {
        name: user?.displayName || user?.name || user?.email?.split("@")[0] || "User",
        email: user?.email || "",
        uid: user?.uid || user?._id || "",
        guest: mode === "guest"
    };

    localStorage.setItem("loggedIn", mode);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("currentUser", userData.name);

    if (userData.email) {
        localStorage.setItem("email", userData.email);
    }
}

function goAfterLogin() {
    const redirectPage = getRedirectPage();
    localStorage.removeItem("redirectPage");
    window.location.href = redirectPage;
}

async function getFirebaseAuthBundle() {
    if (firebaseAuthCache) {
        return firebaseAuthCache;
    }

    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const authModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

    const app = appModule.getApps().length
        ? appModule.getApps()[0]
        : appModule.initializeApp(FIREBASE_CONFIG);

    firebaseAuthCache = {
        auth: authModule.getAuth(app),
        authModule
    };

    return firebaseAuthCache;
}

async function handleAccountExistsWithDifferentCredential(error, sourceProvider, auth, authModule) {
    const email = error?.customData?.email;
    const pendingCredential = sourceProvider === "github"
        ? authModule.GithubAuthProvider.credentialFromError(error)
        : authModule.GoogleAuthProvider.credentialFromError(error);

    if (!email || !pendingCredential) {
        alert("This email is associated with another sign-in provider. Please sign in using that provider first, then link additional providers to your account.");
        return true;
    }

    let methods = [];

    try {
        methods = await authModule.fetchSignInMethodsForEmail(auth, email);
    } catch (fetchError) {
        methods = [];
    }

    try {
        if (methods.includes("google.com")) {
            alert(`${email} is already registered with Google. A Google sign-in popup will open now. After signing in, your GitHub account will be linked automatically.`);
            const googleProvider = new authModule.GoogleAuthProvider();
            const existingResult = await authModule.signInWithPopup(auth, googleProvider);
            await authModule.linkWithCredential(existingResult.user, pendingCredential);
            saveLoggedInUser(existingResult.user, "true");
            alert("GitHub account successfully linked.");
            goAfterLogin();
            return true;
        }

        if (methods.includes("password")) {
            const password = prompt(
                    `${email} was originally registered using Email/Password. To link your GitHub account, please enter the password for this account:`
);
            if (!password) {
                alert("No password was provided, so GitHub account linking was cancelled. You can still sign in using your email and password.");
                return true;
            }

            const existingResult = await authModule.signInWithEmailAndPassword(auth, email, password);
            await authModule.linkWithCredential(existingResult.user, pendingCredential);
            saveLoggedInUser(existingResult.user, "true");
            alert("GitHub account successfully linked.");
            goAfterLogin();
            return true;
        }

        alert(`${email} already exists in Firebase, but the sign-in provider could not be detected. Please check the provider for this email in Firebase Console > Authentication > Users.`);
    } catch (linkError) {
        if (linkError?.code === "auth/provider-already-linked") {
            saveLoggedInUser(auth.currentUser, "true");
            goAfterLogin();
            return true;
        }

        if (linkError?.code === "auth/credential-already-in-use") {
               alert("This GitHub credential is already linked to another account. Please log in directly with GitHub or check for duplicate users in the Firebase Console.");
            return true;
        }

        alert(linkError?.message || "An error occurred while linking the provider.");
        return true;
    }
}

async function showLoginError(error, sourceProvider = "") {
    const code = error?.code || "";

    if (code === "auth/account-exists-with-different-credential") {
        const { auth, authModule } = await getFirebaseAuthBundle();
        const handled = await handleAccountExistsWithDifferentCredential(error, sourceProvider, auth, authModule);
        if (handled) return;
    }

    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        alert("Email ya password incorrect.Login with correct Firebase account.");
        return;
    }

    if (code === "auth/popup-closed-by-user") {
        alert("Login popup is close. Try again later.");
        return;
    }

    if (code === "auth/operation-not-allowed") {
        alert("The selected login provider is not enabled.");
        return;
    }

    if (code === "auth/unauthorized-domain") {
        alert("For Google/GitHub login, open the page using VS Code Live Server/localhost and add localhost to Firebase Authorized Domains.");
    }

    alert(error?.message || "An unexpected error occurred. Please try again later.");}


    // ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded", function () {
    fillSubjectDropdown();
    updateLoginArea();
    guardProtectedPages();
    updateGuestButton();
    showTasks();
    loadPosts();
});

function fillSubjectDropdown() {
    const subjectDropdown = document.getElementById("subject");

    if (!subjectDropdown) return;

    subjectDropdown.innerHTML =
        "<option value=''>Select Subject</option>" +
        subjects.map(subject => `<option value="${subject}">${subject}</option>`).join("");
}

function updateLoginArea() {
    const loginArea = document.getElementById("loginArea");

    if (!loginArea) return;

    const loggedIn = localStorage.getItem("loggedIn");
    const user = getStoredUser();

    if (loggedIn === "true" || loggedIn === "guest") {
        let username = user?.name || user?.email?.split("@")[0] || "User";
        username = username.charAt(0).toUpperCase() + username.slice(1);

        loginArea.innerHTML = `
            <div class="user-profile">
                <div class="user-avatar">${username.charAt(0)}</div>
                <div class="user-name">Hi, ${username}</div>
                <button onclick="logout()" id="authBtn">Logout</button>
            </div>
        `;
        return;
    }

    loginArea.innerHTML = `<button onclick="goLogin()" id="authBtn">Login</button>`;
}

function guardProtectedPages() {
    const currentPage = normalizePageName(window.location.pathname);
    const loggedIn = localStorage.getItem("loggedIn");

    if (LOGIN_REQUIRED_PAGES.includes(currentPage) && loggedIn !== "true") {
        localStorage.setItem("redirectPage", currentPage);
        alert("Is page ke liye login required hai.");
        window.location.href = "login.html";
    }
}

function updateGuestButton() {
    const guestButton = document.querySelector(".skip-btn");

    if (!guestButton) return;

    const redirectPage = getRedirectPage();
    guestButton.style.display = isGuestAllowedPage(redirectPage) ? "block" : "none";
}

// ================= AUTH =================

function goLogin() {
    window.location.href = "login.html";
}

function goSignup() {
    window.location.href = "signup.html";
}

function logout() {
    localStorage.clear();
    window.location.href = "Home.html";
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);

    if (!input) return;

    const shouldShow = input.type === "password";
    input.type = shouldShow ? "text" : "password";

    if (button) {
        button.innerText = shouldShow ? "Hide" : "Show";
    }
}

async function loginUser() {
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
        alert("Email aur password dono fill karo");
        return;
    }

    try {
        const { auth, authModule } = await getFirebaseAuthBundle();
        const result = await authModule.signInWithEmailAndPassword(auth, email, password);
        saveLoggedInUser(result.user, "true");
        goAfterLogin();
    } catch (error) {
        await showLoginError(error);
    }
}

async function createAccount() {
    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    try {
        const { auth, authModule } = await getFirebaseAuthBundle();
        const result = await authModule.createUserWithEmailAndPassword(auth, email, password);
        await authModule.updateProfile(result.user, { displayName: name });
        alert("Account created successfully. Ab login karo.");
        window.location.href = "login.html";
    } catch (error) {
        await showLoginError(error);
    }
}

async function forgotPassword() {
    const email = document.getElementById("email")?.value.trim();

    if (!email) {
        alert("Password reset ke liye pehle email enter karo");
        return;
    }

    try {
        const { auth, authModule } = await getFirebaseAuthBundle();
        await authModule.sendPasswordResetEmail(auth, email);
        alert("A password reset email has been sent. Please check your inbox and spam folder.");
    } catch (error) {
        await showLoginError(error);
    }
}

async function googleLogin() {
    try {
        const { auth, authModule } = await getFirebaseAuthBundle();
        const provider = new authModule.GoogleAuthProvider();
        const result = await authModule.signInWithPopup(auth, provider);
        saveLoggedInUser(result.user, "true");
        goAfterLogin();
    } catch (error) {
        await showLoginError(error, "google");
    }
}

async function githubLogin() {
    try {
        const { auth, authModule } = await getFirebaseAuthBundle();
        const provider = new authModule.GithubAuthProvider();
        provider.addScope("user:email");
        const result = await authModule.signInWithPopup(auth, provider);
        saveLoggedInUser(result.user, "true");
        goAfterLogin();
    } catch (error) {
        await showLoginError(error, "github");
    }
}

function guestLogin() {
    const redirectPage = getRedirectPage();

    if (!isGuestAllowedPage(redirectPage)) {
        alert("Guest access is only available for Academics and Career pages.");
        return;
    }

    saveLoggedInUser({ name: "Guest", email: "guest@prs.local", uid: "guest" }, "guest");
    localStorage.removeItem("redirectPage");
    window.location.href = redirectPage;
}

// ================= NAVIGATION =================

function openPage(page) {
    const loggedIn = localStorage.getItem("loggedIn");

    if (loggedIn === "true") {
        window.location.href = page;
        return;
    }

    if (loggedIn === "guest" && isGuestAllowedPage(page)) {
        window.location.href = page;
        return;
    }

    if (loggedIn === "guest" && !isGuestAllowedPage(page)) {
        localStorage.clear();
        alert("Guest access is only available for Academics and Career pages. Login is required for this page.");
    }

    localStorage.setItem("redirectPage", page);
    window.location.href = "login.html";
}

// ================= ACADEMICS =================

function loadData() {
    const subject = document.getElementById("subject")?.value;
    const level = document.getElementById("level")?.value;
    const content = document.getElementById("content");

    if (!content) return;

    if (!subject) {
        content.innerHTML = "";
        return;
    }

    const safeSubject = encodeURIComponent(subject);
    const safeLevel = encodeURIComponent(level);

    content.innerHTML = `
        <h1 class="topic-title">&#128218; ${subject} (${level.toUpperCase()} LEVEL)</h1>

        <div class="content-grid">
            <div class="big-card">
                <h2>&#127909; YouTube Videos</h2>
                <p>Best ${level} tutorials & playlists</p>
                <a href="https://www.youtube.com/results?search_query=${safeSubject}+${safeLevel}+full+course" target="_blank">Watch</a>
            </div>

            <div class="big-card">
                <h2>&#128216; Notes</h2>
                <p>${level} study material & PDFs</p>
                <a href="https://www.google.com/search?q=${safeSubject}+${safeLevel}+notes+pdf" target="_blank">Read</a>
            </div>

            <div class="big-card">
                <h2>&#128196; Research Papers</h2>
                <p>IEEE & Scholar papers</p>
                <a href="https://scholar.google.com/scholar?q=${safeSubject}+${safeLevel}+research+papers" target="_blank">Explore</a>
            </div>

            <div class="big-card">
                <h2>&#128221; Practice Questions</h2>
                <p>Assignments & MCQs</p>
                <a href="https://www.google.com/search?q=${safeSubject}+${safeLevel}+practice+questions" target="_blank">Solve</a>
            </div>

            <div class="big-card">
                <h2>&#128640; Projects</h2>
                <p>Real-world ${level} projects</p>
                <a href="https://www.youtube.com/results?search_query=${safeSubject}+${safeLevel}+projects" target="_blank">Build</a>
            </div>

            <div class="big-card">
                <h2>&#128506; Roadmap</h2>
                <p>Complete learning roadmap</p>
                <a href="https://www.google.com/search?q=${safeSubject}+roadmap+${safeLevel}" target="_blank">Open</a>
            </div>
        </div>
    `;
}

// ================= COMMUNITY =================

function loadPosts() {
    const postsBox = document.getElementById("posts");
    const postList = document.getElementById("postList");
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");

    if (postsBox) {
        const defaultPosts = posts.length ? posts : [
            { user: "Rudra", text: "Completed my AI project today" },
            { user: "Student", text: "Anyone preparing for DBMS exam?" }
        ];

        postsBox.innerHTML = defaultPosts.map((post, index) => `
            <div class="community-post">
                <h3>${post.user || "Student"}</h3>
                <p>${post.text || post}</p>
                ${posts.length ? `<button onclick="deletePost(${index})">X</button>` : ""}
            </div>
        `).join("");
    }

    if (postList) {
        postList.innerHTML = posts.map((post, index) => `
            <li>
                ${post.text || post}
                <button class="delete-btn" onclick="deletePost(${index})">X</button>
            </li>
        `).join("");

        const postCount = document.getElementById("postCount");
        if (postCount) postCount.innerText = posts.length;
    }
}

function addPost() {
    const input = document.getElementById("postInput");

    if (!input) return;

    const text = input.value.trim();

    if (!text) {
        alert("Write something");
        return;
    }

    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    const user = getStoredUser();

    posts.unshift({
        user: user?.name || "Student",
        text
    });

    localStorage.setItem("posts", JSON.stringify(posts));
    input.value = "";
    loadPosts();
}

function deletePost(index) {
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    posts.splice(index, 1);
    localStorage.setItem("posts", JSON.stringify(posts));
    loadPosts();
}

// ================= TASKS =================

function showTasks() {
    const taskList = document.getElementById("taskList");
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

    if (!taskList) return;

    taskList.innerHTML = tasks.map((task, index) => `
        <li>
            ${task}
            <button class="delete-btn" onclick="deleteTask(${index})">X</button>
        </li>
    `).join("");

    const taskCount = document.getElementById("taskCount");
    if (taskCount) taskCount.innerText = tasks.length;
}

function addTask() {
    const input = document.getElementById("taskInput");

    if (!input) return;

    const task = input.value.trim();

    if (!task) {
        alert("Enter task");
        return;
    }

    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    input.value = "";
    showTasks();
    updateRecommendation();
}

function deleteTask(index) {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.splice(index, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    showTasks();
    updateRecommendation();
}

function updateRecommendation() {
    const recommendField = document.getElementById("recommendField");
    if (!recommendField) return;

    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    const allText = (tasks.join(" ") + " " + posts.map(post => post.text || post).join(" ")).toLowerCase();

    let field = "Software Development";

    if (allText.includes("ai") || allText.includes("machine learning") || allText.includes("python")) {
        field = "AI / Machine Learning";
    } else if (allText.includes("web") || allText.includes("html") || allText.includes("css") || allText.includes("javascript")) {
        field = "Full Stack Development";
    } else if (allText.includes("cyber") || allText.includes("security")) {
        field = "Cyber Security";
    } else if (allText.includes("cloud") || allText.includes("aws")) {
        field = "Cloud Computing";
    } else if (allText.includes("data")) {
        field = "Data Science";
    } else if (allText.includes("dsa") || allText.includes("leetcode")) {
        field = "DSA & Problem Solving";
    }

    recommendField.innerText = field;
}


}
