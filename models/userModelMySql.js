const mysql = require('mysql2/promise');
const validate = require('./validateUtils.js');
const logger = require('../logger');
const bcrypt = require('bcrypt');
const errorTypes = require('./errorModel.js');

var connection;
const saltRounds = 10; //used for encrypting passwords

/**
 * Connects to a database provided by the user.
 * @returns The connection to the database.
 */
function getConnection() {
    return connection;
}

/**
 * Initializes the connection to the indicated database dbname.  
 *  Injects database name so we can use this model for both 
 *  testing and main program without overwriting our main database.
 * 
 * @param {string} dbname The name of the database.
 * @param {boolean} reset If reset is true, then all existing data in the database is erased and a fresh table created.
 * @throws DBConnectionError is there are any issues.
 */
async function initialize(dbname, reset) {
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: '10006',
            password: 'pass',
            database: dbname
        });

        // Drop tables if reset is true
        if (reset) {
            const dropSongs = "DROP TABLE IF EXISTS Songs;";
            await connection.execute(dropSongs);

            const dropSessions = "DROP TABLE IF EXISTS sessions;";
            await connection.execute(dropSessions);

            const dropUsers = "DROP TABLE IF EXISTS users;";
            await connection.execute(dropUsers);
            // logger.info("Table song dropped");
        }

        // Create table if it doesn't exist
        const sqlQuery = 'CREATE TABLE IF NOT EXISTS users(userId int AUTO_INCREMENT, username VARCHAR(50) NOT NULL, password VARCHAR(300) NOT NULL, PRIMARY KEY(userId));';

        await connection.execute(sqlQuery);
        logger.info("Table users created/exists");
    }
    catch (error) {
        logger.error(error);
        throw new errorTypes.DatabaseError("The database is offline.");
    }
}

/**
 * Creates/Registers a user with a username and password.
 * @param {string} username Username of user. Must not already exist in the database.
 * @param {string} password Password of user. Must have a minimum length of 7.
 * @returns The username and the hashed password.
 * @throws InvalidInputError, DBConnectionError
 */
async function addUser(username, password) {
    //validate the password: make sure its 7 characters or longer
    let validatedPassword = validate.validatePassword(password);
    if (!validatedPassword)
        throw new errorTypes.InvalidInputError("Password must be at least 7 characters long.");

    //validate the username: make sure its unique (doesn't already exist)
    let validatedUsername = await validate.validateUniqueUser(username, connection);
    if (!validatedUsername)
        throw new errorTypes.UserAlreadyExistsError("User already exists.");

    //hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //create insert command
    const sqlCommand = 'INSERT INTO users(username, password) VALUES ('
        + connection.escape(username) + ', ' + connection.escape(hashedPassword) + ')';

    try {
        //execute command
        await connection.execute(sqlCommand);
        logger.info("User " + username + " successfully registered!");

        return { "username": username, "password": hashedPassword }
    }
    catch (error) {
        logger.error(error);
        throw new errorTypes.DatabaseError("Something wrong happened in the database.");
    }
}

/**
 * Gets a user from the database if the credentials match.
 * @param {string} username Username of user. Must exist in the database.
 * @param {string} password Password of user. Must match with the user's password in the database.
 * @returns The username and the password.
 * @throws AuthenticationError, DBConnectionError
 */
async function getUser(username, password) {

    try {
        //check if username and password match in db
        let validateUser = await validate.authenticateUser(username, password, connection);
        if (validateUser.username != username || validateUser.password != password)
            throw new errorTypes.AuthenticationError("Username and/or password are invalid.");

        return { "username": validateUser.username, "password": validateUser.password };
    }

    catch (error) {
        if(error instanceof errorTypes.AuthenticationError)
            throw error;

        logger.error(error);
        throw new errorTypes.DatabaseError("Something wrong happened in the database.");
    }
}

/**
 * Get a specific user id from a user.
 * @param {*} username Username of user. Must exist in the database.
 * @returns The id of the user.
 * @throws AuthenticationError if the passed username isn't in the database.
 * @throws DatabaseError if the database is inaccessible.
 */
async function getUserId(username) {
    let sql = "SELECT userId FROM users WHERE username = ?";

    let [records, metadata] = await connection.query(sql, [username])
        .catch((err) => {
            logger.error(err);
            throw new errorTypes.DatabaseError(err);
        });

    if (records.length == 0) {
        let errorMessage = "No such user exists.";
        logger.error(errorMessage);
        throw new errorTypes.AuthenticationError(errorMessage);
    }

    return records[0].userId;
}

module.exports = {
    getConnection,
    initialize,
    addUser,
    getUser,
    getUserId
}