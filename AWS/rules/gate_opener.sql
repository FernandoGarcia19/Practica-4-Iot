SELECT 
topic(3) AS thing_name,
substring(topic(3),0, 13) AS thing_type,
substring(topic(3),14, 22) AS thing_purpose,
substring(topic(3), 23, 27) AS serial_number,
state.reported.gate_sensor.sensor_state AS gate_sensor_state,
"OPEN" AS action
current.state.reported.car_count AS current_car_count,
timestamp() AS event_time
FROM 
'$aws/things/+/shadow/update' 
WHERE 
state.reported.gate_sensor.sensor_state="BLOCKED" AND
state.reported.gate_actuator.gate_state="CLOSED"