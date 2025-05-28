SELECT
topic(3) AS thing_name,
substring(topic(3),0, 13) AS thing_type,
substring(topic(3),14, 22) AS thing_purpose,
substring(topic(3), 23, 27) AS serial_number,
"CLOSE" AS action,
current.state.reported.car_count AS current_car_count,
timestamp() AS event_time
FROM 
'$aws/things/+/shadow/update/documents'
WHERE 
current.state.reported.car_count > previous.state.reported.car_count AND
current.state.desired.car_count <> current.state.reported.car_count and
current.state.reported.gate_actuator.gate_state="OPEN"