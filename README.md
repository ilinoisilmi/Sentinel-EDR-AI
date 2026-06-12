##!!!!After downloading do "npm install" then do "npm run dev" to start the tool!!!!




Sentinel is a single-page React app that recreates a full security operations center across seven modules — process monitoring, network defense, email/phishing analysis, ML-driven analytics, API gateway scoring, file-integrity/ransomware detection, and threat intelligence.

Each module pairs a realistic, animated attack scenario with a plain-English explanation of what's happening and how the detection actually works — making it equally useful as a learning tool, a demo, or a UI/animation showcase.# 🛡️ Sentinel — Interactive XDR / SOC Console

> An interactive, browser-based security operations center that teaches how modern endpoint, network, and threat-intel tooling works — through live simulated attacks, plain-English explanations, and machine learning models built entirely from scratch.

![React](https://img.shields.io/badge/React-Hooks-61DAFB?logo=react&logoColor=white&style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black&style=flat-square)
![ML Engine](https://img.shields.io/badge/ML%20Engine-Zero%20Dependencies-success?style=flat-square)

## Overview

Sentinel is a single-page React app that recreates a full security operations center across **seven modules** — process monitoring, network defense, email/phishing analysis, ML-driven analytics, API gateway scoring, file-integrity/ransomware detection, and threat intelligence.

Each module pairs a realistic, animated attack scenario with a plain-English explanation of what's happening and how the detection actually works — making it equally useful as a learning tool, a demo, or a UI/animation showcase.

## Modules

- 🖥️ **Host XDR** — A live process table that gets "infected" mid-session by a C2 beacon process. Force-kill the threat and watch a 5-rule ensemble classifier explain its verdict in plain English.
- 🌐 **Network Perimeter** — Visualize active socket connections, inject a simulated C2 connection to a known-bad IP, block it, and explore an Isolation Forest anomaly heatmap of live traffic.
- 📧 **Email Analysis** — Paste any email (or pick from 5 built-in samples) to get a phishing risk score based on urgency language, credential requests, financial keywords, and suspicious links.
- 🧠 **ML Analytics** — Side-by-side explainer cards and visualizations for Isolation Forest anomaly detection, K-Means traffic clustering (k = 2–5), and automatic firewall rule-conflict detection.
- ⚙️ **API Gateway Monitor** — Real-time risk scoring of API traffic from request rate + payload size, with a live-feed simulation mode and a breakdown of each factor's contribution to the score.
- 📁 **File Integrity Monitor** — Simulates a ransomware encryption burst in real time, complete with a live attack timeline, screen-shake/glitch effects at the attack peak, and a quarantine workflow.
- 🎯 **Threat Intelligence** — A feed of known-malicious IPs with confidence scores, geolocation, and tags, plus a MITRE ATT&CK–mapped view of which attacker tactics are currently active.

## Under the hood

Every "AI verdict" in Sentinel is backed by a real (if simplified) algorithm, hand-implemented in pure JavaScript — no ML libraries:

- **Isolation Forest** — random-partitioning trees for anomaly scoring, used in the Network, ML Analytics, and File Integrity modules
- **K-Means clustering** — groups traffic samples into behavioral clusters with a configurable k
- **Ensemble voting classifier** — a 5-rule majority-vote model used for threat classification in Host XDR, Email Analysis, and the Gateway Monitor
- **Keyword-based NLP heuristics** — scores email text for urgency, credential-harvesting, and financial social-engineering language, plus URL-pattern analysis

## Design & motion

- Custom animation primitives built with plain React state + CSS keyframes — particle bursts on block/kill, screen-flash overlays, typewriter text, animated counters, and a terminal-style live event log
- Fully themeable via CSS custom properties (`--color-background-primary`, `--color-text-secondary`, etc.)
- Typeset in `Inter` / `DM Sans` and `JetBrains Mono`

## Note

This is a **simulation built for education and demos** — all attacks, IPs, and detections are scripted or randomly generated. No real network, filesystem, or process data is read or modified.
