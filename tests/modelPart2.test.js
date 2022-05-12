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
        // await usersModel.initialize(dbName, true);
        // await usersModel.addUser("MusicLover95", "I_luv_songs");
    }
    catch (error) {
        logger.error(error);
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
    // await usersModel.addUser(username, password);

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

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
    // const connection = songsModel.getConnection();
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
    // await usersModel.addUser(username, password);

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

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
    // await usersModel.addUser(username, password);

    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);

    // Close the database connection.
    // const connection = songsModel.getConnection();
    logger.debug("Closing connection...");
    await connection.close();
    logger.debug("Connection closed.");

    // Attempt to retrieve the song using getOneSong(). Should throw a DatabaseError.
    logger.debug(`Attempting to retrieve \'${title}\' from the Songs table while connection is closed...`);
    await expect(async () => {
        await songsModel.getOneSong(1, title, artist);
    }).rejects.toThrowError(errorTypes.DatabaseError);

    logger.debug("TEST PASSED.");
})
//#endregion

//#region Model UPDATE Tests
test("songsModel.updateSong() can update an existing song with valid new data", async () => {
    logger.debug("RUNNING TEST: \'songsModel.updateSong() can update an existing song with valid new data\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    logger.debug("Test generated following user:");
    logger.debug({
        username: username,
        password: password
    })
    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);
    logger.debug(`Successfully inserted \'${username}\' into users table.`);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated following [original] song:");
    logger.debug({
        oldTitle: title,
        oldArtist: artist,
        oldGenre: genre,
        oldAlbum: album
    })
    logger.debug("Attempting to insert song into Songs table...");
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);
    logger.debug("Insertion successful.");

    // Generate valid replacement data.
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

    // Attempt to replace the original song's data with this replacement data.
    logger.debug(`Attempting to replace \'${title}\' with \'${newTitle}\'...`);
    const updateResult = await songsModel.updateSong(1, title, artist, newTitle, newArtist, newGenre, newAlbum);

    // The model should return the number of rows changed in the database. The number should be 1.
    logger.debug(`Operation changed ${updateResult} records in the Songs table.`);
    expect(updateResult).toBe(1);
    logger.debug("Correct number of records changed.");

    // Query the database directly to confirm that the replacement took place.
    logger.debug("Querying database to confirm successful UPDATE operation...");
    const sql = "SELECT * FROM Songs WHERE userId = 1";
    const [records, metadata] = await connection.query(sql);

    // Query should produce an array containing a single record.
    logger.debug(`Query retrieved ${records.length} records from the Songs table.`);
    expect(records.length).toBe(1);
    logger.debug("Correct number of records retrieved.");

    // This record's values should match the generated replacement data.
    logger.debug("Verifying that retrieved record matches the replacement song...");
    expect(records[0].title === newTitle).toBe(true);
    expect(records[0].artist === newArtist).toBe(true);
    expect(records[0].genre === newGenre).toBe(true);
    expect(records[0].album === newAlbum).toBe(true);
    logger.debug("All fields match.");

    logger.debug("TEST PASSED.");
})

test("songsModel.updateSong() rejects invalid replacement data", async () => {
    logger.debug("RUNNING TEST: \'songsModel.updateSong() rejects invalid replacement data\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    logger.debug("Test generated following user:");
    logger.debug({
        username: username,
        password: password
    })
    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);
    logger.debug(`Successfully inserted \'${username}\' into users table.`);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated following [original] song:");
    logger.debug({
        oldTitle: title,
        oldArtist: artist,
        oldGenre: genre,
        oldAlbum: album
    })
    logger.debug("Attempting to insert song into Songs table...");
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);
    logger.debug("Insertion successful.");

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

    // Try to replace the original song with these bad values. Model should throw an InvalidInputError.
    logger.debug(`Attempting to replace \'${title}\' with \'${badTitle}\'...`);
    await expect(async () => {
        await songsModel.updateSong(1, title, artist, badTitle, badArtist, badGenre, badAlbum);
    }).rejects.toThrowError(errorTypes.InvalidInputError);

    logger.debug("TEST PASSED.");
})

test("songsModel.updateSong() doesn't crash when attempting to replace nonexistent song", async () => {
    logger.debug("RUNNING TEST: \'songsModel.updateSong() doesn't crash when attempting to replace nonexistent song\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    logger.debug("Test generated following user:");
    logger.debug({
        username: username,
        password: password
    })
    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);
    logger.debug(`Successfully inserted \'${username}\' into users table.`);

    // Generate valid replacement data without inserting a song first.
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

    // Attempt to replace the nonexistent song with this replacement data.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated following valid song without inserting it into the Songs table:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    });

    logger.debug(`Attempting to replace the nonexistent ${title} with ${newTitle}...`);
    await expect(async () => {
        await songsModel.updateSong(1, title, artist, newTitle, newArtist, newGenre, newAlbum);
    }).rejects.toThrowError(errorTypes.InvalidInputError);

    logger.debug("TEST PASSED.");

})

