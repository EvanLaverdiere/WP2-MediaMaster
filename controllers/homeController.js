const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/songModelMySql')

class Tracker{
    constructor(username){
        this.username = username
    }
}

function renderHome(req, res) {
    let userId = req.cookies.userId;
    let logged;
    if (typeof (userId) != 'undefined')logged = true;
    res.render('home.hbs',
    {
        icon: "images/favicon.ico",
        logged: logged,
        username:"changeMe"
    })
}
router.get('/home', renderHome)

function renderAbout(req, res) {
    let message ="This website was created by Evan, Jeremy and Julian.\nWe are cegep students from John Abbot College and this is our Web Programming final project."
    +" We created Media Master since we wanted to create a website that allow users "+
    "to have their own song collections. In which they can store, delete, update and view songs from their collection."+
    " So they can keep track of their music. In order to access to these functionalities, every user needs to be signed in in their account."+
    " And so, every user can create their account, providing a username and password.";
    res.render('aboutUs.hbs',{message})
}
router.get('/aboutUs', renderAbout)



module.exports = {
    router,
    routeRoot
}
