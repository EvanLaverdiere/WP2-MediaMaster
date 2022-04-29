const model = require('../models/userModelMySql.js');
const dbName = "mediamaster_db_test";
const bcrypt = require('bcrypt'); //TODO: Document that you've added bcrypt module.
//TODO: Add logger

const saltRounds = 10;
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
    await model.createUser(username, password);

    const sqlQuery = "SELECT username, password FROM users WHERE username = "
    + connection.escape(username) + " AND password = "
    + connection.escape(password) + "";
    const [rows, fields] = await connection.execute(sqlQuery);
    console.log(rows);

    expect(Array.isArray(rows)).toBe(true);
    expect(rows[rows.length - 1].username.toLowerCase() == username.toLowerCase()).toBe(true);
    expect(rows[rows.length - 1].password.toLowerCase() == password.toLowerCase()).toBe(true);
})

afterEach(async () => {
    connection = model.getConnection();
    if (connection) {
        await connection.close();
    }
});