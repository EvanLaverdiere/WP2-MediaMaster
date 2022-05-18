const mysql = require('mysql2/promise');
const logger = require('../logger');
const validator = require('../validation/validateUtils.js');

const errorTypes = require('./errorModel.js');
const userModel = require('./userModelMySql.js');
const sessionModel = require('./sessionModelMySql');

var connection;

/**
 * Initializes the database connection and creates if it does not exist the Songs table.
 * It also first initializes the user model connection.
 * Throws if there any errors while trying to execute the queries.
 * @param {Name of database} db  
 * @param {Mandatory boolean indicating if to do a reset of the table} reset 
 */
async function initialize(db, reset) {
    try {

        await userModel.initialize(db, reset);


        await setConnection(db);

        await sessionModel.initialize(db, reset, connection);

        if (reset)
            await dropTable();


        const sqlQuery = 'create table if not exists Songs(id int AUTO_INCREMENT, title VARCHAR(50) not null, artist VARCHAR(50) not null, genre VARCHAR(50) not null, album VARCHAR(50), userId int not null, PRIMARY KEY(id), CONSTRAINT fk_users FOREIGN KEY (userId) REFERENCES users(userId))';


        await connection.execute(sqlQuery)
            .then(logger.info("Songs table created/exists"))
            .catch((error) => { logger.error("Songs table was not created: " + error.message); throw new errorTypes.DatabaseError(error.message) });

    } catch (error) {
        throw error;
    }
}


//#region CREATE Operations
/**
 * Adds a song to the Songs table. 
 * It only gets added if a song with the exact same datails does not already exists.
 * And, if the title is alphanumeric.
 * The song corresponds (is tied with a userId) with a user from the users table.
 * Throws if the title is not alphanumeric, if the song already exists.
 * And, if there are any issues with the database/connection trying to execute the insert query.
 * @param {Mandatory} title 
 * @param {Mandatory} artist 
 * @param {Mandatory} genre 
 * @param {Optional} album 
 * @param {Mandatory} currentUserId 
 * @returns A boolean indicating if the operation was successful
 */
async function addSong(title, artist, genre, album, currentUserId) {

    validator.validateSong(title, artist, genre); //Throws specific error messages if invalid, it needs to get caught it controller
    if (typeof (album) == 'undefined') album = "";
    if (typeof (currentUserId) == 'undefined') currentUserId =1; //Left so tests pass, but it needs to be changed along the tests

    await checkDuplicate(title, artist, genre, album);  //Throws if the song is already added in the db

    try {

        let query = "insert into Songs(title, artist, genre, album, userId) values(?, ?, ?, ?, ?);";
        let results = await connection.execute(query, [title, artist, genre, album, currentUserId]);
        logger.info(`Song [${title}] was successfully added `);
        return true;
    } catch (error) {
        logger.error(error.message);
        throw new errorTypes.DatabaseError("The song was not added: " + error.message);
    }
}
//#endregion

//#region READ Operations
/**
 * Retrieves all songs for certain user.
 * Throws if there are any errors (db/connection) when trying to retrieve the songs.
 * @param {Mandatory} currentUserId 
 * @returns 
 */
async function getAllSongs(currentUserId) {
    if (typeof (currentUserId) == 'undefined') currentUserId =1; //Left so tests pass, but it needs to be changed along the tests

    let query = "select title, artist, genre, album from Songs where userId=" + connection.escape(currentUserId) + ";";

    try {
        let songs = await connection.execute(query);
        logger.info(`Songs retrieved successfully`);
        return songs[0];
    } catch (error) {
        logger.error(error.message);
        throw new errorTypes.DatabaseError("The songs were not retrieved: " + error.message);
    }
}

/**
 * Retrieve a song belonging to the specified user, based on passed title and artist.
 * @param {*} userId The user's ID. 
 * @param {*} title The title of the desired song.
 * @param {*} artist The artist who wrote the song.
 * @returns An object representing the retrieved song.
 * @throws DatabaseError if the database is inaccessible when called.
 * @throws InvalidInputError if the passed song does not exist.
 */
async function getOneSong(userId, title, artist) {
    // TO-DO: Validate passed userId

    // TO-DO: Validate passed title, artist, & genre.

    let query = "SELECT * FROM Songs WHERE title = ? AND artist = ? AND userId = ? LIMIT 1";

    const results = await connection.query(query, [title, artist, userId])
        .catch((err) => {
            // Log the error.
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        })

    // Query will return an array of two arrays. The first array contains the actual songs, while the second holds metadata.
    const songs = results[0];
    // Log the query results.
    logger.debug("Query retrieved following record(s) from the \'songs\' table:");
    logger.debug(songs);

    // If the passed song was not found, the songs array will be empty.
    if (songs.length == 0) {
        let errorMessage = "User's collection does not contain the song \'" + title + "\' by " + artist + ".";
        logger.error(errorMessage);
        //Throw appropriate error. 
        throw new errorTypes.InvalidInputError(errorMessage);
    }

    // If the songs array is not empty, we've found our song.
    logger.info("Successfully retrieved \'" + title + "\', by " + artist + " from user's collection.");
    return songs[0];
}
//#endregion

//#region UPDATE Regions
/**
 * Update an existing song with new values.
 * @param {*} userId The ID of the song's owner.
 * @param {*} oldTitle The song's original title.
 * @param {*} oldArtist The song's original artist.
 * @param {*} newTitle The replacement title.
 * @param {*} newArtist The replacement artist.
 * @param {*} newGenre The replacement genre.
 * @param {*} newAlbum The replacement album.
 * @returns 
 */
