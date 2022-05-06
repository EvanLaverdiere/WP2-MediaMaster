const model = require('../models/songModelMySql.js')

const express = require('express');
const { json } = require('express/lib/response');
const res = require('express/lib/response');
const { request } = require('express');
const { InvalidInputError, DatabaseError } = require('../models/errorModel.js');
const router = express.Router();
const routeRoot = '/';

//#region ADD Endpoints
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
    let title = req.body.title; let artist = req.body.artist; let genre = req.body.genres; let album = req.body.album;
    try {
        var result = await model.addSong(title, artist, genre, album);
        if (result == true) {
            let message = `Song [${title}] was successfully added`;
            res.render('add.hbs', addFormDetails(message, undefined, true)); //TODO: send success message
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

/**
 * End point reached after user clicks in the navbar the add button.
 * This endpoint calls the addform function which renders an add form to add a song.
 * Sending some details for the creation of the form.
 * Such as endpoint, method, fields for adding a song, and all the genres
 * @param {*} req 
 * @param {*} res 
 */
function addForm(req, res) {
    res.render('add.hbs', addFormDetails());
}
router.get('/addForm', addForm)


function addFormDetails(message, error, success) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;
    return pageData = {
        message: message,
        success: success,
        error: error,
        endpoint: "/song",
        method: "post",
        legend: "Enter details to add a song",
        formfields: [{ field: "title", pretty: "Title" },
        { field: "artist", pretty: "Artist" },
        { field: "album", pretty: "Album", album: true }],
        genres: model.allGenres()
    }
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
        var song = await model.getAllSongs(1);
        res.render('all.hbs', { song });
    } catch (error) {
        let message = "Error 500, The tasks were not retrieved:" + error.message;
        let obj = { showError: true, message: message }
        res.render('home.hbs', obj);
    }
}
router.get('/songs', allSongs)
//#endregion





async function getSong(req, res) {
    let targetTitle = req.query.title;
    let targetArtist = req.query.artist;
    let userId = 1;

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

function getOneForm(req, res) {
    res.render('getOne.hbs', getFormDetails());
}

router.get('/getOne', getOneForm)

function getFormDetails(message, error, success, song) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;

    return pageData = {
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
        ]
    }
}

async function editSong(req, res) {
    let oldTitle = req.body.oldTitle;
    let oldArtist = req.body.oldArtist;
    let newTitle = req.body.newTitle;
    let newArtist = req.body.newArtist;
    let newGenre = req.body.newGenre;
    let newAlbum = req.body.newAlbum;
    let userId = 1;

    try {
        let changedRows = await model.updateSong(1, oldTitle, oldArtist, newTitle, newArtist, newGenre, newAlbum);
        let message = `Successfully replaced ${oldTitle} by ${oldArtist} with ${newTitle} by ${newArtist}`;
        res.render('home.hbs', {});
    } catch (error) {
        if (error instanceof InvalidInputError) {
            res.status(404);
            // RENDER NOT FINALIZED YET.

            res.render('home.hbs', {

            });
        }
        else if (error instanceof DatabaseError) {
            // RENDER NOT FINALIZED YET.

            res.status(500);
            res.render('home.hbs', {});
        }

    }
}

function editForm(req, res) {
    res.render('edit.hbs', editFormDetails());
}

router.get('/edit', editForm);

function editFormDetails(message, error, success, song) {
    if (typeof message === 'undefined') message = false;
    if (typeof error === 'undefined') error = false;
    if (typeof success != true) successMessage = false;

    return pageData = {
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
            { field: "newGenre", pretty: "New Genre", genre: true },
            { field: "newAlbum", pretty: "New Album" }
        ],
        titles: model.getAllTitles(1),
        genres: model.allGenres()
    }

}

router.put('/song', editSong);

module.exports = {
    router,
    routeRoot
}