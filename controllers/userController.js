const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const cookieController = require('./cookieController');
const sessionModel = require('../models/sessionModelMySql');
const errorTypes = require('../models/errorModel.js');
// const { use } = require('../app');
let lightTheme;
let userName;
let currentUser = "a";
//#region SHOW FORMS

function showLoginForm(request, response) {
    response.render('login.hbs', pageData('user'));
}

function showRegisterForm(request, response) {
    response.render('register.hbs', pageData('users'));
}

function pageData(endpoint) {
    return {
        icon: "images/favicon.ico",
        message: false,
        endpoint: "/"+endpoint,
        method: "post",
        light: lightTheme
    }
}

function showProfile(request, response) {
    let colors = [];
    let theme = request.cookies.theme; if (theme == "light") {
        lightTheme = true;
        colors = ["Light", "Dark"];
    }
    else {
        colors = ["Dark", "Light"];
        lightTheme = false;
    }

    response.render('userProfile.hbs', {
        icon: "images/favicon.ico",
        username: request.cookies.username,
        colors: colors,
        languages: ["English", "French"],
        logged: true,
        light: lightTheme
    });
}
//#endregion

//#region ENDPOINTS

async function addUser(request, response) {
    try {
        const usernameInput = request.body.username;
        const passwordInput = request.body.password;
        let colors;
        let theme = request.cookies.theme; if (theme == "light") {
            lightTheme = true;
            colors = ["Light", "Dark"];
        }
        else {
            colors = ["Dark", "Light"];
            lightTheme = false;
        }
        const { username, password } = await model.addUser(usernameInput, passwordInput);
        userName = username;
        response.status(200);
        response.render('userProfile.hbs', {
            icon: "images/favicon.ico",
            successMessage: true,
            message: "Successfully registered user!",
            username: username,
            colors: colors,
            username: username,
            light: lightTheme
        });
    }
    catch (err) {
        if (err instanceof errorTypes.InvalidInputError) {
            response.status(400);
            response.render('register.hbs', {
                icon: "images/favicon.ico",
                failureMessage: true,
                message: "Failed to register: invalid input. " + err.message,
                endpoint: "/users",
                method: "post",
                light: lightTheme
            });
        }
        else if (err instanceof errorTypes.UserAlreadyExistsError) {
            response.status(400);
            response.render('register.hbs', {
                icon: "images/favicon.ico",
                failureMessage: true,
                message: "Failed to register: " + err.message,
                endpoint: "/users",
                method: "post",
                light: lightTheme
            });
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('register.hbs', {
                icon: "images/favicon.ico",
                failureMessage: true,
                message: "Failed to register: " + err.message,
                endpoint: "/users",
                method: "post",
                light: lightTheme
            });
        }
        else {
            response.status(500);
            response.render('register.hbs', {
                icon: "images/favicon.ico",
                failureMessage: true,
                message: "Failed to register: unknown cause. " + err.message,
                endpoint: "/users",
                method: "post",
                light: lightTheme
            });
        }
    }
}
router.post('/users', addUser);

async function getUser(request, response) {
    let colors;
    try {
        let theme = request.cookies.theme; if (theme == "light") {
            lightTheme = true;
            colors = ["Light", "Dark"];
        }
        else {
            colors = ["Dark", "Light"];
            lightTheme = false;
        }
        const usernameInput = request.body.username;
        const passwordInput = request.body.password;

        const { username, password } = await model.getUser(usernameInput, passwordInput);
        const userId = await model.getUserId(username);
        const tracker = await cookieController.manageTracker(request, username);
        const session = await sessionModel.addSession(userId);
        response.status(200);
        response.cookie("userId", userId);
        response.cookie("username", username);
        response.cookie("tracker", JSON.stringify(tracker));
        response.cookie("sessionId", session.sessionId, { expires: session.closesAt, httpOnly: true });
        response.render('userProfile.hbs', {
            icon: "images/favicon.ico",
            successMessage: true,
            message: "Successfully logged in!",
            username: username,
            colors: colors,
            light: lightTheme,
            logged: true
        });
    }
    catch (err) {
        if (err instanceof errorTypes.AuthenticationError) {
            response.status(400);
            response.render('login.hbs', {
                icon: "images/favicon.ico",
                failureMessage: true,
                message: "Failed to login: " + err.message,
                endpoint: "/user",
                method: "post",
                light: lightTheme
            });
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('login.hbs', {
                icon: "images/favicon.ico",
                failureMessage: true,
                message: "Failed to login: " + err.message,
                endpoint: "/user",
                method: "post",
                light: lightTheme
            });
        }
        else {
            response.status(500);
            response.render('login.hbs', {
                icon: "images/favicon.ico",
                failureMessage: true,
                message: "Failed to login: unknown cause. " + err.message,
                endpoint: "/user",
                method: "post",
                light: lightTheme
            });
        }
    }
}
router.post('/user', getUser);

//#endregion
function showUserForm(request, response) {
    let theme = request.cookies.theme;
    if (theme == "light") lightTheme = true; else lightTheme = false;

    switch (request.body.choice) {
        case 'login':
            showLoginForm(request, response);
            break;
        case 'register':
            showRegisterForm(request, response);
            break;
        case 'profile':
            showProfile(request, response);
            break;
        default:
            response.render('home.hbs');
    }
}

module.exports = {
    router,
    routeRoot,
    showUserForm,
    currentUser
}