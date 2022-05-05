const model = require('../models/songModelMySql.js')

const express = require('express');
const { json } = require('express/lib/response');
const res = require('express/lib/response');
const { request } = require('express');
const { InvalidInputError, DatabaseError } = require('../models/errorModel.js');
const router = express.Router();
const routeRoot = '/';

async function add(req, res) {


    let title = req.body.title;
    let artist = req.body.artist;
    let genre = req.body.genre;
    let album = req.body.album;

    try {
        var result = await model.addSong(title, artist, genre, album);
        if (result == true) {

            res.render('add.hbs', {
                message: `Song [${title}] was successfully added`

            })
        }
    }
    catch (error) {
    }
}
router.post('/song', add)


async function allSongs(req, res) {
    res.statusCode = 200;
    try {
        var rows = await model.getAllSongs();


    } catch (error) {
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