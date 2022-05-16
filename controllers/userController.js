const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const cookieController = require('./cookieController');
const errorTypes = require('../models/errorModel.js');

//#region SHOW FORMS

 function showLoginForm(request, response) {
    const pageData = {
        message: false,
        endpoint: "/user",
        method: "post",
    }
    response.render('login.hbs', pageData);
}
router.get('/users/forms/login', showLoginForm);

function showRegisterForm(request, response) {
   const pageData = {
       message: false,
       endpoint: "/users",
       method: "post",
   }
   response.render('register.hbs', pageData);
}
router.get('/users/forms/register', showRegisterForm);

//#endregion

//#region ENDPOINTS

async function addUser(request, response) {
    try {
        const usernameInput = request.body.username;
        const passwordInput = request.body.password;

        const {username, password} = await model.addUser(usernameInput, passwordInput);

        response.status(200);
        response.render('userProfile.hbs', {
            successMessage: true,
            message: "Successfully registered user!",
            username: username,
            colors: ["Dark", "Light"],
            languages: ["English", "French"]
        });
    }
    catch (err) {
        if (err instanceof errorTypes.InvalidInputError) {
            response.status(400);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: invalid input. " + err.message,
                endpoint: "/users",
                method: "post"
            });
        }
        else if (err instanceof errorTypes.UserAlreadyExistsError) {
            response.status(400);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: " + err.message,
                endpoint: "/users",
                method: "post"
            });
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: "+ err.message,
                endpoint: "/users",
                method: "post"
            });
        }
        else {
            response.status(500);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: unknown cause. " + err.message,
                endpoint: "/users",
                method: "post"
            });
        }
    }
}
router.post('/users', addUser);

async function getUser(request, response){
    try{
        const usernameInput = request.body.username;
        const passwordInput = request.body.password;

        const { username, password } = await model.getUser(usernameInput, passwordInput);
        const userId = await model.getUserId(username);
        const tracker = await cookieController.manageTracker(request, username);

        response.status(200);
        response.cookie("userId", userId);
        response.cookie("tracker", JSON.stringify(tracker));
        response.render('userProfile.hbs', {
            successMessage: true,
            message: "Successfully logged in!",
            username: username,
            colors: ["Dark", "Light"],
            languages: ["English", "French"]
        });
        //TODO: response.render
    }
    catch(err){
        if (err instanceof errorTypes.AuthenticationError) {
            response.status(400);
            response.render('login.hbs', {
                failureMessage: true,
                message: "Failed to login: " + err.message,
                endpoint: "/user",
                method: "post"
            });
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('login.hbs', {
                failureMessage: true,
                message: "Failed to login: " + err.message,
                endpoint: "/user",
                method: "post"
            });
        }
        else {
            response.status(500);
            response.render('login.hbs', {
                failureMessage: true,
                message: "Failed to login: unknown cause. " + err.message,
                endpoint: "/user",
                method: "post"
            });
        }
    }
}
router.post('/user', getUser);

//#endregion

module.exports = {
    router,
    routeRoot
}