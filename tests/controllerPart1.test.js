const app = require('../app');
const supertest = require('supertest');
const testRequest = supertest(app);

const dbName = "mediamaster_db_test";
const songsModel = require('../models/songModelMySql');
const usersModel = require('../models/userModelMySql');
var connection;
let songData;

beforeEach(async () => {
    await songsModel.initialize(dbName, true);
    await usersModel.addUser("Paco", "Paquito123");
    connection = songsModel.getConnection();
    songData = [
        { title: "Remember everything", artist: "Five Finger Death Punch", genre: "Rock", album: "" },
        { title: "I Apologize", artist: "Five Finger Death Punch", genre: "Rock", album: "" },
        { title: "Fade to black", artist: "Metallica", genre: "Heavy Metal", album: "" },
        { title: "No saben como vivo", artist: "Dollar Selmouni, JC Reyes", genre: "Latin Urbano", album: "" },
        { title: "Ella", artist: "Many", genre: "Latin", album: "" },
        { title: "Mirame", artist: "Many", genre: "Latin Urban", album: "" },
        { title: "The Day that Never Comes", artist: "Metallica", genre: "Heavy metal", album: "" }
    ]
});

afterEach(async () => {
    connection = songsModel.getConnection();
    if (connection) {
        await connection.close();
    }
});
const generateRandomSongSlice = () => {
    const index = Math.floor((Math.random() * songData.length));
    return songData.slice(index, index + 1)[0];
}
test("Controller: HOME /home success case", async () => {
    const response = await testRequest.get('/home');
    await expect(response.status).toBe(200);
});
test("Controller: HOME /home failure case", async () => {
    const response = await testRequest.get('/homee');
    await expect(response.status).toBe(404);
});
test("Controller: ERROR /error failure case", async () => {
    const response = await testRequest.get('/error');
    await expect(response.status).toBe(404);
});
test("Controller - POST - Success ", async () => {

    const response = await testRequest.post('/song').send({
        title: "BBunny",
        artist: "Chubby",
        genres:"Reggae"
    });
    await expect(response.status).toBe(200);
})

test("Controller - POST - Failure ", async () => {

    const response = await testRequest.post('/song').send({
        title: "BBun*ny",
        artist: "Chubby",
        genres:"Reggae"
    });
    await expect(response.status).toBe(400);
})
test("Controller - POST - Failure - Closed Connection", async () => {

    songsModel.getConnection().close()
    const response = await testRequest.post('/song').send({
        title: "k",
        artist: "Chubby",
        genres:"Reggae"
    });
    await expect(response.status).toBe(500);
    
})

test("Controller: GET /songs success case", async () => {
    let songs = generateRandomSongSlice();
    await songsModel.addSong(song.title, song.artist, song.genre, song.album);
    response = await testRequest.get('/songs');
    await expect(response.status).toBe(200);
});

test("Controller: GET /songs failure case - Closed Connection ", async () => {
    let song = generateRandomSongSlice();
    await songsModel.addSong(song.title, song.artist, song.genre, song.album);
    songsModel.getConnection().close()
    response = await testRequest.get('/songs');
    await expect(response.status).toBe(500);
});