

function getOneSong(userId, title, artist, genre, album) {
    // TO-DO: Validate that passed userId
    
    const query = 'SELECT * FROM songs ' +
        'WHERE title = \'' + title + '\' ' +
        'AND artist = \'' + artist + '\' ' +
        'AND genre = \'' + genre + '\' ' +
        'AND userId = ' + userId;

    
}

//#region UPDATE Operations
function updateSong() { }
//#endregion

//#region DELETE Operations
function deleteSong() { }
//#endregion