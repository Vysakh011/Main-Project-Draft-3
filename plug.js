// ✅ Get plugId from URL query string
const urlParams = new URLSearchParams(window.location.search);
const currentPlugId = parseInt(urlParams.get("plug"), 10);

// ✅ Connect to MQTT broker
const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker over WSS");
  client.subscribe("smart/plug/data");
});

client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const plugData = data.data || data;

    // ✅ Only update if this is the selected plug
    if (data.plug === currentPlugId) {
      updatePlugUI(currentPlugId, plugData);
    }
  } catch (err) {
    console.error("❌ Error parsing message:", err);
  }
});

// ================= UI UPDATE =================
function updatePlugUI(plugId, plugData) {
  const container = document.getElementById("plugData");
  const power = (plugData.voltage * plugData.current).toFixed(2);

  container.innerHTML = `
    <h2>Plug ${plugId}</h2>
    <p class="value"><i class="bi bi-battery"></i> Voltage: ${plugData.voltage} V</p>
    <p class="value"><i class="bi bi-lightning"></i> Current: ${plugData.current} A</p>
    <p class="value"><i class="bi bi-plug"></i> Power: ${power} W</p>
    <p class="value"><i class="bi bi-clock"></i> Timer: ${plugData.timer} s</p>
  `;

  // ✅ Sync toggle with relay state (inverted logic)
  const toggle = document.getElementById("relayToggle");
  const status = document.getElementById("relayStatus");

  if (plugData.relay === 0) {
    toggle.checked = true;
    status.textContent = "Status: ON";
  } else {
    toggle.checked = false;
    status.textContent = "Status: OFF";
  }

  // ✅ Show timer countdown if active
  const timerDisplay = document.getElementById("timerDisplay");
  if (plugData.timer > 0) {
    timerDisplay.textContent = `Timer Running: ${plugData.timer} sec left`;
  } else {
    timerDisplay.textContent = "";
  }
}

// ================= CONTROL FUNCTIONS =================
function toggleRelay() {
  const toggle = document.getElementById("relayToggle");
  const status = document.getElementById("relayStatus");

  // Inverted mapping: checked → relay OFF, unchecked → relay ON
  if (toggle.checked) {
    client.publish("smart/plug/cmd", JSON.stringify({ plug: currentPlugId, cmd: "off" }));
    status.textContent = "Status: OFF";
  } else {
    client.publish("smart/plug/cmd", JSON.stringify({ plug: currentPlugId, cmd: "on" }));
    status.textContent = "Status: ON";
  }
}

function sendTimer() {
  const h = parseInt(document.getElementById("hours").value);
  const m = parseInt(document.getElementById("minutes").value);
  const s = parseInt(document.getElementById("seconds").value);
  const totalSec = h * 3600 + m * 60 + s;

  if (totalSec > 0) {
    client.publish(
      "smart/plug/cmd",
      JSON.stringify({ plug: currentPlugId, cmd: "timer", seconds: totalSec })
    );
    document.getElementById("timerDisplay").textContent = `Timer Started: ${totalSec} sec`;

    // ✅ Force toggle ON when timer starts
    const toggle = document.getElementById("relayToggle");
    toggle.checked = true;
    document.getElementById("relayStatus").textContent = "Status: ON";
  }
}
