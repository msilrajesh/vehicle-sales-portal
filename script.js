let map = L.map('map').setView([17.385044, 78.486671], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let geoLayer;
let salesData = [];
let geojsonData;

function loadDropdowns() {
  const dealers = [...new Set(salesData.map(d => d.Dealer))].filter(Boolean);
  const models = [...new Set(salesData.map(d => d.Model))].filter(Boolean);
  const months = [...new Set(salesData.map(d => d.Month))].filter(Boolean);
  const years = [...new Set(salesData.map(d => d.Financial_Year))].filter(Boolean);

  fillDropdown("modelDropdown", models);
  fillDropdown("dealerDropdown", dealers);
  fillDropdown("monthDropdown", months);
  fillDropdown("yearDropdown", years);
}

function fillDropdown(id, items) {
  const select = document.getElementById(id);
  select.innerHTML = '<option value="All">All</option>';
  items.forEach(item => {
    select.innerHTML += `<option value="${item}">${item}</option>`;
  });
  select.onchange = updateMap;
}

function updateMap() {
  const model = document.getElementById('modelDropdown').value;
  const dealer = document.getElementById('dealerDropdown').value;
  const month = document.getElementById('monthDropdown').value;
  const year = document.getElementById('yearDropdown').value;

  let filtered = salesData;
  if (model !== 'All') filtered = filtered.filter(d => d.Model === model);
  if (dealer !== 'All') filtered = filtered.filter(d => d.Dealer === dealer);
  if (month !== 'All') filtered = filtered.filter(d => d.Month === month);
  if (year !== 'All') filtered = filtered.filter(d => d.Financial_Year === year);

  const pincodeCount = {};
  filtered.forEach(d => {
    pincodeCount[d.Pincode] = (pincodeCount[d.Pincode] || 0) + 1; // or +Number(d.Units_Sold) if you want total units
  });

  if (geoLayer) map.removeLayer(geoLayer);

  geoLayer = L.geoJSON(geojsonData, {
    style: feature => {
      const count = pincodeCount[feature.properties.pincode] || 0;
      let color = count === 0 ? '#ccc' : count > 20 ? '#006400' : count > 10 ? '#90ee90' : '#ff6666';
      return {
        color: '#333',
        fillColor: color,
        fillOpacity: 0.5,
        weight: 1
      };
    },
    onEachFeature: (feature, layer) => {
      const pin = feature.properties.pincode;
      layer.bindTooltip(`Pincode: ${pin}<br>Sales: ${pincodeCount[pin] || 0}`);
    }
  }).addTo(map);
}

fetch('sample_sales_data.csv')
  .then(response => response.text())
  .then(csv => {
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        salesData = results.data;
        loadDropdowns();
        updateMap();
      }
    });
  });

fetch('hyderabad_pincode_polygons.geojson')
  .then(res => res.json())
  .then(data => {
    geojsonData = data;
    updateMap();
  });
