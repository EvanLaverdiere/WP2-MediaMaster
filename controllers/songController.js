const model = require('../models/songModelMySql.js')

const express = require('express');
const { json } = require('express/lib/response');
const res = require('express/lib/response');
const { request } = require('express');
const router = express.Router();
const routeRoot = '/';

async function add(req, res) {
    res.statusCode=200;

    let title = req.body.title;
    let artist = req.body.artist;
    let genre = req.body.genre;
    let album = req.body.album;

    try {
        var result = await model.addSong(title, artist, genre, album);
        if (result == true) {
            res.render('add.hbs',{
                message: 'Song successfully added'
            })
        }
    }
    catch (error) {
    }
}
router.post('/song', add)


async function allSongs(req, res) {
    res.statusCode=200;
    try {
        var rows = await model.getAllSongs();

        
    } catch (error) {
    }
}
router.get('/songs', allSongs)

async function getSong(req, res){
    let targetTitle = req.query.title;
    let targetArtist = req.query.artist;
    let userId = 1;

    // try{
    //     let {title, artist, genre, album} = await model.getOneSong(userId, targetTitle, targetArtist);
    try {
        let {title, artist, genre, album} = await model.getOneSong(userId, targetTitle, targetArtist);
        res.render()
    } catch (error) {
        
    }
    
}

router.get('/song', getSong);

module.exports = {
    router,
    routeRoot
}