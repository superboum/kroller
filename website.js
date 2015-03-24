var winston = require('winston');

function Website(url,world,id) {
    this.url = url;
    this.world = world;
    this.pages = [];
    this.children = [];
    this.id = id;
}

Website.prototype.addPage = function(p) {
    this.pages.push(p);
    p.website = this;
}

Website.prototype.informChildren = function(p) {
    p.children.forEach(function(p) {
        website = this.world.findWebsite(p.baseUrl());
        if (website.url === this.url || this.alreadyRegistered(website)) { 
            return;
        }
        this.children.push(website);

    }.bind(this));
}

Website.prototype.alreadyRegistered = function(website) {
    return !(this.children.every(function(w) {
        if (w.url === website.url) { return false }
        return true;
    }.bind(this)));
}

module.exports = Website;
