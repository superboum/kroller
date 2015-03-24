var winston = require('winston');
var async = require("async");
var events = require('events');
var request = require('request');

var Page = require('./page');
var Website = require('./website');

var fetch = function(url,cb) {
    request({
        url: url,
        //timeout: 10000
    }, function (error, response, body) {
        cb(error,response,body);
    });
};


function World(depth) {
    this.maxDepth = depth;
    this.pages = [];
    this.websites = [];
    this.watcher = new events.EventEmitter();
    this.watcher.on('OnePageCrawled', this.onePageCrawled);
    winston.debug("Creating a new world");
    this.queue = async.queue(fetch, 100);

    this.queue.drain = function() {
        winston.info('Finished. Pages found: '+this.pages.length+'. Websites found:  '+this.websites.length);
        this.watcher.emit('AllPageCrawled');
    }.bind(this);
}

World.prototype.onePageCrawled = function(page) {
    var w = page.world;
    winston.verbose("Fetched "+page.url+" depth "+page.depth);
    if(page.depth < w.maxDepth) {
        page.children.forEach(function(p) {
            if(!p.crawled)
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

        var website = this.findWebsite(page.prettyUrl());

        if (website === null) {
            website = new Website(page.prettyUrl(),this, this.websites.length);
            this.websites.push(website);
        }

        website.addPage(page);

        this.pages.push(page);
        winston.debug("This page is new in our world "+url);
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
            winston.debug("This page is already in our world "+url);
            return false;
        }
        return true;
    });
    return r;
}

World.prototype.findWebsite = function(url) {
    r = null;
    this.websites.every(function(website, index) {
        if (url === website.url) {
            r = website;
            winston.debug("This website is already in our world "+url);
            return false;
        }
        return true;
    });
    return r;
}

World.prototype.generateGexf = function() {
    head = '<gexf xmlns="http://www.gexf.net/1.1draft" xmlns:viz="http://www.gexf.net/1.1draft/viz" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1" xsi:schemaLocation="http://www.gexf.net/1.1draft http://www.gexf.net/1.1draft/gexf.xsd">';
    meta = '<meta lastmodifieddate="2015-03-02 17:13:56 +0100"><creator>Kroller</creator><description>Kroll the web with kroller with a big K</description></meta>';
    graph = '<graph defaultedgetype="directed">';
    graph += '<attributes class="node"> <attribute id="0" title="name" type="string"/><attribute id="1" title="url" type="string"/><attribute id="2" title="links" type="int"/> <attribute id="3" title="actor" type="string"> <default>default_actor</default> </attribute> </attributes>';
    nodes = '<nodes>';
    edges = '<edges>';
    graphEnd = '</graph>'
    footer = '</gexf>';

    this.websites.forEach(function(w,i) {
        nodes += '<node id="'+i+'" label="'+w.url+'">';
        nodes += '<attvalues><attvalue for="0" value="Noeud '+i+'" /><attvalue for="1" value="'+w.url+'"/><attvalue for="2" value="'+w.children.length+'"/></attvalues>'
        nodes += '</node>'

        w.children.forEach(function(wchild,j) {
            edges += '<edge id="n'+i+'c'+j+'" source="'+w.id+'" target="'+wchild.id+'" />';
        });
    });
    nodes += '</nodes>';
    edges += '</edges>'
    return head + meta + graph + nodes + edges + graphEnd + footer;
}

module.exports = World
