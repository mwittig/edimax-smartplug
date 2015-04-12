var smartplug = require('./index');

var x = Date.now();

smartplug.getDeviceInfo({name:'edimax', host:'192.168.178.65'}).then(function (energy) {
    console.log(energy);
}).catch(function(e) {console.log(e)});

// set switch ON
smartplug.setSwitchState(true, {name:'edimax', host:'192.168.178.65'}).catch(function(e) {console.log(e)});

smartplug.getSwitchPower({name:'edimax', host:'192.168.178.65'}).then(function (power) {
    console.log("Current switch power", power, "Watts");
}).catch(function(e) {console.log(e)});

smartplug.getSwitchEnergy({name:'edimax', host:'192.168.178.65'}).then(function (energy) {
    console.log(energy);
}).catch(function(e) {console.log(e)});

// set switch OFF
smartplug.setSwitchState(false, {name:'edimax', host:'192.168.178.65'}).catch(function(e) {console.log(e)});

// get switch status
smartplug.getSwitchState({name:'edimax', host:'192.168.178.65'}).then(function (state) {
    console.log("Switch is", state?"ON":"OFF");
    console.log(Date.now() - x)
}).catch(function(e) {console.log(e)});


