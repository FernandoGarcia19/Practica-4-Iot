#ifndef SMARTCOUNTER_H
#define SMARTCOUNTER_H
#define SMART_COUNTER_DELAY 5
#include "Sensor.h"

class SmartCounter: public Sensor{
  private:
    int counter; 
    unsigned long startLapsus; 
    unsigned long endLapsus; 
  public:
    SmartCounter(const byte& pin, const int& lapsus, const int& threshold)
    : Sensor(pin, lapsus, threshold), counter(0), startLapsus(0), endLapsus(0){
    }
    ~SmartCounter(){}

    int getCounter(){
      return counter;
    }
    
    void loop(){
      readLightValue();
      if(lightValue <= threshold && !isBlocked){
        startLapsus = millis();
        isBlocked = true;
      } else if (lightValue > threshold && isBlocked){
        endLapsus = millis();
        isBlocked = false;
        int blockedTime = (endLapsus - startLapsus) / 1000;
        if (blockedTime >= lapsus){
          counter++;
        }
      }
      delay(SMART_COUNTER_DELAY);
    }

};
#endif