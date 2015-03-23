var request = require('request');
var winston = require('winston');

function Page(link,world) {
    this.url = link;
    this.world = world;
    this.depth = 0;
    this.children = [];
    this.body = null;
}

Page.prototype.fetchContent = function(cb) {
    request(this.url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            this.body = body;
            this.findChildren();
            cb(null);
        } else {
            cb(error || "Page status was not 200 :(");
        }
    }.bind(this));
};

Page.prototype.findChildren = function() {
    links = this.parseContent();
    pages = [];
    links.forEach(function(l) {
        pages.push(this.world.lookup(l));
    });
    return pages;
}

Page.prototype.parseContent = function() {
    links = []
    linkFinder = /<a(.*?)href="(.*?)"(.*?)>/gi; 
    while(currentLink = linkFinder.exec(this.body)) {
        if (currentLink = this.beautifyLink(currentLink[2])) {
            links.push(currentLink);
        }
    }
    return links;
};

Page.prototype.beautifyLink = function(rawLink) {
    if(rawLink.substring(0,7) === 'mailto:') {
        winston.debug("Ignoring mailto address "+rawLink);
        return null;
    }

    if(rawLink == "") {
        return null;
    }

    rawLink = rawLink.split("#",1)[0]

    if (/https?:\/\//i.exec(rawLink)) {
        return rawLink;
    }
    if (rawLink.substring(0,1) == '/') {
        return this.baseUrl() + rawLink;
    }
    return this.urlDir() + rawLink;
}

Page.prototype.urlDir = function() {
    urlDir = this.url
    while(urlDir.length > 0 && urlDir.charAt[urlDir.length-1] != '/') {
        urlDir = urlDir.slice(0,-1);
    }

    if (urlDir.length === 0) {
        return this.url + '/';
    }
    return urlDir;
}

Page.prototype.baseUrl = function() {
    return /https?:\/\/([\w\d-_.]*)/i.exec(this.url)[0];
};

Page.prototype.crawl = function() {
    this.fetchContent(function(err,links) {
        //@TODO generate children
        console.log(links);
        this.world.watcher.emit('PageCrawled',this);
    }.bind(this));
};

module.exports = Page;