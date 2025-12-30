// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const retrievedValue = document.getElementById('valueContainer');
const bleStateContainer = document.getElementById('bleState');

const brightnessSlider = document.getElementById('brightnessSlider');
const colourSelect = document.getElementById('colourSelect');
// const redSlider = document.getElementById('redSlider');
// const greenSlider = document.getElementById('greenSlider');
// const blueSlider = document.getElementById('blueSlider');

var power = 0;
var brightness = 50;
var red = 100;
var green = 100;
var blue = 100;

//Define BLE Device Specs
var deviceName ='ESP32';
var bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
var ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
var sensorCharacteristic= '19b10001-e8f2-537e-4f6c-d104768a1214';

//Global Variables to Handle Bluetooth
var bleServer;
var bleServiceFound;
var sensorCharacteristicFound;

// Connect Button (search for BLE Devices only if BLE is available)
connectButton.addEventListener('click', (event) => {
    if (isWebBluetoothEnabled()){
        connectToDevice();
    }
});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Write to the ESP32 LED Characteristic
onButton.addEventListener('click', () => {
    power = 1;
    writeOnCharacteristic(power, brightness, red, green, blue);
});

offButton.addEventListener('click', () => {
    power = 0;
    writeOnCharacteristic(power, brightness, red, green, blue);
});

brightnessSlider.addEventListener('input', (event) => {
    brightness = event.target.value;
    console.log("brightness", brightness);
    writeOnCharacteristic(power, brightness, red, green, blue);
});

// rgb

colourSelect.addEventListener('input', (event) => {
    const color = event.target.value
    red = parseInt(color.substr(1,2), 16)
    green = parseInt(color.substr(3,2), 16)
    blue = parseInt(color.substr(5,2), 16)
    writeOnCharacteristic(power, brightness, red, green, blue);
})

// redSlider.addEventListener('input', (event) => {
//     red = event.target.value;
//     writeOnCharacteristic(power, brightness, red, green, blue);
// });

// greenSlider.addEventListener('input', (event) => {
//     green = event.target.value;
//     writeOnCharacteristic(power, brightness, red, green, blue);
// });

// blueSlider.addEventListener('input', (event) => {
//     blue = event.target.value;
//     writeOnCharacteristic(power, brightness, red, green, blue);
// });

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log("Web Bluetooth API is not available in this browser!");
        bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser!";
        return false
    }
    console.log('Web Bluetooth API supported in this browser.');
    return true
}

// Connect to BLE Device and Enable Notifications
function connectToDevice(){
    console.log('Initializing Bluetooth...');
    navigator.bluetooth.requestDevice({
        filters: [{name: deviceName}],
        optionalServices: [bleService]
    })
    .then(device => {
        console.log('Device Selected:', device.name);
        bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        bleStateContainer.style.color = "#24af37";
        device.addEventListener('gattservicedisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(gattServer =>{
        bleServer = gattServer;
        console.log("Connected to GATT Server");
        return bleServer.getPrimaryService(bleService);
    })
    .then(service => {
        bleServiceFound = service;
        console.log("Service discovered:", service.uuid);
        return service.getCharacteristic(sensorCharacteristic);
    })
    .then(characteristic => {
        console.log("Characteristic discovered:", characteristic.uuid);
        sensorCharacteristicFound = characteristic;
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
        characteristic.startNotifications();
        console.log("Notifications Started.");
        return characteristic.readValue();
    })
    .then(value => {
        console.log("Read value: ", value);
        const decodedValue = new TextDecoder().decode(value);
        console.log("Decoded value: ", decodedValue);
        retrievedValue.innerHTML = decodedValue;
    })
    .catch(error => {
        console.log('Error: ', error);
    })
}

function onDisconnected(event){
    console.log('Device Disconnected:', event.target.device.name);
    bleStateContainer.innerHTML = "Device disconnected";
    bleStateContainer.style.color = "#d13a30";

    connectToDevice();
}

function handleCharacteristicChange(event){
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Characteristic value changed: ", newValueReceived);
    retrievedValue.innerHTML = newValueReceived;
}

function writeOnCharacteristic(power, brightness){
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(ledCharacteristic)
        .then(characteristic => {
            console.log("Found the LED characteristic: ", characteristic.uuid);
            const data = new Uint8Array([power, brightness, red, green, blue]);
            return characteristic.writeValue(data);
        })
        .then(() => {
            console.log("Value written to LEDcharacteristic:", power);
        })
        .catch(error => {
            console.error("Error writing to the LED characteristic: ", error);
        });
    } else {
        console.error ("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }
}

function disconnectDevice() {
    console.log("Disconnect Device.");
    if (bleServer && bleServer.connected) {
        if (sensorCharacteristicFound) {
            sensorCharacteristicFound.stopNotifications()
                .then(() => {
                    console.log("Notifications Stopped");
                    return bleServer.disconnect();
                })
                .then(() => {
                    console.log("Device Disconnected");
                    bleStateContainer.innerHTML = "Device Disconnected";
                    bleStateContainer.style.color = "#d13a30";

                })
                .catch(error => {
                    console.log("An error occurred:", error);
                });
        } else {
            console.log("No characteristic found to disconnect.");
        }
    } else {
        // Throw an error if Bluetooth is not connected
        console.error("Bluetooth is not connected.");
        window.alert("Bluetooth is not connected.")
    }
}

// custom
// function writeBrightness(value) {
//     if (bleServer && bleServer.connected) {
//         bleServiceFound.getCharacteristic(ledCharacteristic)
//         .then(characteristic => {

//         })
//         .then(() => {
//             console.log("Value written to LEDcharacteristic:", value);
//         })
//         .catch(error => {
//             console.error("Error writing to the LED characteristic: ", error);
//         });
//     } else {
//         console.error ("Bluetooth is not connected. Cannot write to characteristic.")
//         window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
//     }
// }

