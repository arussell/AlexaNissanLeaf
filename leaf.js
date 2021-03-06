"use strict";

let https = require("https");
let querystring = require('querystring');

// Require encryption.js to encrypt the password.
var Encryption = require('./encryption.js');

// Do not change this value, it is static.
let initial_app_strings = "9s5rfKVuMrT03RtzajWNcA";
// Possible value are NE (Europe), NNA (North America) and NCI (Canada).
let region_code = process.env.regioncode;
// You should store your username and password as environment variables. 
// If you don't you can hard code them in the following variables.
let username = process.env.username; // Your NissanConnect username or email address.

let sessionid, vin, loginFailureCallback;

/**
* Sends a request to the Nissan API.
*
* action - The API endpoint to call, like UserLoginRequest.php.
* requestData - The URL encoded parameter string for the current call.
* successCallback
* failureCallback
**/
function sendRequest(action, requestData, successCallback, failureCallback) {	
	const options = {
		hostname: "gdcportalgw.its-mo.com",
		port: 443,
		path: "/api_v190426_NE/gdc/" + action,
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Content-Length": Buffer.byteLength(requestData),
		}
	};

	// Uncomment these for details logging to CloudWatch
	// console.log(`Options: ${JSON.stringify(options)}`);
	// console.log(`Request data: ${requestData}`);

	const req = https.request(options, resp => {
		if (resp.statusCode < 200 || resp.statusCode > 300) {
			console.log(`Failed to send request ${action} (${resp.statusCode}: ${resp.statusMessage})`);
			if (failureCallback)
				failureCallback();
			return;
		}

		console.log(`Successful request ${action} (${resp.statusCode}: ${resp.statusMessage})`);
		let respData = "";

		resp.on("data", c => {
			respData += c.toString();
		});
		resp.on("end", () => {
			let json = respData && respData.length ? JSON.parse(respData) : null;
			if (json.status == 200) {
				successCallback(respData && respData.length ? JSON.parse(respData) : null);
			} else {
				console.log(json);
			}
		});
	});
	
	req.write(requestData);
	req.end();
}

/**
* Log the current user in to retrieve a valid session token.
* 
* successCallback
**/
function login(successCallback) {
	sendRequest("InitialApp_v2.php",
	"RegionCode=" + region_code +
	"&initial_app_str=" + initial_app_strings +
	"&lg=en_US",
	initialResponse => {
		let encoded_password = querystring.escape(encrypt(process.env.password, initialResponse.baseprm));
		sendRequest("UserLoginRequest.php",
		"UserId=" + username +
		"&RegionCode=" + region_code +
		"&initial_app_str=" + initial_app_strings +
		"&Password=" + encoded_password,
		loginResponse => {
			// Get the session id and VIN for future API calls.
			// Sometimes the results from the API include a VehicleInfoList array, sometimes they omit it!
			if (loginResponse.VehicleInfoList) {
				sessionid = encodeURIComponent(loginResponse.VehicleInfoList.vehicleInfo[0].custom_sessionid);
				vin = encodeURIComponent(loginResponse.VehicleInfoList.vehicleInfo[0].vin);
			} else  {
				sessionid = encodeURIComponent(loginResponse.vehicleInfo[0].custom_sessionid);
				vin = encodeURIComponent(loginResponse.vehicleInfo[0].vin);
			}
			successCallback();
		}, 
		loginFailureCallback);
	}, 
	loginFailureCallback);
}

/**
* Get the battery information from the API.
**/
exports.getBatteryStatus = (successCallback, failureCallback) => {
	login(() => sendRequest("BatteryStatusRecordsRequest.php",
	"custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback));
}

/**
* Enable the climate control in the car.
**/
exports.sendPreheatCommand = (successCallback, failureCallback) => {
	login(() => sendRequest("ACRemoteRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback));
}

/**
* Enable the climate control in the car.
**/
exports.sendCoolingCommand = (successCallback, failureCallback) => {
	login(() => sendRequest("ACRemoteRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback));
}

/**
* Disable the climate control in the car.
**/
exports.sendClimateControlOffCommand = (successCallback, failureCallback) => {
	login(() => sendRequest("ACRemoteOffRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback));
}

/**
* Start charging the car.
**/
exports.sendStartChargingCommand = (successCallback, failureCallback) => {
	login(() => sendRequest("BatteryRemoteChargingRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback));
}

/**
* Request the API fetch updated data from the car.
**/
exports.sendUpdateCommand = (successCallback, failureCallback) => {
	login(() => sendRequest("BatteryStatusCheckRequest.php",
	"UserId=" + username +
	"&custom_sessionid=" + sessionid +
	"&RegionCode=" + region_code +
	"&VIN=" + vin,
	successCallback,
	failureCallback));
}

/**
* Encrypt the password for use with API calls.
**/
function encrypt(password, key) {
	var e = new Encryption();
	return e.encrypt(password, key);
}
