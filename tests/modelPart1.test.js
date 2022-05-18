
const testDb = "mediamaster_db_test";
const songsModel = require('../models/songModelMySql');
const usersModel = require('../models/userModelMySql');
let connection;
const logger = require('../logger');
let songData;
beforeEach(async () => {
    await songsModel.initialize(testDb, true);
    await usersModel.addUser("Paco", "Paquito123");
    songData = [
        { title: "Remember everything", artist: "Five Finger Death Punch", genre: "Rock", album: "" },
        { title: "I Apologize", artist: "Five Finger Death Punch", genre: "Rock", album: "" },
        { title: "Fade to black", artist: "Metallica", genre: "Heavy Metal", album: "" },
        { title: "No saben como vivo", artist: "Dollar Selmouni, JC Reyes", genre: "Latin Urbano", album: "" },
        { title: "Ella", artist: "Many", genre: "Latin", album: "" },
        { title: "Mirame", artist: "Many", genre: "Latin Urban", album: "" },
        { title: "The Day that Never Comes", artist: "Metallica", genre: "Heavy metal", album: "" }
    ]
});

afterEach(async () => {

    connection = songsModel.getConnection();
    if (connection) {
        await connection.close();
    }
});


const generateRandomSongSlice = () => {
    const index = Math.floor((Math.random() * songData.length));
    return songData.slice(index, index + 1)[0];
}
const generateRandomSongSplice = () => {
    return songData.splice(0, 1);
}
test("Model:  Success - Add", async () => {
    let song = generateRandomSongSlice();

    let validAdd = await songsModel.addSong(song.title, song.artist, song.genre, song.album);

    expect(validAdd).toEqual(true);

    let songAdded = await songsModel.getOneSong(1, song.title, song.artist);

    expect(songAdded.title).toBe(song.title);
    expect(songAdded.artist).toBe(song.artist);
    expect(songAdded.genre).toBe(song.genre);
    expect(songAdded.album).toBe(song.album);
})


test("Model: Success - Add - Many Songs", async () => {
    let originalSongDataLength = songData.length;
    expect((await songsModel.getAllSongs()).length).toBe(0);
    for (let i = 0; i < originalSongDataLength; i++) {
        let song = generateRandomSongSplice()[0];
        expect(await songsModel.addSong(song.title, song.artist, song.genre, song.album)).toBe(true);
    }

    expect((await songsModel.getAllSongs(1)).length).toBe(originalSongDataLength);
})

test("Model: Failure - Add - Duplicate", async () => {
    let song = generateRandomSongSlice();

    let validAdd = await songsModel.addSong(song.title, song.artist, song.genre, song.album);

    expect(validAdd).toEqual(true);

    try {
        await songsModel.addSong(song.title, song.artist, song.genre, song.album);
    } catch (error) {
        expect(error.name).toBe("InvalidInputError");
        let rows = await songsModel.getAllSongs(1);
        expect(rows.length).toBe(1);    //Just the first song was added
    }
})
test("Model: Failure - Add - Invalid Input", async () => {
    try {
        let song = generateRandomSongSlice();
        let validAdd = await songsModel.addSong(song.title + "*", song.artist, song.genre, song.album);
    } catch (error) {
        expect(error.name).toBe("InvalidInputError");
        let rows = await songsModel.getAllSongs(1);
        expect(rows.length).toBe(0);    //song was not added
    }
})


test("Model: Success - All songs ", async () => {
    let songs = [];

    for (let i = 0; i < songData.length; i++) {
        songs.push(generateRandomSongSlice());
    }
    let rows = await songsModel.getAllSongs(1);
    for (let k = 0; k < rows.length; k++) {
        expect(rows[k]).toEqual(songs[k])
    }
})

test("Model: Failure - Add song - Closed connection ", async () => {
    let song = generateRandomSongSlice();

    try {
        songsModel.getConnection().close()
        await songsModel.addSong(song.title, song.artist, song.genre, song.album);
    } catch (error) {
        expect(error.name).toBe("DatabaseError");
    }

})

test("Model: Failure - Get songs - Closed connection ", async () => {

    try {

        let originalSongDataLength = songData.length;
        expect((await songsModel.getAllSongs()).length).toBe(0);
        for (let i = 0; i < originalSongDataLength; i++) {
            let song = generateRandomSongSplice()[0];
            expect(await songsModel.addSong(song.title, song.artist, song.genre, song.album)).toBe(true);
        }

        songsModel.getConnection().close()
        let songs = await songsModel.getAllSongs(1);

    } catch (error) {
        expect(error.name).toBe("DatabaseError");
    }

})