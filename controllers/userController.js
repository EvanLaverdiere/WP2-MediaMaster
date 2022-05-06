const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const errorTypes = require('../models/errorModel.js');

//#region SHOW FORMS

 function showLoginForm(request, response) {
    const pageData = {
        message: false,
        endpoint: "/users",
        method: "get",
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
        const username = request.body.username;
        const password = request.body.password;

        await model.addUser(username, password);

        response.status(200);
        response.render('userProfile.hbs', {
            successMessage: true,
            message: "Successfully registered user!"
        });
    }
    catch (err) {
        if (err instanceof errorTypes.InvalidInputError) {
            response.status(400);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: invalid input.",
                endpoint: "/users",
                method: "post"
            });
        }
        else if (err instanceof errorTypes.UserAlreadyExistsError) {
            response.status(400);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: user already exists.",
                endpoint: "/users",
                method: "post"
            });
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: something wrong happened in the database.",
                endpoint: "/users",
                method: "post"
            });
        }
        else {
            response.status(500);
            response.render('register.hbs', {
                failureMessage: true,
                message: "Failed to register: unknown cause.",
                endpoint: "/users",
                method: "post"
            });
        }
    }
}
router.post('/users', addUser);

async function getUser(request, response){
    try{
        const username = request.query.username;
        const password = request.query.password;

        const result = await model.getUser(username, password);

        response.status(200);
        response.render('userProfile.hbs', {});
        //TODO: response.render
    }
    catch(err){
        if (err instanceof errorTypes.AuthenticationError) {
            response.status(400);
            response.render('login.hbs', {});
            //TODO: response.render
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('login.hbs', {});
            //TODO: response.render
        }
        else {
            response.status(500);
            response.render('login.hbs', {});
            //TODO: response.render
        }
    }
}
router.get('/users', getUser);

//#endregion

module.exports = {
    router,
    routeRoot
}