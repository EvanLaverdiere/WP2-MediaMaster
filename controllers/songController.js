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
let currentUserId; //TODO: Remove all dependencies and varaible
let currentUser;

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
    let userId = req.cookies.userId;
    let theme = req.cookies.theme;

    if (theme == "light") lightTheme = true; else lightTheme = false;
    try {
        var result = await model.addSong(title, artist, genre, album, userId);
        if (result == true) {
            let message = `Song [${title}] was successfully added`;

            let tracker = manageTracker(req);
            let session = await manageSession(req);
            if(session){
                res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
            }
            res.cookie("tracker", JSON.stringify(tracker));

            res.render('add.hbs', addFormDetails(message, undefined, true));
        }
    }
    catch (error) {
        let errorMessage;
        if (error instanceof InvalidInputError) { res.status(400); errorMessage = "Error 400"; }
        if (error instanceof DatabaseError) { res.status(500); errorMessage = "Error 500 "; } else { errorMessage = "" }
        res.render('add.hbs', addFormDetails(errorMessage + error.message, true))
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
    res.render('add.hbs', addFormDetails());
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
        let userId = req.cookies.userId;
        
        let theme = req.cookies.theme; if (theme == "light") lightTheme = true; else lightTheme = false;
        // If cookie is not set then redirect to login page
        var song = await model.getAllSongs(userId);

        let tracker = manageTracker(req);
        let session = await manageSession(req);
        if(session){
            res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
        }
        res.cookie("tracker", JSON.stringify(tracker));
    
        var song = await model.getAllSongs(currentUserId);
        res.render('all.hbs', { icon: "images/favicon.ico", song, logged: true, light: lightTheme, username: currentUser });
    } catch (error) {
        let errorMessage;
        if (error instanceof DatabaseError) { res.status(500); errorMessage = "Error 500, The songs were not retrieved:"; } else { errorMessage = "" }

        errorMessage += error.message;
        let obj = { showError: true, message: errorMessage, light: lightTheme, logged: true, username: currentUser };
        res.render('home.hbs', obj);
    }
}
router.get('/songs', allSongs)
//#endregion


//#region GET song

async function getSong(req, res) {
    let targetTitle = req.query.title;
    let targetArtist = req.query.artist;
    let userId = req.cookies.userId;
    let theme = req.cookies.theme; if (theme == "light") lightTheme = true; else lightTheme = false;

    // try{
    //     let {title, artist, genre, album} = await model.getOneSong(userId, targetTitle, targetArtist);
    try {
        let { title, artist, genre, album } = await model.getOneSong(userId, targetTitle, targetArtist);
        // RENDER NOT FINALIZED YET.
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

        res.render('getOne.hbs', getFormDetails(message, false, true, song));
    } catch (error) {
        if (error instanceof InvalidInputError) {
            res.status(404);
            // RENDER NOT FINALIZED YET.

            res.render('getOne.hbs', getFormDetails("404 Error: " + error.message, true, false));
        }
        else if (error instanceof DatabaseError) {
            // RENDER NOT FINALIZED YET.

            res.status(500);
            res.render('getOne.hbs', getFormDetails("500 Error: " + error.message, true, false));
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
    res.render('getOne.hbs', getFormDetails());
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
    let userId = req.cookies.userId;
    let theme = req.cookies.theme; if (theme == "light") lightTheme = true; else lightTheme = false;

    try {
        await model.updateSong(userId, oldTitle, oldArtist, newTitle, newArtist, newGenre, newAlbum);
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
        }));
    } catch (error) {
        if (error instanceof InvalidInputError) {
            res.status(404);
            // RENDER NOT FINALIZED YET.
            let message = `404 Error: Could not update ${oldTitle} by ${oldArtist}: ` + error.message;

            res.render('edit.hbs', editFormDetails(message, true));
        }
        else if (error instanceof DatabaseError) {
            // RENDER NOT FINALIZED YET.

            res.status(500);
            let message = "500 Error: Problem accessing database: " + error.message;
            res.render('edit.hbs', editFormDetails(message, true));
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
    res.render('edit.hbs', editFormDetails());
}

// function showEditForm(res) {
//     res.render('edit.hbs', editFormDetails());
// }
//#endregion

//#region DELETE song
async function deleteOneSong(req, res) {
    let title = req.body.title;
    let artist = req.body.artist;
    let theme = req.cookies.theme; if (theme == "light") lightTheme = true; else lightTheme = false;
    let userId = req.cookies.userId;

    try {
        const deletedSong = await model.deleteSong(userId, title, artist);

        let tracker = manageTracker(req);
        let session = await manageSession(req);
        if(session){
            res.cookie("sessionId", session.sessionId, {expires: session.closesAt});
        }
        res.cookie("tracker", JSON.stringify(tracker));

        res.render('delete.hbs', deleteFormDetails(`Successfully removed ${title} by ${artist} from your collection.`, false, true, deletedSong));
    } catch (error) {
        if (error instanceof InvalidInputError) {
            res.status(404);
            // RENDER NOT FINALIZED YET.
            let message = `404 Error: Could not delete ${title} by ${artist}: ` + error.message;

            res.render('delete.hbs', deleteFormDetails(message, true));
        }
        else if (error instanceof DatabaseError) {
            // RENDER NOT FINALIZED YET.

            res.status(500);
            let message = "500 Error: Problem accessing database: " + error.message;
            res.render('delete.hbs', deleteFormDetails(message, true));
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
    res.render('delete.hbs', deleteFormDetails());

}
//#endregion

//#region Form Details
function addFormDetails(message, error, success) {
    // if user got to this point they should be logged in
    if (typeof (userId) != 'undefined') logged = true;
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;
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
        username: currentUser,
        light: lightTheme
    }
}
function getFormDetails(message, error, success, song) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;

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
        username: currentUser,
        light: lightTheme
    }
}
function editFormDetails(message, error, success, song) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;

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
        username: currentUser
    }

}
function deleteFormDetails(message, error, success, song) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;

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
        username: currentUser,
        light: lightTheme
    }

}

//#endregion

/** Show the appropriate form based on user choice */
async function showForm(request, response) {
    let theme = request.cookies.theme; if (theme == "light") lightTheme = true; else lightTheme = false;
    if (typeof request.cookies.userId === "undefined" && request.body.choice !== "register" && request.body.choice !== "login") {
        request.body.choice = 'login';
        userController.showUserForm(request, response);
    }
    else {
        currentUserId = request.cookies.userId;
        currentUser = request.cookies.username;
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
            default:
                response.render('home.hbs');
        }
    }

}
// no valid choice made
router.post('/form', showForm);

module.exports = {
    router,
    routeRoot,
    user
}