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

// ================= LOGIN PAGE =================

function loginUser(){

let email =
document.getElementById("email").value;

let password =
document.getElementById("password").value;

if(email.trim() === "" || password.trim() === ""){

alert("Please fill all fields");
return;

}

localStorage.setItem("loggedIn","true");

localStorage.setItem("email",email);

let redirect =
localStorage.getItem("redirectPage");

if(redirect){

window.location.href = redirect;

}
else{

window.location.href = "home.html";

}

}

// ================= LOGIN BUTTON =================

function goLogin(){

window.location.href = "login.html";

}

// ================= OPEN PAGE =================

function openPage(page){

const loggedIn =
localStorage.getItem("loggedIn");

if(loggedIn === "true"){

window.location.href = page;

}
else{

localStorage.setItem("redirectPage",page);

window.location.href = "login.html";

}

}

// ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded",()=>{

// SUBJECT DROPDOWN

let subjectDropdown =
document.getElementById("subject");

if(subjectDropdown){

subjectDropdown.innerHTML =

"<option value=''>Select Subject</option>" +

subjects.map(s =>

`<option value="${s}">${s}</option>`

).join("");

}

// LOGIN / LOGOUT

const loginArea =
document.getElementById("loginArea");

if(loginArea){

const loggedIn =
localStorage.getItem("loggedIn");

if(loggedIn === "true"){

let email =
localStorage.getItem("email") || "User";

let username =
email.split("@")[0];

username =
username.charAt(0).toUpperCase() +
username.slice(1);

loginArea.innerHTML = `

<div style="
display:flex;
align-items:center;
gap:15px;
">

<h3 style="
color:white;
margin:0;
">
Hi, ${username}
</h3>

<button onclick="logout()"
style="
padding:12px 35px;
background:#ff7a18;
border:none;
border-radius:10px;
color:white;
font-weight:bold;
cursor:pointer;
">
Logout
</button>

</div>

`;

}
else{

loginArea.innerHTML = `

<button onclick="goLogin()"
style="
padding:12px 40px;
background:#ff7a18;
border:none;
border-radius:10px;
color:white;
font-weight:bold;
cursor:pointer;
">
Login
</button>

`;

}

}

// LOAD DATA

showTasks();

loadPosts();

});

// ================= LOGOUT =================

function logout(){

localStorage.removeItem("loggedIn");

localStorage.removeItem("email");

window.location.href = "home.html";

}

// ================= TASKS =================

function addTask(){

let loggedIn =
localStorage.getItem("loggedIn");

if(loggedIn !== "true"){

alert("Login required");
return;

}

let input =
document.getElementById("taskInput");

let val =
input.value;

if(val.trim() === ""){

alert("Enter task");
return;

}

let arr =
JSON.parse(localStorage.getItem("tasks")) || [];

arr.push(val);

localStorage.setItem(
"tasks",
JSON.stringify(arr)
);

input.value = "";

showTasks();

}

function showTasks(){

let tasks =
JSON.parse(localStorage.getItem("tasks")) || [];

let taskList =
document.getElementById("taskList");

if(taskList){

taskList.innerHTML =

tasks.map((t,index) =>

`

<li class="task-item">

${t}

<button
onclick="deleteTask(${index})"
style="
margin-left:10px;
background:red;
color:white;
border:none;
padding:5px 10px;
border-radius:5px;
cursor:pointer;
">

X

</button>

</li>

`

).join("");

}

}

function deleteTask(index){

let tasks =
JSON.parse(localStorage.getItem("tasks")) || [];

tasks.splice(index,1);

localStorage.setItem(
"tasks",
JSON.stringify(tasks)
);

showTasks();

}

// ================= COMMUNITY =================

function loadPosts(){

let posts =
JSON.parse(localStorage.getItem("posts")) || [];

let box =
document.getElementById("posts");

if(box){

box.innerHTML =

posts.map((p,index) =>

`

<div class="community-post">

${p}

<button
onclick="deletePost(${index})"
style="
float:right;
background:red;
border:none;
padding:5px 10px;
border-radius:5px;
color:white;
cursor:pointer;
">

X

</button>

</div>

`

).join("");

}

}

function addPost(){

let input =
document.getElementById("postInput");

if(!input) return;

let val =
input.value;

if(val.trim() === ""){

alert("Write something");
return;

}

let arr =
JSON.parse(localStorage.getItem("posts")) || [];

arr.unshift(val);

localStorage.setItem(
"posts",
JSON.stringify(arr)
);

input.value = "";

loadPosts();

}

function deletePost(index){

let posts =
JSON.parse(localStorage.getItem("posts")) || [];

posts.splice(index,1);

localStorage.setItem(
"posts",
JSON.stringify(posts)
);

loadPosts();

}

