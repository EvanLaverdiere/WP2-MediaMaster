const model = require('../models/userModelMySql.js');
const errorTypes = require('../models/errorModel.js');
const bcrypt = require('bcrypt'); //TODO: Document that you've added bcrypt module.

const saltRounds = 10;
const dbName = "mediamaster_db_test";
var connection;

/* Data to be used to generate random users for testing */
const userData = [
    { username: 'John', password: 'john123' },
    { username: 'Smith', password: 'smith456' },
    { username: 'Rachel', password: 'rachel789' },
    { username: 'Peter', password: 'peter000' },
    { username: 'Laura', password: 'laura111' },
    { username: 'William', password: 'william222' }
]

// Slice version - Allows many tests without ever "running out" of generated users
const generateUserData = () => {
    const index = Math.floor((Math.random() * userData.length));
    return userData.slice(index, index + 1)[0];
}

beforeEach(async () => {
    await model.initialize(dbName, true);
    connection = model.getConnection();
});

test('[MODEL PART 3] Adding a user: Success case', async () => {
    const { username, password } = generateUserData();
    await model.addUser(username, password);

    const sqlQuery = "SELECT username, password FROM users WHERE username = "
    + connection.escape(username) + " AND password = "
    + connection.escape(password) + "";
    const [rows, fields] = await connection.execute(sqlQuery);

    expect(Array.isArray(rows)).toBe(true);
    expect(rows[rows.length - 1].username.toLowerCase() == username.toLowerCase()).toBe(true);
    expect(rows[rows.length - 1].password.toLowerCase() == password.toLowerCase()).toBe(true);
})

test('[MODEL PART 3] Adding a user: Failure case (InvalidInputError)', async () => {
    const username = "Hello";
    const password = "Hi";

    try {
        await model.addUser(username, password);
    }
    catch (err) {
        expect(err).toBeInstanceOf(errorTypes.InvalidInputError);
    }
});

test('[MODEL PART 3] Adding a user: Failure case (UserAlreadyExistsError)', async () => {
    const { username, password } = generateUserData();
    await model.addUser(username, password);

    try {
        await model.addUser(username, password);
    }
    catch (err) {
        expect(err).toBeInstanceOf(errorTypes.UserAlreadyExistsError);
    }
})

test('[MODEL PART 3] Getting a user: Success case', async () => {
    const { username, password } = generateUserData();
    await model.addUser(username, password);

    const result = await model.getUser(username, password);

    expect(result.username.toLowerCase() == username.toLowerCase()).toBe(true);
    expect(result.password.toLowerCase() == password.toLowerCase()).toBe(true);
})

test('[MODEL PART 3] Getting a user: Failure case (AuthenticationError)', async () => {
    const { username, password } = generateUserData();
    await model.addUser(username, password);

    try {
        await model.getUser("username", "password");
    }
    catch (err) {
        expect(err).toBeInstanceOf(errorTypes.AuthenticationError);
    }
})

afterEach(async () => {
    connection = model.getConnection();
    if (connection) {
        await connection.close();
    }
});