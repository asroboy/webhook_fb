var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var Analytics = require('analytics-node');
var analytics = new Analytics('kngf8THjj5e2QnLTdjfprebBW1KdQQbx');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));


// Facebook Webhook
app.get('/webhook', function (req, res) {
    console.log('res', res);

    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'testbot_verify_token') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});


// handler receiving messages
app.post('/webhook', function (req, res) {
        var events = req.body.entry[0].messaging;
        console.log("REQ", JSON.stringify(req.body));

        for (i = 0; i < events.length; i++) {
            var event = events[i];
            console.log("=======EVENT CHECK=======");
            //console.log('Sender ID: ', event.sender.id);
            console.log('Event ' + i + ': ', JSON.stringify(event));

            if (event.message && event.message.text && event.sender) {
                //console.log("=======MESSAGE=======");
                //console.log('Message : ', event.message.text);

                /**
                 * ACTIONS FOR QUICK REPLY
                 */
                if (event.message.quick_reply) {
                    console.log("=======QUICK REPLY=======");

                    var find_prefix = event.message.quick_reply.payload.split('_');
                    var payload_prefix = find_prefix[0];
                    console.log("payload_prefix", payload_prefix);

                    /**
                     * Check if payload REGISTER_PAYLOAD (old Get started) button
                     */
                    if (event.message.quick_reply.payload === 'REGISTER_PAYLOAD') {
                        console.log("Payload ", event.message.quick_reply.payload);
                        getResponseToUser(event.message.quick_reply.payload, event.sender.id, event.recipient.id);
                    }
                    /**
                     * Check if payload DEVELOPER (Get started) button
                     */
                    else if (payload_prefix === 'DEVELOPER') {
                        console.log("Payload ", event.message.quick_reply.payload);
                        pixel('QuickReply', event.message.text, event.message.quick_reply.payload, event.sender.id, event.recipient.id);
                        getResponseToUser(event.message.quick_reply.payload, event.sender.id, event.recipient.id);
                    }
                    /**
                     * Check if payload is BOT key
                     */
                    else if (payload_prefix === 'BOT' || payload_prefix === 'SHARE') {
                        console.log("Payload ", event.message.quick_reply.payload);
                        pixel('QuickReply', event.message.text, event.message.quick_reply.payload, event.sender.id, event.recipient.id);
                        getResponseToUser(event.message.quick_reply.payload, event.sender.id, event.recipient.id);
                    }
                    /**
                     * Check if payload is Multi BOT key(s)
                     */
                    else if ((payload_prefix === 'BOT' || payload_prefix === 'SHARE') && event.message.quick_reply.payload.indexOf(",") !== -1) {
                        var payloads = event.message.quick_reply.payload.split(",");
                        for (i = 0; i < payloads.length; i++) {
                            console.log("Payload " + i, payloads[i]);
                            pixel('QuickReply', event.message.text, payloads[i], event.sender.id, event.recipient.id);
                            getResponseToUser(payloads[i], event.sender.id, event.recipient.id);
                        }
                    }
                    /**
                     * MULTI KEY FORMAT [A]|[B]|BOT_xxxx_xxxx
                     */
                    else if (event.message.quick_reply.payload.indexOf("|") > -1) {
                        /**
                         * Split Payload marked with |
                         * @type {*}
                         */
                        var keys = event.message.quick_reply.payload.split("|");
                        console.log("Payload ", event.message.quick_reply.payload);
                        var action_name = keys[0];
                        action_name = action_name.replace("[", "");
                        action_name = action_name.replace("]", "");


                        if (keys.length == 2) {
                            keyIndexAction(keys[1], event, action_name, "QuickReply");
                        }
                        if (keys.length == 3) {
                            keyIndexAction(keys[1], event, action_name, "QuickReply");
                            keyIndexAction(keys[2], event, action_name, "QuickReply");
                        }

                        if (keys.length == 4) {
                            keyIndexAction(keys[1], event, action_name, "QuickReply");
                            keyIndexAction(keys[2], event, action_name, "QuickReply");
                            keyIndexAction(keys[3], event, action_name, "QuickReply");

                        }

                    }

                    //=====
                    /**
                     * if Payload is only text
                     */
                    else if (event.message.quick_reply.payload) {
                        console.log("QuickReply ", event.message.quick_reply.payload);
                        //var token = "";
                        //this is to handle print PAYLOAD to msgr room
                        pixel('QuickReply', event.message.text, event.message.quick_reply.payload, event.sender.id, event.recipient.id);
                        getToken(event.message.quick_reply.payload, event.recipient.id, event.sender.id);
                    }
                }

                /**
                 * ACTIONS FOR OTHERS
                 */
                else {
                    if (event.message.metadata) {
                        var jsonMeta = JSON.parse(event.message.metadata);
                        console.log('json meta', jsonMeta);
                        if (jsonMeta.ad_id) {
                            console.log("=======ADS REPLY=======");
                            getAdsResponseToUser(event.recipient.id, event.sender.id, jsonMeta.ad_id)
                        }
                    } else {
                        if (event.message.text) {
                            var request_key = event.message.text;
                            console.log("===== event.message.text ========");
                            // getResponseToUser(request_key, event.sender.id, event.recipient.id);
                        }
                    }
                }

            }

            /**
             * ACTIONS FOR OPTIN
             */
            if (event.optin) {
                var key = event.optin.ref;
                console.log(key)
                if (event.optin.user_ref) {
                    console.log(key)
                    // getResponseToUserRef(key, event.optin.user_ref, event.recipient.id);
                } else {
                    // getResponseToUser(key, event.sender.id, event.recipient.id);
                }

            }

            if (event.message && event.message.attachments) {
                console.log("===== event.message.text ========");
                console.log("===== NOTHING HERE ========");
                //var arr = JSON.parse(event.message.attachments);
                //getResponseToUser(event.message.attachments[0].payload.sticker_id, event.sender.id, event.recipient.id);
            }

            /**
             * ACTIONS FOR POSTBACK
             */
            if (event.postback) {
                console.log("===== event.postback ========");
                var find_prefix = event.postback.payload.split('_');
                var payload_prefix = find_prefix[0];
                // console.log("Index of , " + event.postback.payload.indexOf(","));
                if ((payload_prefix === 'BOT' || payload_prefix === 'SHARE') && (event.postback.payload.indexOf(",") > -1)) {
                    var payloads = event.postback.payload.split(",");
                    for (i = 0; i < payloads.length; i++) {
                        console.log("Payload " + i, payloads[i]);
                        pixel('PostBack', payloads[i], payloads[i], event.sender.id, event.recipient.id);
                        getResponseToUser(payloads[i], event.sender.id, event.recipient.id);
                    }
                }


                /**
                 * MULTI KEY FORMAT [A]|[B]|BOT_xxxx_xxxx
                 * MULTI KEY FORMAT [A]|[B]|[BOT_xxxx_xxxx]|BOT_xxx_xxx
                 */
                else if (event.postback.payload.indexOf("|") > -1) {
                    /**
                     * Split Payload marked with |
                     * @type {*}
                     */
                    var keys = event.postback.payload.split("|");
                    console.log("Payload ", event.postback.payload);
                    console.log("PAYLOAD KEY SIZE ", keys.length);

                    var action_name = keys[0]; //action name
                    action_name = action_name.replace("[", "");
                    action_name = action_name.replace("]", "");

                    if (keys.length == 2) {
                        keyIndexAction(keys[1], event, action_name, "PostBack");
                    }
                    if (keys.length == 3) {
                        keyIndexAction(keys[1], event, action_name, "PostBack");
                        keyIndexAction(keys[2], event, action_name, "PostBack");
                    }

                    if (keys.length == 4) {
                        keyIndexAction(keys[1], event, action_name, "PostBack");
                        keyIndexAction(keys[2], event, action_name, "PostBack");
                        keyIndexAction(keys[3], event, action_name, "PostBack");
                        // index_1_action(action_name, reply_text_or_bot_key, keys[2], "PostBack", event);
                    }

                }

                //***************
                else if (event.postback.payload === "USER_DEFINED_PAYLOAD") {
                    pixel('PostBack', "Get Started", event.postback.payload, event.sender.id, event.recipient.id);
                    getResponseToUser(event.postback.payload, event.sender.id, event.recipient.id);
                } else {
                    pixel('PostBack', event.postback.payload, event.postback.payload, event.sender.id, event.recipient.id);
                    getResponseToUserForPostback(event.postback.payload, event.sender.id, event.recipient.id);
                }


                if (event.postback.referral) {
                    var ref = event.postback.referral.ref;
                    var keys = ref.split("|");

                    // if (keys[0] === 'MESSAGE_ME') {
                    // getResponseToUser(ref,event.sender.id, event.recipient.id );
                    getToken(ref, event.recipient.id, event.sender.id);
                    // }
                }

            }


            if (event.referral) {
                var ref = event.referral.ref;
                var keys = ref.split("|");

                // if (keys[0] === 'MESSAGE_ME') {
                    // getResponseToUser(ref,event.sender.id, event.recipient.id );
                    getToken(ref, event.recipient.id, event.sender.id);
                // }
            }
        }
        res.sendStatus(200);
    }
);


