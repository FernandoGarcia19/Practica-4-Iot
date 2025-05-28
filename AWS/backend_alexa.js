const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const IotData = new AWS.IotData({ endpoint: 'tu-endpoint.com' });

async function getThingName(userId) {
  const params = {
      TableName: 'userThings', 
      Key: { userId: userId }
  };

  try {
      const result = await dynamoDb.get(params).promise();
      return result.Item ? result.Item.thing_name : null;
  } catch (error) {
      console.error('Error al obtener el thingName de DynamoDB:', error);
      throw new Error('No se pudo obtener el thingName');
  }
};

async function getShadowParams(userId) {
  const thingName = await getThingName(userId);
  console.log(thingName);
  if (!thingName) {
      throw new Error('Thing name no encontrado');
  }
  return { thingName: thingName };
};

function getShadowPromise(params) {
  return new Promise((resolve, reject) => {
      IotData.getThingShadow(params, (err, data) => {
          if (err) {
              console.log(err, err.stack);
              reject('Error al obtener el shadow: ' + err.message);
          } else {
              resolve(JSON.parse(data.payload));
          }
      });
  });
};

function updateShadowPromise(params) {
  return new Promise((resolve, reject) => {
      IotData.updateThingShadow(params, (err, data) => {
          if (err) {
              console.log(err, err.stack);
              reject('Error al actualizar el shadow: ' + err.message);
          } else {
              resolve(data);
          }
      });
  });
};

const checkCarCounterHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'checkCarCounterIntent';
    },
    async handle(handlerInput) {
        let speakOutput = "Couldn't obtain the car counter state";
        try {
            const userId = handlerInput.requestEnvelope.session.user.userId;
            const params = await getShadowParams(userId);
            const shadowData = await getShadowPromise(params);
            const carCounterState = shadowData.state.reported.car_count;
            speakOutput = `The car counter is ${carCounterState}`;
        }
        catch(error){
            console.error('Error obtaining car count', error);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const getLapsusHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'getLapsusIntent';
    },
    async handle(handlerInput) {
        let speakOutput = "Couldn't obtain the lapsus configuration";
        try {
            const userId = handlerInput.requestEnvelope.session.user.userId;
            const params = await getShadowParams(userId);
            const shadowData = await getShadowPromise(params);
            const lapsus = shadowData.state.reported.config.lapsus;
            speakOutput = `The current sensor lapsus is ${lapsus} seconds`;
        }
        catch(error){
            console.error('Error obtaining lapsus', error);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const getThresholdHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'getThresholdIntent';
    },
    async handle(handlerInput) {
        let speakOutput = "Couldn't obtain the threshold configuration";
        try {
            const userId = handlerInput.requestEnvelope.session.user.userId;
            const params = await getShadowParams(userId);
            const shadowData = await getShadowPromise(params);
            const threshold = shadowData.state.reported.config.threshold;
            speakOutput = `The current sensor threshold is ${lapsus}`;
        }
        catch(error){
            console.error('Error obtaining lapsus', error);
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const setCounterHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'setCarCounterIntent';
    },
    async handle(handlerInput) {
        const counter = handlerInput.requestEnvelope.request.intent.slots.counterValue;
        const counterValue = counter.value;
        
        if (!counterValue) {
            const speakOutput = 'I couldn\'t understand the counter value. Please try again.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        const userId = handlerInput.requestEnvelope.session.user.userId;
        const ShadowParams = await getShadowParams(userId);
        const payload = {
            state: {
                desired: {
                    car_count: parseInt(counterValue, 10)
                }
            }
        }
        const params = {
            ...ShadowParams,
            payload: JSON.stringify(payload)
        }

        try {
            await updateShadowPromise(params);
            const speakOutput = `The car counter has been set to ${counterValue}`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        } catch (error) {
            console.error('Error updating car counter', error);
            const speakOutput = 'There was an error updating the car counter. Please try again later.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
    }
};

const setThresholdHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'setThresholdIntent';
    },
    async handle(handlerInput) {
        const threshold = handlerInput.requestEnvelope.request.intent.slots.threshold;
        const thresholdValue = threshold.value;
        
        if (!thresholdValue) {
            const speakOutput = 'I couldn\'t understand the threshold value. Please try again.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        const userId = handlerInput.requestEnvelope.session.user.userId;
        const ShadowParams = await getShadowParams(userId);
        const payload = {
            state: {
                desired: {
                    config: {
                        threshold: parseInt(thresholdValue, 10)
                    }
                }
            }
        }
        const params = {
            ...ShadowParams,
            payload: JSON.stringify(payload)
        }

        try {
            await updateShadowPromise(params);
            const speakOutput = `The threshold has been set to ${thresholdValue}`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        } catch (error) {
            console.error('Error updating threshold', error);
            const speakOutput = 'There was an error updating the threshold. Please try again later.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
    }
};

const setLapsusHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'setLapsusIntent';
    },
    async handle(handlerInput) {
        const lapsus = handlerInput.requestEnvelope.request.intent.slots.lapsus;
        const lapsusValue = lapsus.value;
        
        if (!lapsusValue) {
            const speakOutput = 'I couldn\'t understand the lapsus value. Please try again.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        
        const userId = handlerInput.requestEnvelope.session.user.userId;
        const ShadowParams = await getShadowParams(userId);
        const payload = {
            state: {
                desired: {
                    config: {
                        lapsus: parseInt(lapsusValue, 10)
                    }
                }
            }
        }
        const params = {
            ...ShadowParams,
            payload: JSON.stringify(payload)
        }

        try {
            await updateShadowPromise(params);
            const speakOutput = `The lapsus has been set to ${lapsusValue}`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        } catch (error) {
            console.error('Error updating lapsus', error);
            const speakOutput = 'There was an error updating the lapsus. Please try again later.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
    }
};


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to your Smart Parking Assistant.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        checkCarCounterHandler,
        getLapsusHandler,
        getThresholdHandler,
        setCounterHandler,
        setThresholdHandler,
        setLapsusHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();