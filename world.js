var winston = require('winston');
var Page = require('./page');
var events = require('events');

function World(depth) {
    this.maxDepth = depth;
    this.pages = [];
    this.crawled = 0;
    this.watcher = new events.EventEmitter();
    this.watcher.on('PageCrawled', this.pageCrawled);
    winston.debug("Creating a new world");
}

World.prototype.pageCrawled = function(page) {
    winston.verbose("We have crawled a page "+page.url);
    if(page.depth < this.maxDepth) {
        page.crawlChildren();
    }
}

/**
 * Inform the world that we want to use this website
 * @param String Website URL
 *
 * @return Website A website registered in our world
 */

World.prototype.lookup = function(url) {
    var page = this.findPage(url);

    if (page === null) {
        page = new Page(url,this);
        this.pages.push(page);
        winston.debug("This website is new in our world "+url);
    }
    return page;
};


/**
 * Find a website from URL
 *
 * @return Website|null the Website in our world
 */

World.prototype.findPage = function(url) {
    r = null;
    this.pages.every(function(page, index) {
        if (url === page.url) {
            r = page;
            winston.debug("This website is already in our world "+url);
            return false;
        }
        return true;
    });
    return r;
}

module.exports = World
