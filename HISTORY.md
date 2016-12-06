# Release History

* 20161207, V0.0.16
    * Dependency updates
    * Revised README
    * Updated Travis build descriptor
    
* 20160831, V0.0.15
    * Feature: Added method to access history data (contributed by @mattjgalloway)
    * Updated README and demo.js
    * Dependency updates
    
* 20160503, V0.0.14
    * Bug fix: Close discovery socket on error
    * Improved error handling
    
* 20160503, V0.0.13
    * Fix: ensure discovery service will timeout if no results received

* 20160425, V0.0.12
    * Added device discovery service
    * Dependency updates
    * Replaced lodash with lightweight lodash method modules
    * Added release history file
    * Updated README
    
* 20160305, V0.0.11
    * Dependency updates
    * Replaced deprecated use of Promise.settle()
    * Minor changes of demo.js

* 20151231, V0.0.10
    * Added missing commit from previous releas
    
* 20151231, V0.0.9
    * Bug fix. Always set SmartPlug id XML-Attribute to "edimax" rather than the name assigned to the plug.
    * Dependency update
    * Added basic Travis builds
  
* 20150511, V0.0.8
    * Enforce a default timeout of 20000 msecs to cleanup if client is connected but server does not send a response.

* 20150508, V0.0.7
    * Fixed request error handling. Request must be aborted if error has occurred
    * Added option to set a request timeout
    
* 20150416, V0.0.6
    * Fixed bug in request processing which caused a TypeError if withMetering was set to false

* 20150413, V0.0.5
    * Added getStatusValues() method to provide bulk updates optionally including metering values
    
* 20150413, V0.0.4
    * Improved error handling (Unauthorized case, in particular)
    * Handle chunked response data
    * Added basic implementation to obtain schedule info
    * Updated README
    
* 20150413, V0.0.3
    * Added function to get Energy & Power attributes and to read device information (vendor, model, firmware version)
    
* 20150412, V0.0.2
    * Corrected package descriptor
    
* 20150412, V0.0.1
    * Initial Version