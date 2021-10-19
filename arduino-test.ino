#include <Canbus.h>  // don't forget to include these
#include <defaults.h>
#include <global.h>
#include <mcp2515.h>
#include <mcp2515_defs.h>

int count = 0;
int active = 0;

void setup() {
  // start serial port at 9600 bps:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }
  // CANSPEED_250   
  // CANSPEED_500
  if(Canbus.init(CANSPEED_125))
    Serial.println("[DBG] CAN Init ok");
  else
    Serial.println("[DBG] Can't Init CAN");
}

void sendData() {  
  delay(10);
  count++;

  if (count > 100 && count < 200) {
    Serial.println("55|1|2|3|4|5|6|7|8");
    Serial.println("64|1|2|80|4|5|6|99|8");
  } else if (count > 200 && count < 300) {
    Serial.println("55|1|55|3|4|5|6|77|8");
    Serial.println("64|1|2|80|4|64|6|99|8");
  } else if (count > 300) {
    Serial.println("55|1|55|3|4|5ddd|6|77|8");
    Serial.println("64|1|2a|80|4|64|6|99|8");
    count = 0;
  } else {
    Serial.println("55|1|2|3|4|5|6|7|8");
    Serial.println("64|1|2|80|4|5|6|99|8");
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
    }
  }
}