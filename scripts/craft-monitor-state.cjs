"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { normalize, roster } = require("./craft-progress-monitor.cjs");

const gates = ["G01", "G02", "G03"];
const fields = ["stage", "status", "task", "result", "next", "rework", "candidate"];
const patchKeys = new Set([...fields, "gates", "gateEvidence", "agents", "handoff", "event"]);
const hasText = value => typeof value === "string" && Boolean(value.trim());
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

function initialState(target, runId) {
  if (!hasText(target)) throw Error("A target name is required.");
  return {
    target, runId, stage: 1, status: "running", rework: "pending", candidate: "",
    task: "대상 버전과 분석 허용 범위 확인", result: "—", next: "필수 관찰 목록 초안 작성",
    gates: { G01: "PENDING", G02: "PENDING", G03: "PENDING" }, gateEvidence: {},
    agents: roster.map(name => ({ name, status: name === "MAIN" ? "running" : "inactive", task: "" })),
    events: [], handoffs: []
  };
}

function applyUpdate(state, patch) {
  if (!isObject(patch) || Object.keys(patch).some(key => !patchKeys.has(key))) throw Error("Unknown state update field.");
  const candidateChanged = Object.hasOwn(patch, "candidate") && patch.candidate !== state.candidate;
  for (const key of fields) if (Object.hasOwn(patch, key)) state[key] = patch[key];
  const gatePatch = patch.gates ?? {};
  const evidencePatch = patch.gateEvidence ?? {};
  for (const update of [gatePatch, evidencePatch]) {
    if (!isObject(update) || Object.keys(update).some(key => !gates.includes(key))) throw Error("Unknown Gate update field.");
  }
  if (candidateChanged || (Object.hasOwn(gatePatch, "G01") && gatePatch.G01 !== "PASS")) {
    for (const gate of ["G02", "G03"]) {
      state.gates[gate] = "PENDING";
      delete state.gateEvidence[gate];
    }
  }
  if (Object.hasOwn(gatePatch, "G02") && gatePatch.G02 !== "PASS") {
    state.gates.G03 = "PENDING";
    delete state.gateEvidence.G03;
  }
  for (const [gate, status] of Object.entries(gatePatch)) {
    if (status !== state.gates[gate]) delete state.gateEvidence[gate];
    state.gates[gate] = status;
  }
  Object.assign(state.gateEvidence, evidencePatch);
  for (const gate of gates) if (state.gates[gate] === "PENDING") delete state.gateEvidence[gate];

  const time = new Date().toISOString().slice(11, 19) + "Z";
  if (Object.hasOwn(patch, "agents")) {
    if (!Array.isArray(patch.agents) || new Set(patch.agents.map(agent => agent?.name)).size !== patch.agents.length) {
      throw Error("Agent updates must be an array with unique role names.");
    }
    for (const update of patch.agents) {
      if (!update || !roster.includes(update.name) ||
          Object.keys(update).some(key => !["name", "status", "task", "activity"].includes(key))) throw Error("Unknown agent update.");
      const agent = state.agents.find(item => item.name === update.name);
      Object.assign(agent, update);
      if (agent.status === "inactive" && !Object.hasOwn(update, "task")) agent.task = "";
      if (agent.activity === null) delete agent.activity;
    }
  }
  if (Object.hasOwn(patch, "handoff")) {
    const { from, to, task } = patch.handoff ?? {};
    if (!roster.includes(from) || !roster.includes(to) || !hasText(task)) throw Error("A handoff requires two CRAFT role names and a task.");
    state.handoffs = [...state.handoffs, { from, to, task, at: time }].slice(-3);
  }
  if (Object.hasOwn(patch, "event")) {
    if (!hasText(patch.event)) throw Error("A non-empty event summary is required.");
    state.events = [...state.events, [time, patch.event]].slice(-3);
  }
  return state;
}

function verifyState(state) {
  normalize(state);
  if (typeof state.candidate !== "string") throw Error("Candidate must be a string.");
  for (const gate of gates) {
    if (state.gates[gate] !== "PENDING" && !hasText(state.gateEvidence[gate])) {
      throw Error(gate + " requires its recorded evidence reference.");
    }
  }
  if (state.stage >= 3 && state.gates.G01 !== "PASS") throw Error("G01 PASS is required before implementation.");
  if ([4, 6].includes(state.stage) && state.gates.G02 !== "PASS") throw Error("Current candidate G02 PASS is required before measurement or acceptance.");
  if (["G02", "G03"].some(gate => state.gates[gate] !== "PENDING") && !hasText(state.candidate)) {
    throw Error("Candidate identity is required for G02 or G03.");
  }
  if (state.gates.G03 !== "PENDING" && state.stage !== 6) throw Error("G03 is decided at stage 06 only.");
  if (state.gates.G03 === "HOLD" && state.status !== "held") throw Error("G03 HOLD requires a held run.");
}

function publish(operation, file, payload) {
  const root = fs.realpathSync(path.join(__dirname, "..", ".craft-monitor"));
  const directory = fs.realpathSync(path.dirname(file));
  const runId = path.relative(root, directory);
  if (!/^\d{8}-\d{6}-[0-9a-f]{12}$/.test(runId) || path.basename(file) !== "state.json") {
    throw Error("State path must be inside a CRAFT monitor run directory.");
  }
  const target = path.join(directory, "state.json");
  const lock = target + ".lock";
  const handle = fs.openSync(lock, "wx");
  const temporary = target + ".tmp";
  try {
    let state;
    if (operation === "Start") {
      if (fs.existsSync(target)) throw Error("Monitor run already exists.");
      state = initialState(payload.target, runId);
    } else if (operation === "Update") {
      state = JSON.parse(fs.readFileSync(target, "utf8"));
      if (state.runId !== runId) throw Error("State does not belong to this monitor run.");
      state = applyUpdate(state, payload);
    } else throw Error("Unknown monitor operation.");
    verifyState(state);
    const json = JSON.stringify(state, null, 2) + "\n";
    if (Buffer.byteLength(json) > 256 * 1024) throw Error("Monitor state exceeds the viewer size limit.");
    fs.writeFileSync(temporary, json, { encoding: "utf8", flag: "wx" });
    try { fs.renameSync(temporary, target); }
    finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  } finally {
    fs.closeSync(handle);
    fs.unlinkSync(lock);
  }
}

try {
  const [operation, file] = process.argv.slice(2);
  publish(operation, file, JSON.parse(fs.readFileSync(0, "utf8").replace(/^\uFEFF/, "")));
} catch (error) {
  console.error("CRAFT monitor: " + error.message);
  process.exitCode = 1;
}
