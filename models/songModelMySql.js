const mysql = require('mysql2/promise');
const logger = require('../logger');
const validator = require('./validateUtils.js');

const errorTypes = require('./errorModel.js');
const userModel = require('./userModelMySql.js');

var connection;

async function initialize(db, reset) {
    try {

        await userModel.initialize(db, reset);
        

        await setConnection(db);

        if (reset)
            await dropTable();


        const sqlQuery = 'create table if not exists Songs(id int AUTO_INCREMENT, title VARCHAR(50) not null, artist VARCHAR(50) not null, genre VARCHAR(50) not null, album VARCHAR(50), userId int not null, PRIMARY KEY(id), CONSTRAINT fk_users FOREIGN KEY (userId) REFERENCES users(userId))';


        await connection.execute(sqlQuery)
            .then(logger.info("Songs table created/exists"))
            .catch((error) => { logger.error("Songs table was not created: " + error.message); throw new errorTypes.DatabaseError(error.message) });

        let y = await getAllSongs(1);
    } catch (error) {
        throw error;
    }
}


//#region CREATE Operations
async function addSong(title, artist, genre, album, currentUserId) {

    validator.validateSong(title, artist, genre); //Throws specific error messages if invalid, it needs to get caught it controller
    if (typeof (album) == 'undefined') album = "";

    await checkDuplicate(title, artist, genre, album);  //Throws if the song is already added in the db

    try {
        let query = "insert into Songs(title, artist, genre, album, userId) values(?, ?, ?, ?, ?);";
        let results = await connection.execute(query, [title, artist, genre, album, 1]);
        logger.info(`Song [${title}] was successfully added `);
        return true;
    } catch (error) {
        logger.error(error.message);
        throw new errorTypes.DatabaseError("The song was not added: " + error.message);
    }
}
//#endregion

//#region READ Operations
async function getAllSongs(currentUserId) {
    let query = "select title, artist, genre, album from Songs where userId="+connection.escape(currentUserId)+";";

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
 */
async function getOneSong(userId, title, artist) {
    // TO-DO: Validate passed userId

    // TO-DO: Validate passed title, artist, & genre.

    let query = "SELECT * FROM Songs " +
        'WHERE title = \'' + title + '\' ' +
        'AND artist = \'' + artist + '\' ' +
        'AND userId = ' + userId + ' ' +
        'LIMIT 1';

    const results = await connection.query(query)
        .catch((err) => {
            // Log the error.
            logger.error(err);
            throw new DBConnectionError(err);
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
        //To-Do: throw appropriate error. 
        throw new errorTypes.InvalidInputError(errorMessage);
    }

    // If the songs array is not empty, we've found our song.
    logger.info("Successfully retrieved \'" + title + "\', by " + artist + " from user's collection.");
    return songs[0];
}
//#endregion

//#region UPDATE Regions
async function updateSong(userId, oldTitle, oldArtist, newTitle, newArtist, newGenre, newAlbum) {
    const oldSong = await getOneSong(userId, oldTitle, oldArtist)
        .catch((err) => { throw err });

    let oldId = oldSong.id;

    const sql = "UPDATE Songs SET" +
        "title = \'" + newTitle + "\', " +
        "artist = \'" + newArtist + "\', " +
        "genre = \'" + newGenre + "\', ";

    if (newAlbum) {
        sql += "album = \'" + newAlbum + "\' ";
    }

    sql += "WHERE id = " + oldId + " " +
        "LIMIT 1";

    const results = await connection.query(sql)
        .catch((err) => {
            logger.error(err);
            // To-Do: throw an appropriate error.
        })

    let changedRows = results[0].changedRows;
    if (changedRows <= 0) {
        let errorMessage = "No songs were changed.";
        logger.error(errorMessage);
        // To-Do: throw an appropriate error.
    }

    logger.info("Update successful.");
    return changedRows;
}
//#endregion

//#region DELETE Regions
async function deleteSong(userId, title, artist) {
    // To-Do: Validate passed userId.

    // To-Do: Verify that the song to be deleted actually exists in the database. Throw an exception if it doesn't.
    const song = await getOneSong(userId, title, artist)
        .catch((err) => { throw err });

    // if the song exists, try to delete it from the database.
    let doomedId = song.id;

    // const sql = "DELETE FROM songs WHERE id = \'" + title + "\' " +
    //     "AND artist = \'" + artist + "\' " +
    //     "AND genre = \'" + genre + "\' ";

    // if (album) {
    //     sql += "AND album = \'" + album + "\' ";
    // }

    // sql += "AND userId = " + userId + " " +
    //     "LIMIT 1";

    const sql = "DELETE FROM Songs WHERE id = " + doomedId +
        "LIMIT 1";

    let results = await connection.query(sql)
        .catch((err) => {
            logger.error(err);
            // To-Do: Throw appropriate error.
            throw new DBConnectionError(err);
        });

    let affectedRows = results[0].affectedRows;
    if (affectedRows <= 0) {
        let errorMessage = "No records were deleted.";
        logger.error(errorMessage);
        // To-Do: Throw appropriate error.
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

function getConnection(){
    return connection;
}


async function checkDuplicate(title, artist, genre, album) {
    let query = "select * from Songs where title = ? and artist = ? and genre = ? and album =?;"
    let [rows, fields] = await connection.execute(query, [title, artist, genre, album])
        .catch((error) => { logger.error(error.message); throw new errorTypes.DatabaseError(error.message); });

    var unique = rows.length === 0;
    if (!unique) {
        logger.error("Error: Song already in database");
        throw new errorTypes.InvalidInputError("The Song was not added - A Song with the exact same details already exists in the database");
    }

}
module.exports = { initialize, addSong, getAllSongs, getOneSong, closeConnection, getConnection }

