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

            let message=`Song [${title}] was successfully added`;
            res.render('add.hbs',addFormDetails(message,undefined,true)); //TODO: send success message

        }
    }
    catch (error) {
        let errorMessage;
        if(error instanceof InvalidInputError){errorMessage="Error 400";}
        if(error instanceof DatabaseError){errorMessage="Error 500 ";}else{errorMessage=""}
        res.render('add.hbs', addFormDetails(errorMessage+error.message, true))
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


function addFormDetails(message,error,success) {
    if(typeof message === 'undefined')message =false;
    if(typeof error === 'undefined')error = false;
    if(typeof success != true)successMessage = false;
    return pageData = {
        message: message,
        success: success,
        error: error,
        endpoint: "/song",
        method: "post",
        legend: "Enter details to add a song",
        formfields: [{ field: "title", pretty: "Title" },
        { field: "artist", pretty: "Artist" },
        { field: "album", pretty: "Album", album:true }],
        genres:model.allGenres()
    }
}

//#endregion



async function allSongs(req, res) {
    try {
        var song = await model.getAllSongs(1);
        res.render('all.hbs',{song});
    } catch (error) {
        let message = "Error 500, The tasks were not retrieved:"+ error.message;
        let obj={showError:true, message:message}
        res.render('home.hbs',obj);
    }
}
router.get('/songs', allSongs)





async function getSong(req, res) {
    let targetTitle = req.query.title;
    let targetArtist = req.query.artist;
    let userId = 1;

    // try{
    //     let {title, artist, genre, album} = await model.getOneSong(userId, targetTitle, targetArtist);
    try {
        let { title, artist, genre, album } = await model.getOneSong(userId, targetTitle, targetArtist);
        // RENDER NOT FINALIZED YET.
        res.render('home.hbs', {
            message: "Succesfully retrieved the song from your collection.",
            song: {
                title: title,
                artist: artist,
                genre: genre,
                album: album
            }
        })
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

router.get('/song', getSong);

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

router.put('/song', editSong);

module.exports = {
    router,
    routeRoot
}