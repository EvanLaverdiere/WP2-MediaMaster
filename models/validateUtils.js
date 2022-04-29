const validator = require('validator');
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
 * @param {string} title Cannot be null. Must be of type string.
 * @param {string} artist Cannot be null. Must be of type string.
 * @param {string} genre Must be one of the types in the valid genres.
 * @returns True if the song's fields are valid, false otherwise
 */
function validateSong(title, artist, genre) {
    title = title.replaceAll(' ', '');

    return (genreTypes.includes(genre.toLowerCase()) 
    && typeof title === 'string' && title != null
    && typeof artist === 'string' && artist != null
    && validator.isAlpha(title));
}

/**
 * Validates the fields of a user
 * @param {*} username Must not already exist in the database.
 * @param {*} password Cannot be null.
 */
function validateUser(username, password){
    // TODO: Implement once getConnection has been implemented
    // Username must not already exist in db
    // Password min 7 characters (already done in view?)
}

module.exports = {
    validateSong,
    validateUser
}
