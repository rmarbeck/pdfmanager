const puppeteer = require('puppeteer');
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000


var http = require('http');
var url = require('url');
var fs = require('fs');
const PASSWORD = process.env.HOMETIME_PASSWORD || "unknown";

http.createServer(function (req, res) {
  var q = url.parse(req.url, true);
  var filename = "." + q.pathname;
  
  (async() => {
	const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
	const page = await browser.newPage();
	await page.goto('https://legacy.hometime.fr/quick-login', {waitUntil: 'networkidle2'});
        await page.waitForSelector('input[name="password"]')
    	await page.type('input[name="password"]', PASSWORD)
   	await page.click('[type="submit"]')
  	//await page.waitForNavigation()
  	await page.goto('https://legacy.hometime.fr'+q.pathname, {waitUntil: 'networkidle0'})
	await page.pdf({path: 'page.pdf', displayHeaderFooter: false, printBackground: true});

	await browser.close();

  fs.readFile('./page.pdf', function(err, data) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      res.write("file name :"+filename+"\n");
      return res.end("404 Not Found");
    } 
    res.writeHead(200, {'Content-Type': 'application/pdf'});
    res.write(data);
    return res.end();
  });
	})();
}).listen(PORT);

