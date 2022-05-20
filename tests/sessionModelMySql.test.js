const supertest = require('supertest');
const errorTypes = require('../models/errorModel');

// Initialise the test database before each test.
const dbName = "mediamaster_db_test";
const songsModel = require('../models/songModelMySql');
const usersModel = require('../models/userModelMySql');
const sessionModel = require('../models/sessionModelMySql');
const logger = require('../logger');
const { Test } = require('supertest');
const express = require('express');

beforeEach(async () => {
    try {
        await songsModel.initialize(dbName, true);
        // await usersModel.initialize(dbName, true);
        // await usersModel.addUser("MusicLover95", "I_luv_songs");
    }
    catch (error) {
        logger.error(error);
        // Fail gracefully.
    }
});

// Close database after each test.
afterEach(async () => {
    connection = songsModel.getConnection();
    if (connection) {
        await connection.close();
    }
});

const userData = [
    { userId: 1, username: "Bob", password: "p@ssW0rD" },
    { userId: 2, username: "MusicLover95", password: "I_luv_songs" }
]

const generateUserData = () => {
    const index = Math.floor(Math.random() * userData.length);
    return userData.slice(index, index + 1)[0];
}

test("addSession() success case", async () => {
    const { username, password } = generateUserData();

    await usersModel.addUser(username, password);

    const session = await sessionModel.addSession(1);

    const sessionId = session.sessionId;

    const sql = `SELECT * FROM sessions WHERE userId = ${1}`;

    const conn = songsModel.getConnection();

    const [records, metadata] = await conn.query(sql);

    expect(Array.isArray(records)).toBe(true);

    expect(records.length).toBe(1);

    expect(sessionId === records[0].sessionId).toBe(true);
})

test("addSession() failure case", async () => {
    const { username, password } = generateUserData();

    await usersModel.addUser(username, password);

    const badUserId = 2;

    await expect(async ()=>{
        await sessionModel.addSession(badUserId);
    }).rejects.toThrow(errorTypes.DatabaseError);
})

test("getSession() success case", async () => {
    const { username, password } = generateUserData();

    await usersModel.addUser(username, password);

    const session = await sessionModel.addSession(1);

    const sessionId = session.sessionId;

    const retrievedSession = await sessionModel.getSession(sessionId);

    expect(sessionId === retrievedSession.sessionId).toBe(true);
})