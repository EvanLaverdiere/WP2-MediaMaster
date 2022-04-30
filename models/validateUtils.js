const validator = require('validator');
const bcrypt = require('bcrypt'); //TODO: Document that you've added bcrypt module.
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
    title = title.replaceAll(' ', '');

    return (genreTypes.includes(genre.toLowerCase()) 
    && typeof title === 'string' && title != null
    && typeof artist === 'string' && artist != null
    && validator.isAlphanumeric(title));
}

/**
 * Checks if the user exists in the database.
 * @param {*} username Username of user. Cannot be null.
 * @param {*} password Password of user. Cannot be null. Must be at least 7 characters long.
 * @returns True if the user's fields are valid, false otherwise.
 */
function authenticateUser(username, password){
    // TODO: Implement once getConnection has been implemented
}

/**
 * Verifies that username doesn't exist in database and that password is minimum 7 characters long.
 * @param {string} username Username of user. Must not already exist in the database.
 * @param {string} password Password of user. Must be at least 7 characters long.
 * @returns True if the username doesn't exist in the database. false otherwise.
 */
function validateUser(username, password){
    const minLength = 7;

    // TODO: Implement once getConnection has been implemented
    //create sql query to check db if username already exists in database
    let sqlquery;

    //execute query
    let rows;

    return password.length >= minLength && rows.length === 0;
}

module.exports = {
    validateSong,
    authenticateUser,
    validateUser
}