const app = require('./app.js');
const port = 1339;
const songModel = require('./models/songModelMySql.js');
const userModel = require('./models/userModelMySql.js');

let dbName = process.argv[2];
if (!dbName) {
    dbName = 'mediamaster_db';
} 

songModel.initialize(dbName, true)
    .then(
        app.listen(port) // Run the server
    );
