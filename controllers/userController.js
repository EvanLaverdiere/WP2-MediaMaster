const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/userModelMySql');
const errorTypes = require('../models/errorModel.js');

//#region ENDPOINTS

async function addUser(request, response) {
    try {
        const username = request.body.username;
        const password = request.body.password;

        await model.addUser(username, password);

        response.status(200);
        response.render('home.hbs', {});
        //TODO: response.render
    }
    catch (err) {
        if (err instanceof errorTypes.InvalidInputError) {
            response.status(400);
            response.render('register.hbs', {});
            //TODO: response.render
        }
        else if (err instanceof errorTypes.UserAlreadyExistsError) {
            response.status(400);
            response.render('register.hbs', {});
            //TODO: response.render
        }
        else if (err instanceof errorTypes.DatabaseError) {
            response.status(500);
            response.render('register.hbs', {});
            //TODO: response.render
        }
        else {
            response.status(500);
            response.render('register.hbs', {});
            //TODO: response.render
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
router.get('/user', getUser);

//#endregion

module.exports = {
    router,
    routeRoot
}