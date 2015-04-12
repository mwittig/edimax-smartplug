var util = require('util'),
    http = require('http'),
    _ = require('lodash'),
    xpath = require('xpath'),
    xmldom = require('xmldom'),
    Promise = require('bluebird'),
    commandTemplateString = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="%s"><CMD id="%s">%s</CMD></SMARTPLUG>',
    lastRequest = Promise.resolve(),
    debug = process.env.hasOwnProperty('EDIMAX_DEBUG')?consoleDebug:function(){};


function createCommandString(deviceName, command, commandXml) {
    return util.format(commandTemplateString, deviceName, command, commandXml);
}

function consoleDebug() {
    console.log.apply(this, arguments)
}

function postRequest(command, options) {
    var requestOptions = _.assign({
            port: 10000,
            path: 'smartplug.cgi',
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
                'Content-Length': command.length
            },
            name: 'edimax',
            username: 'admin',
            password: '1234'
        }, options);

    requestOptions.headers['Authorization'] =
        "Basic " + new Buffer(requestOptions.username + ":" + requestOptions.password).toString("base64");

    debug('REQUEST: ' + JSON.stringify(requestOptions));

    return new Promise(function (resolve, reject) {
        var postReq = http.request(requestOptions, function (response) {
            debug('STATUS: ' + response.statusCode);
            debug('HEADERS: ' + JSON.stringify(response.headers));
            var contentLength = response.headers['content-length'];
            if (_.isUndefined(contentLength) || _.parseInt(contentLength) === 0) {
                postReq.emit('error', new Error("No such device: check name"));
            }
            response.setEncoding('utf8');
            response.on('data', function (result) {
                debug("DATA", result);
                var doc = new xmldom.DOMParser().parseFromString(result, 'text/xml');
                resolve(doc);
            });
        }).on('error', function (error) {
            debug('ERROR:' + 'Host ' + requestOptions.host + ' ' + error);
            reject(error);
        });

        postReq.write(command);
        postReq.end();
    });
}

module.exports.getSwitchState = function (options) {
    var commandString = createCommandString(options.name, "get", "<Device.System.Power.State/>");
    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, options).then(function (responseDom) {
            return Promise.resolve(
                /^ON$/.test(xpath.select("//Device.System.Power.State/text()", responseDom).toString())); // true if on
        })
    });
};

module.exports.setSwitchState = function (state, options) {
    var command = util.format("<Device.System.Power.State>%s</Device.System.Power.State>", state ? "ON" : "OFF"),
        commandString = createCommandString(options.name, "setup", command);

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, options).then(function () {
            return Promise.resolve();
        })
    });
};
