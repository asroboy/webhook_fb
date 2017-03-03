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
		//console.log('Sender ID: ', event.sender.id);
		console.log('Event : ', JSON.stringify(event));
		
        if (event.message && event.message.text) {
			//console.log("=======MESSAGE=======");
		    //console.log('Message : ', event.message.text);
			if(event.message.quick_reply){
				console.log("=======QUICK REPLY=======");
				var find_prefix = event.message.quick_reply.payload.split('_');
				var payload_prefix = find_prefix[0];
				console.log("payload_prefix", payload_prefix);
				if(event.message.quick_reply.payload === 'REGISTER_PAYLOAD'){
					getResponseToUser(event.message.quick_reply.payload, event.sender.id, event.recipient.id);
				}else if(payload_prefix==='DEVELOPER'){
					getResponseToUser(event.message.quick_reply.payload, event.sender.id, event.recipient.id);
				}else if(event.message.quick_reply.payload){
					//var token = "";
					getToken(event.message.quick_reply.payload,event.recipient.id, event.sender.id)
					//firstMessage(event.sender.id);
				}
			}else{
					if(event.message.metadata){
						var jsonMeta = JSON.parse(event.message.metadata);
						console.log('json meta', jsonMeta);
						if(jsonMeta.ad_id){
								console.log("=======ADS REPLY=======");
								getAdsResponseToUser(event.recipient.id, event.sender.id, jsonMeta.ad_id)
						}
					}else{
						if(event.message.text){
							var request_key = event.message.text;
							var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id='+event.recipient.id+'&request_key='+request_key+'&messenger_uid=' + event.sender.id;
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
											var token = obj.messenger_data.pageAccessToken;
											sendMessage(event.sender.id, obj.data.jsonData, token);
									}
									if(code == 0){
											var token = obj.messenger_data.pageAccessToken;
											getResponseToUserWithNoKey(event.sender.id, event.recipient.id);
											//sendMessage(event.sender.id, {"text" : "Sorry I don't understand what do you want"}, token);
									}
								
								}
							});
						}
					}
			}
			
        }
		if (event.message && event.message.attachments){
			//var arr = JSON.parse(event.message.attachments);
			getResponseToUser(event.message.attachments[0].payload.sticker_id, event.sender.id, event.recipient.id);
		}
		if(event.postback){
				getResponseToUser(event.postback.payload, event.sender.id, event.recipient.id);
		}
    }
    res.sendStatus(200);
});


function getUserInfo(user_msg_id, page_token){
	var url = 'https://graph.facebook.com/v2.6/'+user_msg_id+'?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token='+ page_token;
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
								var token = obj.messenger_data.pageAccessToken;
								var message ={"text":m_payload};
								sendMessage(recipient, message , token);
						}
						if(code == 0){
								console.log('TOKEN NOT FOUND, Get page access token from facebook developer page and register to http://halfcup.com/social_rebates_system');
						}
					}
				});
}

function getToken(m_payload, sender, recipient){
	var url = 'http://halfcup.com/social_rebates_system/api/getPageMessengerToken?messenger_id='+sender+'&messenger_uid=' + recipient;
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
								var token = obj.messenger_data.pageAccessToken;
								var message ={"text":m_payload};
								sendMessage(recipient, message , token);
						}
						if(code == 0){
								console.log('Can\'t send message, TOKEN NOT FOUND, Get page access token from facebook developer page and register to http://halfcup.com/social_rebates_system');
						}
					
					}
				});
}

function getAdsResponseToUser(recipient, sender, ads_id){
		
				var url = 'http://halfcup.com/social_rebates_system/api/getBotAdsResponseMessage?messenger_id='+sender+'&ads_id='+ads_id+'&messenger_uid=' + recipient;
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
								var token = obj.messenger_data.pageAccessToken;
								sendMessage(recipient, obj.data.jsonData, token);
						}
						if(code == 0){
								var token = obj.messenger_data.pageAccessToken;
								//sendMessage(recipient, {"text" : "Sorry I don't understand what do you want"}, token);
						}
					
					}
				});
}


function getResponseToUser(request_key, recipient, sender){
		
				var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id='+sender+'&request_key='+request_key+'&messenger_uid=' + recipient;
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
								var token = obj.messenger_data.pageAccessToken;
								sendMessage(recipient, obj.data.jsonData, token);
						}
						if(code == 0){
								var token = obj.messenger_data.pageAccessToken;
								getResponseToUserWithNoKey(recipient, sender);
								//sendMessage(recipient, {"text" : "Sorry I don't understand what do you want"}, token);
						}
					
					}
				});
}

function getResponseToUserWithNoKey( recipient, sender){
		
				var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id='+sender+'&request_key='+sender+'&messenger_uid=' + recipient;
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
								var token = obj.messenger_data.pageAccessToken;
								sendMessage(recipient, obj.data.jsonData, token);
						}
						if(code == 0){
								var token = obj.messenger_data.pageAccessToken;
								//sendMessage(recipient, {"text" : "Sorry I don't understand what do you want"}, token);
						}
					
					}
				});
}

app.get('/send', function(req, res){
	 //var userId = location.search.split('user_id=')[0]
		var recipientId = req.query.user_id; // $_GET["id"]
		//'1193481570735913'
		var token = "";
		sendMessage(recipientId, {text: "Echo: Selamat Datang " + recipientId}, token);
		res.send('OK ' + recipientId);
});

app.get('/send_multiple', function(req, res){
	 //var userId = location.search.split('user_id=')[0]
		var recipientIds = req.query.user_ids.split(','); // $_GET["id"]
		//'1193481570735913'
		var token = "";
		for (i = 0; i < recipientIds.length; i++) { 
			sendMessage(recipientIds[i], {text: "Echo: Selamat Datang " + recipientIds[i]}, token);
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
function sendMessage(recipientId, message, token) {
	//console.log(process); process.env.PAGE_ACCESS_TOKEN
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
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
function sendMessagePostback(recipientId, message, token) {
	//console.log(process); process.env.PAGE_ACCESS_TOKEN
    request({
        url: 'https://graph.facebook.com/v2.6/me/messaging_postbacks',
        qs: {access_token: token},
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