const FIREBASE_CONFIG = {
    apiKey: "AIzaSyALYRXOXr_jb8djjgNi_eu6AKheQUWvRoA",
    authDomain: "personalized-recommendersystem.firebaseapp.com",
    projectId: "personalized-recommendersystem",
    storageBucket: "personalized-recommendersystem.firebasestorage.app",
    messagingSenderId: "251161281833",
    appId: "1:251161281833:web:37ca8f03e0eb787ef8a338",
    measurementId: "G-V9ZQTK8FRM"
};

const subjects = [
    "AI", "Machine Learning", "Internet of Things", "Maths",
    "Electrical Engineering", "Physics", "Chemistry", "Biology",
    "Programming", "DSA", "Python", "OOP", "Operating System",
    "DBMS", "Computer Networks", "Cloud Computing", "Cyber Law",
    "Digital Electronics", "Discrete Maths", "COA",
    "Computer Graphics", "DAA"
];

const GUEST_ALLOWED_PAGES = ["academics.html", "career.html"];
const LOGIN_REQUIRED_PAGES = ["planner.html", "community.html", "dashboard.html"];

let firebaseBundle = null;

function normalizePageName(page) {
    return (page || "").split("/").pop().split("?")[0].split("#")[0].toLowerCase();
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
    } catch {
        return null;
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

async function getFirebaseBundle() {
    if (firebaseBundle) return firebaseBundle;

    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const authModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

    const app = appModule.getApps().length
        ? appModule.getApp()
        : appModule.initializeApp(FIREBASE_CONFIG);

    const auth = authModule.getAuth(app);
    firebaseBundle = { auth, authModule };

    return firebaseBundle;
}

function saveFirebaseSession(user) {
    const userData = {
        name: user.displayName || user.email?.split("@")[0] || "User",
        email: user.email || "",
        uid: user.uid || ""
    };

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("currentUser", userData.name);
    localStorage.setItem("email", userData.email);
}

function saveGuest() {
    localStorage.setItem("loggedIn", "guest");
    localStorage.setItem("user", JSON.stringify({
        name: "Guest",
        email: "",
        uid: "guest",
        guest: true
    }));
    localStorage.setItem("currentUser", "Guest");
}

function goAfterLogin() {
    const redirectPage = getRedirectPage();
    localStorage.removeItem("redirectPage");
    window.location.href = redirectPage;
}

document.addEventListener("DOMContentLoaded", async () => {
    applySavedTheme();
    fillSubjectDropdown();
    updateLoginArea();
    guardProtectedPages();
    updateGuestButton();
    loadPosts();
    showTasks();
    updateRecommendation();
    initializeDashboardIdentity();

    try {
        const { auth, authModule } = await getFirebaseBundle();

        authModule.onAuthStateChanged(auth, user => {
            if (user) saveFirebaseSession(user);
            updateLoginArea();
        });
    } catch (error) {
        console.warn("Firebase init error:", error.message);
    }
});

// ================= AUTH =================

function goLogin() {
    window.location.href = "login.html";
}

function goSignup() {
    window.location.href = "signup.html";
}

async function loginUser() {
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
        alert("Email and password are required.");
        return;
    }

    try {
        const { auth, authModule } = await getFirebaseBundle();
        const result = await authModule.signInWithEmailAndPassword(auth, email, password);

        saveFirebaseSession(result.user);
        goAfterLogin();

    } catch (error) {
        showFirebaseError(error);
    }
}

async function createAccount() {
    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!name || !email || !password) {
        alert("Please fill all fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
        const { auth, authModule } = await getFirebaseBundle();

        const result = await authModule.createUserWithEmailAndPassword(auth, email, password);

        await authModule.updateProfile(result.user, {
            displayName: name
        });

        alert("Account created successfully. Please login now.");
        window.location.href = "login.html";

    } catch (error) {
        showFirebaseError(error);
    }
}

async function googleLogin() {
    try {
        const { auth, authModule } = await getFirebaseBundle();

        const provider = new authModule.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: "select_account"
        });

        const result = await authModule.signInWithPopup(auth, provider);

        saveFirebaseSession(result.user);
        goAfterLogin();

    } catch (error) {
        showFirebaseError(error);
    }
}

async function githubLogin() {
    try {
        const { auth, authModule } = await getFirebaseBundle();

        const provider = new authModule.GithubAuthProvider();
        provider.addScope("read:user");
        provider.addScope("user:email");

        const result = await authModule.signInWithPopup(auth, provider);

        saveFirebaseSession(result.user);
        goAfterLogin();

    } catch (error) {
        showFirebaseError(error);
    }
}

