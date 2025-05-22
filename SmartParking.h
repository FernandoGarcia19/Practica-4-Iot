#ifndef SMARTPARKING_H
#define SMARTPARKING_H
#include "WifiManager.h"
#include "MQTTClient.h"
#include "./Sensor/GateSensor.h"
#include "./Sensor/SmartCounter.h"
#include "./Actuator/Actuator.h"

class SmartParking {
  private:
    WifiManager wifiManager;
    MQTTClient mqttClient;
    Actuator actuator;
    GateSensor gateSensor;
    SmartCounter counterSensor;

    const char* updateTopic;
    const char* deltaTopic;

    StaticJsonDocument<JSON_OBJECT_SIZE(64)> inputDoc;
    StaticJsonDocument<JSON_OBJECT_SIZE(16)> outputDoc;
    char outputBuffer[256];

    void reportState()
    {
      outputDoc["state"]["reported"]["gate_actuator"]["gate_state"] = actuator.getState();
      outputDoc["state"]["reported"]["gate_sensor"]["sensor_state"] = gateSensor.getSensorState();
      outputDoc["state"]["reported"]["counter_sensor"]["sensor_state"] = counterSensor.getSensorState();
      outputDoc["state"]["reported"]["config"]["threshold"] = sensor.getThreshold();
      outputDoc["state"]["reported"]["config"]["lapsus"] = sensor.getLapsus();
      size_t len = serializeJson(outputDoc, outputBuffer, sizeof(outputBuffer));
      outputBuffer[len] = '\0'; 
      mqttClient.publish(updateTopic, outputBuffer);
    }

    void manageServoGate(const String &gateState){
      (gateState == "OPEN") ? actuator.openGate() : actuator.closeGate();
    }

    void setSensorThreshold(int threshold){
      gateSensor.setThreshold(threshold);
      counterSensor.setThreshold(threshold);
    }

    void setSensorLapsus(int lapsus){
      gateSensor.setLapsus(lapsus);
      counterSensor.setLapsus(lapsus);
    }
//////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
    void handleDelta(JsonVariant state) {
      if (state.containsKey("servomotor")) {
        String gateState = state["servomotor"]["gate_state"].as<String>();
        manageServoGate(gateState);
      }
      if (state.containsKey("config")) {
        int threshold = state["lightsensor"]["config"]["threshold"] | 0;
        setSensorThreshold(threshold);
      }
      reportState();
    }

  public:
    SmartParking(const char* SSID, const char* password, const char* clientId, const char* broker,const int &port, 
      const byte& actuatorPin, const byte& sensorPin, const char* updateTopic, const char* deltaTopic)
      : wifiManager(SSID, password),
        mqttClient(broker, port, clientId),
        actuator(actuatorPin), sensor(sensorPin),
        updateTopic(updateTopic), deltaTopic(deltaTopic)
    {
    }


    void init(){
      wifiManager.connect();
      actuator.init();
      sensor.readLightValue();
      sensor.setSensorState(sensor.classifyState(sensor.getLightValue()));


      mqttClient.setCallback([this](char *topic, byte *payload, unsigned int length) {
        String message;
        for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

        Serial.print("MESSAGE ARRIVED ON TOPIC: ");
        Serial.println(topic);
        Serial.print("PAYLOAD: ");
        Serial.println(message);
      
        DeserializationError err = deserializeJson(inputDoc, payload);
        if (err) {
          Serial.print("deserializeJson failed: ");
          Serial.println(err.c_str());
          return;
        }
      
        JsonVariant deltaState = inputDoc["state"];
        this->handleDelta(deltaState);  // your custom processor
      });
    }

    void loop(){
      if(!mqttClient.isConnected()){
        mqttClient.connect();
        mqttClient.subscribe(deltaTopic);
        reportState();
      }
      mqttClient.loop();

      sensor.readLightValue();

      String newState = sensor.classifyState(sensor.getLightValue());
      if (sensor.stateHasChanged(newState)) {
        sensor.setSensorState(newState);
        reportState();
      } 
      delay(1000);
    }
};
#endif