// ================= CAREER =================

function loadCareer(){

let branch =
document.getElementById("branch").value;

let box =
document.getElementById("careerBox");

let careers = {

cse:[
"Software Engineer",
"AI Engineer",
"Web Developer",
"Cyber Security Engineer",
"Cloud Engineer",
"Data Scientist"
],

ece:[
"Embedded Engineer",
"VLSI Engineer",
"Telecom Engineer",
"IoT Engineer"
],

me:[
"Automobile Engineer",
"Robotics Engineer",
"CAD Designer"
],

civil:[
"Site Engineer",
"Structural Engineer",
"Construction Manager"
],

ee:[
"Power Engineer",
"Automation Engineer",
"Electrical Designer"
]

};

if(branch){

box.innerHTML =

careers[branch]

.map(c =>

`

<div class="card"
onclick="showCareer('${c}')">

${c}

</div>

`

).join("");

}

}

function showCareer(role){

let box =
document.getElementById("careerDetail");

box.classList.remove("hidden");

box.innerHTML = `

<h2>${role}</h2>

<p>
Skills, Roadmaps & Resources
</p>

<div style="margin-top:20px;">

<a href="https://www.youtube.com/results?search_query=${role}+roadmap"
target="_blank">

Roadmap

</a>

<br><br>

<a href="https://roadmap.sh/"
target="_blank">

Developer Roadmap

</a>

<br><br>

<a href="https://www.google.com/search?q=${role}+interview+questions"
target="_blank">

Interview Questions

</a>

</div>

<br>

<button onclick="closeCareer()">

Close

</button>

`;

}

function closeCareer(){

document
.getElementById("careerDetail")
.classList.add("hidden");

}

// ================= ACADEMICS =================

function loadData(){

let sub =
document.getElementById("subject").value;

let lvl =
document.getElementById("level").value;

let box =
document.getElementById("content");

if(!sub){

box.innerHTML = "";
return;

}

// SEARCHES

let youtubeQuery =
`${sub} ${lvl} full course`;

let notesQuery =
`${sub} ${lvl} notes pdf`;

let researchQuery =
`${sub} ${lvl} research papers`;

let practiceQuery =
`${sub} ${lvl} practice questions`;

let projectQuery =
`${sub} ${lvl} projects`;

let roadmapQuery =
`${sub} roadmap ${lvl}`;

// LEVEL COLOR

let levelColor = "#00e5ff";

if(lvl === "beginner"){

levelColor = "#00ff95";

}
else if(lvl === "intermediate"){

levelColor = "#ffd000";

}
else if(lvl === "advanced"){

levelColor = "#ff4d4d";

}

// UI

box.innerHTML = `

<h1 class="topic-title"
style="
color:${levelColor};
text-align:center;
margin-top:40px;
">

📚 ${sub} (${lvl.toUpperCase()} LEVEL)

</h1>

<div class="content-grid">

<!-- YOUTUBE -->

<div class="big-card">

<h2>
🎥 YouTube Videos
</h2>

<p>
Best ${lvl} tutorials & playlists
</p>

<a href="
https://www.youtube.com/results?search_query=${youtubeQuery}"
target="_blank">

Watch

</a>

</div>

<!-- NOTES -->

<div class="big-card">

<h2>
📘 Notes
</h2>

<p>
${lvl} study material & PDFs
</p>

<a href="
https://www.google.com/search?q=${notesQuery}"
target="_blank">

Read

</a>

</div>

<!-- RESEARCH -->

<div class="big-card">

<h2>
📄 Research Papers
</h2>

<p>
IEEE & Scholar papers
</p>

<a href="
https://scholar.google.com/scholar?q=${researchQuery}"
target="_blank">

Explore

</a>

</div>

<!-- PRACTICE -->

<div class="big-card">

<h2>
📝 Practice Questions
</h2>

<p>
Assignments & MCQs
</p>

<a href="
https://www.google.com/search?q=${practiceQuery}"
target="_blank">

Solve

</a>

</div>

<!-- PROJECTS -->

<div class="big-card">

<h2>
🚀 Projects
</h2>

<p>
Real-world ${lvl} projects
</p>

<a href="
https://www.youtube.com/results?search_query=${projectQuery}"
target="_blank">

Build

</a>

</div>

<!-- ROADMAP -->

<div class="big-card">

<h2>
🛣 Roadmap
</h2>

<p>
Complete learning roadmap
</p>

<a href="
https://www.google.com/search?q=${roadmapQuery}"
target="_blank">

Open

</a>

</div>

</div>

`;

}