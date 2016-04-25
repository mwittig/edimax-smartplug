# edimax-smartplug

[![Build Status](https://travis-ci.org/mwittig/edimax-smartplug.svg)](https://travis-ci.org/mwittig/edimax-smartplug)

Node module to communicate with Edimax Smart Plugs. The library utilizes Bluebird 
promises - https://github.com/petkaantonov/bluebird. Device requests will be executed sequentially. 
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
    
    // discover devices
    smartplug.discoverDevices({
        timeout: 3000,
        address: "255.255.255.255"
    }).then(function (results) {
        console.log(results);
    }).catch(function(e) {console.log("Request failed: ", e)});
    
## New: Device Discovery

The device discovery implementation is based on the findings summarized in a 
[blog post](http://blog.guntram.de/?p=45) (thanks, Guntram). As the discovery 
mechanism may also be used for other Edimax products, e.g. IP cameras, you should filter
by model name to make sure the found device is a smart plug ('SP2101W' and 'SP2101W'). The method `discoverDevices()` 
accepts the following options:

| Property  | Default           | Type    | Description                                 |
|:----------|:------------------|:--------|:--------------------------------------------|
| address   | "255.255.255.255" | String  | The broadcast address                       |
| timeout   | 3000              | Integer | The timeout in milliseconds for discovery   |

Note: Using the global broadcast address on Windows may yield unexpected results. On Windows, 
global broadcast packets will only be routed via the first network adapter which may cause problems
with multi-homed setups and virtual network adapters. If you want to use a broadcast address 
though, use a network-specific address, e.g. for `192.168.0.1/24` use `192.168.0.255`.
    
## TODO

* Documentation
* Make request chaining optional. In some cases, request/response interleaving does not matter
* Add tests

## History

See [Release History](https://github.com/mwittig/edimax-smartplug/blob/master/HISTORY.md).

## License 

Copyright (c) 2015-2016, Marcus Wittig and contributors. All rights reserved.

[MIT License](https://github.com/mwittig/edimax-smartplug/blob/master/LICENSE)