function keyIndexAction(key, event, action_name, event_name) {
    // var key_1 = keys[1]; //reply text or maybe bot key  INDEX 1
    if (key.indexOf("]") > -1) {

        key = key.replace("[", "");
        key = key.replace("]", "");
        var reply_text = key;
        if (reply_text.indexOf("_") > -1) {
            var prefix = reply_text.split('_');
            var p_prefix = prefix[0];
            if ((p_prefix === 'BOT' || p_prefix === 'SHARE') && reply_text.indexOf(",") > -1) {
                var payloads = reply_text.split(",");
                for (i = 0; i < payloads.length; i++) {
                    console.log("Payload " + i, payloads[i]);
                    pixel(event_name, action_name, payloads[i], event.sender.id, event.recipient.id);
                    if (event_name === "PostBack") {
                        getResponseToUserForPostback(payloads[i], event.sender.id, event.recipient.id);
                    } else {
                        var resp = getResponseToUser(payloads[i], event.sender.id, event.recipient.id);
                        console.log("GET RESPONSE TO USER : ", resp);
                    }
                }
            } else {
                pixel(event_name, action_name, reply_text, event.sender.id, event.recipient.id);
                if (event_name === "PostBack") {
                    getResponseToUserForPostback(reply_text, event.sender.id, event.recipient.id);
                } else {
                    getResponseToUser(reply_text, event.sender.id, event.recipient.id);

                }
            }
        } else {
            if (reply_text !== "")
                getToken(reply_text, event.recipient.id, event.sender.id);
        }

    } else {
        if (key.indexOf("_") > -1) {
            var prefix = key.split('_');
            var p_prefix = prefix[0];
            if ((p_prefix === 'BOT' || p_prefix === 'SHARE') && key.indexOf(",") > -1) {
                var payloads = key.split(",");
                for (i = 0; i < payloads.length; i++) {
                    console.log("Payload " + i, payloads[i]);
                    pixel(event_name, action_name, payloads[i], event.sender.id, event.recipient.id);
                    if (event_name === "PostBack") {
                        getResponseToUserForPostback(payloads[i], event.sender.id, event.recipient.id);
                    } else {
                        getResponseToUser(payloads[i], event.sender.id, event.recipient.id);
                    }
                }
            } else if ((p_prefix === 'BOT' || p_prefix === 'SHARE')) {
                pixel(event_name, action_name, key, event.sender.id, event.recipient.id);
                if (event_name === "PostBack") {
                    getResponseToUserForPostback(key, event.sender.id, event.recipient.id);
                } else {
                    var resp = getResponseToUser(key, event.sender.id, event.recipient.id);
                    console.log("GET RESPONSE TO USER : ", resp);
                }
            }
        } else {
            if (key !== "")
                getToken(key, event.recipient.id, event.sender.id);
        }
    }
}


