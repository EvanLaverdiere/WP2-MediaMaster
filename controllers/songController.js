const model = require('../models/songModelMySql.js')
const userController = require('./userController')
let user;
const express = require('express');
const { json } = require('express/lib/response');
const res = require('express/lib/response');
const { request } = require('express');
const { InvalidInputError, DatabaseError } = require('../models/errorModel.js');
const { createTracker, updateTracker, manageTracker, manageSession } = require('./cookieController');
const router = express.Router();
const routeRoot = '/';
let lightTheme;

//#region ADD Endpoint
/**
 * Endpoint reached after user submits the add form to add a song.
 * It reads the input from the user through the body of the request.
 * And tells the model to add a song (model will decide to add it or not).
 * After, it will render the add form again in case the user wants to keep adding songs.
 * If there is an error or if the operation was successful an message will be rendered along with the form.
 * @param {*} req 
 * @param {*} res 
 */
async function add(req, res) {
    let title = req.body.title; 
    let artist = req.body.artist; 
    let genre = req.body.genres;
    let album = req.body.album; 

    try {
        var result = await model.addSong(title, artist, genre, album, req.cookies.userId);
        if (result == true) {
            let message = `Song [${title}] was successfully added`;

            let tracker = manageTracker(req);
            let session = await manageSession(req);
            if(session){
                res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
            }
            res.cookie("tracker", JSON.stringify(tracker));

            res.render('add.hbs', addFormDetails(message, undefined, true, req));
        }
    }
    catch (error) {
        let errorMessage;
        if (error instanceof InvalidInputError) { res.status(400); errorMessage = "Error 400"; }
        if (error instanceof DatabaseError) { res.status(500); errorMessage = "Error 500 "; } else { errorMessage = "" }
        res.render('add.hbs', addFormDetails(errorMessage + error.message, true, undefined, req))
    }
}
router.post('/song', add)

async function showAddForm(req, res) {
    let tracker = manageTracker(req);
    let session = await manageSession(req);
    if(session){
        res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
    }
    res.cookie("tracker", JSON.stringify(tracker));
    res.render('add.hbs', addFormDetails(undefined, undefined, undefined, req));
}

//#endregion

//#region allSongs
/**
 * This function is called, after the endpoint /songs is reached.
 * This function renders the all hbs view, sending in all the songs
 * So the view can display it as a table.
 * If an error occurs, it renders home page with an error message
 * @param {*} req 
 * @param {*} res 
 */
async function allSongs(req, res) {
    try {
        lightTheme=isLightTheme(req);

        var song = await model.getAllSongs(req.cookies.userId);

        let tracker = manageTracker(req);
        let session = await manageSession(req);
        if(session){
            res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
        }
        res.cookie("tracker", JSON.stringify(tracker));
    
        res.render('all.hbs', { icon: "images/favicon.ico", song, logged: true, light: lightTheme, username: req.cookies.username });
    } catch (error) {
        let errorMessage;
        if (error instanceof DatabaseError) { res.status(500); errorMessage = "Error 500, The songs were not retrieved:"; } else { errorMessage = "" }

        errorMessage += error.message;
        let obj = { showError: true, message: errorMessage, light: lightTheme, logged: true, username: req.cookies.username };
        res.render('home.hbs', obj);
    }
}
router.get('/songs', allSongs)
//#endregion


//#region GET song

async function getSong(req, res) {
    let targetTitle = req.query.title;
    let targetArtist = req.query.artist;

    // try{
    //     let {title, artist, genre, album} = await model.getOneSong(userId, targetTitle, targetArtist);
    try {
        let { title, artist, genre, album } = await model.getOneSong( req.cookies.userId, targetTitle, targetArtist);

        let message = "Succesfully retrieved the song from your collection.";
        let song = {
            title: title,
            artist: artist,
            genre: genre,
            album: album
        };

        let tracker = manageTracker(req);
        let session = await manageSession(req);
        
        if(session){
            res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
        }

        res.cookie("tracker", JSON.stringify(tracker));    
        res.render('getOne.hbs', getFormDetails(message, false, true, song, req));

    } catch (error) {
        if (error instanceof InvalidInputError) {
            res.status(404);
            res.render('getOne.hbs', getFormDetails("404 Error: " + error.message, true, false, undefined, req));
        }
        else if (error instanceof DatabaseError) {
            res.status(500);
            res.render('getOne.hbs', getFormDetails("500 Error: " + error.message, true, false, undefined, req));
        }
    }
}
router.get('/song', getSong);

