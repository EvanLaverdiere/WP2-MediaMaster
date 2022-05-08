const app = require('../app');
const supertest = require('supertest');
const testRequest = supertest(app);
const errorTypes = require('../models/errorModel');

// Initialise the test database before each test.
const dbName = "mediamaster_db_test";
const songsModel = require('../models/songModelMySql');
const usersModel = require('../models/userModelMySql');
const logger = require('../logger');

beforeEach(async () => {
    try {
        await songsModel.initialize(dbName, true);
    }
    catch (error) {
        // Fail gracefully.
    }
});

// Close database after each test.
afterEach(async () => {
    connection = songsModel.getConnection();
    if (connection) {
        await connection.close();
    }
});

const userData = [
    { userId: 1, username: "Bob", password: "p@ssW0rD" },
    { userId: 2, username: "MusicLover95", password: "I_luv_songs" }
]

/* data to be used to generate random songs for testing. */
const songData = [
    { title: "Beat It", artist: "Michael Jackson", genre: "Pop", album: "Thriller" },
    { title: "The Girl is Mine", artist: "Michael Jackson", genre: "Pop", album: "Thriller" },
    { title: "Thriller", artist: "Michael Jackson", genre: "Pop", album: "Thriller" },
    { title: "Fly Like an Eagle", artist: "Seal", genre: "rhythm", album: "Space Jam" },
    { title: "My Girl", artist: "The Temptations", genre: "soul" },
    { title: "The Way You Do the Things You Do", artist: "The Temptations", genre: "soul" }
]

const generateUserData = () => {
    const index = Math.floor(Math.random() * userData.length);
    return userData.slice(index, index + 1)[0];
}

const generateSongData = () => {
    const index = Math.floor(Math.random() * songData.length);
    return songData.slice(index, index + 1)[0];
}

//#region Controller GET Tests
test("songController.getSong() 200 success case test", async () => {
    logger.debug("RUNNING TEST: \'songController.getSong() 200 success case test\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    // await usersModel.addUser(username, password);

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Send a GET request for that song to the '/song' endpoint.
    logger.debug(`Sending a GET request to the /song endpoint with query parameters for title=${title} and artist=${artist}...`);
    const testResponse = await testRequest.get(`/song?title=${title}&artist=${artist}`);

    // Controller should send back a 200 response code.
    logger.debug(`Received a ${testResponse.status} response code from the songController.`);
    expect(testResponse.status).toBe(200);
    logger.debug("Correct status code received.");

    logger.debug("TEST PASSED.");
})
//#endregion

//#region Controller UPDATE Tests

//#endregion

//#region Controller DELETE Tests

//#endregion