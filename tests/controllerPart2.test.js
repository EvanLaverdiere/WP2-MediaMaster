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

test("songController.getSong() sends 404 response for invalid song", async () => {
    logger.debug("RUNNING TEST: \'songController.getSong() sends 404 response for invalid song\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Generate an invalid song.
    const badTitle = "Wannabe";
    const badArtist = "Spice Girls";
    logger.debug("Test generated following invalid song:");
    logger.debug({
        title: badTitle,
        artist: badArtist
    })

    // Send a GET request for this invalid song to the /song endpoint.
    logger.debug(`Sending a GET request to the /song endpoint with query parameters for title=${badTitle} and artist=${badArtist}...`);
    const testResponse = await testRequest.get(`/song?title=${badTitle}&artist=${badArtist}`);

    // Controller should send back a 404 response code.
    logger.debug(`Received a ${testResponse.status} response code from the songController.`);
    expect(testResponse.status).toBe(404);
    logger.debug("Correct status code received.");

    logger.debug("TEST PASSED.");
})

test("songController.getSong() sends 500 response for inaccessible database", async () => {
    logger.debug("RUNNING TEST: \'songController.getSong() sends 500 response for inaccessible database\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Close the connection.
    await connection.close();

    // Send a GET request for that song to the '/song' endpoint.
    logger.debug(`Sending a GET request to the /song endpoint with query parameters for title=${title} and artist=${artist}...`);
    const testResponse = await testRequest.get(`/song?title=${title}&artist=${artist}`);

    // Controller should send back a 500 response code.
    logger.debug(`Received a ${testResponse.status} response code from the songController.`);
    expect(testResponse.status).toBe(500);
    logger.debug("Correct status code received.");

    logger.debug("TEST PASSED.");

})
//#endregion

//#region Controller UPDATE Tests
test("songController.editSong() 200 success case test", async () => {
    logger.debug("RUNNING TEST: \'songController.editSong() 200 success case test\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated the following valid [original] song:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    });
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Generate a valid replacement song.
    const newTitle = "Fly Me To The Moon";
    const newArtist = "Frank Sinatra";
    const newGenre = "Jazz";
    const newAlbum = "It Might As Well Be Swing";
    logger.debug("Test generated the following replacement song:");
    logger.debug({
        title: newTitle,
        artist: newArtist,
        genre: newGenre,
        album: newAlbum
    });

    // Send a PUT request to the /song endpoint containing the titles, artists, genre, and album fields.
    logger.debug("Sending a PUT request to the /song endpoint with the following body parameters:");
    logger.debug({
        oldTitle: title,
        oldArtist: artist,
        newTitle: newTitle,
        newArtist: newArtist,
        newGenre: newGenre,
        newAlbum: newAlbum
    });
    const testResponse = await testRequest.put('/song')
        .send({
            oldTitle: title,
            oldArtist: artist,
            newTitle: newTitle,
            newArtist: newArtist,
            newGenre: newGenre,
            newAlbum: newAlbum
        });

    // Controller should send a 200 response.
    logger.debug(`Received a ${testResponse.status} response code from the songController.`);
    expect(testResponse.status).toBe(200);
    logger.debug("Correct status code received.");

    logger.debug("TEST PASSED.");

})

test("songController.editSong() sends 404 response for invalid new data", async () => {
    logger.debug("RUNNING TEST: \'songController.editSong() sends 404 response for invalid new data\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated the following valid [original] song:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    });
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Generate invalid replacement data.
    const badTitle = "Sp3c1@l_M3sS";
    const badArtist = "Vanilla Ice";
    const badGenre = "Rock";
    const badAlbum = "NOYB";
    logger.debug("Test generated following invalid replacement song:");
    logger.debug({
        title: badTitle,
        artist: badArtist,
        genre: badGenre,
        album: badAlbum
    })

    // Send a PUT request to the /song endpoint with this invalid replacement data.
    logger.debug("Sending a PUT request to the /song endpoint with the following body parameters:");
    logger.debug({
        oldTitle: title,
        oldArtist: artist,
        newTitle: badTitle,
        newArtist: badArtist,
        newGenre: badGenre,
        newAlbum: badAlbum
    });
    const testResponse = await testRequest.put('/song')
        .send({
            oldTitle: title,
            oldArtist: artist,
            newTitle: badTitle,
            newArtist: badArtist,
            newGenre: badGenre,
            newAlbum: badAlbum
        });

    // Controller should send back a 404 response.
    logger.debug(`Received a ${testResponse.status} response code from the songController.`);
    expect(testResponse.status).toBe(404);
    logger.debug("Correct status code received.");

    logger.debug("TEST PASSED.");


})

test("songController.editSong() sends 500 response when database is inaccessible", async () => {
    logger.debug("RUNNING TEST: \'songController.editSong() sends 500 response when database is inaccessible\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated the following valid [original] song:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    });
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Generate a valid replacement song.
    const newTitle = "Fly Me To The Moon";
    const newArtist = "Frank Sinatra";
    const newGenre = "Jazz";
    const newAlbum = "It Might As Well Be Swing";
    logger.debug("Test generated the following replacement song:");
    logger.debug({
        title: newTitle,
        artist: newArtist,
        genre: newGenre,
        album: newAlbum
    });

    // Close the connection.
    logger.debug("Closing connection...");
    await connection.close();
    logger.debug("Connection closed.");

    // Send a PUT request to the /song endpoint containing the titles, artists, genre, and album fields.
    logger.debug("Sending a PUT request to the /song endpoint with the following body parameters while connection is closed:");
    logger.debug({
        oldTitle: title,
        oldArtist: artist,
        newTitle: newTitle,
        newArtist: newArtist,
        newGenre: newGenre,
        newAlbum: newAlbum
    });
    const testResponse = await testRequest.put('/song')
        .send({
            oldTitle: title,
            oldArtist: artist,
            newTitle: newTitle,
            newArtist: newArtist,
            newGenre: newGenre,
            newAlbum: newAlbum
        });

    // Controller should send back a 500 response code.
    logger.debug(`Received a ${testResponse.status} response code from the songController.`);
    expect(testResponse.status).toBe(500);
    logger.debug("Correct status code received.");

    logger.debug("TEST PASSED.");

})
//#endregion

//#region Controller DELETE Tests
test("songController.deleteOneSong() 200 success case test", async () => {
    logger.debug("RUNNING TEST: \'songController.deleteOneSong() 200 success case test\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add them to the database.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated the following valid [original] song:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    });
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Send a DELETE request to the /song endpoint with body parameters for title and artist.
    logger.debug(`Sending a DELETE request to the /song endpoint with the following body parameters:`);
    logger.debug({
        title: title,
        artist: artist
    });
    testResponse = await testRequest.delete('/song')
        .send({
            title: title,
            artist: artist
        });

    // Controller should send back a 200 response code.
    logger.debug(`Received a ${testResponse.status} response code from the songController.`);
    expect(testResponse.status).toBe(200);
    logger.debug("Correct status code received.");

    logger.debug("TEST PASSED.");

})
//#endregion