// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const bleStateContainer = document.getElementById('bleState');
const powerStatusContainer = document.getElementById('powerStatusContainer');
const colourSelect = document.getElementById('colourSelect');

var power = 0;
// var brightness = 50;
var red = 100;
var green = 100;
var blue = 100;

//Define BLE Device Specs
var deviceName ='ESP32';
var bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
var sensorCharacteristic= '19b10001-e8f2-537e-4f6c-d104768a1214';
var ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';


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
    writeOnCharacteristic();
});

offButton.addEventListener('click', () => {
    power = 0;
    writeOnCharacteristic();
});

colourSelect.addEventListener('input', (event) => {
    const color = event.target.value
    red = parseInt(color.substr(1,2), 16)
    green = parseInt(color.substr(3,2), 16)
    blue = parseInt(color.substr(5,2), 16)
    
    // if (!ledCharacteristicFound) return;

    // const data = new Uint8Array([power, red, green, blue]);
    // ledCharacteristicFound.writeValue(data);
    writeOnCharacteristic();
})

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
        const powerState = value.getUint8(0);
        const r = value.getUint8(1);
        const g = value.getUint8(2);
        const b = value.getUint8(3);

        updateUIFromESP(powerState, r, g, b);
    })
    .catch(error => {
        console.log('Error: ', error);
    })
}

function onDisconnected(event){
    console.log('Device Disconnected:', event.target.device.name);
    bleStateContainer.innerHTML = "Device disconnected";
    bleStateContainer.style.color = "#d13a30";

    // connectToDevice();
}

function handleCharacteristicChange(event){
    const value = event.target.value;

    const powerState = value.getUint8(0);
    const r = value.getUint8(1);
    const g = value.getUint8(2);
    const b = value.getUint8(3);

    updateUIFromESP(powerState, r, g, b);
}

function writeOnCharacteristic(){  // js -> cpp
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(ledCharacteristic)
        .then(characteristic => {
            console.log("Found the LED characteristic: ", characteristic.uuid);
            const data = new Uint8Array([power, red, green, blue]);
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

function updateUIFromESP(powerState, r, g, b) {
    power = powerState;
    red = r;
    green = g;
    blue = b;

    // Power UI
    powerStatusContainer.innerText = power ? "ON" : "OFF";
    powerStatusContainer.style.color = power ? "#24af37" : "#d13a30";

    // Colour picker sync
    const hex =
      "#" +
      red.toString(16).padStart(2, "0") +
      green.toString(16).padStart(2, "0") +
      blue.toString(16).padStart(2, "0");

    colourSelect.value = hex;
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

