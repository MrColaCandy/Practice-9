const searchInput = document.getElementById("search-input");
const searchForm = document.getElementById("search-form");
const suggestionsUl = document.getElementById("suggestions-ul");
const closeModalBtn = document.getElementById("modal-close-btn");
const openModalBtn = document.getElementById("modal-open-btn");
const currentCitySection = document.getElementById("current-city");
const cityTitle = document.getElementById("city-title");
const cards = document.getElementById("cards");
const today = document.getElementById("today");
const historyDiv = document.getElementById("history");

const historyMap = new Map(JSON.parse(localStorage.getItem("history")));

drawHistory([...historyMap.entries()]);
openModalBtn.onclick = () => {
  drawHistory([...historyMap.entries()]);
};
const apiKey = "YGM55ZK6AP39B22TGNQQMF6SV";

let currentCity = { name: "Tehran", lat: "35.7219", lon: "51.3347" };

let cities = [];
getCities();
getWeather(`${currentCity.lat},${currentCity.lon}`, getToday(), getNextWeek());
searchInput.addEventListener("keyup", (e) => {
  getSearchSuggestions(e.target.value.toString().trim());
  toggleSuggestionsUl();
});
suggestionsUl.addEventListener("click", (e) => {
  const target = e.target;
  if (target.nodeName !== "LI") return;
  currentCity = cities.find((city) => city.id == target.id);

  searchInput.value = currentCity.name;
  closeModalBtn.click();
});
searchForm.onsubmit = (e) => {
  e.preventDefault();

  currentCity = cities.find((city) =>
    city.name.toLowerCase().startsWith(searchInput.value.toLowerCase())
  );
  if (!currentCity) {
    searchInput.value = "";
    return;
  }
  closeModalBtn.click();
};
closeModalBtn.onclick = async () => {
  closeSuggestions();
  cityTitle.innerHTML = `
  <div class="spinner-border text-center text-success" role="status">
     <span class="sr-only"></span>
  </div>`;

  if (!currentCity) {
    return;
  }

  const data = await getWeather(
    `${currentCity.lat},${currentCity.lon}`,
    getToday(),
    getNextWeek()
  );

  historyMap.set(currentCity.name, data.currentConditions);
  localStorage.setItem("history", JSON.stringify([...historyMap.entries()]));
};
function closeSuggestions() {
  searchInput.value = "";
  suggestionsUl.innerHTML = "";
  suggestionsUl.parentElement.style.height = "0px";
}

function getSearchSuggestions(value) {
  suggestionsUl.innerHTML = "";
  if (value.match(/\s+/) || value === "") {
    suggestionsUl.innerHTML = "";
    return;
  }
  const suggestions = cities.filter((city) => {
    return city.name.toLowerCase().startsWith(value.toLowerCase());
  });

  suggestions.forEach((suggestion) => {
    const li = document.createElement("li");
    li.setAttribute("id", suggestion.id);
    li.innerText = suggestion.name;
    suggestionsUl.append(li);
  });
}

function toggleSuggestionsUl() {
  if (suggestionsUl.innerHTML === "") {
    suggestionsUl.parentElement.style.height = "0px";
  } else {
    suggestionsUl.parentElement.style.height = "200px";
  }
}

async function getWeather(location = "", startTime, endTime) {
  const data = await getWeatherData(location, startTime, endTime);
  cityTitle.innerText = currentCity.name;

  const xValues = [];
  const yValues = [];
  data.days.forEach((day, index) => {
    xValues[index] = getDayInWeek(day);
    yValues[index] = getCelsiusTemp(day.temp);
  });
  drawChart({
    labels: xValues,
    datasets: [
      {
        label: currentCity.name + " Temperatures °C",
        borderColor: "rgba(0,0,255,0.1)",
        data: yValues,
      },
    ],
  });
  drawCards(data);
  return data;
}
async function getWeatherData(location, startTime, endTime) {
  const res = await fetch(
    "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" +
      location +
      "/" +
      startTime +
      "/" +
      endTime +
      "/?key=" +
      apiKey,
    {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  return data;
}

function getCelsiusTemp(temp) {
  return Math.floor((temp - 32) * (5 / 9));
}

function getDayInWeek(day) {
  return moment(day.datetime).format("dddd");
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getNextWeek() {
  const now = Date.now() + 6 * 24 * 60 * 60 * 1000;
  return new Date(now).toISOString().split("T")[0];
}
async function getCities() {
  const saved = JSON.parse(localStorage.getItem("cities"));
  if (saved) {
    cities = saved;
    return;
  }
  const res = await fetch(
    "https://api.jsonbin.io/v3/b/64d329939d312622a38e45a2?meta=false",
    {
      headers: {
        "X-Master-Key":
          "$2b$10$9UY1zovPAw8Eugiwt0/ytuEZ30WTB68nyrwSe7luZHy6l/nGcdiya",
        "X-Access-Key":
          "$2b$10$NVqxdTmypEGpHvC0vBLQuOnSVu6TfJ4rrgU/MuOPh6Pl2ldu3AQxq",
      },
    }
  );
  const data = await res.json();
  cities = data;
  localStorage.setItem("cities", JSON.stringify(data));
}

function drawChart(data) {
  new Chart("chart-daily", {
    type: "line",
    data: data,
  });
}

function drawCards(data) {
  cards.innerHTML = "";
  data.days.forEach((day, index) => {
    const card = createCardHTML(day);
    if (index === 0) {
      today.innerHTML = card;
      return;
    }

    cards.innerHTML += `<div  class="next-week" >${card}</div>`;
  });
}

function createCardHTML(day) {
  return `
  <div class="card  text-center">
  <img class="card-img-top" src="./assets/images/${
    day.icon
  }.png" alt="Card image cap">
    <div class="card-body">
    <h5 class="card-title">${moment(day.datetime).format("dddd")}</h5>
    <h6 class="card-subtitle mb-2 text-muted">${day.datetime}</h6>
     <p class="card-text">${day.description}</p>
     <p class="card-text text-center text-danger">temp: ${getCelsiusTemp(
       day.temp
     )} °C</p>
     <p class="card-text text-center text-primary">humidity: ${
       day.humidity
     } %</p>
     <p class="card-text text-center text-secondary">wind speed: ${
       day.windspeed
     } KM/H</p>
    </div>
  </div>
    `;
}

function drawHistory(his) {
  if (his.length >= 4) {
    his = his.slice(-3);
  }
  historyDiv.innerHTML = "";
  his.forEach((h) => {
    const cityName = h[0];
    const condition = h[1];

    const card = `
  <div  class="card  text-center">
  <img class="card-img-top" src="./assets/images/${
    condition.icon
  }.png" alt="Card image cap">
    <div class="card-body">
    <h5 class="card-title">Today</h5>
    <h6 class="card-subtitle mb-2 text-muted">${condition.datetime}</h6>
     <p class="card-text">${cityName}</p>
     <p class="card-text text-center text-danger">temp: ${getCelsiusTemp(
       condition.temp
     )} °C</p>
     <button data-city="${cityName}" class="btn btn-success" >See More</button>
    </div>
    
  </div>
    `;

    historyDiv.innerHTML += card;
  });
}

historyDiv.addEventListener("click", (e) => {
  if (e.target.nodeName === "BUTTON") {
    const name = e.target.dataset.city;
    const city = cities.find((c) => c.name === name);
    currentCity = city;
    closeModalBtn.click();
  }
});
