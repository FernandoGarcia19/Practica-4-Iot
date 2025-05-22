#ifndef GATESENSOR_H
#define GATESENSOR_H
#define GATE_SENSOR_DELAY 5
#include "Sensor.h"
class GateSensor: public Sensor {
  private:

  public:
    GateSensor(const byte& pin, const int& threshold, const int& lapsus)
    : Sensor(pin, threshold, lapsus){
    }
    ~GateSensor(){}
    
    void loop(){
      readLightValue();
    }

};

#endif