async function getOneForm(req, res) {
    let tracker = manageTracker(req);
    let session = await manageSession(req);
    if (session) {
        res.cookie("sessionId", session.sessionId, { expires: session.closesAt });
    }
    res.cookie("tracker", JSON.stringify(tracker));
    res.render('getOne.hbs', getFormDetails(undefined, undefined, undefined, undefined, req));
}
//#endregion


//#region EDIT song
async function editSong(req, res) {
    let oldTitle = req.body.oldTitle;
    let oldArtist = req.body.oldArtist;
    let newTitle = req.body.newTitle;
    let newArtist = req.body.newArtist;
    let newGenre = req.body.newGenre;
    let newAlbum = req.body.newAlbum;

    try {
        await model.updateSong(req.cookies.userId, oldTitle, oldArtist, newTitle, newArtist, newGenre, newAlbum);
        let message = `Successfully replaced ${oldTitle} by ${oldArtist} with ${newTitle} by ${newArtist}`;

        let tracker = manageTracker(req);
        let session = await manageSession(req);
        if(session){
            res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
        }
        res.cookie("tracker", JSON.stringify(tracker));

        res.render('edit.hbs', editFormDetails(message, false, true, {
            title: newTitle,
            artist: newArtist,
            
            genre: newGenre,
            album: newAlbum
        }, req));
    } catch (error) {
        if (error instanceof InvalidInputError) {
            res.status(404);
            // RENDER NOT FINALIZED YET.
            let message = `404 Error: Could not update ${oldTitle} by ${oldArtist}: ` + error.message;

            res.render('edit.hbs', editFormDetails(message, true, undefined, undefined, req));
        }
        else if (error instanceof DatabaseError) {
            // RENDER NOT FINALIZED YET.

            res.status(500);
            let message = "500 Error: Problem accessing database: " + error.message;
            res.render('edit.hbs', editFormDetails(message, true, undefined, undefined, req));
        }

    }
}
router.put('/song', editSong);

async function editForm(req, res) {
    // if(!req.cookies.tracker){
    //     let tracker = createTracker("Bob", req);
    //     res.cookie("tracker", JSON.stringify(tracker));
    // }
    // else{
    //     let tracker = JSON.parse(req.cookies.tracker);
    //     let updatedTracker = updateTracker(tracker, req);
    //     if(updatedTracker != null){
    //         res.cookie("tracker", JSON.stringify(updatedTracker));
    //     }
    // }
    let tracker = manageTracker(req);
    let session = await manageSession(req);
    if (session) {
        res.cookie("sessionId", session.sessionId, { expires: session.closesAt });
    }
    res.cookie("tracker", JSON.stringify(tracker));
    res.render('edit.hbs', editFormDetails(undefined, undefined, undefined, undefined, req));
}

// function showEditForm(res) {
//     res.render('edit.hbs', editFormDetails());
// }
//#endregion

//#region DELETE song
async function deleteOneSong(req, res) {
    let title = req.body.title;
    let artist = req.body.artist;
    lightTheme=isLightTheme(req);

    try {
        const deletedSong = await model.deleteSong(req.cookies.userId, title, artist);

        let tracker = manageTracker(req);
        let session = await manageSession(req);
        if(session){
            res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
        }
        res.cookie("tracker", JSON.stringify(tracker));

        res.render('delete.hbs', deleteFormDetails(`Successfully removed ${title} by ${artist} from your collection.`, false, true, deletedSong, req));
    } catch (error) {
        if (error instanceof InvalidInputError) {
            res.status(404);
            // RENDER NOT FINALIZED YET.
            let message = `404 Error: Could not delete ${title} by ${artist}: ` + error.message;

            res.render('delete.hbs', deleteFormDetails(message, true, undefined, undefined, req));
        }
        else if (error instanceof DatabaseError) {
            // RENDER NOT FINALIZED YET.

            res.status(500);
            let message = "500 Error: Problem accessing database: " + error.message;
            res.render('delete.hbs', deleteFormDetails(message, true, undefined, undefined, req));
        }
    }
}

