const app = require('./app.js');
const port = 1339;
const model = require('./models/songModelMySql.js');

let dbName = process.argv[2];
if (!dbName) {
    dbName = 'mediamaster_db';
} 

model.initialize(dbName, true)
    .then(
        app.listen(port) // Run the server
    );
