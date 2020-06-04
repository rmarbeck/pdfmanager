const puppeteer = require('puppeteer');
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000


var http = require('http');
var url = require('url');
var fs = require('fs');
const PASSWORD = process.env.HOMETIME_PASSWORD || "unknown";
const ACCOUNT = process.env.HOMETIME_ACCOUNT_EMAIL || "unknown";

http.createServer(function (req, res) {
  if (PASSWORD === "unknown" || ACCOUNT === "unknown") {
	res.writeHead(500, {'Content-Type': 'text/html'});
        res.write("Error in configuration of the module");
        return res.end();
  } else  {
  var q = url.parse(req.url, true);
  var filename = "." + q.pathname;
  const trustedkey = req.headers['trustedkey'];
  
  (async() => {
	console.log('querying '+q.pathname)
	const filename = 'page'+Math.random().toString(36).substring(7)+'.pdf'
	const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
	const page = await browser.newPage();
	if ( typeof trustedkey === "undefined") {
		console.log('logging in needed')
		await page.goto('https://legacy.hometime.fr/quick-login', {waitUntil: 'networkidle0'});
        	await page.waitForSelector('input[name="password"]')
    		await page.type('input[name="password"]', PASSWORD)
   		await page.click('[type="submit"]')
  		//await page.waitForNavigation()
        	await page.waitForSelector('.navbar')
		console.log('login successfull')
	} else {	
		console.log('direct access through shared secret')
		await page.setExtraHTTPHeaders(
   			{'trustedkey': trustedkey, 'token': ACCOUNT}
		);	
	}
  	await page.goto('https://legacy.hometime.fr'+q.pathname, {waitUntil: 'networkidle0'})
        const pagetitle = await page.title();
	await page.pdf({path: filename, preferCSSPageSize: true, displayHeaderFooter: false, printBackground: true});

	await browser.close();

	fs.readFile('./'+filename, function(err, data) {
    		if (err) {
      		res.writeHead(404, {'Content-Type': 'text/html'});
      		res.write("file name :"+filename+"\n");
      		return res.end("404 Not Found");
    	} 
    	res.writeHead(200, {'Content-Type': 'application/pdf; name='+pagetitle+'.pdf', 'content-disposition': 'inline; filename='+pagetitle+'.pdf'});
    	res.write(data);
    	return res.end();
  	});
	fs.unlink('./'+filename, (err) => {
  		if (err) {
    			console.error(err);
    			return;
  		}
	});
	console.log('end of '+q.pathname+' management');
 })();
 }
}).listen(PORT);

