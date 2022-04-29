const mysql = require('mysql2/promise');
const validate = require('./validateUtils');
//TODO: Add the logger
//const logger = require('../logger');
const validator = require('validator'); //******** We might not want this
const bcrypt = require('bcrypt'); //TODO: Document that you've added bcrypt module.

var connection;
const saltRounds = 10;

/**  Error for 400-level issues */
class InvalidInputError extends Error { }
class AuthenticationError extends Error { }

/** Error for 500-level issues */
class DBConnectionError extends Error { }

/**
 * Creates/Registers a user with a username and password.
 * @param {*} username Username of user. Must not already exist in the database.
 * @param {*} password Password of user. Must have a minimum length of 7.
 * @returns The username and the hashed password.
 * @throws InvalidInputError, DBConnectionError
 */
async function createUser(username, password) {
    //make sure username doesn't exist in database
    if (!validate.validateUsername(username))
        throw new InvalidInputError();

    //hash the password first (with salting)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //create insert command
    const sqlCommand = 'INSERT INTO users(username, password) VALUES (\"'
        + connection.escape(username) + '\",\"' + connection.escape(hashedPassword) + '\")';

    //execute command
    try {
        await connection.execute(sqlCommand);
        //logger.info("User " + username + " successfully registered!");
        return { "username": username, "password": hashedPassword }
    }
    catch (error) {
        //logger.error(error);
        throw new DBConnectionError();
    }
}

/**
 * Gets a user from the database if the credentials match.
 * @param {*} username Username of user. Must exist in the database.
 * @param {*} password Password of user. Must match with the user's password in the database.
 */
async function getUser(username, password){
    //hash the password first (with salting)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //check if username and password match in db
    if (!validate.authenticateUser(username, hashedPassword))
        throw new AuthenticationError();
}

module.exports = {
    createUser,
    getUser
}