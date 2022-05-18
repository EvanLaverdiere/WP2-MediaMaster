const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const errorTypes = require('../models/errorModel.js');
const { use } = require('../app');
let lightTheme;
let userName;
//#region SHOW FORMS

 function showLoginForm(request, response) {

    const pageData = {
        message: false,
        endpoint: "/user",
        method: "post",
        light: lightTheme
    }
    response.render('login.hbs', pageData);
}

function showRegisterForm(request, response) {

   const pageData = {
       message: false,
       endpoint: "/users",
       method: "post",
       light: lightTheme
   }
   response.render('register.hbs', pageData);
}

function showProfile(request, response) {
    let colors=[];
    let theme = request.cookies.theme;  if(theme=="light"){
        lightTheme=true;
        colors =["Light","Dark"];
    }
    else{
        colors =["Dark","Light"];
        lightTheme=false;
    } 

    response.render('userProfile.hbs', {
        username: userName,
        colors: colors,
        languages: ["English", "French"],
        logged:true,
        light: lightTheme
    });
 }
//#endregion

//#region ENDPOINTS

async function addUser(request, response) {
    try {
        const usernameInput = request.body.username;
        const passwordInput = request.body.password;
        let theme = request.cookies.theme;  if(theme=="light")lightTheme=true;else lightTheme=false;

        const {username, password} = await model.addUser(usernameInput, passwordInput);
        userName=username;
        response.status(200);
        response.render('userProfile.hbs', {
            successMessage: true,
            message: "Successfully registered user!",
            username: username,
            colors: ["Dark", "Light"],
            languages: ["English", "French"],
            logged:true,
            username: username,
            light: lightTheme
        });
    }
    catch (err) {
        if (err instanceof errorTypes.InvalidInputError) {
            response.status(400);
            response.render('register.hbs', {
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
                failureMessage: true,
                message: "Failed to register: "+ err.message,
                endpoint: "/users",
                method: "post",
                light: lightTheme
            });
        }
        else {
            response.status(500);
            response.render('register.hbs', {
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

async function getUser(request, response){
    let colors;
    try{
        let theme = request.cookies.theme;  if(theme=="light"){
            lightTheme=true;
            colors =["Light","Dark"];
        }
        else{
            colors =["Dark","Light"];
            lightTheme=false;
        } 
        const usernameInput = request.query.username;
        const passwordInput = request.query.password;

        const { username, password } = await model.getUser(usernameInput, passwordInput);

        response.status(200);
        response.render('userProfile.hbs', {
            successMessage: true,
            message: "Successfully logged in!",
            username: username,
            colors: colors,
            languages: ["English", "French"],
            light: lightTheme
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
                method: "post",
                light: lightTheme
            });
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('login.hbs', {
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
    if(theme=="light")lightTheme=true;else lightTheme=false;

    switch (request.body.choice) {
        case 'login':
            showLoginForm(request,response);
            break;
        case 'register':
            showRegisterForm(request,response);
            break;
        case 'profile':
            showProfile(request,response);
            break;
        default:
            response.render('home.hbs');
    }
} // no valid choice made
module.exports = {
    router,
    routeRoot,
    showUserForm
}