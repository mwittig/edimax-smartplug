var smartplug = require('./index'),
    options = {
        name:'edimax',
        host:'192.168.178.65',
        username: 'admin',
        password: '1234'
    },
    x = Date.now();

smartplug.getDeviceInfo(options).then(function (energy) {
    console.log(energy);
}).catch(function(e) {console.log(e)});

smartplug.getSchedule(options).then(function (schedule) {
    console.log(schedule);
}).catch(function(e) {console.log(e)});

// set switch ON
smartplug.setSwitchState(true, options).catch(function(e) {console.log(e)});

smartplug.getSwitchPower(options).then(function (power) {
    console.log("Current switch power", power, "Watts");
}).catch(function(e) {console.log(e)});

smartplug.getSwitchEnergy(options).then(function (energy) {
    console.log(energy);
}).catch(function(e) {console.log(e)});

// set switch OFF
smartplug.setSwitchState(false, options).catch(function(e) {console.log(e)});

// get switch status
smartplug.getSwitchState(options).then(function (state) {
    console.log("Switch is", state?"ON":"OFF");
    console.log(Date.now() - x, "milliseconds ellapsed")
}).catch(function(e) {console.log(e)});