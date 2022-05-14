const uuid = require('uuid');


class Tracker{
    constructor(username){
        this.username = username
        this.pages = [];
    }
}

function createTracker(username, req){
    const trackerId = uuid.v4();
    
    let tracker = new Tracker(username);
    let page = getCurrentPage(req);

    tracker.pages.push(page);

    return tracker;
}

function getCurrentPage(req){
    let url = req.url;
    let time = new Date();

    return {url, time};
}

function updateTracker(tracker, req){
    let length = tracker.pages.length;
    let lastPage = tracker.pages[length - 1];

    // Is the user still on the previous page?
    if(lastPage.url === req.url){
        return null;
    }

    lastPage.timeLeft = new Date();

    let nextPage = getCurrentPage(req);
    tracker.pages.push(nextPage);

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