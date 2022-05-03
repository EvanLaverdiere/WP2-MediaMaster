const model = require('../models/userModelMySql.js');
const app = require('../app');
const supertest = require('supertest');
const testRequest = supertest(app);

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

test('[CONTROLLER] Adding a user: Success case', async () => {
    const { username, password } = generateUserData();
    const testResponse = await testRequest.post("/users").send({
        username: username,
        password: password
    });

    expect(testResponse.status).toBe(200);
});

afterEach(async () => {
    connection = model.getConnection();
    if (connection) {
        await connection.close();
    }
});