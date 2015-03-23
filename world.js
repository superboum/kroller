var winston = require('winston');
var Page = require('./page');
var async = require("async");
var events = require('events');
var request = require('request');

var fetch = function(url,cb) {
    request({
        url: url,
        timeout: 10000
    }, function (error, response, body) {
        cb(error,response,body);
    });
};


function World(depth) {
    this.maxDepth = depth;
    this.pages = [];
    this.watcher = new events.EventEmitter();
    this.watcher.on('OnePageCrawled', this.onePageCrawled);
    winston.debug("Creating a new world");
    this.queue = async.queue(fetch, 1);

    this.queue.drain = function() {
        console.log('Finished, websites found: '+this.pages.length);
    }.bind(this);
}

World.prototype.onePageCrawled = function(page) {
    var w = page.world;
    winston.verbose("Fetched "+page.url);
    if(page.depth < w.maxDepth) {
        page.children.forEach(function(p) {
            p.crawl();
        });
    }
};


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
