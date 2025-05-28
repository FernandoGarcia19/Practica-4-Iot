import json
import boto3

client = boto3.client('iot-data')

def lambda_handler(event, context):
    try:

        thing_name = event.get('thing_name')
        current_car_count = event.get('current_car_count', None)

        if thing_name is None:
            raise Exception("None 'thing_name'")

        
        print(f"CURRENT CAR COUNT: {current_car_count}")

        topic = f"$aws/things/{thing_name}/shadow/update"
        payload = {
            "state": {
                "desired": {
                    "gate_actuator":{
                        "gate_state":"CLOSED"
                    },
                    "car_count": current_car_count
                },
            }
        }
        client.publish(topic=topic, qos=1, payload=json.dumps(payload))
        return {
            'statusCode': 200,
        }
    except Exception as e:
        print(f"Exception: {e}")