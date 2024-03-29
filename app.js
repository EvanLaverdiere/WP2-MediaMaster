const express = require('express');
const app = express();
app.use(express.json())

const logger = require('./logger');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser')
const pinohttp = require('pino-http');
const cookieParser = require('cookie-parser');

logger.info("Creating app");

const methodOverride = require('method-override');

const expressListRoutes = require('express-list-routes');

// Hbs
app.engine('hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', './views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.json());
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.use(cookieParser());

app.use(express.json());
app.use(express.static('public'))

// Http request logs will go to same location as main logger
const httpLogger = pinohttp({
  logger: logger
});

app.use(httpLogger);

const controllers = ['homeController', 'userController', 'songController', 'errorController']

// Register routes from all controllers 
//  (Assumes a flat directory structure and common 'routeRoot' / 'router' export)
controllers.forEach((controllerName) => {
  try {
    const controllerRoutes = require('./controllers/' + controllerName);
    app.use(controllerRoutes.routeRoot, controllerRoutes.router);
  } catch (error) {
    logger.error(error);
  }
})
expressListRoutes(app, { prefix: '/' });

module.exports = app
