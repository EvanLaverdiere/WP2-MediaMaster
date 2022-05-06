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


module.exports = {
    router,
    routeRoot
}
