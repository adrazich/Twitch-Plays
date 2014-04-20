(function(){
	"use strict";

	// node requirements: express, mongodb, mongojs, irc
	var express = require('express');
	var app = express();
	
	// Storing to mongo db
	var mongojs = require('mongojs');
	var collections = ['messages'];
	var databaseUrl = 'localhost';
	var db = mongojs(databaseUrl, collections);
	
	// "bot" is your twitch username
	var irc = require('irc');
	var client = new irc.Client('irc.twitch.tv', 'bot', {
		userName: 'bot',
		port: 6667,
		debug: true,
    	showErrors: true,
    	secure: false,
		channels: ['#twitch']
	});

	client.send('PASS', 'bot oauth:youroauthcodehere'); // get an oauth code on twitch's website
	client.send('JOIN', '#twitch');	// join which channels you want

	if (!Date.now){
		Date.now = function() { return new Date().getTime(); };
	}

	// Add a message to mongodb when a message is sent
	client.addListener('message', function (from, to, message) {
		console.log(from + ' => ' + to + ': ' + message);

		// store messages from specific channels
		if (to === '#twitch'){
			db.messages.insert({ 
				message: message, 
				from: from, 
				to: to,
				timestamp: Date.now()
			},function (err, inserted){
				console.log(err+' : '+inserted)
			});
		}
	});

	client.addListener('error', function(message) {
	    console.log('error: ', message);
	});

	// API Route that shows all messages sent to the channel you joined
	app.get('/api/messages', function(request, response){
		// desc: -1, asc: 1
		db.messages.find({}).sort({ timestamp:-1 }).toArray(function(err, docs){
			response.json(200, { messages: docs, error:err });
		});		
	});

	app.listen(8080);
}).call(this);