async function forgotPassword(event) {
    if (event) event.preventDefault();

    const email = document.getElementById("email")?.value.trim();

    if (!email) {
        alert("Please enter your email first.");
        return;
    }

    try {
        const { auth, authModule } = await getFirebaseBundle();

        await authModule.sendPasswordResetEmail(auth, email, {
            url: "http://127.0.0.1:5500/login.html",
            handleCodeInApp: false
        });

        alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
        showFirebaseError(error);
    }
}

async function logout() {
    try {
        const { auth, authModule } = await getFirebaseBundle();
        await authModule.signOut(auth);
    } catch {}

    localStorage.clear();
    window.location.href = "Home.html";
}

function guestLogin() {
    const redirectPage = getRedirectPage();

    saveGuest();
    localStorage.removeItem("redirectPage");

    window.location.href = isGuestAllowedPage(redirectPage)
        ? redirectPage
        : "academics.html";
}

function showFirebaseError(error) {
    const code = error?.code || "";

    if (code === "auth/unauthorized-domain") {
        alert("This domain is not authorized. Add localhost and 127.0.0.1 in Firebase Authorized Domains.");
        return;
    }

    if (code === "auth/popup-blocked") {
        alert("Popup was blocked. Allow popups and try again.");
        return;
    }

    if (code === "auth/popup-closed-by-user") {
        alert("Login popup was closed. Please try again.");
        return;
    }

    if (code === "auth/operation-not-allowed") {
        alert("This provider is not enabled in Firebase Console.");
        return;
    }

    if (code === "auth/account-exists-with-different-credential") {
        alert("This email is already linked with another login method.");
        return;
    }

    if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
    ) {
        alert("Incorrect email or password.");
        return;
    }

    if (code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login.");
        return;
    }

    if (code === "auth/weak-password") {
        alert("Password must be at least 6 characters.");
        return;
    }

    alert(error?.message || "Login failed. Please try again.");
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

    localStorage.setItem("redirectPage", page);
    window.location.href = "login.html";
}

function guardProtectedPages() {
    const currentPage = normalizePageName(window.location.pathname);
    const loggedIn = localStorage.getItem("loggedIn");

    if (LOGIN_REQUIRED_PAGES.includes(currentPage) && loggedIn !== "true") {
        localStorage.setItem("redirectPage", currentPage);
        alert("Login is required for this page.");
        window.location.href = "login.html";
    }
}

function updateGuestButton() {
    const guestButton = document.querySelector(".skip-btn");
    if (!guestButton) return;

    guestButton.style.display = "block";
}

function updateLoginArea() {
    const loginArea = document.getElementById("loginArea");
    if (!loginArea) return;

    const loggedIn = localStorage.getItem("loggedIn");
    const user = getStoredUser();

    if (loggedIn === "true" || loggedIn === "guest") {
        const username = user?.name || "User";

        loginArea.innerHTML = `
            <div class="user-profile">
                <div class="user-avatar">${escapeHtml(username.charAt(0).toUpperCase())}</div>
                <div class="user-name">Hi, ${escapeHtml(username)}</div>
                <button onclick="logout()" id="authBtn">Logout</button>
            </div>
        `;
        return;
    }

    loginArea.innerHTML = `<button onclick="goLogin()" id="authBtn">Login</button>`;
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const show = input.type === "password";
    input.type = show ? "text" : "password";

    if (button) button.innerText = show ? "Hide" : "Show";
}

// ================= ACADEMICS =================

