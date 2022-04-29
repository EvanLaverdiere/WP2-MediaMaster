const app = require('./app.js');
const port = 1339;
const model = require('./models/songModelMySql');

let dbName = process.argv[2];
if (!dbName) {
    dbName = 'mediamaster_db';
} 

model.initialize(dbName, false)
    .then(
        app.listen(port) // Run the server
    );
