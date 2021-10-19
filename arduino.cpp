#include <Canbus.h>
#include <defaults.h>
#include <global.h>
#include <mcp2515.h>
#include <mcp2515_defs.h>

/**
 * Change this if connecting to a different speed CAN network
 * Options are:
 * * CANSPEED_125 = 7
 * * CANSPEED_250 = 3
 * * CANSPEED_500 = 1
 */
int CANSpeed = CANSPEED_125;

int active = 0;

void setup() {
  // start serial port at 9600 bps:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }
  
  if(Canbus.init(CANSpeed))
    Serial.println("[DBG] CAN Init ok");
  else
    Serial.println("[DBG] Can't Init CAN");
}

void sendData() {  
  tCAN message;

  if (mcp2515_check_message()) 
  {
    if (mcp2515_get_message(&message)) 
    {      
      Serial.print(message.id, HEX);
      Serial.print("|");
            
      for(int i=0;i<message.header.length;i++)
      {
        Serial.print(message.data[i]);
        Serial.print("|");
      }
      Serial.println("");
    }
  }
}

void loop() {
  if (active == 1)
    sendData();

  if (Serial.available()) {
    long command = Serial.parseInt();

    switch (command) {
      case 1:
        Serial.println("[DBG] Arduino CAN Adapter");
      break;
      case 2:
        active = 1;
        Serial.println("[DBG] Running");
      break;
      case 3:
        active = 0;
        Serial.println("[DBG] Stopping");
      break;
      case 4: 
        String speed;

        switch (CANSpeed)
        {
          case 7:
              speed = "CANSPEED_125";
              break;
          case 3:
              speed = "CANSPEED_250";
              break;
          case 1:
              speed = "CANSPEED_500";
              break;
        }
        
        Serial.println("[DBG] CAN speed: " + speed);
      break;
    }
  }
}