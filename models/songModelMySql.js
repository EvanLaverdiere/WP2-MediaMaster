const mysql = require('mysql2/promise');
const logger = require('../logger');
var connection;

async function initialize(db, reset) {
    try {
        await setConnection(db);

        if (reset)
            await dropTable();

        const sqlQuery = 'create table if not exists Songs(id int AUTO_INCREMENT, title VARCHAR(50) not null, artist VARCHAR(50) not null, genre VARCHAR(50) not null, album VARCHAR(50), PRIMARY KEY(id))';

        await connection.execute(sqlQuery)
            .then(logger.info("Songs table created/exists"))
            .catch((error) => { logger.error("Songs table was not created: "+error.message); });

    } catch (error) {
        throw error;
    }
}

async function addSong(title, artist, genre, album){
    try {
        // Validation
        let query = "insert into Songs(title, artist, genre, album) values(?, ?, ?, ?)";
        if(typeof(album))
            album = "";
        let [rows, fields] = await connection.execute(query, [title, artist, genre, album])
            .then(()=>{
                logger.info(`Song [${title}] was added successfully`)
            })
            .catch((error) => { logger.error(error.message); });
    } catch (error) {
        //Handle error
    }
    // The return could be a boolean true
}

async function getAllSongs(){
    try {
        let query = "select title, artist, genre, album from Songs;";
        
        let songs = await connection.execute(query)
            .then(logger.info(`Songs retrieved successfully`))
            .catch((error) => {logger.error(error.message)})

        return songs[0];
    } catch (error) {
        // Handle it
    }
}

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
        .catch((error) => { logger.error("Connection was not established: "+error.message) });

}

function closeConnection(){
    if (typeof connection != 'undefined'){
        connection.close();
   }
}
module.exports = { initialize, addSong, getAllSongs, closeConnection}