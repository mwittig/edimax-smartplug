# How-to Downgrade the SmartPlug Firmware

The recent firmware versions published for EdiSmart/Amazon Alexa Integration are currently not supported by edimax-smartplug:
* SP2101W: v2.09 and higher
* SP1101W: v1.05 and higher

The following guide describes how you can downgrade the firmware in case you already have the new firmware installed.

## Download the Firmware Upgrade Tool

* Download the [Firmware Upgrade Tool for Windows](http://www.edimax.com/edimax/mw/cufiles/files/download/Firmware/SP-2101W_Firmware_Upgrade_Tool_2.08.zip)
* Unzip the downloaded zip archive and unzip the contained exe file. For this you need 
  an archiving tool which can handle self extracting archives (sfx), like 7zip, for example. 
* You should now have a new directory named `SP-2101W_Firmware_Upgrade_Tool_2.08` which contains two `.bin`files:
  * `SP1101W_2.04_upg.bin`: The firmware binary for SP1101W SmartPlugs
  * `SP2101W_2.08_upg.bin`: The firmware binary for SP2101W SmartPlugs

## Reset the SmartPlug to Factory Settings

* Press and hold button for about 10 seconds until the network LED starts flashing quickly in red

* Wait for the smart plug to restart. The plug is ready when the network LED is flashing slowly in red

## Connect to the WiFi Network of the SmartPlug

Connect to the WiFi network exhibited by the SmartPlug. The network is named "EdiPlug.Setup" or similar.

## Upload and Install Firmware

* Open the the following URL in your web browser: <http://192.168.20.3:10000/tnupgrade.html>. You will prompted for 
  an username and password which should be set to the factory defaults (`admin` / `1234`).

* When the web page is opened push the button to select the firmware file and then press "Apply" to upload. 
  Be patient as the upload and burn procedure takes about 2 minutes.

* When the firmware has been successfully uploaded, reset the SmartPlug gain to Factory Settings as described above.

## Setup you SmartPlug

* Make sure you have the "EdiLife" app installed on your Smartphone. Note, the "EdiPlug" or "EdiSmart" cannot be used. 

* Start "EdiLife" app and follow the steps for setup.