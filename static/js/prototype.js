"use strict";

// All simulated study conditions are defined here so researchers can edit them easily.
const scenarios = {
  A: { name: "Simple delay", serviceTime: "8:10 AM", eta: "8:14 AM", etaLabel: "Estimated arrival", delayText: "4 min delayed", status: "Delayed", onTimeRate: 86, averageDelay: 3, liveAvailable: true, alternativeDeparture: null },
  B: { name: "Repeated ETA change", serviceTime: "8:25 AM", eta: "6 min", etaLabel: "Live ETA", delayText: "", status: "Live ETA", onTimeRate: 68, averageDelay: 8, liveAvailable: true, alternativeDeparture: "8:32 AM" },
  C: { name: "Live data unavailable", serviceTime: "8:40 AM", eta: "7 min", etaLabel: "Live ETA", delayText: "", status: "Live ETA", onTimeRate: 65, averageDelay: 8, liveAvailable: true, alternativeDeparture: "8:47 AM" }
};

let selectedScenarioKey = null;
let scenarioState = null;
let activeTimers = [];
let runToken = 0;

const byId = (id) => document.getElementById(id);
const welcomeScreen = byId("welcomeScreen");
const contextScreen = byId("contextScreen");
const journeyScreen = byId("journeyScreen");
const beginButton = byId("beginButton");
const resetButton = byId("resetButton");

function clearScenarioTimers() {
  activeTimers.forEach((timerId) => clearTimeout(timerId));
  activeTimers = [];
  runToken += 1; // Stale callbacks cannot mutate a newer scenario run.
}

function scheduleScenarioAction(delayMs, action) {
  const scheduledRun = runToken;
  const timerId = setTimeout(() => {
    if (scheduledRun === runToken) action();
  }, delayMs);
  activeTimers.push(timerId);
}

function initialStateFor(scenarioKey) {
  const config = scenarios[scenarioKey];
  return { ...config, repeatedEtaChange: false, phase: "context" };
}

// Priority-ordered research logic, kept independent from scenario rendering.
function calculateRecommendation(state) {
  if (!state.liveAvailable) return { title: "Consider an alternative route", reason: "Live arrival information is unavailable.", visualState: "caution" };
  if (state.onTimeRate < 60) return { title: "Consider an alternative route", reason: "Historical on-time performance is low.", visualState: "caution" };
  if (state.averageDelay > 10) return { title: "Consider an alternative route", reason: "Historical delays are often longer.", visualState: "caution" };
  if (state.repeatedEtaChange) return { title: "Either option may be reasonable", reason: "ETA has changed repeatedly.", visualState: "neutral" };
  if ((state.onTimeRate >= 60 && state.onTimeRate <= 79) || (state.averageDelay >= 6 && state.averageDelay <= 10)) return { title: "Either option may be reasonable", reason: "Historical reliability is moderate.", visualState: "neutral" };
  if (state.onTimeRate >= 80 && state.averageDelay <= 5) return { title: "Consider waiting", reason: "This service is usually reliable.", visualState: "stable" };
  return { title: "Either option may be reasonable", reason: "Current service information is mixed.", visualState: "neutral" };
}

function renderRecommendation(result) {
  const icons = { stable: "◷", neutral: "↔", caution: "△" };
  byId("recommendationCard").className = `card recommendation-card ${result.visualState}`;
  byId("recommendationIcon").textContent = icons[result.visualState];
  byId("recommendationTitle").textContent = result.title;
  byId("recommendationReason").textContent = result.reason;
}

