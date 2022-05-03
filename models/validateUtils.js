const validator = require('validator');
const model = require('./userModelMySql.js');
const errorTypes = require('./errorModel.js');

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
 * @returns True if the user's fields are valid, false otherwise.
 */
async function authenticateUser(username, password, connection) {

    //create sql query to check db if username already exists in database
    const sqlQuery = "SELECT username, password FROM users WHERE username = "
        + connection.escape(username) + " AND password = "
        + connection.escape(password);

    //execute query
    const rows = await connection.execute(sqlQuery);

    return rows[0].length == 1;
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
async function validateUniqueUser(username, connection){

    //create sql query to check db if username already exists in database
    const sqlQuery = "SELECT username FROM users WHERE username = "
        + connection.escape(username)

    //execute query
    const [rows, fields] = await connection.execute(sqlQuery);

    return rows.length == 0;
}

module.exports = {
    validateSong,
    authenticateUser,
    validatePassword,
    validateUniqueUser
}
