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

        const createCommand = "CREATE TABLE IF NOT EXISTS sessions(sessionId char(36), userId int NOT NULL, openedAt Datetime NOT NULL, closesAt Datetime NOT NULL, " +
            "PRIMARY KEY (sessionId), CONSTRAINT fk_users_sessions FOREIGN KEY (userId) REFERENCES users (userId))";


        await connection.execute(createCommand);
    } catch (error) {
        logger.error(error);
        throw new errorTypes.DatabaseError(error);
    }
}

//#region CREATE Operations
/**
 * Creates a new session that will expire in 25 minutes. Adds it to the database.
 * @param {*} userId The ID of the user to whom this session belongs.
 * @throws DatabaseError if the database is inaccessible when this function is called.
 */
async function addSession(userId) {
    //TODO: Verify that passed userId is already in the database.

    const sessionId = uuid.v4(); // Generate a random value for the session Id.

    const openedAt = new Date(); // Session is opened at the current time.

    const closesAt = new Date(Date.now() + 25 * 60000); // Session will expire in 25 minutes.

    const sql = "INSERT INTO sessions (sessionId, userId, openedAt, closesAt) VALUES(?, ?, ?, ?)";

    let results = await connection.query(sql, [sessionId, userId, openedAt, closesAt])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    // Returns the newly created session's ID and closing time. These will be used to set the sessionId cookie.
    return { sessionId: sessionId, closesAt: closesAt };
}
//#endregion

//#region GET Operations
/**
 * Retrieves an existing session from the database.
 * @param {*} sessionId The ID of the session.
 * @returns An object representing the session.
 * @throws AuthenticationError if the passed sessionId is invalid.
 * @throws DatabaseError if the database is inaccessible when this function is called.
 */
async function getSession(sessionId) {
    const sql = "SELECT * FROM sessions WHERE sessionId = ?";

    const results = await connection.query(sql, [sessionId])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    const sessions = results[0];

    if (sessions.length == 0) {
        // If no records were retrieved, the sessions table must not contain the passed sessionId.
        let errorMessage = "No session with the id \'" + sessionId + "\' exists.";
        logger.error("ERROR: " + errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }

    return sessions[0];
}

/**
 * Retrieves an existing session from the database by the passed user ID.
 * @param {*} userId The session's associated user ID.
 * @returns An object representing the session.
 * @throws AuthenticationError if the passed sessionId is invalid.
 * @throws DatabaseError if the database is inaccessible when this function is called.
 */
async function getSessionByUserId(userId) {
    const sql = "SELECT * FROM sessions WHERE userId = ?";

    const [sessions, metadata] = await connection.query(sql, [userId])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    if (sessions.length == 0) {
        let errorMessage = "No sessions found for the user ID " + userId + ".";
        logger.error("ERROR: " + errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }

    return sessions[0];
}
//#endregion

//#region UPDATE Operations
/**
 * Refreshes an existing session, extending its duration.
 * @param {*} sessionId The session's ID.
 * @returns The updated session.
 */
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

    if (changedRows == 0) {
        let errorMessage = "No sessions were changed.";
        logger.error("ERROR: " + errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }

    const refreshedSession = {
        sessionId: session.sessionId,
        userId: session.userId,
        openedAt: session.openedAt,
        closesAt: newExpiryTime
    }

    return refreshedSession;
}

/**
 * Refresh a session by replacing its original value with a new one.
 * @param {*} userId The User ID associated with the session.
 * @param {*} sessionId The session's ID.
 * @returns The refreshed session.
 */
async function refreshSession(userId, sessionId) {
    try {
        // Verify that the passed session ID exists. Will throw if the ID is not found.
        const oldSession = await getSession(sessionId);

        // Create a new session to replace the original session.
        const newSession = await addSession(userId);

        // Delete the original, obsolete session.
        await deleteSession(oldSession.sessionId);

        // Return the new session.
        return newSession;
    } catch (error) {
        throw error; // If anything goes wrong in one of the called functions, throw the resulting error. Those functions will log it.
    }
}
//#endregion

//#region DELETE Operations
/**
 * Deletes a session by passed session ID. To be used when a sessionId cookie exists.
 * @param {*} sessionId The ID of the session to be deleted.
 */
async function deleteSession(sessionId) {
    const sql = "DELETE FROM sessions WHERE sessionId = ?";

    let results = await connection.query(sql, [sessionId])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    let affectedRows = results[0].affectedRows;
    if (affectedRows <= 0) {
        let errorMessage = "No sessions were deleted.";
        logger.error("ERROR: " + errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }
}

/**
 * Deletes a session by its corresponding user ID. To be used when no sessionId cookie exists, having expired.
 * @param {*} userId The user ID of the session. In normal circumstances, a user will only have one session open at a time.
 * @throws AuthenticationError If the function failed to delete any sessions from the database.
 * @throws DatabaseError if the database is inaccessible when called.
 */
async function deleteSessionByUserId(userId) {
    const sql = "DELETE FROM sessions WHERE userId = ?";

    let results = await connection.query(sql, [userId])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    let affectedRows = results[0].affectedRows;

    if (affectedRows <= 0) {
        let errorMessage = "No sessions were deleted.";
        logger.error("ERROR: " + errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }
}
//#endregion

/**
 * Verifies whether a given session is expired.
 * @param {*} sessionId The ID of the session to check.
 * @returns True if the session is expired, false otherwise.
 */
async function isExpired(userId) {
    try {
        let session = await getSessionByUserId(userId);
        let expiresAt = session.closesAt;
        let now = new Date();

        return session.closesAt < now;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    initialize,
    addSession,
    getSession,
    getSessionByUserId,
    updateSession,
    refreshSession,
    deleteSession,
    deleteSessionByUserId,
    isExpired
}