var smartplug = require('./index');

// set switch ON
smartplug.setSwitchState(true, {name:'edimax', host:'192.168.178.65'}).catch(function(e) {console.log(e)});

// set switch OFF
smartplug.setSwitchState(false, {name:'edimax', host:'192.168.178.65'}).catch(function(e) {console.log(e)});

// get switch status
smartplug.getSwitchState({name:'edimax', host:'192.168.178.65'}).then(function (state) {
    console.log("Switch is", state?"ON":"OFF");
}).catch(function(e) {console.log(e)});