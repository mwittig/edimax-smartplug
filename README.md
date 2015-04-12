# edimax-smartplug

Node module to communicate with Edimax Smart Plugs. 

This is an early version of the module which supports switching, only. More feature will follow soon. The library 
utilizes Bluebird promises - https://github.com/petkaantonov/bluebird. Device request will be executed sequentially. 
This is useful as the Smart Plugs do not chain incoming requests.

## Usage Examples

    var smartplug = require('./index');
  
    // set switch ON
    smartplug.setSwitchState(true, {name:'edimax', host:'192.168.178.65'}).catch(function(e) {console.log(e)});
    
    // set switch OFF
    smartplug.setSwitchState(false, {name:'edimax', host:'192.168.178.65'}).catch(function(e) {console.log(e)});
    
    // get switch status
    smartplug.getSwitchState({name:'edimax', host:'192.168.178.65'}).then(function (state) {
        console.log("Switch is", state?"ON":"OFF");
    }).catch(function(e) {console.log(e)});