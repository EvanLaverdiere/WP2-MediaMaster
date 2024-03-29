const uuid = require('uuid');
const logger = require('../logger');
const sessionModel = require('../models/sessionModelMySql');


/**
 * Object representing a tracking cookie. Contains a user's name and an array of the pages that the user has visited on the site.
 */
class Tracker{
    constructor(username){
        this.username = username
        this.pagesVisited = [];
    }
}

/**
 * Creates a new Tracker object.
 * @param {*} username The user with whom this Tracker will be associated.
 * @param {*} req The HTTP Request detailing which page the user was on when the Tracker was created.
 * @returns The new Tracker object.
 */
function createTracker(username, req){
    const trackerId = uuid.v4();
    
    let tracker = new Tracker(username);
    let page = getCurrentPage(req);

    tracker.pagesVisited.push(page);

    return tracker;
}

/**
 * Retrieves an object representing the current page that a user is on.
 * @param {*} req The HTTP Request containing the current URL.
 * @returns An object containing the page's URL and the time at which the request was received.
 */
function getCurrentPage(req){
    let method = req.method;
    let url = req.url;
    let timeArrived = new Date();

    return {method, url, timeArrived};
}

/**
 * Updates an existing Tracker object.
 * @param {*} tracker The Tracker to be updated.
 * @param {*} req The HTTP request which sent in the Tracker.
 * @returns A new, updated Tracker object if the user has moved to a different page since they last sent a request, or null otherwise.
 */
function updateTracker(tracker, req){
    // Get the last page the user visited before this request was sent in.
    let length = tracker.pagesVisited.length;
    let lastPage = tracker.pagesVisited[length - 1];

    // Is the user still on the previous page?
    if(lastPage.url === req.url){
        return null; // If so, nothing needs to be changed. Return null.
    }

    // Otherwise, mark the current time as the moment when the user left the previous page.
    lastPage.timeLeft = new Date();

    // Then add the current page to the Tracker's pagesVisited array.
    let nextPage = getCurrentPage(req);
    tracker.pagesVisited.push(nextPage);

    // Return the modified Tracker.
    return tracker;

}

/**
 * Updates the tracker cookie sent by an HTTP request. If the request has no cookie, method creates a new Tracker instead.
 * @param {*} req The incoming HTTP request.
 * @param {*} username The user to whom this tracker is attached.
 * @returns A Tracker object.
 */
function manageTracker(req, username){
    let tracker;
    
    // Does the request have a tracker cookie already?
    if(!req.cookies.tracker){
        // If not, create one.
        tracker = createTracker(username, req);
        let pagesVisited = tracker.pagesVisited;
        logger.debug(`Started tracking user \'${username}\' at ${pagesVisited[pagesVisited.length - 1].url}.`);
    }
    else{
        // Otherwise, update the existing one.
        let oldTracker = JSON.parse(req.cookies.tracker);
        let updatedTracker = updateTracker(oldTracker, req);

        // Were any changes made to the tracker?
        if(updatedTracker != null){
            // If so, return the updated tracker.
            tracker = updatedTracker;
            logger.debug(`User \'${username}\' moved to a new page.`);
        }
        else{
            // Otherwise, return the original tracker.
            tracker = oldTracker;
        }
    }

    logger.debug({tracker: tracker});
    return tracker;
}

/**
 * Updates the sessionId cookie assigned to an HTTP request by retrieving information from the Sessions table.
 * If the sessionId cookie is not present, due to being expired, function will delete the corresponding session
 * record from the database.
 * @param {*} req The HTTP request to be checked for a sessionId cookie.
 * @returns The refreshed session if successful, or null otherwise.
 */
async function manageSession(req){
    try {
        // Get the sessionId and userId cookies from the HTTP request.
        let sessionId = req.cookies.sessionId;
        let userId = req.cookies.userId;

        let userSession;
        // Does the sessionId cookie exist?
        if(sessionId){
            userSession = await sessionModel.getSession(sessionId); // If so, get the corresponding session.
        }
        else{
            userSession = await sessionModel.getSessionByUserId(userId); // If not, it must be expired. Get the session by userId instead.
        }
    
        // Has the session expired?
        if(await sessionModel.isExpired(userId)){
            // If so, delete the corresponding session from the database.
            await sessionModel.deleteSessionByUserId(userId);
            return null;
        }
        else{
            // Otherwise, update the existing session and return it.
            userSession = await sessionModel.refreshSession(userId, sessionId);
        }
        return userSession;
    } catch (error) {
        logger.error(error);
        return null; // Return null if anything goes wrong.
    }    
}

module.exports = {
    // createTracker,
    // updateTracker
    manageTracker,
    manageSession
}