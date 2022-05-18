// Code taken from: https://www.javascripttutorial.net/javascript-dom/javascript-toggle-password-visibility/
const togglePassword = document.querySelector("#toggle");
const password = document.querySelector("#password");

const moon = document.querySelector("#moon");
const sun = document.querySelector("#sun");

if (moon !== null)
    moon.addEventListener("click", moonF);
if (sun !== null)
    sun.addEventListener("click", sunF);


function showPassword() {

    const type = password.getAttribute("type") === "password" ? "text" : "password";

    password.setAttribute("type", type);

    // toggle the icon
    this.classList.toggle("bi-eye");
}

function changeTheme() {
    var x = document.getElementById("select").value.toLowerCase();
    x = x.toLowerCase();
    document.cookie = "theme=" + x + ";";
    location.reload();
}

function moonF(e) {
    document.cookie = "theme=dark;";
    e.preventDefault();
    location.reload();
}

function sunF(e) {
    document.cookie = "theme=light;";
    e.preventDefault();
    location.reload();
}