app.get('/callback', function (req, res) {
    if (req.query['token'] === 'test') {
        res.send('OKE');
    } else {
        res.send('Invalid verify token');
    }
});

app.get('/test', function (req, res) {
    if (req.query['token'] === 'test') {
        helooTest(callback());
        res.send('HALOOO');
    } else {
        res.send('Invalid verify token');
    }
});


function looper() {
    var z = 0;
    while (helooTest(callback()) !== "" && z < 10) {
        z++;
        console.log("oke " + z);
    }
}

function callback() {
    console.log("callback");
}

function helooTest(callback) {
    var url = 'http://localhost:3000/callback?token=test';
    console.log('url', url);
    var result = "";
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
            result = "error";
            return result;
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
            result = "error";
            return result;
        } else {
            result = "oke";
            return result;
        }
    });

}


function pixel(event_name, name, key, messenger_id, page_id) {
    var url = 'http://halfcup.com/social_rebates_system/pixel/index?name=' + name + '&event_name=' + event_name + '&key=' + key + '&messenger_id=' + messenger_id + '&page_id=' + page_id;

    analytics.track({
        userId: 'f4ca124298',
        event: event_name,
        properties: {
            name: name,
            key: key,
            messenger_id: messenger_id,
            page_id: page_id
        }
    });

    console.log('url_pixel', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            console.log('PIXEL', 'Successfully send');
            // console.log('PIXEL', body);
        }
    });
    logAction(event_name, name, key, messenger_id, page_id);
}

function logAction(event_name, name, key, messenger_id, page_id) {
    var url = 'http://halfcup.com/social_rebates_system/hcApi/saveMessengerAction?messenger_id=' + page_id + '&action_name=' + name + '&payload=' + key + '&user_msg_id=' + messenger_id;

    console.log('url user action', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            console.log('USER ACTION', 'Successfully send');
            // console.log('PIXEL', body);
        }
    });
}

