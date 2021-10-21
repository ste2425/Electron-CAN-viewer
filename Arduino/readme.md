# Arduino Adapter

The arduino acts like a CANBus adapter communicating with the Electron app over serial.

In order for this to work upload the `arduino.ino` file to your Arduino Uno via the Arduino IDE.

It is dependant on the CANbus shield and library provided by SparkFun. Other compatible shields should work as they all use the same underlying chips. https://www.sparkfun.com/products/13262

The library has been included in this repo for ease of use but it may be out of date. To add the library to the Arduino IDE select `Sketch` -> `Include Library` -> `Add .ZIP Library...` and select `Canbus.zip` from this repository. 

# Connecting to your vehicle
Depending on how you access the CAN network you may be able to use the sub-D to OBD cable they provide. This is vehicle dependant.

As i needed to access a secondary CAN network that is not specified in the OBD spec i had to use the breakout headers to manually connect to the network.

See `Point 7` in the [`Hardware Overview` section](https://learn.sparkfun.com/tutorials/can-bus-shield-hookup-guide#hardware-overview) for info on hooking up the shield. You will need to research your vehicles specific CAN network arrangements.