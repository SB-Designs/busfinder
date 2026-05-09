const API_URL =
  "https://k4dxsjc6v3.execute-api.eu-west-1.amazonaws.com/prod/live-tracking/customer-ticket/99806934-c04c-4d55-b9ac-2618b1f245b2";
const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic2JjY29hY2hlcyIsImEiOiJjbG15eTFhejkwM3l3MnVtdjhqMHdzb2tjIn0.cmIRt1Bs24fcpE-Sjizn5w";
const POLL_INTERVAL_MS = 5000;

const serviceNameEl = document.getElementById("serviceName");
const ticketIdEl = document.getElementById("ticketId");
const liveStatusEl = document.getElementById("liveStatus");
const apiUpdatedEl = document.getElementById("apiUpdated");
const mapUpdatedEl = document.getElementById("mapUpdated");
const qrCodeContainer = document.getElementById("qrcode");

mapboxgl.accessToken = MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [0.5462918, 51.5964316],
  zoom: 12,
});

const marker = new mapboxgl.Marker({ color: "#e63946" })
  .setLngLat([0.5462918, 51.5964316])
  .addTo(map);

let qrInstance;

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

function updateQrCode(ticketId) {
  if (!ticketId) return;

  qrCodeContainer.innerHTML = "";
  qrInstance = new QRCode(qrCodeContainer, {
    text: ticketId,
    width: 150,
    height: 150,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });
}

async function fetchBusLocation() {
  try {
    liveStatusEl.textContent = "Updating live location...";

    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const lat = Number(data.lat);
    const lng = Number(data.long);

    serviceNameEl.textContent = data.service_name || "Unknown service";
    ticketIdEl.textContent = data.id || "-";
    apiUpdatedEl.textContent = formatDate(data.last_updated);

    if (!qrInstance && data.id) {
      updateQrCode(data.id);
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      marker.setLngLat([lng, lat]);
      map.easeTo({ center: [lng, lat], duration: 1200, essential: true });
      mapUpdatedEl.textContent = new Date().toLocaleString();
      liveStatusEl.textContent = data.enabled
        ? "Live tracking active"
        : "Tracking currently disabled";
    } else {
      liveStatusEl.textContent = "Location unavailable";
    }
  } catch (error) {
    liveStatusEl.textContent = `Update failed: ${error.message}`;
  }
}

fetchBusLocation();
setInterval(fetchBusLocation, POLL_INTERVAL_MS);
