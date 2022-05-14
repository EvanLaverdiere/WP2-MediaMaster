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

function manageTracker(req, username){
    let tracker;
    
    if(!req.cookies.tracker){
        tracker = createTracker(username, req);
    }
    else{
        let oldTracker = JSON.parse(req.cookies.tracker);
        let updatedTracker = updateTracker(oldTracker, req);
        if(updatedTracker != null){
            tracker = updatedTracker;
        }
        else{
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