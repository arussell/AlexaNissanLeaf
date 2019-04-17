"use strict";

// Require the leaf.js file with specific vehicle functions.
let car = require("./leaf");

// Require https so we can send Progressive Responses
let https = require("https");

// Send a request to the Progressive Response service
function sendProgressiveResponseRequest(event, requestData, successCallback, failureCallback) {	
	const options = {
		hostname: "api.eu.amazonalexa.com",
		port: 443,
		path: "/v1/directives",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Bearer " + event.context.System.apiAccessToken
		}
	};

	const req = https.request(options, resp => {
		if (resp.statusCode < 200 || resp.statusCode > 300) {
			console.log(`Failed to send progressive response request (${resp.statusCode}: ${resp.statusMessage})`);
			if (failureCallback)
				failureCallback();
			return;
		}

		console.log(`Successful progressive response request (${resp.statusCode}: ${resp.statusMessage})`);
	});
	
	req.write(JSON.stringify(requestData));
	req.end();
}

// Send a progress message
function sendProgressMessage(message, event) {
	// stuff
	const requestId = event.request.requestId;

	// build the progressive response directive
	const requestData = {
		header: {
	    	 requestId,
		},
	    directive: {
	    	type: 'VoicePlayer.Speak',
	    	speech: message,
		},
	};
	sendProgressiveResponseRequest(event, requestData, null, null);
}

// Build a response to send back to Alexa.
function buildResponse(output, card, shouldEndSession) {
	return {
		version: "1.0",
		response: {
			outputSpeech: {
				type: "PlainText",
				text: output,
			},
			card,
			shouldEndSession
		}
	};
}

// Helper to build the text response for battery status.
function buildBatteryStatus(battery) {
	console.log(battery);
	const milesPerMeter = 0.000621371;
	let response = `You have ${Math.floor((battery.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount / battery.BatteryStatusRecords.BatteryStatus.BatteryCapacity) * 100)}% battery remaining. 	`;

	if (battery.BatteryStatusRecords.PluginState == "CONNECTED") {
		response += "The car is plugged in";
	} else {
		response += "The car is not plugged in";
	}

	if (battery.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus != "NOT_CHARGING") {
		response += " and charging";
	}

	return response + ".";
}

// Helper to build the text response for range status.
function buildRangeStatus(battery) {
	console.log(battery);
	const milesPerMeter = 0.000621371;
	let response = `You have ${Math.floor(battery.BatteryStatusRecords.CruisingRangeAcOn * milesPerMeter)} miles with the air conditioning on, or ${Math.floor(battery.BatteryStatusRecords.CruisingRangeAcOff * milesPerMeter)} miles with the air conditioner off. Based on what I know about the Nissan LEAF, you can expect to get as little as ${Math.floor(battery.BatteryStatusRecords.CruisingRangeAcOn * milesPerMeter * 0.8)} miles in worst case conditions or ${Math.floor(battery.BatteryStatusRecords.CruisingRangeAcOff * milesPerMeter * 1.2)} miles in ideal conditions. `;

	if (battery.BatteryStatusRecords.PluginState == "CONNECTED") {
		response += "The car is plugged in";
	} else {
		response += "The car is not plugged in";
	}

	if (battery.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus != "NOT_CHARGING") {
		response += " and charging";
	}

	return response + ".";
}

// Helper to build the text response for charge time status.
function buildChargeTimeStatus(battery) {
	console.log(battery);
	const milesPerMeter = 0.000621371;

	// Set environment variable "chargeSpeed" to value "3" if you want 3kW reports.
	// It it's set to any other value, or if env variable not set, assume 6kW speeds.
	if (typeof process.env.chargeSpeed !== 'undefined' && process.env.chargeSpeed == "3") {
		hours = battery.BatteryStatusRecords.TimeRequiredToFull200.HourRequiredToFull;
		minutes = battery.BatteryStatusRecords.TimeRequiredToFull200.MinutesRequiredToFull;
	} else {
		hours = battery.BatteryStatusRecords.TimeRequiredToFull200_6kW.HourRequiredToFull;
		minutes = battery.BatteryStatusRecords.TimeRequiredToFull200_6kW.MinutesRequiredToFull;
	}

	let response = `The car will take about ${hours} hour`;
	if (hours > 1) {
		response += "s"; // pluralise hours when necessary
	}
	// skip minutes if none
	if (minutes > 0) {
		response += ` and ${minutes} minute`;
		if (minutes > 1) {
			response += "s"; // pluralise hours when necessary
		}
	}
	response += " to charge. ";

	if (battery.BatteryStatusRecords.PluginState == "CONNECTED") {
		response += "The car is plugged in";
	} else {
		response += "The car is not plugged in";
	}

	if (battery.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus != "NOT_CHARGING") {
		response += " and charging";
	}

	return response + ".";
}

// Helper to build the text response for charging status.
function buildChargingStatus(charging) {
	let response = "";
	if(charging.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus == "NOT_CHARGING") {
		response += "Your car is not on charge.";
	} else {
		response += "Your car is on charge.";
	}
	
	return response;
}

