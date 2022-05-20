const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const cookieController = require('./cookieController');
const sessionModel = require('../models/sessionModelMySql');
const errorTypes = require('../models/errorModel.js');
let lightTheme;

//#region SHOW FORMS

/**
 * Renders the login page.
 * @param {*} request The request from the client.
 * @param {*} response The response from the server.
 * @param {*} notLoggedIn A flag indicating if the user is logged in or not.
 */
function showLoginForm(request, response, notLoggedIn) {
    response.render('login.hbs', pageData('user', notLoggedIn));
}

/**
 * Renders the register page.
 * @param {*} request The request from the client.
 * @param {*} response The response from the server.
 */
function showRegisterForm(request, response) {
    response.render('register.hbs', pageData('users'));
}

/**
 * Helper function for sending page data when loading a page.
 * @param {string} endpoint Where the form page will be submitted.
 * @param {boolean} notLoggedIn A flag indicating if the user is logged in or not.
 * @returns Data which will fill the page.
 */
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

/**
 * Renders the user profile page.
 * @param {*} request The request from the client.
 * @param {*} response The response from the server.
 */
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
        logged: true,
        light: lightTheme
    });
}
//#endregion

//#region ENDPOINTS

/**
 * Endpoint function for adding a user to the database.
 * Called when the register form is submitted.
 * @param {*} request The request from the client.
 * @param {*} response The response from the server.
 */
async function addUser(request, response) {
    try {
        const usernameInput = request.body.username;
        const passwordInput = request.body.password;
        lightTheme = isLightTheme(request);

        await model.addUser(usernameInput, passwordInput);
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

/**
 * Endpoint function for getting a user from the database.
 * Called when the login form is submitted. 
 * If user was successfully logged, it sets the appropiate cookies
 * (userId, tracker, username, sessionId). And renders the user's profile.
 * @param {*} request The request from the client.
 * @param {*} response The response from the server.
 */
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

// #region Logout
/**
 * Renders the login form, in case the user wants to login on another account.
 * The cookies are removed from a external script.
 * @param {Mandatory} req 
 * @param {Mandatory} res 
 */
function logout(req, res) {
    lightTheme = isLightTheme(req);
    res.render('login.hbs', {
            icon: "images/favicon.ico",
            endpoint: "/user",
            method: "post",
            successMessage: true,
            message: "Successfully logged out!",
            light: lightTheme
    })
}

// 

/**
 * Loads register, login or user profile page based on the client request.
 * @param {*} request The request from the client.
 * @param {*} response The response from the server.
 * @param {boolean} notLoggedIn A flag indicating if the user is logged in or not.
 */
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
        case 'logout':
            logout(request, response);
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