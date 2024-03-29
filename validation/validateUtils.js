const validator = require('validator');
const model = require('../models/userModelMySql');
const errorTypes = require('../models/errorModel');
const bcrypt = require('bcrypt'); //TODO: Document that you've added bcrypt module.
const logger = require('../logger.js');
const genreTypes = [
    "alternative",
    "blues",
    "classical",
    "country",
    "electronic",
    "folkmusic",
    "hiphop",
    "holiday",
    "instrumental",
    "jazz",
    "karaoke",
    "metal",
    "newage",
    "pop",
    "reggae",
    "rock",
    "soul",
    "soundtrack",
    "world"
]

/**
 * Validates the mandatory fields of a song.
 * @param {string} title Title of song. Cannot be null. Must be of type string.
 * @param {string} artist Artist of song. Cannot be null. Must be of type string.
 * @param {string} genre Genre of song. Must be one of the types in the valid genres.
 * @returns True if the song's fields are valid, false otherwise
 */
function validateSong(title, artist, genre) {
    title = title.replace(/ /g, '');
    let notAdded = "The song was not added: ";
    
    //Not checking if the genre matches since user is not actually typing in a genre, we provide them
    //Not checking if is string type since whatever the user types in, is considered as string
    //Not checking if is null since, user cannot send nulls

    if(!(validator.isAlphanumeric(title)))
        throw new errorTypes.InvalidInputError(notAdded+" the title can only contains letters and/or numbers")


    // return (genreTypes.includes(genre.toLowerCase())
    //     && typeof title === 'string' && title != null
    //     && typeof artist === 'string' && artist != null
    //     && validator.isAlphanumeric(title));
}

/**
 * Checks if the user exists in the database.
 * @param {*} username Username of user. Cannot be null.
 * @param {*} password Password of user. Cannot be null. Must be at least 7 characters long.
 * @param {*} connection Connection to the database.
 * @returns True if the user's fields are valid, false otherwise.
 */
async function authenticateUser(username, password, connection) {

    try {
        const sqlQuery = "SELECT username FROM users WHERE username = "
        + connection.escape(username);

        const result = await connection.execute(sqlQuery);
        
        if(result[0].length == 0)
            throw new errorTypes.AuthenticationError("User not found in database");

        //create sql query to check db if username already exists in database
        const sqlQuery2 = "SELECT password FROM users WHERE username = "
            + connection.escape(username);

        //execute query
        const result2 = await connection.execute(sqlQuery2);

        if(await bcrypt.compare(password, result2[0][0].password)){
            return true;
        }

        return false;
    }
    catch(err){
        if(err instanceof errorTypes.AuthenticationError)
            throw err;

        logger.error(err);
        console.log(err);
        
        throw new errorTypes.DatabaseError("Something wrong happened in the database.");
    }

}

/**
 * Verifies that the password is minimum 7 characters long.
 * @param {string} password Password of user. Must be at least 7 characters long.
 * @returns True if the password is more or equal to 7 characters, false otherwise.
 */
function validatePassword(password) {
    const minLength = 7;

    return password.length >= minLength;
}

/**
 * Verifies that the user doesn't already exist in the database
 * @param {*} username Username of user. Must be unique.
 * @param {*} connection Connection to database.
 * @returns True if the username is unique, false otherwise.
 */
async function validateUniqueUser(username, connection) {
    try {
        //create sql query to check db if username already exists in database
        const sqlQuery = "SELECT username FROM users WHERE username = "
            + connection.escape(username)

        //execute query
        const [rows, fields] = await connection.execute(sqlQuery);
        return rows.length == 0;
    }
    catch (err) {
        console.log(err);
        throw new errorTypes.DatabaseError("Something wrong happened in the database.");
    }

}

module.exports = {
    validateSong,
    authenticateUser,
    validatePassword,
    validateUniqueUser
}