function renderScenario() {
  byId("serviceTime").textContent = scenarioState.serviceTime;
  byId("statusHeading").textContent = scenarioState.liveAvailable ? scenarioState.status : "Live information unavailable";
  byId("statusIcon").textContent = scenarioState.liveAvailable ? "◷" : "△";
  byId("etaLabel").textContent = scenarioState.etaLabel;
  byId("etaValue").textContent = scenarioState.eta;
  byId("delayText").textContent = scenarioState.delayText;
  byId("onTimeRate").textContent = `${scenarioState.onTimeRate}%`;
  byId("averageDelay").textContent = `${scenarioState.averageDelay} min`;
  byId("etaBlock").classList.toggle("unavailable", !scenarioState.liveAvailable);
  byId("liveWarning").hidden = scenarioState.liveAvailable;
  byId("liveWarning").textContent = scenarioState.liveAvailable ? "" : "Live information unavailable — this ETA may no longer be reliable";
  const showAlternative = selectedScenarioKey === "B" || (selectedScenarioKey === "C" && !scenarioState.liveAvailable);
  byId("alternativeCard").hidden = !showAlternative;
  if (showAlternative) byId("alternativeDeparture").textContent = scenarioState.alternativeDeparture;
  renderRecommendation(calculateRecommendation(scenarioState));
}

function showContext(scenarioKey) {
  clearScenarioTimers();
  selectedScenarioKey = scenarioKey;
  scenarioState = initialStateFor(scenarioKey);
  welcomeScreen.hidden = true;
  journeyScreen.hidden = true;
  contextScreen.hidden = false;
  byId("contextServiceTime").textContent = scenarioState.serviceTime;
  byId("completeMessage").hidden = true;
  byId("updateText").textContent = "";
  byId("etaBlock").className = "eta-block";
  beginButton.disabled = false;
  resetButton.disabled = false;
  byId("researchStatus").textContent = `Scenario ${scenarioKey} selected — context shown`;
  document.querySelectorAll(".scenario-button").forEach((button) => button.classList.toggle("selected", button.dataset.scenario === scenarioKey));
}

function highlightEtaUpdate() {
  const block = byId("etaBlock");
  block.classList.remove("updated");
  void block.offsetWidth;
  block.classList.add("updated");
  byId("updateText").textContent = "Updated just now";
  scheduleScenarioAction(2500, () => { byId("updateText").textContent = ""; block.classList.remove("updated"); });
}

function beginScenario() {
  if (!selectedScenarioKey) return;
  clearScenarioTimers();
  scenarioState = { ...initialStateFor(selectedScenarioKey), phase: "running" };
  contextScreen.hidden = true;
  journeyScreen.hidden = false;
  byId("completeMessage").hidden = true;
  byId("updateText").textContent = "";
  byId("etaBlock").className = "eta-block";
  renderScenario();
  beginButton.disabled = true;
  byId("researchStatus").textContent = `Scenario ${selectedScenarioKey} running`;

  if (selectedScenarioKey === "B") {
    scheduleScenarioAction(10000, () => { scenarioState.eta = "9 min"; renderScenario(); highlightEtaUpdate(); });
    scheduleScenarioAction(20000, () => { scenarioState.eta = "12 min"; scenarioState.repeatedEtaChange = true; renderScenario(); highlightEtaUpdate(); });
  }
  if (selectedScenarioKey === "C") {
    scheduleScenarioAction(10000, () => { scenarioState.liveAvailable = false; renderScenario(); highlightEtaUpdate(); });
  }
  scheduleScenarioAction(30000, () => {
    scenarioState.phase = "complete";
    byId("completeMessage").hidden = false;
    byId("researchStatus").textContent = `Scenario ${selectedScenarioKey} complete`;
  });
}

function resetCurrentScenario() {
  if (selectedScenarioKey) showContext(selectedScenarioKey);
}

document.querySelectorAll(".scenario-button").forEach((button) => button.addEventListener("click", () => showContext(button.dataset.scenario)));
beginButton.addEventListener("click", beginScenario);
resetButton.addEventListener("click", resetCurrentScenario);

// Expose pure logic for quick manual checks in the browser console.
window.calculateRecommendation = calculateRecommendation;
window.prototypeScenarios = scenarios;
