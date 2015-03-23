var readline = require('readline');
var World = require('./world');
var winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize:true
});
//silly,debug,verbose,info,warn,error
winston.level = 'verbose';

winston.info("Kroller is now started");
w = new World(2);

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function(line){
    w.lookup(line).crawl();
})

rl.on('close', function(){
    winston.info("Every websites are now referenced");
})

w.watcher.on('AllPageCrawled', function() {
    console.log('the end');
})