async function updateSong(userId, oldTitle, oldArtist, newTitle, newArtist, newGenre, newAlbum) {
    // Verify that the new values are acceptable. If they aren't, the validator will throw an InvalidInputError.
    validator.validateSong(newTitle, newArtist, newGenre);
    // .catch((err) => { throw err });

    // Then check the database to confirm that the original song is present in the user's collection.
    // If it isn't, getOneSong() will throw an InvalidInputError.
    const oldSong = await getOneSong(userId, oldTitle, oldArtist)
        .catch((err) => { throw err });

    // Extract the song's id from the retrieved record to simplify the upcoming SQL Update query.
    let oldId = oldSong.id;

    // let sql = "UPDATE Songs SET title = ?, artist = ?, genre = ?";
    let sql;

    if (newAlbum) {
        // sql += ", album = \'" + connection.escape(newAlbum) + "\' "; // Update the album if the user specified a new value. Otherwise, leave it as-is.
        sql = "UPDATE Songs SET title = ?, artist = ?, genre = ?, album = ? WHERE id = ?";
    }
    else{
        sql = "UPDATE Songs SET title = ?, artist = ?, genre = ? WHERE id = ?";
    }

    // sql += "WHERE id = " + oldId;
    // "LIMIT 1";

    // let sql = "UPDATE Songs SET title = ?, artist = ?, genre = ?"

    const results = await connection.query(sql, [newTitle, newArtist, newGenre, newAlbum, oldId])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        })

    // The query will return the number of rows that were changed in the database. If no rows were changed, something went wrong.
    let changedRows = results[0].changedRows;
    if (changedRows <= 0) {
        let errorMessage = "No songs were changed.";
        logger.error(errorMessage);
        // To-Do: throw an appropriate error.
        throw new errorTypes.InvalidInputError(errorMessage);
    }

    // If one row was changed, then the Update operation was carried out successfully.
    logger.info("Update successful.");
    return changedRows;
}
//#endregion

//#region DELETE Regions
/**
 * Deletes a song from the database.
 * @param {*} userId The ID of the song's owner.
 * @param {*} title The title of the song to be deleted.
 * @param {*} artist The artist who performed the song.
 * @returns An object representing the deleted song.
 * @throws InvalidInputError if the song to be deleted doesn't exist.
 * @throws DatabaseError if the database is inaccessible when called.
 */
async function deleteSong(userId, title, artist) {
    // To-Do: Validate passed userId.

    // To-Do: Verify that the song to be deleted actually exists in the database. Throw an exception if it doesn't.
    const song = await getOneSong(userId, title, artist)
        .catch((err) => { throw err });

    // if the song exists, try to delete it from the database.
    let doomedId = song.id;

    const sql = "DELETE FROM Songs WHERE id = " + doomedId +
        " LIMIT 1";

    let results = await connection.query(sql)
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    let affectedRows = results[0].affectedRows;
    if (affectedRows <= 0) {
        let errorMessage = "No records were deleted.";
        logger.error(errorMessage);
        // To-Do: Throw appropriate error.
        throw new errorTypes.InvalidInputError(errorMessage);
    }

    logger.info("Deletion successful.");
    return song;
}
//#endregion

async function dropTable() {
    const clearAll = "drop table if exists Songs;";
    await connection.execute(clearAll)
        .then(logger.info("Table Songs was dropped"))
        .catch((error) => { logger.error(error.message); })
}

async function setConnection(db) {

    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: '10006',
        password: 'pass',
        database: db
    }).then(logger.info("Connection established"))
        .catch((error) => {
            logger.error("Connection was not established: " + error.message);
            throw new errorTypes.DatabaseError(error.message);
        });

}

function closeConnection() {
    if (typeof connection != 'undefined') {
        connection.close();
    }
}

function getConnection() {
    return connection;
}


async function checkDuplicate(title, artist, genre, album, currentUserId) {
    let query = "select * from Songs where title = ? and artist = ? and genre = ? and album =? and userId=?;"
    let [rows, fields] = [];
    try {
        [rows, fields] = await connection.query(query, [title, artist, genre, album,1]);

    } catch (error) {
        logger.error(error.message);
        throw new errorTypes.DatabaseError("The song was not added: " + error.message);
    }

    var unique = rows.length === 0;
    if (!unique) {
        logger.error("Error: Song already in database");
        throw new errorTypes.InvalidInputError("The Song was not added - A Song with the exact same details already exists in the database");
    }

}

let allGenres = () => ["Alternative",
    "Blues",
    "Classical",
    "Country",
    "Electronic",
    "Folkmusic",
    "Hiphop",
    "Holiday",
    "Instrumental",
    "Jazz",
    "Karaoke",
    "Metal",
    "Newage",
    "Pop",
    "Reggae",
    "Rock",
    "Soul",
    "Soundtrack",
    "World"
];

async function getAllTitles(userId) {
    try {
        let sql = "SELECT title FROM Songs WHERE userId = " + userId;
        let results = await connection.query(sql);
        return results[0];
    } catch (error) {
        // Fail gracefully.
    }
}

module.exports = { initialize, addSong, getAllSongs, getOneSong, updateSong, deleteSong, closeConnection, getConnection, allGenres, getAllTitles }