test("songsModel.updateSong() doesn't crash when database is inaccessible", async () => {
    logger.debug("RUNNING TEST: \'songsModel.updateSong() doesn't crash when database is inaccessible\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    logger.debug("Test generated following user:");
    logger.debug({
        username: username,
        password: password
    })
    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);
    logger.debug(`Successfully inserted \'${username}\' into users table.`);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated following [original] song:");
    logger.debug({
        oldTitle: title,
        oldArtist: artist,
        oldGenre: genre,
        oldAlbum: album
    })
    logger.debug("Attempting to insert song into Songs table...");
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);
    logger.debug("Insertion successful.");

    // Generate valid replacement data.
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

    // Close the database connection.
    logger.debug("Closing the connection...");
    await connection.close();
    logger.debug("Connection closed.");

    // Attempt to replace the original song with the new values. Should throw a DatabaseError.
    logger.debug(`Attempting to replace \'${title}\' with \'${newTitle}\' while the connection is closed...`);
    await expect(async () => {
        await songsModel.updateSong(1, title, artist, newTitle, newArtist, newGenre, newAlbum);
    }).rejects.toThrowError(errorTypes.DatabaseError);

    logger.debug("TEST PASSED.");


})
//#endregion

//#region Model DELETE Tests
test("songsModel.deleteSong() can delete an existing song", async () => {
    logger.debug("RUNNING TEST: \'songsModel.deleteSong() can delete an existing song\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    logger.debug("Test generated following user:");
    logger.debug({
        username: username,
        password: password
    })
    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);
    logger.debug(`Successfully inserted \'${username}\' into users table.`);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated following song:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    })
    logger.debug("Attempting to insert song into Songs table...");
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);
    logger.debug("Insertion successful.");

    // Attempt to delete the passed song from the database.
    logger.debug(`Attempting to delete ${title} from user's collection...`);
    const deleteResult = await songsModel.deleteSong(1, title, artist);
    logger.debug("Deleted the following record:");
    logger.debug(deleteResult);

    // Method should return an object representing the deleted song.
    logger.debug("Verifying that deleted record's fields match those of generated song...");
    expect(deleteResult.title === title).toBe(true);
    expect(deleteResult.artist === artist).toBe(true);
    expect(deleteResult.genre === genre).toBe(true);
    if (album) {
        expect(deleteResult.album === album).toBe(true);
    }
    logger.debug("All fields match.");

    // Query the database to confirm that the deletion took place.
    logger.debug("Querying database to confirm successful DELETE operation...");
    const sql = "SELECT * FROM Songs WHERE userId = 1";
    const [records, metadata] = await connection.query(sql);

    // Query should return an array of records with nothing in it.
    logger.debug(`Query produced ${records.length} records from the Songs table.`);
    expect(records.length).toBe(0);
    logger.debug("Correct number of records retrieved.");

    logger.debug("TEST PASSED.");

})

test("songsModel.deleteSong() cannot delete a nonexistent song", async () => {
    logger.debug("RUNNING TEST: \'songsModel.deleteSong() cannot delete a nonexistent song\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    logger.debug("Test generated following user:");
    logger.debug({
        username: username,
        password: password
    })
    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);
    logger.debug(`Successfully inserted \'${username}\' into users table.`);

    // Attempt to delete a song which hasn't been entered into the database yet.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated following song without inserting it into the database:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    });
    logger.debug(`Attempting to delete ${title} from user's collection...`);
    await expect(async () => {
        await songsModel.deleteSong(1, title, artist);
    }).rejects.toThrowError(errorTypes.InvalidInputError);

    logger.debug("TEST PASSED.");
})

test("songsModel.deleteSong() doesn't crash when database is inaccessible", async () => {
    logger.debug("RUNNING TEST: \'songsModel.deleteSong() doesn't crash when database is inaccessible\'.");

    // Generate a valid user and add them to the database.
    const { userId, username, password } = generateUserData();
    logger.debug("Test generated following user:");
    logger.debug({
        username: username,
        password: password
    })
    const connection = songsModel.getConnection();
    const userQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await connection.query(userQuery, [username, password]);
    logger.debug(`Successfully inserted \'${username}\' into users table.`);

    // Generate a valid song and add it to the database for that user.
    const { title, artist, genre, album } = generateSongData();
    logger.debug("Test generated following song:");
    logger.debug({
        title: title,
        artist: artist,
        genre: genre,
        album: album
    })
    logger.debug("Attempting to insert song into Songs table...");
    const addResult = await songsModel.addSong(title, artist, genre, album, 1);
    logger.debug("Insertion successful.");

    // Close the connection.
    logger.debug("Closing the connection...");
    await connection.close();
    logger.debug("Connection closed.");

    // Attempt to delete the song. Should throw a DatabaseError.
    logger.debug(`Attempting to delete ${title} from user's collection while connection is closed...`);
    await expect(async () => {
        await songsModel.deleteSong(1, title, artist);
    }).rejects.toThrowError(errorTypes.DatabaseError);

    logger.debug("TEST PASSED.");
})
//#endregion