var smartplug = require('./index');
var options = {
    timeout: 10000,
    name:'edimax',
    host:'192.168.178.65',
    username: 'admin',
    password: '1234'
};


smartplug.getDeviceInfo(options).then(function (info) {
    console.log(info);
}).catch(function(e) {console.log("Request failed: ", e)});

smartplug.getSchedule(options).then(function (schedule) {
    console.log(schedule);
}).catch(function(e) {console.log("Request failed: ", e)});

// set switch ON
smartplug.setSwitchState(true, options).catch(function(e) {console.log("Request failed: ", e)});

smartplug.getSwitchPower(options).then(function (power) {
    console.log("Current switch power", power, "Watts");
}).catch(function(e) {console.log("Request failed: ", e)});

smartplug.getSwitchEnergy(options).then(function (energy) {
    console.log("getSwitchEnergy result:", energy);
}).catch(function(e) {console.log("Request failed: ", e)});

smartplug.getStatusValues(true, options).then(function (all) {
    console.log("getStatusValues result:", all);
}).catch(function(e) {console.log("Request failed: ", e)});

// set switch OFF
smartplug.setSwitchState(false, options).catch(function(e) {console.log("Request failed: ", e)});

// get switch status
smartplug.getSwitchState(options).then(function (state) {
    console.log("Switch status is", state?"ON":"OFF");
}).catch(function(e) {console.log("Request failed: ", e)});

// get schedule status
smartplug.getScheduleState(options).then(function (state) {
    console.log("Schedule status is", state?"ON":"OFF");
}).catch(function(e) {console.log("Request failed: ", e)});

// get the daily history of power measured consumption for the given date range
smartplug.getHistory('DAY', '20160825', '20160830', options).then(function (results) {
    console.log("getHistory result", results);
}).catch(function(e) {console.log("Request failed: ", e)});

// discover devices
smartplug.discoverDevices({
    timeout: 3000,
    address: "192.168.178.255"
}).then(function (results) {
    console.log("Discovery Result:", results);
}).catch(function(e) {console.log("Request failed: ", e)});
