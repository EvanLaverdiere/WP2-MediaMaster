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

}

module.exports = {
    createTracker
}