router.delete('/song', deleteOneSong);

async function deleteForm(req, res){

    let tracker = manageTracker(req);
    let session = await manageSession(req);
    if (session) {
        res.cookie("sessionId", session.sessionId, { expires: session.closesAt });
    }
    res.cookie("tracker", JSON.stringify(tracker));
    res.render('delete.hbs', deleteFormDetails(undefined, undefined, undefined, undefined, req));

}
//#endregion

//#region Form Details
function addFormDetails(message, error, success, request) {
    // if user got to this point they should be logged in
    if (typeof (userId) != 'undefined') logged = true;
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;
    lightTheme=isLightTheme(request);
    return pageData = {
        icon: "images/favicon.ico",
        message: message,
        success: success,
        error: error,
        endpoint: "/song",
        method: "post",
        legend: "Enter details to add a song",
        formfields: [{ field: "title", pretty: "Title", required: "required" },
        { field: "artist", pretty: "Artist", required: "required" },
        { field: "album", pretty: "Album" }],
        genres: model.allGenres(),
        logged: true,
        username: request.cookies.username,
        light: lightTheme
    }
}
function getFormDetails(message, error, success, song, request) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;
    lightTheme=isLightTheme(request);

    return pageData = {
        icon: "images/favicon.ico",
        message: message,
        success: success,
        error: error,
        song: song,
        endpoint: "/song",
        method: "get",
        legend: "Search for a specific song by title and artist",
        formfields: [
            { field: "title", pretty: "Title" },
            { field: "artist", pretty: "Artist" }
        ],
        logged: true,
        username: request.cookies.username,
        light: lightTheme
    }
}
function editFormDetails(message, error, success, song, request) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;
    lightTheme=isLightTheme(request);

    return pageData = {
        icon: "images/favicon.ico",
        message: message,
        success: success,
        error: error,
        song: song,
        endpoint: "/song",
        method: "post",
        legend: "Edit or replace an existing song",
        formfields: [
            { field: "oldTitle", pretty: "Old Title", title: true },
            { field: "oldArtist", pretty: "Old Artist" },
            { field: "newTitle", pretty: "New Title" },
            { field: "newArtist", pretty: "New Artist" },
            // { field: "newGenre", pretty: "New Genre", genre: true },
            { field: "newAlbum", pretty: "New Album" }
        ],
        // titles: model.getAllTitles(1),
        newGenre: model.allGenres(),
        logged: true,
        light: lightTheme,
        username: request.cookies.username
    }

}
function deleteFormDetails(message, error, success, song, request) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;
    lightTheme=isLightTheme(request);

    return pageData = {
        icon: "images/favicon.ico",
        message: message,
        success: success,
        error: error,
        song: song,
        endpoint: "/song",
        method: "post",
        legend: "Delete a song from your collection",
        formfields: [
            { field: "title", pretty: "Title" },
            { field: "artist", pretty: "Artist" }
        ],
        logged: true,
        username: request.cookies.username,
        light: lightTheme
    }

}

//#endregion

function isLightTheme(req) {
    if (req.cookies.theme == "light")
        return true; 
    else 
        return false;
}

/** Show the appropriate form based on user choice */
async function showForm(request, response) {
    let choice = request.body.choice;
    if (typeof request.cookies.userId === "undefined" && choice !== "register" && choice !== "login" && choice !== "logout") {
        request.body.choice = 'login';
        let notLoggedIn = true;
        userController.showUserForm(request, response, notLoggedIn);
    }
    else {
        switch (request.body.choice) {
            case 'add':
                showAddForm(request, response);
                break;
            case 'show':
                getOneForm(request, response);
                break;
            case 'list':
                response.redirect('/songs');
                break;
            case 'edit':
                await editForm(request, response);
                break;
            case 'delete':
                await deleteForm(request, response);
                break;
            case 'register':
                userController.showUserForm(request, response);
                break;
            case 'login':
                userController.showUserForm(request, response);
                break;
            case 'profile':
                userController.showUserForm(request, response);
                break;
            case 'logout':
                userController.showUserForm(request, response);
                break;
            default:
                response.render('home.hbs');
        }
    }

}
router.post('/form', showForm);

module.exports = {
    router,
    routeRoot,
    user
}