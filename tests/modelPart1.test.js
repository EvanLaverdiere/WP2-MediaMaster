const app = require('../app');
const supertest = require('supertest');
const testRequest = supertest(app);

const testDb = "mediamaster_db_test";
const songsModel = require('../models/songModelMySql');
const usersModel = require('../models/userModelMySql');

const logger = require('../logger');

beforeEach(async () => {
    await songsModel.initialize(testDb, true);
    await usersModel.addUser("Paco","Paquito123");
});

afterEach(async () => {
    connection = songsModel.getConnection();
    if (connection) {
        await connection.close();
    }
});
const songData = [
    { title: "Remember everything", artist: "Five Finger Death Punch", genre: "Rock", album:"" },
    { title: "I Apologize", artist: "Five Finger Death Punch", genre: "Rock", album: "" },
    { title: "Fade to black", artist: "Metallica", genre: "Heavy Metal", album: "" },
    { title: "No saben como vivo", artist: "Dollar Selmouni, JC Reyes", genre: "Latin Urbano", album: "" },
    { title: "Ella", artist: "Many", genre: "Latin",album:"" },
    { title: "Mirame", artist: "Many", genre: "Latin Urban",album:"" },
    { title: "The Day that Never Comes", artist: "Metallica", genre: "Heavy metal",album:"" }
]

const generateRandomSongSlice = () => {
    const index = Math.floor((Math.random() * songData.length));
    return songData.slice(index, index + 1)[0];
}
const generateRandomSongSplice = () => {
    return songData.splice(0,1);
}
test("Model:  Success - Add", async () => {
    let song = generateRandomSongSlice();

    let validAdd = await songsModel.addSong(song.title, song.artist, song.genre, song.album);

    await expect(validAdd).toEqual(true);

    let songAdded = await songsModel.getOneSong(1, song.title, song.artist);

    await expect(songAdded.title).toBe(song.title);
    await expect(songAdded.artist).toBe(song.artist);
    await expect(songAdded.genre).toBe(song.genre);
    await expect(songAdded.album).toBe(song.album);
})


test("Model: Success - Add - Many Songs", async () => {
    let originalSongDataLength=songData.length;
    await expect((await songsModel.getAllSongs()).length).toBe(0);
    for (let i = 0; i < originalSongDataLength; i++) {
        let song = generateRandomSongSplice()[0];
       await expect(await songsModel.addSong(song.title, song.artist, song.genre, song.album)).toBe(true);
    }
    
    await expect((await songsModel.getAllSongs(1)).length).toBe(originalSongDataLength);
})
//Test crash duplicates
//Test crash add invalid title /*/