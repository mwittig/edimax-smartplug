# edimax-smartplug

Node module to communicate with Edimax Smart Plugs. The library utilizes Bluebird 
promises - https://github.com/petkaantonov/bluebird. Device request will be executed sequentially. 
This is useful as the Smart Plug REST service does not chain incoming requests.

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
    
    // get switch power
    smartplug.getSwitchPower({name:'edimax', host:'192.168.178.65'}).then(function (power) {
        console.log("Current switch power", power, "Watts");
    }).catch(function(e) {console.log(e)});
    
    // get switch energy reading
    smartplug.getSwitchEnergy({name:'edimax', host:'192.168.178.65'}).then(function (energy) {
        console.log(energy);
    }).catch(function(e) {console.log(e)});
    
    
TODO
----

* Documentation
* Make request chaining optional. In some cases, request/response interleaving does not matter
* Add tests

History
-------

* 20150412, V0.0.1
    * Initial Version
    
* 20150412, V0.0.2
    * Corrected package descriptor
    
* 20150413, V0.0.3
    * Added function to get Energy & Power attributes and to read device information (vendor, model, firmware version)
    
* 20150413, V0.0.4
    * Improved error handling (Unauthorized case, in particular)
    * Handle chunked response data
    * Added basic implementation to obtain schedule info
    * Updated README
    
* 20150413, V0.0.5
    * Added getStatusValues() method to provide bulk updates optionally including metering values