var smartplug = require('./index'),
    options = {
        timeout: 10000,
        name:'edimax',
        host:'192.168.178.65',
        username: 'admin',
        password: '1234'
    },
    x = Date.now();

smartplug.getDeviceInfo(options).then(function (energy) {
    console.log(energy);
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
    console.log(energy);
}).catch(function(e) {console.log("Request failed: ", e)});

smartplug.getStatusValues(true, options).then(function (all) {
    console.log(all);
}).catch(function(e) {console.log("Request failed: ", e)});

// set switch OFF
smartplug.setSwitchState(false, options).catch(function(e) {console.log("Request failed: ", e)});

// get switch status
smartplug.getSwitchState(options).then(function (state) {
    console.log("Switch is", state?"ON":"OFF");
    console.log(Date.now() - x, "milliseconds ellapsed")
}).catch(function(e) {console.log("Request failed: ", e)});