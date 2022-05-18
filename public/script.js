// Code taken from: https://www.javascripttutorial.net/javascript-dom/javascript-toggle-password-visibility/
const togglePassword = document.querySelector("#toggle");
const password = document.querySelector("#password");

function showPassword() {

    const type = password.getAttribute("type") === "password" ? "text" : "password";

    password.setAttribute("type", type);

    // toggle the icon
    this.classList.toggle("bi-eye");
}
