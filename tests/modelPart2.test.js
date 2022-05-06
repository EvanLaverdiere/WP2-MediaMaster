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

//#region Model GET tests
test("songsModel.getOneSong() can retrieve a valid song belonging to a valid user", async () => {
    logger.debug("RUNNING TEST: \'songsModel.getOneSong() can retrieve a valid song belonging to a valid user\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    await usersModel.addUser(username, password);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Try to retrieve that song's record from the database.
    const getResult = await songsModel.getOneSong(1, title, artist);

    // Verify that the retrieved record's values match those that were passed to addSong().
    expect(getResult.title === title).toBe(true);
    expect(getResult.artist === artist).toBe(true);
    expect(getResult.userId === 1).toBe(true);

    // Query the database directly to confirm.
    const connection = songsModel.getConnection();
    const query = "SELECT * FROM Songs WHERE userId = 1";
    const [records, metadata] = await connection.query(query);

    // Query should produce an array containing all records from the Songs table belonging to the specified user.
    expect(Array.isArray(records)).toBe(true);

    // There should only be one record in the array.
    expect(records.length).toBe(1);

    // The record's fields should also match what was passed to the addSong() function.
    expect(records[0].title === title).toBe(true);
    expect(records[0].artist === artist).toBe(true);
    expect(records[0].userId === 1).toBe(true);

    logger.debug("TEST PASSED.");
})

test("songsModel.getOneSong() cannot retrieve a song which does not exist", async () => {
    logger.debug("RUNNING TEST: \'songsModel.getOneSong() cannot retrieve a song which does not exist\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    await usersModel.addUser(username, password);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Try to retrieve a song which does not exist from the database.
    // Should throw an InvalidInputError.
    const badTitle = "Ballad of Garply";
    await expect(async () => {
        await songsModel.getOneSong(1, badTitle, artist);
    }).rejects.toThrowError(errorTypes.InvalidInputError);

    logger.debug("TEST PASSED.");
})

test("songsModel.getOneSong() doesn't crash if the database is inaccessible", async () => {
    logger.debug("RUNNING TEST: \'songsModel.getOneSong() doesn't crash if the database is inaccessible\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    await usersModel.addUser(username, password);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Close the database connection.
    const connection = songsModel.getConnection();
    await connection.close();

    // Attempt to retrieve the song using getOneSong(). Should throw a DatabaseError.
    await expect(async () => {
        await songsModel.getOneSong(1, title, artist);
    }).rejects.toThrowError(errorTypes.DatabaseError);

    logger.debug("TEST PASSED.");
})
//#endregion