var util = require('util'),
    http = require('http'),
    _assign = require('lodash.assign'),
    _isUndefined = require('lodash.isundefined'),
    _parseInt = require('lodash.parseint')
    xpath = require('xpath'),
    xmldom = require('xmldom'),
    Promise = require('bluebird'),
    dgram = require('dgram'),
    commandTemplateString = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="edimax"><CMD id="%s">%s</CMD></SMARTPLUG>',
    lastRequest = Promise.resolve(),
    debug = process.env.hasOwnProperty('EDIMAX_DEBUG') ? consoleDebug : function () {
    };

//
// Private Helper Functions
//

function createCommandString(deviceName, command, commandXml) {
    return util.format(commandTemplateString, command, commandXml);
}

function consoleDebug() {
    console.log.apply(this, arguments)
}

function settlePromise(aPromise) {
    return aPromise.reflect();
}

function assignDefaultCommandOptions(options) {
    return _assign({
        name: 'edimax'
    }, options)
}

function postRequest(command, options) {
    var requestOptions = _assign({
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
                if (_isUndefined(contentLength) || _parseInt(contentLength) === 0) {
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

function bufIndexOf(buffer, byteVal, start, end) {
    var pos = start;
    for (; pos < end; pos++) {
        if (buffer[pos] === byteVal) {
            break;
        }
    }
    return pos;
}

function bytesToIpAddress(bytes) {
    if (bytes.length === 4) {
        return "" + bytes[0] + "." + bytes[1] + "." + bytes[2] + "." + bytes[3];
    }
    else {
        throw new Error("Buffer does not contain valid IPv4 address")
    }
}

function toHexString(d) {
    return ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

function bytesToMacAddress(bytes) {
    if (bytes.length === 6) {
        return "" + toHexString(bytes[0]) + ":" + toHexString(bytes[1]) + ":" + toHexString(bytes[2])
            + ":" + toHexString(bytes[3]) + ":" + toHexString(bytes[4]) + ":" + toHexString(bytes[5]);
    }
    else {
        throw new Error("Buffer does not contain valid MAC address")
    }
}

//
// Public Functions
//

module.exports.getSwitchState = function (options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get", "<Device.System.Power.State/>");

    return lastRequest = settlePromise(lastRequest).then(function () {
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

    return lastRequest = settlePromise(lastRequest).then(function () {
        return postRequest(commandString, commandOptions).then(function () {
            return Promise.resolve();
        })
    });
};

module.exports.getSwitchPower = function (options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get",
            "<NOW_POWER><Device.System.Power.NowPower/></NOW_POWER>");

    return lastRequest = settlePromise(lastRequest).then(function () {
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

    return lastRequest = settlePromise(lastRequest).then(function () {
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

    return lastRequest = settlePromise(lastRequest).then(function () {
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
                result = _assign(result, {
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

    return lastRequest = settlePromise(lastRequest).then(function () {
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

    return lastRequest = settlePromise(lastRequest).then(function () {
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

module.exports.discoverDevices = function (options) {
    var options = options || {};
    var port = options.port || 20560;
    var host = options.address || "255.255.255.255";
    var timeout = options.timeout || "3000";
    var discoveryMessage = Buffer([
        0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0x45, 0x44,
        0x49, 0x4d, 0x41, 0x58,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0xA1,
        0xFF, 0x5E
    ]);
    var timeoutId = null;
    var discoResults = [];

    return new Promise(function (resolve, reject) {
        var discoverer = dgram.createSocket('udp4');
        discoverer.bind();

        discoverer.on('listening', function () {
            discoverer.setBroadcast(true);

            discoverer.send(discoveryMessage, 0, discoveryMessage.length, port, host, function(err, bytes) {
                if (err) throw err;
                debug('UDP message sent to ' + host +':'+ port);
            });

            timeoutId = setTimeout(function() {
                discoverer.close();
                resolve(discoResults);
            }, timeout)
        });

        discoverer.on('message', function (message, remote) {
            discoResults.push({
                mac: bytesToMacAddress(message.slice(0, 6)),
                manufacturer: message.toString('ascii', 6, bufIndexOf(message, 0x00, 6, 18)),
                model: message.toString('ascii', 22, bufIndexOf(message, 0x00, 22, 36)),
                version: message.toString('ascii', 36, bufIndexOf(message, 0x00, 36, 44)),
                displayName: message.toString('ascii', 44, bufIndexOf(message, 0x00, 44, 172)),
                port: message.readInt16LE(172),
                addr: bytesToIpAddress(message.slice(174, 178)),
                dstAddr: bytesToIpAddress(message.slice(182, 186))
            });
        });

        discoverer.on('error', function (message, error) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            debug(error);
            reject(error);
        });
    });
};
