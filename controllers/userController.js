const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const cookieController = require('./cookieController');
const sessionModel = require('../models/sessionModelMySql');
const errorTypes = require('../models/errorModel.js');
// const { use } = require('../app');
let lightTheme;
//#region SHOW FORMS

function showLoginForm(request, response, notLoggedIn) {
    response.render('login.hbs', pageData('user', notLoggedIn));
}

function showRegisterForm(request, response) {
    response.render('register.hbs', pageData('users'));
}

function pageData(endpoint, notLoggedIn) {
    let message;

    if (notLoggedIn)
        message = "You need to be logged in to access these forms.";

    return {
        icon: "images/favicon.ico",
        endpoint: "/" + endpoint,
        message: message,
        method: "post",
        light: lightTheme,
        failureMessage: notLoggedIn,
    }
}

function showProfile(request, response) {
    let colors = [];
    if (isLightTheme(request)) {
        lightTheme = true;
        colors = ["Light", "Dark"];
    }
    else {
        lightTheme = false;
        colors = ["Dark", "Light"];
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
        lightTheme = isLightTheme(request);

        const { username, password } = await model.addUser(usernameInput, passwordInput);
        response.status(200);

        response.render('login.hbs', {
            icon: "images/favicon.ico",
            endpoint: "/user",
            method: "post",
            successMessage: true,
            message: "Successfully registered user!",
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
    try {
        let colors;

        if (isLightTheme(request)) {
            lightTheme = true;
            colors = ["Light", "Dark"];
        }
        else {
            lightTheme = false;
            colors = ["Dark", "Light"];
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

function isLightTheme(req) {
    if (req.cookies.theme == "light")
        return true; 
    else 
        return false;
}

//#endregion
function showUserForm(request, response, notLoggedIn) {
    lightTheme = isLightTheme(request);

    switch (request.body.choice) {
        case 'login':
            showLoginForm(request, response, notLoggedIn);
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
    showUserForm
}