const uuid = require('uuid');


class Tracker{
    constructor(username){
        this.username = username
        this.pagesVisited = [];
    }
}

function createTracker(username, req){
    const trackerId = uuid.v4();
    
    let tracker = new Tracker(username);
    let page = getCurrentPage(req);

    tracker.pagesVisited.push(page);

    return tracker;
}

function getCurrentPage(req){
    let url = req.url;
    let timeArrived = new Date();

    return {url, time: timeArrived};
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
    }
    else{
        // Otherwise, update the existing one.
        let oldTracker = JSON.parse(req.cookies.tracker);
        let updatedTracker = updateTracker(oldTracker, req);

        // Were any changes made to the tracker?
        if(updatedTracker != null){
            // If so, return the updated tracker.
            tracker = updatedTracker;
        }
        else{
            // Otherwise, return the original tracker.
            tracker = oldTracker;
        }
    }

    return tracker;
}

module.exports = {
    // createTracker,
    // updateTracker
    manageTracker
}