function fillSubjectDropdown() {
    const subjectDropdown = document.getElementById("subject");

    if (!subjectDropdown || subjectDropdown.tagName !== "SELECT") return;

    subjectDropdown.innerHTML =
        "<option value=''>Select Subject</option>" +
        subjects.map(subject => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("");
}

function loadData() {
    const subject = document.getElementById("subject")?.value;
    const level = document.getElementById("level")?.value || "beginner";
    const content = document.getElementById("content");

    if (!content) return;

    if (!subject) {
        content.innerHTML = "";
        return;
    }

    const safeSubject = encodeURIComponent(subject);
    const safeLevel = encodeURIComponent(level);

    content.innerHTML = `
        <h1 class="topic-title">${escapeHtml(subject)} (${escapeHtml(level.toUpperCase())} LEVEL)</h1>

        <div class="content-grid">
            <div class="big-card">
                <h2>YouTube Videos</h2>
                <p>Best tutorials and playlists.</p>
                <a href="https://www.youtube.com/results?search_query=${safeSubject}+${safeLevel}+full+course" target="_blank">Watch</a>
            </div>

            <div class="big-card">
                <h2>Notes</h2>
                <p>Study material and PDFs.</p>
                <a href="https://www.google.com/search?q=${safeSubject}+${safeLevel}+notes+pdf" target="_blank">Read</a>
            </div>

            <div class="big-card">
                <h2>Research Papers</h2>
                <p>Scholar and research papers.</p>
                <a href="https://scholar.google.com/scholar?q=${safeSubject}+${safeLevel}+research+papers" target="_blank">Explore</a>
            </div>

            <div class="big-card">
                <h2>Practice Questions</h2>
                <p>Assignments and MCQs.</p>
                <a href="https://www.google.com/search?q=${safeSubject}+${safeLevel}+practice+questions" target="_blank">Solve</a>
            </div>

            <div class="big-card">
                <h2>Projects</h2>
                <p>Real-world projects.</p>
                <a href="https://www.youtube.com/results?search_query=${safeSubject}+${safeLevel}+projects" target="_blank">Build</a>
            </div>

            <div class="big-card">
                <h2>Roadmap</h2>
                <p>Complete learning roadmap.</p>
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
        const shownPosts = posts.length ? posts : [
            { user: "Rudra", text: "Completed my AI project today." },
            { user: "Student", text: "Anyone preparing for DBMS exam?" }
        ];

        postsBox.innerHTML = shownPosts.map((post, index) => `
            <div class="community-post">
                <h3>${escapeHtml(post.user || "Student")}</h3>
                <p>${escapeHtml(post.text || post)}</p>
                ${posts.length ? `<button onclick="deletePost(${index})">Delete</button>` : ""}
            </div>
        `).join("");
    }

    if (postList) {
        postList.innerHTML = posts.length
            ? posts.map((post, index) => `
                <li>
                    ${escapeHtml(post.text || post)}
                    <button class="delete-btn" onclick="deletePost(${index})">X</button>
                </li>
            `).join("")
            : `<li>No posts added yet.</li>`;
    }

    const postCount = document.getElementById("postCount");
    if (postCount) postCount.innerText = posts.length;
}

function addPost() {
    const input = document.getElementById("postInput");
    if (!input) return;

    const text = input.value.trim();

    if (!text) {
        alert("Write something before posting.");
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
    updateRecommendation();
}

function deletePost(index) {
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");

    posts.splice(index, 1);
    localStorage.setItem("posts", JSON.stringify(posts));

    loadPosts();
    updateRecommendation();
}

// ================= TASKS =================

function showTasks() {
    const taskList = document.getElementById("taskList");
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

    if (taskList) {
        taskList.innerHTML = tasks.length
            ? tasks.map((task, index) => `
                <li>
                    ${escapeHtml(task)}
                    <button class="delete-btn" onclick="deleteTask(${index})">X</button>
                </li>
            `).join("")
            : `<li>No tasks added yet.</li>`;
    }

    const taskCount = document.getElementById("taskCount");
    if (taskCount) taskCount.innerText = tasks.length;
}

function addTask() {
    const input = document.getElementById("taskInput");
    if (!input) return;

    const task = input.value.trim();

    if (!task) {
        alert("Enter a task.");
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

    const allText = (
        tasks.join(" ") + " " + posts.map(post => post.text || post).join(" ")
    ).toLowerCase();

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

// ================= PLANNER EXTRA =================

function addPlannerTask() {
    const customTitle = document.getElementById("plannerTaskInput")?.value.trim();
    const suggestion = document.getElementById("plannerSuggestion")?.value;
    const title = customTitle || (suggestion !== "Choose Suggested Task" ? suggestion : "");

    if (!title) {
        alert("Enter a task or choose a suggestion.");
        return;
    }

    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.push(title);

    localStorage.setItem("tasks", JSON.stringify(tasks));

    const input = document.getElementById("plannerTaskInput");
    if (input) input.value = "";

    loadPlannerTasks();
    showTasks();
    updateRecommendation();
}

function loadPlannerTasks() {
    const list = document.querySelector(".planner-task-list");
    if (!list) return;

    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

    const totalTasks = document.getElementById("totalTasks");
    const runningTasks = document.getElementById("runningTasks");
    const completedTasks = document.getElementById("completedTasks");
    const blockedTasks = document.getElementById("blockedTasks");

    if (totalTasks) totalTasks.innerText = tasks.length;
    if (runningTasks) runningTasks.innerText = tasks.length;
    if (completedTasks) completedTasks.innerText = "0";
    if (blockedTasks) blockedTasks.innerText = "0";

    list.innerHTML = tasks.length
        ? tasks.map((task, index) => `
            <div class="planner-task-card">
                <div class="planner-task-title">${escapeHtml(task)}</div>
                <div class="planner-details">Status: <b>Running</b></div>
                <div class="planner-progress-bar">
                    <div class="planner-progress" style="width:40%"></div>
                </div>
                <div class="planner-actions">
                    <button onclick="deleteTask(${index}); loadPlannerTasks();">Delete</button>
                </div>
            </div>
        `).join("")
        : `<div class="planner-task-card"><p>No tasks yet. Create your first smart task.</p></div>`;
}

// ================= DASHBOARD / PROFILE =================

function initializeDashboardIdentity() {
    const nameElement = document.getElementById("dashboardUserName");
    const initialElement = document.getElementById("dashboardUserInitial");

    if (!nameElement || !initialElement) return;

    const user = getStoredUser();
    const name = String(user?.name || "Account").trim();

    nameElement.innerText = name;
    initialElement.innerText = name.charAt(0).toUpperCase();
}

function toggleMenu() {
    const menu = document.getElementById("dropdownMenu");
    const button = document.querySelector(".user-btn");

    if (!menu) return;

    const isOpen = menu.classList.toggle("active");
    button?.setAttribute("aria-expanded", String(isOpen));
}

function openProfile() {
    document.getElementById("dropdownMenu")?.classList.remove("active");

    const user = getStoredUser();

    document.getElementById("profileDisplayName").innerText = user?.name || "User";
    document.getElementById("profileEmail").innerText = user?.email || "Not available";
    document.getElementById("profileTasks").innerText = document.getElementById("taskCount")?.innerText || "0";
    document.getElementById("profilePosts").innerText = document.getElementById("postCount")?.innerText || "0";
    document.getElementById("newName").value = user?.name || "";

    document.getElementById("profileModal")?.classList.remove("hidden");
}

function closeProfile() {
    document.getElementById("profileModal")?.classList.add("hidden");
}

function openSettings() {
    document.getElementById("dropdownMenu")?.classList.remove("active");
    document.getElementById("settingsModal")?.classList.remove("hidden");
}

function closeSettings() {
    document.getElementById("settingsModal")?.classList.add("hidden");
}

function saveProfile() {
    const name = document.getElementById("newName")?.value.trim();

    if (!name) {
        alert("Name is required.");
        return;
    }

    const user = getStoredUser() || {};
    user.name = name;

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("currentUser", name);

    updateLoginArea();
    initializeDashboardIdentity();
    closeProfile();

    alert("Profile updated successfully.");
}

function changeUsername() {
    saveProfile();
}

function applySavedTheme() {
    document.body.classList.toggle("light-mode", localStorage.getItem("dashboardTheme") === "light");
}

function toggleTheme() {
    const useLightMode = !document.body.classList.contains("light-mode");

    document.body.classList.toggle("light-mode", useLightMode);
    localStorage.setItem("dashboardTheme", useLightMode ? "light" : "dark");
}

function resetAllData() {
    if (!confirm("Delete all tasks and posts?")) return;

    localStorage.removeItem("tasks");
    localStorage.removeItem("posts");

    showTasks();
    loadPlannerTasks();
    loadPosts();
    updateRecommendation();

    alert("All data deleted.");
}
// ================= CUSTOM OPTION PICKERS =================

function closeOptionPickers(exceptId = "") {
    document.querySelectorAll(".option-picker.is-open").forEach(picker => {
        if (picker.id !== exceptId) {
            picker.classList.remove("is-open");
        }
    });
}

function toggleOptionPicker(pickerId, event) {
    if (event) event.stopPropagation();

    const picker = document.getElementById(pickerId);
    if (!picker) return;

    const shouldOpen = !picker.classList.contains("is-open");
    closeOptionPickers(pickerId);
    picker.classList.toggle("is-open", shouldOpen);
}

function chooseOption(pickerId, inputId, value, label, event) {
    if (event) event.stopPropagation();

    const picker = document.getElementById(pickerId);
    const input = document.getElementById(inputId);

    if (!picker || !input) return;

    input.value = value;

    const labelSpan = picker.querySelector(".option-picker-trigger span");
    if (labelSpan) {
        labelSpan.textContent = label;
    }

    /* Remove selected class from all options */
    picker.querySelectorAll(".option-picker-menu button").forEach(btn => {
        btn.classList.remove("is-selected");
    });

    /* Add selected class only to clicked option */
    if (event?.target) {
        event.target.classList.add("is-selected");
    }

    picker.classList.remove("is-open");

    input.dispatchEvent(
        new Event("change", { bubbles: true })
    );
}

document.addEventListener("click", () => {
    closeOptionPickers();
});
