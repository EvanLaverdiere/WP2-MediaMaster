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

        const createCommand = "CREATE TABLE IF NOT EXISTS sessions(sessionId varchar(50), userId int NOT NULL, openedAt Date NOT NULL, closesAt Date NOT NULL, " +
            "PRIMARY KEY (sessionId), CONSTRAINT fk_users_sessions FOREIGN KEY (userId) REFERENCES users (userId))";


        await connection.execute(createCommand);
    } catch (error) {
        logger.error(error);
        throw new errorTypes.DatabaseError(error);
    }
}

//#region CREATE Operations
async function addSession(userId) {
    //TODO: Verify that passed userId is already in the database.

    const sessionId = uuid.v4(); // Generate a random value for the session Id.

    const openedAt = new Date();

    const closesAt = new Date(Date.now() + 25 * 60000);

    const sql = "INSERT INTO sessions (sessionId, userId, openedAt, closesAt) VALUES(?, ?, ?, ?)";

    let results = await connection.query(sql, [sessionId, userId, openedAt, closesAt]);
}
//#endregion

//#region GET Operations
async function getSession(sessionId) {
    const sql = "SELECT * FROM sessions WHERE sessionId = ?";

    const results = await connection.query(sql, [sessionId])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    const sessions = results[0];

    if (sessions.length == 0) {
        // Throw some kind of error.
        let errorMessage = "No session with the id \'" + sessionId + "\' exists.";
        logger.error("ERROR: " + errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }

    return sessions[0];
}
//#endregion

//#region UPDATE Operations
async function updateSession(sessionId) {
    // Verify that the session exists.
    const session = await getSession(sessionId)
        .catch((err) => { throw err });

    // Extend the session's duration by 25 minutes.
    const newExpiryTime = new Date(Date.now() + 25 * 60000);

    const sql = "UPDATE sessions SET closesAt = ? WHERE sessionId = ?";

    const results = await connection.query(sql, [newExpiryTime, sessionId])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    const changedRows = results[0].changedRows;

    if(changedRows == 0){
        let errorMessage = "No sessions were changed.";
        logger.error("ERROR: " + errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }

    return changedRows;
}
//#endregion

//#region DELETE Operations

//#endregion

async function isExpired(sessionId){
    try {
        let session = await getSession(sessionId);

        return session.expiresAt < new Date();
    } catch (error) {
        throw error;
    }
}

module.exports = {
    initialize
}