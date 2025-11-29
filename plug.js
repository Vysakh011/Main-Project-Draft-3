// plug.js

// ✅ MQTT Setup
const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("smartplug/1");
});

client.on("message", (topic, message) => {
  const data = JSON.parse(message.toString());
  updatePlugData(data);
});

// ✅ Update Plug Data
function updatePlugData(data) {
  const container = document.getElementById("plugData");
  container.innerHTML = `
    <div class="plug-card">
      <h2>Plug ${data.plug}</h2>
      <p class="value"><i class="bi bi-battery"></i> Voltage: ${data.voltage.toFixed(2)} V</p>
      <p class="value"><i class="bi bi-lightning"></i> Current: ${data.current.toFixed(3)} A</p>
      <p class="value"><i class="bi bi-toggle-on"></i> Relay: ${data.relay}</p>
      <p class="value"><i class="bi bi-clock"></i> Timer: ${data.timer}</p>
    </div>
  `;

  // ✅ Inverted relay logic for toggle
  updateRelayStatus(data.relay);

  // ✅ Timer display stays the same
  if (data.timer > 0) {
    document.getElementById("timerDisplay").textContent = `Timer running: ${data.timer} sec`;
  } else {
    document.getElementById("timerDisplay").textContent = "";
  }
}

// ✅ Inverted Relay Status
function updateRelayStatus(relay) {
  const toggle = document.getElementById("relayToggle");
  const status = document.getElementById("relayStatus");

  if (relay === 0) {
    // Relay OFF → Show toggle ON (green)
    toggle.checked = true;
    status.textContent = "Status: ON";
  } else {
    // Relay ON → Show toggle OFF (gray)
    toggle.checked = false;
    status.textContent = "Status: OFF";
  }
}

// ✅ Toggle Relay (publish inverted command)
function toggleRelay() {
  const toggle = document.getElementById("relayToggle");
  let relayValue;

  if (toggle.checked) {
    // UI ON → Send relay=0
    relayValue = 0;
    document.getElementById("relayStatus").textContent = "Status: ON";
  } else {
    // UI OFF → Send relay=1
    relayValue = 1;
    document.getElementById("relayStatus").textContent = "Status: OFF";
  }

  const payload = JSON.stringify({
    plug: 1,
    relay: relayValue
  });

  client.publish("smartplug/1/set", payload);
}

// ✅ Send Timer
function sendTimer() {
  const h = parseInt(document.getElementById("hours").value);
  const m = parseInt(document.getElementById("minutes").value);
  const s = parseInt(document.getElementById("seconds").value);

  const totalSeconds = h * 3600 + m * 60 + s;

  const payload = JSON.stringify({
    plug: 1,
    timer: totalSeconds
  });

  client.publish("smartplug/1/timer", payload);
  document.getElementById("timerDisplay").textContent = `Timer set: ${totalSeconds} sec`;
}
