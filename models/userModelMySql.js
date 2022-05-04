const mysql = require('mysql2/promise');
const validate = require('./validateUtils');
//TODO: Add the logger
//const logger = require('../logger');
const bcrypt = require('bcrypt'); //TODO: Document that you've added bcrypt module.
const errorTypes = require('./errorModel.js');

var connection;
const saltRounds = 10;

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

        // Drop table if reset is true
        if (reset) {
            const dropQuery = "DROP TABLE IF EXISTS users;";
            await connection.execute(dropQuery);
            // logger.info("Table song dropped");
        }

        // Create table if it doesn't exist
        const sqlQuery = 'CREATE TABLE IF NOT EXISTS users(userId int AUTO_INCREMENT, username VARCHAR(50) NOT NULL, password VARCHAR(300) NOT NULL, PRIMARY KEY(userId));';

        await connection.execute(sqlQuery);
        // logger.info("Table users created/exists");
    }
    catch (error) {
        // logger.error(error);
        throw new errorTypes.DatabaseError();
    }
}

/**
 * Creates/Registers a user with a username and password.
 * @param {*} username Username of user. Must not already exist in the database.
 * @param {*} password Password of user. Must have a minimum length of 7.
 * @returns The username and the hashed password.
 * @throws InvalidInputError, DBConnectionError
 */
async function addUser(username, password) {
    let validatedPassword = validate.validatePassword(password);
    if (!validatedPassword)
        throw new errorTypes.InvalidInputError("Password must be at least 7 characters long.");

    let validatedUsername = await validate.validateUniqueUser(username, connection);
    if(!validatedUsername)
        throw new errorTypes.UserAlreadyExistsError("User already exists.");

    //create insert command
    const sqlCommand = 'INSERT INTO users(username, password) VALUES ('
        + connection.escape(username) + ', ' + connection.escape(password) + ')';

    //execute command
    try {
        await connection.execute(sqlCommand);
        //logger.info("User " + username + " successfully registered!");
        return { "username": username, "password": password }
    }
    catch (error) {
        //logger.error(error);
        console.log(error);
        throw new errorTypes.DatabaseError("Something wrong happened in the database.");
    }
}

/**
 * Gets a user from the database if the credentials match.
 * @param {*} username Username of user. Must exist in the database.
 * @param {*} password Password of user. Must match with the user's password in the database.
 */
async function getUser(username, password) {
    let validated = await validate.authenticateUser(username, password, connection);

    //check if username and password match in db
    if (!validated)
        throw new errorTypes.AuthenticationError("Authentication failed.");

    //create sql query to check db if username already exists in database
    let sqlQuery = "SELECT username, password FROM users WHERE username = "
        + connection.escape(username) + " AND password = "
        + connection.escape(password);

    try {
        const [rows, fields] = await connection.execute(sqlQuery);
        //logger.info("User " + username + " successfully found!");
        return { "username": rows[0].username, "password": rows[0].password };
    }
    catch (error) {
        //logger.error(error);
        console.log(error);
        throw new errorTypes.DatabaseError("Something wrong happened in the database.");
    }
}

module.exports = {
    getConnection,
    initialize,
    addUser,
    getUser

}