function getUserInfo(user_msg_id, page_token) {
    var url = 'https://graph.facebook.com/v2.6/' + user_msg_id + '?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=' + page_token;
    console.log('url', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            var obj = JSON.parse(body);
            console.log('json: ', obj);
            var code = obj.code;
            if (code == 1) {
                var token = obj.messenger_data.pageAccessToken;
                var message = {"text": m_payload};
                sendMessage(recipient, message, token);
            }
            if (code == 0) {
                console.log('TOKEN NOT FOUND, Get page access token from facebook developer page and register to http://halfcup.com/social_rebates_system');
            }
        }
    });
}

function getToken(m_payload, sender, recipient) {
    var url = 'http://halfcup.com/social_rebates_system/api/getPageMessengerToken?messenger_id=' + sender + '&messenger_uid=' + recipient;
    console.log('url', url);
    request({
            url: url,
            method: 'GET'
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            } else {
                var obj = JSON.parse(body);
                console.log('json: ', obj);
                var code = obj.code;
                if (code == 1) {
                    var token = obj.messenger_data.pageAccessToken;
                    // if (m_payload.indexOf("\n") > -1) {
                    //     var msgs = m_payload.split("\n");
                    //     for (i = 0; i < msgs.length; i++) {
                    //         // var m = msgs[i].replace(/\n/g, "\\\\n")
                    //         var message = {"text": msgs[i]};
                    //         var js_ = JSON.stringify(message);
                    //         var myEscapedJSONString = js_.escapeSpecialChars();
                    //         myEscapedJSONString = myEscapedJSONString.replace(/\\\\n/g, "\\n");
                    //         console.log("TEXT ==> " + myEscapedJSONString);
                    //         sendMessage(recipient, myEscapedJSONString, token);
                    //     }
                    // } else {

                    // m_payload.replace(/\n/g, "\\\\n");
                    var message = {"text": m_payload};
                    var js_ = JSON.stringify(message);
                    var myEscapedJSONString = js_.escapeSpecialChars();
                    myEscapedJSONString = myEscapedJSONString.replace(/\\\\n/g, "\\n");
                    console.log("TEXT ==> " + myEscapedJSONString);
                    sendMessage(recipient, myEscapedJSONString, token);
                    // }

                }
                if (code == 0) {
                    console.log('Can\'t send message, TOKEN NOT FOUND, Get page access token from facebook developer page and register to http://halfcup.com/social_rebates_system');
                }

            }
        }
    );
}

function getAdsResponseToUser(recipient, sender, ads_id) {

    var result = "";
    var url = 'http://halfcup.com/social_rebates_system/api/getBotAdsResponseMessage?messenger_id=' + sender + '&ads_id=' + ads_id + '&messenger_uid=' + recipient;
    console.log('url', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
            result = 'Error sending message: ' + error;
            return result;
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            var obj = JSON.parse(body);
            console.log('json: ', obj);
            var code = obj.code;
            if (code == 1) {
                var token = obj.messenger_data.pageAccessToken;
                result = sendMessage(recipient, obj.data.jsonData, token);
                return result;
            }
            if (code == 0) {
                var token = obj.messenger_data.pageAccessToken;
                //sendMessage(recipient, {"text" : "Sorry I don't understand what do you want"}, token);
                result = JSON.stringify(response);
                return result;
            }

        }
    });
}

function getResponseToUser(request_key, recipient, sender) {
    var result = "";
    var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id=' + sender + '&request_key=' + request_key + '&messenger_uid=' + recipient;
    console.log('url', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            var obj = JSON.parse(body);
            var code = obj.code;
            if (code == 1) {
                var token = obj.messenger_data.pageAccessToken;
                // var json_data = obj.data.jsonData.replace(/\n/g, "\\\\n");
                var myEscapedJSONString = obj.data.jsonData.escapeSpecialChars();
                myEscapedJSONString = myEscapedJSONString.replace(/\\\\n/g, "\\n");
                console.log('jsonData: ', myEscapedJSONString);
                result = sendMessage(recipient, myEscapedJSONString, token);
                return result;
            }
            if (code == 0) {
                getResponseToUserWithNoKey(recipient, sender);
            }

        }
    });
}

