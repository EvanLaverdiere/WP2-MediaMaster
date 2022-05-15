const mysql = require('mysql2/promise');
const logger = require('../logger');
const validator = require('../validation/validateUtils');

const errorTypes = require('./errorModel.js');
const userModel = require('./userModelMySql.js');
const uuid = require('uuid');

var connection;

async function initialize(db, reset, conn) {
    try {
        connection = conn;

        if (reset) {
            let dropCommand = "DROP TABLE IF EXISTS sessions";
            await connection.execute(dropCommand);
        }

        const createCommand = "CREATE TABLE IF NOT EXISTS sessions(sessionId varchar(50), userId int NOT NULL, openedAt Date NOT NULL, closedAt Date, " +
            "PRIMARY KEY (sessionId), CONSTRAINT fk_users_sessions FOREIGN KEY (userId) REFERENCES users (userId))";


        await connection.execute(createCommand);
    } catch (error) {
        logger.error(error);
        throw new errorTypes.DatabaseError(error);
    }
}

//#region CREATE Operations
async function addSession(userId){
    //TODO: Verify that passed userId is already in the database.

    const sessionId = uuid.v4(); // Generate a random value for the session Id.

    const openedAt = new Date();

    const sql = "INSERT INTO sessions (sessionId, userId, openedAt) VALUES(?, ?, ?)";

    let results = await connection.query(sql, [sessionId, userId, openedAt]);
}
//#endregion

//#region GET Operations

//#endregion

//#region UPDATE Operations

//#endregion

//#region DELETE Operations

//#endregion

module.exports = {
    initialize
}