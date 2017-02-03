var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));


// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
		console.log("=======EVENT CHECK=======");
		console.log('Sender ID: ', event.sender.id);
		console.log('Event : ', JSON.stringify(event));
		
        if (event.message && event.message.text) {
			console.log("=======MESSAGE=======");
		    console.log('Message : ', event.message.text);
			if(event.message.metadata){
				var jsonMeta = JSON.parse(event.message.metadata);
				console.log('json meta', jsonMeta);
				if(jsonMeta.ad_id){
						console.log("=======ADS REPLY=======");
						console.log("Sender ID ",event.sender.id );
						console.log("Recipient ID ",event.recipient.id );
						getResponseToUser('ads', event.recipient.id, event.sender.id);
				}
			}else{
				if(event.message.text){
					var request_key = event.message.text;
					var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id='+event.recipient.id+'&request_key='+request_key;
					console.log("=======GET REPONSE JSON=======");
					console.log('url', url);
					request({
						url: url,
						method: 'GET'
					}, function(error, response, body) {
						if (error) {
							console.log('Error sending message: ', error);
						} else if (response.body.error) {
							console.log('Error: ', response.body.error);
						}else{
							var obj = JSON.parse(body);
							console.log('json: ', obj);
							var code = obj.code;
							if(code == 1){
									sendMessage(event.sender.id, obj.data.jsonData);
							}
							if(code == 0){
									sendMessage(event.sender.id, {"text" : "Sorry I don't understand what do you want"});
							}
						
						}
					});
				}
			}
			
			if(event.message.quick_replies){
				if(event.message.quick_replies.payload == 'REGISTER_PAYLOAD'){
					getResponseToUser(event.message.quick_replies.payload, event.sender.id, event.recipient.id);
				}else{
					firstMessage(event.sender.id);
				}
			}
        }
		
		if(event.postback){
				getResponseToUser(event.postback.payload, event.sender.id, event.recipient.id);
		}
    }
    res.sendStatus(200);
});


function getResponseToUser(request_key, recipient, sender){
		
				var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id='+sender+'&request_key='+request_key;
				console.log('url', url);
				request({
					url: url,
					method: 'GET'
				}, function(error, response, body) {
					if (error) {
						console.log('Error sending message: ', error);
					} else if (response.body.error) {
						console.log('Error: ', response.body.error);
					}else{
						var obj = JSON.parse(body);
						console.log('json: ', obj);
						var code = obj.code;
						if(code == 1){
								sendMessage(recipient, obj.data.jsonData);
						}
						if(code == 0){
								sendMessage(recipient, {"text" : "Sorry I don't understand what do you want"});
						}
					
					}
				});
}

app.get('/send', function(req, res){
	 //var userId = location.search.split('user_id=')[0]
		var recipientId = req.query.user_id; // $_GET["id"]
		//'1193481570735913'
		sendMessage(recipientId, {text: "Echo: Selamat Datang " + recipientId});
		res.send('OK ' + recipientId);
});

app.get('/send_multiple', function(req, res){
	 //var userId = location.search.split('user_id=')[0]
		var recipientIds = req.query.user_ids.split(','); // $_GET["id"]
		//'1193481570735913'
		for (i = 0; i < recipientIds.length; i++) { 
			sendMessage(recipientIds[i], {text: "Echo: Selamat Datang " + recipientIds[i]});
		}
		res.send('OK, Sent to :' + req.query.user_ids);
});


// send rich message with kitten
function firstMessage(recipientId) {
            message = {
		"attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": "Hi, Welcome. Start connect with us by click Start Register",
                        "image_url": "http://www.flowerseedsexpert.co.uk/wp-content/uploads/2016/06/business-support.jpg",
                        "subtitle": "",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Start Register",
                                "payload": "REGISTER_PAYLOAD"
                            }
                        ]
                    }
                ]
            }
        },
        "quick_replies": [
            {
                "content_type": "text",
                "title": "Start Register",
                "payload": "REGISTER_PAYLOAD"
            }
        ]
    };
            sendMessage(recipientId, message);
};

// generic function sending messages
function sendMessage(recipientId, message) {
	//console.log(process);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// generic function sending messages
function sendMessagePostback(recipientId, message) {
	//console.log(process);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messaging_postbacks',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};