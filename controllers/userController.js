const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const errorTypes = require('../models/errorTypes');

//#region ENDPOINTS

async function addUser(request, response) {
    try {
        const usernameInput = request.body.username;
        const passwordInput = request.body.password;

        const { username, password } = await model.addUser(usernameInput, passwordInput);

        response.status(200);
        response.render('home.hbs');
        //TODO: response.render
    }
    catch (err) {
        if (err instanceof errorTypes.InvalidInputError) {
            response.status(400);
            response.render('error.hbs');
            //TODO: response.render
        }
        else if (err instanceof errorTypes.UserAlreadyExistsError) {
            response.status(400);
            response.render('error.hbs');
            //TODO: response.render
        }
        else if (err instanceof errorTypes.DBConnectionError) {
            response.status(500);
            response.render('error.hbs');
            //TODO: response.render
        }
        else {
            response.status(500);
            response.render('error.hbs');
            //TODO: response.render
        }
    }
}
router.post('/users/', addUser);

async function getUser(request, response){
    try{
        const username = request.query.username;
        const password = request.query.password;

        const result = await model.getUser(username, password);

        response.status(200);
        //TODO: response.render
    }
    catch(err){
        if (err instanceof errorTypes.AuthenticationError) {
            response.status(400);
            //TODO: response.render
        }
        else if (err instanceof errorTypes.DBConnectionError) {
            response.status(500);
            //TODO: response.render
        }
        else {
            response.status(500);
            //TODO: response.render
        }
    }
}
router.get('/user', getUser);

//#endregion

module.exports = {
    router,
    routeRoot
}