// Helper to build the text response for connected to power status.
function buildConnectedStatus(connected) {
	let response = "";
	if(connected.BatteryStatusRecords.PluginState == "NOT_CONNECTED") {
		response += "Your car is not connected to a charger.";
	} else {
		response += "Your car is connected to a charger.";
	}
	
	return response;
}

// Handling incoming requests
exports.handler = (event, context) => {
		
	// Helper to return a response with a card.		
	const sendResponse = (title, text) => {
		context.succeed(buildResponse(text, {
			"type": "Simple",
			"title": title,
			"content": text
		}));
	};

	try {
		// Check if this is a CloudWatch scheduled event.
		if (event.source == "aws.events" && event["detail-type"] == "Scheduled Event") {
			console.log(event);
			// The environmnet variable scheduledEventArn should have a value as shown in the trigger configuration for this lambda function,
			// e.g. "arn:aws:events:us-east-1:123123123:rule/scheduledNissanLeafUpdate",
			if (event.resources && event.resources[0] == process.env.scheduledEventArn) {
				// Scheduled data update
				console.log("Beginning scheduled update");
				car.sendUpdateCommand(
					() => console.log("Scheduled update requested"),
					() => console.log("Scheduled update failed")
				);
				return;
			}
			console.log("Scheduled update permission failed");
			sendResponse("Invalid Scheduled Event", "This service is not configured to allow the source of this scheduled event.");
			return;
		}
		// Verify the person calling the script. Get your Alexa Application ID here: https://developer.amazon.com/edw/home.html#/skills/list
		// Click on the skill and look for the "Application ID" field.
		// Set the applicationId as an environment variable or hard code it here.
		if(event.session.application.applicationId !== process.env.applicationId) {
			sendResponse("Invalid Application ID", "You are not allowed to use this service.");
			return;
		}

		// Shared callbacks.
		const exitCallback = () => context.succeed(buildResponse("Goodbye!"));
		const helpCallback = () => context.succeed(buildResponse("What would you like to do? You can preheat the car or ask for battery status.", null, false));
		const loginFailureCallback = () => sendResponse("Authorisation Failure", "Unable to login to Nissan Services, please check your login credentials.");

		// Handle launches without intents by just asking what to do.		
		if (event.request.type === "LaunchRequest") {
			helpCallback();
		} else if (event.request.type === "IntentRequest") {
			sendProgressMessage("Just a moment while I talk to the car.", event);
			// Handle different intents by sending commands to the API and providing callbacks.
			switch (event.request.intent.name) {
				case "PreheatIntent":
					car.sendPreheatCommand(
						response => sendResponse("Car Preheat", "The car is warming up for you."),
						() => sendResponse("Car Preheat", "I can't communicate with the car at the moment.")
					);
					break;
				case "CoolingIntent":
					car.sendCoolingCommand(
						response => sendResponse("Car Cooling", "The car is cooling down for you."),
						() => sendResponse("Car Cooling", "I can't communicate with the car at the moment.")
					);
					break;
				case "ClimateControlOffIntent":
					car.sendClimateControlOffCommand(
						response => sendResponse("Climate Control Off", "The cars climate control is off."),
						() => sendResponse("Climate Control Off", "I can't communicate with the car at the moment.")
					);
					break;
				case "StartChargingIntent":
					car.sendStartChargingCommand(
						response => sendResponse("Start Charging Now", "The car is now charging for you."),
						() => sendResponse("Start Charging Now", "I can't communicate with the car at the moment.")
					);
					break;
				case "UpdateIntent":
					car.sendUpdateCommand(
						response => sendResponse("Car Update", "I'm downloading the latest data for you."),
						() => sendResponse("Car Update", "I can't communicate with the car at the moment.")
					);
					break;
				case "RangeIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Range Status", buildRangeStatus(response)),
						() => sendResponse("Car Range Status", "Unable to get car battery status.")
					);
					break;
				case "ChargeIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Battery Status", buildBatteryStatus(response)),
						() => sendResponse("Car Battery Status", "Unable to get car battery status.")
					);
					break;
				case "ChargeTimeIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Charge Time Status", buildChargeTimeStatus(response)),
						() => sendResponse("Car Charge Time Status", "Unable to get car battery status.")
					);
					break;
				case "ChargingIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Charging Status", buildChargingStatus(response)),
						() => sendResponse("Car Charging Status", "Unable to get car battery status.")
					);
					break;
				case "ConnectedIntent":
					car.getBatteryStatus(
						response => sendResponse("Car Connected Status", buildConnectedStatus(response)),
						() => sendResponse("Car Connected Status", "Unable to get car battery status.")
					);
					break;
				case "AMAZON.HelpIntent":
					helpCallback();
					break;
				case "AMAZON.StopIntent":
				case "AMAZON.CancelIntent":
					exitCallback();
					break;
			}
		} else if (event.request.type === "SessionEndedRequest") {
			exitCallback();
		}
	} catch (err) {
		console.error(err.message);
		console.log(event);
		sendResponse("Error Occurred", "An error occurred. Fire the programmer! " + err.message);
	}
};