const express = require('express');
const router = express.Router();
const routeRoot = '/';
const model = require('../models/songModelMySql')

function renderHome(req, res) {
    res.statusCode=200;
    res.render('home.hbs',
        {
            icon: "images/favicon.ico"
        })
}
router.get('/home', renderHome)

function addForm(req, res) {
    const pageData = {
        message: false,
        endpoint: "/song",
        method: "post",
        legend: "Enter details to add a song",
        formfields: [{ field: "title", pretty: "Title" },
        { field: "artist", pretty: "Artist" },
        { field: "album", pretty: "Album", album:true }],
        genres:
    }
    res.render('add.hbs', pageData);
}
router.get('/addForm', addForm) //just for testing
module.exports = {
    router,
    routeRoot
}
