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
		
        if (event.message && event.message.text && event.sender) {
			//console.log("=======MESSAGE=======");
		    //console.log('Message : ', event.message.text);
			if(event.message.quick_reply){
				console.log("=======QUICK REPLY=======");
				var find_prefix = event.message.quick_reply.payload.split('_');
				var payload_prefix = find_prefix[0];
				console.log("payload_prefix", payload_prefix);
				if(event.message.quick_reply.payload === 'REGISTER_PAYLOAD'){
					console.log("Payload " , event.message.quick_reply.payload);
					getResponseToUser(event.message.quick_reply.payload, event.sender.id, event.recipient.id);
				}else if(payload_prefix==='DEVELOPER'){
					console.log("Payload " , event.message.quick_reply.payload);
					getResponseToUser(event.message.quick_reply.payload, event.sender.id, event.recipient.id);
				}else if(event.message.quick_reply.payload){
					console.log("Payload " , event.message.quick_reply.payload);
					//var token = "";
					//this is to handle print PAYLOAD to msgr room
					getToken(event.message.quick_reply.payload,event.recipient.id, event.sender.id)
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
							console.log("===== event.message.text ========");
							getResponseToUser(request_key, event.sender.id, event.recipient.id);
						}
					}
			}
			
        }
		
		//{"recipient":{"id":"228431964255924"},"timestamp":1488613622152,"sender":{"id":"877390472364218"},"optin":{"ref":"PASS_THROUGH_PARAM"}}
		if (event.optin){
			var key = event.optin.ref;
			if(event.optin.user_ref){
				getResponseToUser(key,event.optin.user_ref , event.recipient.id);
			}else{
				getResponseToUser(key, event.sender.id, event.recipient.id);
			}
			
		}
		if (event.message && event.message.attachments){
			console.log("===== event.message.text ========");
			console.log("===== NOTHING HERE ========");
			//var arr = JSON.parse(event.message.attachments);
			//getResponseToUser(event.message.attachments[0].payload.sticker_id, event.sender.id, event.recipient.id);
		}
		if(event.postback){
			console.log("===== event.postback ========");
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