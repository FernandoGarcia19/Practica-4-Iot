#ifndef ACTUATOR_H
#define ACTUATOR_H
#include "ServoClient.h"
#include <ArduinoJson.h>

class Actuator
{
private:
  ServoClient servo;
  String state;

public:
  Actuator(const byte &pin)
      : servo(pin), state("CLOSED")
  {
  }

  void init(){
    servo.init();
    closeGate();
  }

  String getState(){
    return state;
  }

  void openGate(){
    servo.open();
    state = "OPEN";
  }

  void closeGate(){
    servo.close();
    state = "CLOSED";
  }
};
#endif