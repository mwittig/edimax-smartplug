var util = require('util'),
    http = require('http-digest-client'),
    _isUndefined = require('lodash.isundefined'),
    _parseInt = require('lodash.parseint'),
    xpath = require('xpath'),
    xmldom = require('xmldom'),
    Promise = require('bluebird'),
    dgram = require('dgram'),
    commandTemplateString = '<?xml version="1.0" encoding="UTF8"?><SMARTPLUG id="edimax"><CMD id="%s">%s</CMD></SMARTPLUG>',
    lastRequest = Promise.resolve(),
    debug = process.env.hasOwnProperty('EDIMAX_DEBUG') ? consoleDebug : function () {
    },
    http = require('http')
var agent = new http.Agent({ keepAlive: false });

require('es6-object-assign/auto');

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
    return Object.assign({}, {
        name: 'edimax'
    }, options)
}

function postRequest(command, options) {
    var requestOptions = Object.assign({}, {
            timeout: 20000,
            port: 10000,
            path: 'smartplug.cgi',
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
                'Content-Length': command.length
            },
            username: 'admin',
            password: '1234',
            agent: agent
        }, options),
        timeoutOccurred = false;

    debug('REQUEST OPTIONS: ' + util.inspect(requestOptions));
    debug('REQUEST: ' + command);

    return new Promise(function (resolve, reject) {
        var data = "";
        var client = http(requestOptions.username, requestOptions.password);
        var postReq = client.request(requestOptions, function (response) {
            debug('STATUS: ' + response.statusCode);
            debug('HEADERS: ' + util.inspect(response.headers));

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
        });
        postReq.on('error', function (error) {
            if (timeoutOccurred) {
                error = new Error("Request timeout occurred - request aborted");
            }
            debug('ERROR:' + 'Host ' + requestOptions.host + ' ' + error);
            postReq.abort();
            return reject(error);
        });
        postReq.on('timeout', function () {
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

function numberFromCharCode(charCode) {
    if (charCode >= '0'.charCodeAt(0) && charCode <= '9'.charCodeAt(0)) {
        return charCode - '0'.charCodeAt(0)
    }
    if (charCode >= 'a'.charCodeAt(0) && charCode <= 'z'.charCodeAt(0)) {
        return charCode - 'a'.charCodeAt(0) + 10
    }
    if (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) {
        return charCode - 'A'.charCodeAt(0) + 36
    }
    if (charCode == '+'.charCodeAt(0)) {
        return 62
    }
    if (charCode == '/'.charCodeAt(0)) {
        return 63
    }
    throw new Error("Invalid character code: " + charCode + "(" + String.fromCharCode(charCode) + ")");
}

function decodeHistoryValue(value) {
    var result = 0;

    if (value == '=') {
        return 0;
    }

    for (var i = 0; i < value.length; i++) {
        var thisChar = value.charCodeAt(value.length - i - 1);
        var thisNumber = numberFromCharCode(thisChar);
        result += thisNumber * (Math.pow(64, i))
    }

    return result / 1000;
}

function decodeScheduleActive(schedule) {
    var date = new Date();
    var full_min = date.getMinutes() + date.getHours() * 60;
    var start_min = 0;
    var end_min = 0;
    var day_of_week = date.getDay();
    var daily_schedule = schedule[day_of_week];
    var sched_items = daily_schedule.split('-');
    var result = false;
    for (var i = 0; i < sched_items.length && result !== true; i++) {
       	if (sched_items[i].endsWith('1')) {
            start_min = numberFromCharCode(sched_items[i].charCodeAt(0)) * 60 + numberFromCharCode(sched_items[i].charCodeAt(1));
            end_min = numberFromCharCode(sched_items[i].charCodeAt(2)) * 60 + numberFromCharCode(sched_items[i].charCodeAt(3));
            result = (full_min >= start_min && full_min <= end_min)
        }
    }
    return result;
}

//
// Public Functions
//

module.exports.getScheduleState = function (options) {
    return this.getSchedule(options).then(function (schedule) {
	      return Promise.resolve(decodeScheduleActive(schedule));
    });
};

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
        command = withMetering ? "<Device.System.Power.State/><SCHEDULE/><NOW_POWER/>" : "<Device.System.Power.State/><SCHEDULE/>",
        commandString = createCommandString(commandOptions.name, "get", command);

    return lastRequest = settlePromise(lastRequest).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            var result = {
                state: /^ON$/.test(xpath.select("//Device.System.Power.State/text()", responseDom).toString()),
                scheduleState: false,
                nowPower: 0,
                nowCurrent: 0,
                day: 0,
                week: 0,
                month: 0
            };
            var schedule = {};
            for (var x = 0; x <= 6; ++x) {
                schedule[x] = xpath.select("//Device.System.Power.Schedule." + x + ".List/text()", responseDom).toString()
            }
            result = Object.assign(result, {
                scheduleState: decodeScheduleActive(schedule)
            });
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
                result = Object.assign(result, {
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

module.exports.getHistory = function (unit, startDate, endDate, options) {
    var commandOptions = assignDefaultCommandOptions(options),
        commandString = createCommandString(commandOptions.name, "get",
            util.format("<POWER_HISTORY><Device.System.Power.History.Energy unit=\"%s\" date=\"%s-%s\"/></POWER_HISTORY>", unit, startDate, endDate));

    return lastRequest = settlePromise(lastRequest).then(function () {
        return postRequest(commandString, commandOptions).then(function (responseDom) {
            var results = xpath.select("//Device.System.Power.History.Energy/text()", responseDom).toString();
            var resultsArray = results.split('-');
            var decodedResultsArray = [];
            for (i = 0; i < resultsArray.length; i++) {
                decodedResultsArray.push(decodeHistoryValue(resultsArray[i]));
            }
            return Promise.resolve(decodedResultsArray);
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

            try {
                discoverer.setBroadcast(true);

                if (typeof host !== "string") {
                    throw new TypeError("invalid arguments: IP address must be a string");
                }
                discoverer.send(discoveryMessage, 0, discoveryMessage.length, port, host, function(error, bytes) {
                    if (error) {
                        discoverer.emit('error', error);
                    }
                    else {
                        debug('UDP message sent to ' + host +':'+ port);

                        timeoutId = setTimeout(function() {
                            try {
                                discoverer.close();
                            } catch (ex) {/*ignore*/}
                            resolve(discoResults);
                        }, timeout)
                    }
                });
            }
            catch (e) {
                discoverer.emit('error', e);
            }
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
            try {
                discoverer.close();
            } catch (ex) {/*ignore*/}
            reject(error);
        });
    });
};
