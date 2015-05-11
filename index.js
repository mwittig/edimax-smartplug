var util = require('util'),
    http = require('http'),
    _ = require('lodash'),
    xpath = require('xpath'),
    xmldom = require('xmldom'),
    Promise = require('bluebird'),
    commandTemplateString = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="%s"><CMD id="%s">%s</CMD></SMARTPLUG>',
    lastRequest = Promise.resolve(),
    debug = process.env.hasOwnProperty('EDIMAX_DEBUG') ? consoleDebug : function () {
    };

//
// Private Help Functions
//

function createCommandString(deviceName, command, commandXml) {
    return util.format(commandTemplateString, deviceName, command, commandXml);
}

function consoleDebug() {
    console.log.apply(this, arguments)
}

function assignDefaultCommandOptions(options) {
    return _.assign({
        name: 'edimax'
    }, options)
}

function postRequest(command, options) {
    var requestOptions = _.assign({
            timeout: 20000,
            port: 10000,
            path: 'smartplug.cgi',
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
                'Content-Length': command.length
            },
            username: 'admin',
            password: '1234'
        }, options),
        timeoutOccurred = false;

    requestOptions.headers['Authorization'] =
        "Basic " + new Buffer(requestOptions.username + ":" + requestOptions.password).toString("base64");

    debug('REQUEST OPTIONS: ' + JSON.stringify(requestOptions));
    debug('REQUEST: ' + command);

    return new Promise(function (resolve, reject) {
        var data = "",
            postReq = http.request(requestOptions, function (response) {
                debug('STATUS: ' + response.statusCode);
                debug('HEADERS: ' + JSON.stringify(response.headers));

                var error;
                if (response.statusCode >= 300) {
                    if (response.statusCode === 401) {
                        error = new Error("Unauthorized: check username/password");
                    }
                    else {
                        error = new Error("Request failed. HTTP Status Code: " + response.statusCode);
                    }
                    debug('ERROR:' + 'Host ' + requestOptions.host + ' ' + error);
                    return reject(error);
                }
                var contentLength = response.headers['content-length'];
                if (_.isUndefined(contentLength) || _.parseInt(contentLength) === 0) {
                    error = new Error("No such device: check name");
                    debug('ERROR:' + 'Host ' + requestOptions.host + ' ' + error);
                    return reject(error);
                }

                response.setEncoding('utf8');
                response.on('data', function (result) {
                    debug("DATA CHUNK", result);
                    data += result;
                });
                response.on('end', function () {
                    debug("END");
                    var doc = new xmldom.DOMParser().parseFromString(data, 'text/xml');
                    return resolve(doc);
                });
            }).on('error', function (error) {
                if (timeoutOccurred) {
                    error = new Error("Request timeout occurred - request aborted");
                }
                debug('ERROR:' + 'Host ' + requestOptions.host + ' ' + error);
                postReq.abort();
                return reject(error);
            }).on('timeout', function () {
                timeoutOccurred = true;
                postReq.abort();
            });
        postReq.setTimeout(requestOptions.timeout);
        postReq.write(command);
        postReq.end();
    });
}

//
// Public Functions
//

module.exports.getSwitchState = function (options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get", "<Device.System.Power.State/>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            return Promise.resolve(
                /^ON$/.test(xpath.select("//Device.System.Power.State/text()", responseDom).toString())); // true if on
        })
    });
};

module.exports.setSwitchState = function (state, options) {
    var commandOptions = assignDefaultCommandOptions(options),
        command = util.format("<Device.System.Power.State>%s</Device.System.Power.State>", state ? "ON" : "OFF"),
        commandString = createCommandString(commandOptions.name, "setup", command);

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, commandOptions).then(function () {
            return Promise.resolve();
        })
    });
};

module.exports.getSwitchPower = function (options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get",
            "<NOW_POWER><Device.System.Power.NowPower/></NOW_POWER>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            return Promise.resolve(
                parseFloat(xpath.select("//Device.System.Power.NowPower/text()", responseDom).toString())
            );
        })
    });
};

module.exports.getSwitchEnergy = function (options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get",
            "<NOW_POWER><Device.System.Power.NowEnergy.Day/><Device.System.Power.NowEnergy.Week/><Device.System.Power.NowEnergy.Month/></NOW_POWER>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            return Promise.resolve({
                day: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Day/text()", responseDom).toString()),
                week: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Week/text()", responseDom).toString()),
                month: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Month/text()", responseDom).toString())
            });
        })
    });
};

module.exports.getStatusValues = function (withMetering, options) {
    var commandOptions = assignDefaultCommandOptions(options),
        command = withMetering ? "<Device.System.Power.State/><NOW_POWER/>" : "<Device.System.Power.State/>",
        commandString = createCommandString(commandOptions.name, "get", command);

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            var result = {
                state: /^ON$/.test(xpath.select("//Device.System.Power.State/text()", responseDom).toString()),
                nowPower: 0,
                nowCurrent: 0,
                day: 0,
                week: 0,
                month: 0
            };
            if (withMetering) {
                var toggleTime = xpath.select("//Device.System.Power.LastToggleTime/text()", responseDom).toString(),
                    date = (toggleTime.length === 14) ?
                        new Date(
                            toggleTime.substring(0, 4),
                            parseInt(toggleTime.substring(4, 6)) - 1,
                            toggleTime.substring(6, 8),
                            toggleTime.substring(8, 10),
                            toggleTime.substring(10, 12),
                            toggleTime.substring(12, 14)
                        ) : new Date();
                result = _.assign(result, {
                    lastToggleTime: date,
                    nowPower: parseFloat(xpath.select("//Device.System.Power.NowPower/text()", responseDom).toString()),
                    nowCurrent: parseFloat(xpath.select("//Device.System.Power.NowCurrent/text()", responseDom).toString()),
                    day: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Day/text()", responseDom).toString()),
                    week: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Week/text()", responseDom).toString()),
                    month: parseFloat(xpath.select("//Device.System.Power.NowEnergy.Month/text()", responseDom).toString())
                })
            }
            return Promise.resolve(result);
        })
    });
};

module.exports.getSchedule = function (options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get",
            "<SCHEDULE></SCHEDULE>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            var result = {};
            for (var x = 0; x <= 6; ++x) {
                result[x] = xpath.select("//Device.System.Power.Schedule." + x + ".List/text()", responseDom).toString()
            }
            return Promise.resolve(result);
        })
    });
};

module.exports.getDeviceInfo = function (options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get",
            "<SYSTEM_INFO><Run.Cus/><Run.Model/><Run.FW.Version/><Run.LAN.Client.MAC.Address/></SYSTEM_INFO>");

    return lastRequest = Promise.settle([lastRequest]).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            return Promise.resolve({
                vendor: xpath.select("//Run.Cus/text()", responseDom).toString(),
                model: xpath.select("//Run.Model/text()", responseDom).toString(),
                fwVersion: xpath.select("//Run.FW.Version/text()", responseDom).toString(),
                mac: xpath.select("//Run.LAN.Client.MAC.Address/text()", responseDom).toString()
            });
        })
    });
};