function getResponseToUserForPostback(request_key, recipient, sender) {

    var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id=' + sender + '&request_key=' + request_key + '&messenger_uid=' + recipient;
    console.log('url', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            var obj = JSON.parse(body);
            console.log('json: ', obj);
            var code = obj.code;
            if (code == 1) {
                var token = obj.messenger_data.pageAccessToken;
                // var js_ = JSON.stringify(obj.data.jsonData);
                var myEscapedJSONString = obj.data.jsonData.escapeSpecialChars();
                myEscapedJSONString = myEscapedJSONString.replace(/\\\\n/g, "\\n");
                console.log('jsonData: ', myEscapedJSONString);
                sendMessage(recipient, myEscapedJSONString, token);
            }
            if (code == 0) {
                var token = obj.messenger_data.pageAccessToken;
                // getResponseToUserWithNoKey(recipient, sender);
                // if (!(request_key.indexOf("BOT") > -1) && !(request_key.indexOf("USER_DEFINED_PAYLOAD") > -1)) {

                var message = {"text": request_key};
                var js_ = JSON.stringify(message);
                var myEscapedJSONString = js_.escapeSpecialChars();
                myEscapedJSONString = myEscapedJSONString.replace(/\\\\n/g, "\\n");
                console.log("TEXT ==> " + myEscapedJSONString);
                sendMessage(recipient, myEscapedJSONString, token);
                // }

            }

        }
    });
}

String.prototype.escapeSpecialChars = function () {
    return this.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\r|\n/g, "\\n")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
};

function getResponseToUserRef(request_key, recipient, sender) {

    var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id=' + sender + '&request_key=' + request_key + '&messenger_uid=' + recipient;
    console.log('url', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            var obj = JSON.parse(body);
            console.log('json: ', obj);
            var code = obj.code;
            if (code == 1) {
                var token = obj.messenger_data.pageAccessToken;
                sendMessageUserRef(recipient, obj.data.jsonData, token);
            }
            if (code == 0) {
                var token = obj.messenger_data.pageAccessToken;
                //getResponseToUserWithNoKey(recipient, sender);
                //sendMessage(recipient, {"text" : "Sorry I don't understand what do you want"}, token);
            }

        }
    });
}

function getResponseToUserWithNoKey(recipient, sender) {
    var result = "";
    var url = 'http://halfcup.com/social_rebates_system/api/getResponseMessage?messenger_id=' + sender + '&request_key=' + sender + '&messenger_uid=' + recipient;
    console.log('url', url);
    request({
        url: url,
        method: 'GET'
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
            result = 'Error sending message: ' + error;
            return result;
        } else if (response.body.error) {
            console.log('Error : ', response.body.error);
            result = 'Error : ' + response.body.error;
            return result;
        } else {
            var obj = JSON.parse(body);
            console.log('json: ', obj);
            var code = obj.code;
            if (code == 1) {
                var token = obj.messenger_data.pageAccessToken;
                sendMessage(recipient, obj.data.jsonData, token);
            }
            if (code == 0) {
                var token = obj.messenger_data.pageAccessToken;
                //sendMessage(recipient, {"text" : "Sorry I don't understand what do you want"}, token);
            }
            result = JSON.stringify(response);
            return result;
        }
    });
}

app.get('/send', function (req, res) {
    //var userId = location.search.split('user_id=')[0]
    var recipientId = req.query.user_id; // $_GET["id"]
    //'1193481570735913'
    var token = "";
    sendMessage(recipientId, {text: "Echo: Selamat Datang " + recipientId}, token);
    res.send('OK ' + recipientId);
});

app.get('/send_multiple', function (req, res) {
    //var userId = location.search.split('user_id=')[0]
    var recipientIds = req.query.user_ids.split(','); // $_GET["id"]
    var messages = req.query.message; // $_GET["id"]
    //'1193481570735913'
    var token = req.query.token;
    for (i = 0; i < recipientIds.length; i++) {
        sendMessage(recipientIds[i], messages, token);
    }
    res.send('OK, Sent to :' + req.query.user_ids);
});

// generic function sending messages
function sendMessage(recipientId, message, token) {
    //console.log(process); process.env.PAGE_ACCESS_TOKEN

    var result = "";
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
            result = 'Error sending message: ' + error;
            return result;
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
            result = 'Error: ' + response.body.error;
            return result;
        } else {
            // console.log('============ ' + response + ' =========== ');
            result = JSON.stringify(response);
            return result;
        }
    });
};
// generic function sending messages
function sendMessageUserRef(recipientId, message, token) {
    //console.log(process); process.env.PAGE_ACCESS_TOKEN
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {user_ref: recipientId},
            message: message,
        }
    }, function (error, response, body) {
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
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// }).listen(1337, "127.0.0.1");
// console.log('Server running at http://127.0.0.1:1337/');