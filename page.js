var winston = require('winston');

function Page(link,world) {
    this.url = link;
    this.world = world;
    this.depth = 0;
    this.children = [];
    this.body = null;
    this.crawled = false;
    this.website = null;
    this.banned = ['mp4','mp3','css','js','wav','flv','swf','jpg','jpeg','png','pdf']
}

Page.prototype.crawl = function() { 
    this.depth++;
    this.crawled = true;
    this.world.queue.push(this.url, function(error,response,body) {
        if (error) {
            winston.warn("Can't crawl the website "+this.url+" with error "+error);
        } else if(response.statusCode == 404) {
            winston.warn("Page not found "+this.url);
        } else {
            this.body = body;
            this.findChildren();
        }
        this.world.watcher.emit('OnePageCrawled',this);
    }.bind(this));
};

Page.prototype.findChildren = function() {
    links = this.parseContent();
    links.forEach(function(l) {
        p = this.world.lookup(l);
        p.depth = this.depth;
        this.children.push(p);
    }.bind(this));
    this.website.informChildren(this);
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
        winston.debug("Ignoring email "+rawLink);
        return null;
    }
    
    if(rawLink.substring(0,6) === 'skype:') {
        winston.debug("Ignoring skype "+rawLink);
        return null;
    }

    if(rawLink == "") {
        return null;
    }

    rawLink = rawLink.split("#",1)[0]
    extensionRawLink = rawLink.split("?",1)[0]
   
    ext = (extensionRawLink.split(".").slice(-1))[0]

    if(this.banned.indexOf(ext.toLowerCase()) != -1) {
        return null;
    }

    if (/https?:\/\//i.exec(rawLink)) {
        return rawLink;
    }

    if (rawLink.substring(0,2) == '//') {
      return 'https:' + rawLink;
    }

    if (rawLink.substring(0,1) == '/') {
        return this.baseUrl() + rawLink;
    }
    
    if (rawLink.substring(0,2) == './') {
        return this.baseUrl() + '/' + rawLink.substring(2);
    }

    return this.urlDir() + '/' + rawLink;
}

Page.prototype.urlDir = function() {
    return /^(https?:\/\/.*?)(\/[^\/]*)?$/gi.exec(this.url)[1];
}

Page.prototype.baseUrl = function() {
    return /https?:\/\/([\w\d-_.]*)/i.exec(this.url)[0];
};

module.exports = Page;
