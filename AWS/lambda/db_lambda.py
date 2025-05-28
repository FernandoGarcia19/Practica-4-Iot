import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('smart_parking_data')

def lambda_handler(event, context):
    try:
        data_item = {
            'thing_name':event.get('thing_name'),
            'thing_type': event.get('thing_type'),
            'thing_purpose': event.get('thing_purpose'),
            'serial_number': event.get('serial_number'),
            'action':event.get('action'),
            'current_car_count':event.get('current_car_count'),
            'event_time':event.get('event_time')
        }
        response = table.put_item(Item=data_item)
        print(f'RESPONSE: {response}')
        return {
            'statusCode': 200,
            'body': json.dumps('Hello from Lambda!')
        }

    except Exception as e:
        print(f'EXCEPTION: {e}')
