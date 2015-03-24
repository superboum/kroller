#!/usr/bin/node 

var readline = require('readline');
var winston = require('winston');
var program = require('commander');
var fs = require('fs');

var World = require('./world');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    colorize:true,
});

winston.level = 'info';
var depth = 1;
var concurrency = 100;

program
  .version('0.0.1')
  .usage('[option]')
  .option('-i, --input [file]', 'A file containing one website per line (required)')
  .option('-o, --output [file]', 'Where to store gexf file (required)')
  .option('-d, --depth <n>', 'Crawl depth, default 1')
  .option('-c, --concurrency <n>', 'Concurrent requests allowed, default 100.')
  .option('-v, --verbose', 'Verbosity', function(v,total) { return total+1;  }, 0 )
  .parse(process.argv);

//silly,debug,verbose,info,warn,error
if(program.verbose === undefined) winston.level = 'info';
if(program.verbose === 1) winston.level = 'verbose';
if(program.verbose > 1) winston.level = 'debug';

if(!program.input || !program.output) {
  winston.error("Missing mandatory arguments. Check ./kroller.js --help. Bye :)"); 
  process.exit(1);
}

if(program.concurrency) concurrency = program.concurrency;
if(program.depth) depth = program.depth;

w = new World(depth,concurrency);

fs.readFile(program.input, "utf8", function(error, data) {
  if(error || !data) {
    winston.error("Unable to open file. The error -> "+error);
    process.exit(1);
  }
  
  winston.info("Kroller is now started with depth="+depth+" and concurrency="+concurrency);
  data = data.split("\n");
  data.pop(); //Dirty hack, sorry :s
  data.forEach(function(line) {
    w.lookup(line).crawl(); 
  });
});

w.watcher.on('AllPageCrawled', function() {
  winston.info('Finished. Pages found: '+w.pages.length+'. Websites found:  '+w.websites.length);
  winston.info('Writing your GEXF file...');
  fs.writeFile(program.output, w.generateGexf(), function(err) {
    if(err) {
      winston.error("Can't write in this file :'(");
    } else {
      winston.info("You can now open your file "+program.output+" in Gephi ! Bye :)");
    }
  });
})
