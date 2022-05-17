const { request } = require('express');
const express = require('express');
const router = express.Router();
const routeRoot = '/';

/**
 * If the url entered by the user is not a valid enpoint, -
 * it will get to this endpoint and respond with a 404 error code
 * @param {response} req 
 * @param {request} res 
 */
function errorResponse(req, res) {
    res.statusCode = 404;
    res.render('error.hbs',
        {
            message: "Error 404 Not Found: The site you were trying to visit could not be found"
        })
}
router.all('*', errorResponse);
module.exports = {
    router,
    routeRoot
}
