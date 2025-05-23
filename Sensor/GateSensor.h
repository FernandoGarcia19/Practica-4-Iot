#ifndef GATESENSOR_H
#define GATESENSOR_H
#define GATE_SENSOR_DELAY 5
#include "Sensor.h"
class GateSensor: public Sensor {
  private:
    unsigned long startMillis;
    unsigned long endMillis;
    String currentState;
  public:
    GateSensor(const byte& pin, const int& lapsus, const int& threshold)
    : Sensor(pin, threshold, lapsus), currentState("CLEAR"){
    }
    ~GateSensor(){}
    
    void loop(){
      readLightValue();
      if(lightValue <= threshold && !isBlocked){
        startMillis = millis();
        isBlocked = true;
      } else if (lightValue > threshold && isBlocked){
        endMillis = millis();
        isBlocked = false;
        int blockedTime = (endMillis - startMillis) / 1000;
        if (blockedTime >= lapsus){
          currentState = "CLEAR";
        }
      } else {
        currentState = "BLOCKED";
      }
    }

    String getCurrentState(){
      return this->currentState;
    }
};

#endif