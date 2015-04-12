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

    debug('REQUEST OPTIONS: ' + JSON.stringify(requestOptions));
    debug('REQUEST: ' + command);

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

module.exports.getSwitchPower = function (options) {
    var commandString = createCommandString(options.name, "get",
        "<NOW_POWER><Device.System.Power.NowPower/></NOW_POWER>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, options).then(function (responseDom) {
            return Promise.resolve(
                parseFloat(xpath.select("//Device.System.Power.NowPower/text()", responseDom).toString())
            );
        })
    });
};

module.exports.getAll = function (options) {
    var commandString = createCommandString(options.name, "get", "<Device.System.Power.State/><NOW_POWER/>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, options).then(function (responseDom) {
                var toggleTime = xpath.select("//Device.System.Power.LastToggleTime/text()", responseDom).toString(),
                    date = (toggleTime.length === 14)?
                        new Date(
                            toggleTime.substring(0,4),
                            parseInt(toggleTime.substring(4,6))-1,
                            toggleTime.substring(6,8),
                            toggleTime.substring(8,10),
                            toggleTime.substring(10,12),
                            toggleTime.substring(12,14)
                        ):new date();

            return Promise.resolve({
                lastToggleTime: date,
                state: /^ON$/.test(xpath.select("//Device.System.Power.State/text()", responseDom).toString()),
                nowPower: parseFloat(xpath.select("//Device.System.Power.NowPower/text()", responseDom).toString()),
                nowCurrent: parseFloat(xpath.select("//Device.System.Power.NowCurrent/text()", responseDom).toString()),
                day: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Day/text()", responseDom).toString()),
                week: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Week/text()", responseDom).toString()),
                month: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Month/text()", responseDom).toString())
            });
        })
    });
};

module.exports.getSwitchEnergy = function (options) {
    var commandString = createCommandString(options.name, "get",
        "<NOW_POWER><Device.System.Power.NowEnergy.Day/><Device.System.Power.NowEnergy.Week/><Device.System.Power.NowEnergy.Month/></NOW_POWER>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, options).then(function (responseDom) {
            return Promise.resolve({
                day: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Day/text()", responseDom).toString()),
                week: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Week/text()", responseDom).toString()),
                month: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Month/text()", responseDom).toString())
            });
        })
    });
};

module.exports.getDeviceInfo = function (options) {
    var commandString = createCommandString(options.name, "get",
        "<SYSTEM_INFO><Run.Cus/><Run.Model/><Run.FW.Version/></SYSTEM_INFO>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, options).then(function (responseDom) {
            return Promise.resolve({
                vendor: xpath.select("//Run.Cus/text()", responseDom).toString(),
                model: xpath.select("//Run.Model/text()", responseDom).toString(),
                fwVersion: xpath.select("//Run.FW.Version/text()", responseDom).toString()
            });
        })
    });
};