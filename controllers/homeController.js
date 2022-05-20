const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/songModelMySql')
let i ="images/"
const images=[i+"img2.jpg",i+"img3.jpg",i+"img1.jpg",i+"img4.jpg"];
class Tracker{
    constructor(username){
        this.username = username
    }
}

/**
 * Displays the site's home page.
 * @param {*} req 
 * @param {*} res 
 */
function renderHome(req, res) {
    let logged;
    if (typeof (req.cookies.username) != 'undefined')
        logged = true;
    let theme = req.cookies.theme;  if(theme=="light")theme=true;else theme=false;

    res.render('home.hbs',
    {
        icon: "images/favicon.ico",
        logged: logged,
        username:req.cookies.username,
        light: theme,
        first:"images/img0.jpg",
        images:images
    })
}
router.get('/home', renderHome)

/**
 * Displays the About Us page.
 * @param {*} req 
 * @param {*} res 
 */
function renderAbout(req, res) {
    let logged;
    if (typeof (req.cookies.username) != 'undefined')
        logged = true;
    let theme = req.cookies.theme;  if(theme=="light")theme=true;else theme=false;

    let message ="This website was created by Evan, Jeremy and Julian.\nWe are cegep students from John Abbot College and this is our Web Programming final project."
    +" We created Media Master since we wanted to create a website that allow users "+
    "to have their own song collections. In which they can store, delete, update and view songs from their collection."+
    " So they can keep track of their music. In order to access to these functionalities, every user needs to be signed in in their account."+
    " And so, every user can create their account, providing a username and password.";
    res.render('aboutUs.hbs',{
        icon: "images/favicon.ico",
        message,
        theme: theme,
        logged: logged,
        username: req.cookies.username,
        light: theme
    })
}
router.get('/aboutUs', renderAbout)



module.exports = {
    router,
    routeRoot
}
