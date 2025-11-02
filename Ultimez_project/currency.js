

// DOM references
const elements = {
  from: document.getElementById("from-currency"),
  to: document.getElementById("to-currency"),
  amount: document.getElementById("amount"),
  form: document.getElementById("converter-form"),
  historyList: document.getElementById("history-list"),
  clearHistory: document.getElementById("clear-history-btn"),
  resultBox: document.querySelector(".result"),
  amountDisplay: document.getElementById("amount-display"),
  fromDisplay: document.getElementById("from-display"),
  convertedDisplay: document.getElementById("converted-display"),
  toDisplay: document.getElementById("to-display"),
  rateInfo: document.getElementById("rate-info"),
  swap: document.getElementById("swap-btn"),
  toast: document.getElementById("toast"),
  chartCtx: document.getElementById("rateChart").getContext("2d"),
};

// Add refresh button dynamically
const refreshButton = document.createElement("button");
refreshButton.id = "refresh-btn";
refreshButton.textContent = "🔄 Refresh Rates";
document.querySelector(".container").insertBefore(refreshButton, document.querySelector(".chart-container"));

let chartInstance;
let historyData = {}; // stores conversions by pair

// API Config
const API_KEY = "73f137be3b97ba831b21821d"; 
const API_BASE = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

//  Load Currency List

async function loadCurrencies() {
  try {
    const res = await fetch(`${API_BASE}/latest/USD`);
    const data = await res.json();
    if (data.result !== "success") throw new Error("Invalid API key or response");

    const codes = Object.keys(data.conversion_rates);

    codes.forEach(code => {
      elements.from.appendChild(new Option(code, code));
      elements.to.appendChild(new Option(code, code));
    });

    elements.from.value = "USD";
    elements.to.value = "INR";

    drawChart();
  } catch (error) {
    alert("⚠️ Could not load currency list. Check your API key or connection.");
    console.error(error);
  }
}


//  Swap currencies

elements.swap.addEventListener("click", () => {
  [elements.from.value, elements.to.value] = [elements.to.value, elements.from.value];
  drawChart();
});


//  Convert currency

elements.form.addEventListener("submit", async e => {
  e.preventDefault();
  await handleConversion();
});


//  Refresh button

refreshButton.addEventListener("click", async () => {
  showToast("🔄 Refreshing latest rates...");
  await handleConversion(true);
});

// Main conversion logic

async function handleConversion(isRefresh = false) {
  const from = elements.from.value;
  const to = elements.to.value;
  const amt = parseFloat(elements.amount.value);

  if (!amt || amt <= 0) {
    alert("Please enter a valid amount!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/pair/${from}/${to}`);
    const data = await res.json();

    if (data.result !== "success") throw new Error("Invalid API response");

    const rate = data.conversion_rate;
    const converted = (amt * rate).toFixed(2);

    // Display results
    elements.amountDisplay.textContent = amt;
    elements.fromDisplay.textContent = from;
    elements.convertedDisplay.textContent = converted;
    elements.toDisplay.textContent = to;
    elements.rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;

    // Animate result
    if (!isRefresh) {
      elements.resultBox.classList.remove("show");
      setTimeout(() => elements.resultBox.classList.add("show"), 50);
    }

    showToast(isRefresh ? "✅ Rates Updated!" : "✅ Conversion Successful!");

    // Save conversion
    const key = `${from}_${to}`;
    if (!historyData[key]) historyData[key] = [];

    const time = formatRelativeTime(new Date());
    const entry = { amount: amt, converted: parseFloat(converted), rate, time };
    historyData[key].push(entry);

    // Add to history list
    const li = document.createElement("li");
    li.textContent = `${time} — ${amt} ${from} = ${converted} ${to}`;
    elements.historyList.prepend(li);

    drawChart();
  } catch (error) {
    alert("⚠️ Error fetching conversion data!");
    console.error(error);
  }
}

// Clear history

elements.clearHistory.addEventListener("click", () => {
  elements.historyList.innerHTML = "";
  historyData = {};
  drawChart();
});


//  Toast popup

function showToast(message = "✅ Success!") {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2000);
}


//  Time formatter

function formatRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
}


// 8️⃣ Chart Drawing — Amount vs Converted

function drawChart() {
  if (chartInstance) chartInstance.destroy();

  const from = elements.from.value;
  const to = elements.to.value;
  const pairKey = `${from}_${to}`;
  const chartTitle = document.querySelector(".chart-container h3");
  const history = historyData[pairKey] || [];

  if (history.length === 0) {
    chartTitle.textContent = "No conversions yet for this pair";
    elements.chartCtx.clearRect(0, 0, elements.chartCtx.canvas.width, elements.chartCtx.canvas.height);
    return;
  }

  chartTitle.textContent = `Conversion Chart (${from} → ${to})`;

  const labels = history.map(item => `${item.amount} ${from}`);
  const dataPoints = history.map(item => item.converted);

  const gradient = elements.chartCtx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(99,102,241,1)");
  gradient.addColorStop(1, "rgba(139,92,246,0.3)");

  chartInstance = new Chart(elements.chartCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${from} to ${to}`,
          data: dataPoints,
          borderColor: gradient,
          borderWidth: 3,
          fill: true,
          backgroundColor: "rgba(139,92,246,0.1)",
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: "#8b5cf6",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} ${to}`,
          },
        },
        legend: { labels: { color: "#fff" } },
      },
      scales: {
        x: { title: { display: true, text: `Amount in ${from}`, color: "#fff" }, ticks: { color: "#fff" } },
        y: { title: { display: true, text: `Converted in ${to}`, color: "#fff" }, ticks: { color: "#fff" } },
      },
    },
  });
}


loadCurrencies();
