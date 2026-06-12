import { useState, useEffect, useRef, useCallback } from "react";

const RED    = "#E24B4A", RED_BG    = "#FCEBEB", RED_TEXT    = "#791F1F";
const AMBER  = "#EF9F27", AMBER_BG  = "#FAEEDA", AMBER_TEXT  = "#633806";
const GREEN  = "#639922", GREEN_BG  = "#EAF3DE", GREEN_TEXT  = "#27500A";
const BLUE   = "#378ADD", BLUE_BG   = "#E6F1FB", BLUE_TEXT   = "#0C447C";
const PURPLE = "#7F77DD", PURPLE_BG = "#EEEDFE", PURPLE_TEXT = "#3C3489";
const GRAY   = "#888780", GRAY_BG   = "#F1EFE8", GRAY_TEXT   = "#444441";

/* ─── Particle burst on block/kill ────────────────────────────────────────── */
function ParticleBurst({ trigger, color = GREEN }) {
  const [particles, setParticles] = useState([]);
  const prevTrigger = useRef(trigger);
  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;
    if (!trigger) return;
    const p = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i / 14) * 360,
      dist: 30 + Math.random() * 30,
      size: 3 + Math.random() * 4,
    }));
    setParticles(p);
    setTimeout(() => setParticles([]), 700);
  }, [trigger]);
  if (!particles.length) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {particles.map(p => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.dist;
        const ty = Math.sin(rad) * p.dist;
        return (
          <div key={p.id} style={{
            position: "absolute", top: "50%", left: "50%",
            width: p.size, height: p.size, borderRadius: "50%", background: color,
            transform: "translate(-50%,-50%)",
            animation: `particleFly 0.65s ease-out forwards`,
            "--tx": `${tx}px`, "--ty": `${ty}px`,
          }} />
        );
      })}
    </div>
  );
}

/* ─── Screen flash overlay ────────────────────────────────────────────────── */
function ScreenFlash({ trigger, color = RED }) {
  const [visible, setVisible] = useState(false);
  const prev = useRef(trigger);
  useEffect(() => {
    if (trigger === prev.current) return;
    prev.current = trigger;
    if (!trigger) return;
    setVisible(true);
    setTimeout(() => setVisible(false), 500);
  }, [trigger]);
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
      background: color + "22",
      animation: "flashFade 0.5s ease-out forwards",
    }} />
  );
}

/* ─── Typewriter text ─────────────────────────────────────────────────────── */
function Typewriter({ text, speed = 28 }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0, borderRight: `2px solid currentColor` }}>&nbsp;</span></span>;
}

/* ─── Animated counter ────────────────────────────────────────────────────── */
function AnimCount({ value, color }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    prev.current = value;
    const diff = value - start;
    const steps = 12;
    let s = 0;
    const id = setInterval(() => {
      s++;
      setDisp(Math.round(start + (diff * s) / steps));
      if (s >= steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [value]);
  return <span style={{ color, fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>{disp}</span>;
}

function Tag({ color = "gray", children }) {
  const map = {
    danger: [RED_BG, RED_TEXT], warning: [AMBER_BG, AMBER_TEXT],
    success: [GREEN_BG, GREEN_TEXT], info: [BLUE_BG, BLUE_TEXT],
    purple: [PURPLE_BG, PURPLE_TEXT], gray: [GRAY_BG, GRAY_TEXT],
  };
  const [bg, fg] = map[color] || map.gray;
  return (
    <span style={{
      background: bg, color: fg, fontSize: 11, fontWeight: 500,
      padding: "2px 9px", borderRadius: 5, whiteSpace: "nowrap", letterSpacing: 0.4,
      fontFamily: "'Inter', 'DM Sans', var(--font-sans)",
    }}>{children}</span>
  );
}

function LiveDot({ color = GREEN, pulse = true }) {
  return (
    <span style={{
      display: "inline-block", width: 7, height: 7, borderRadius: "50%",
      background: color, flexShrink: 0,
      animation: pulse ? "pulse 2s ease infinite" : undefined,
    }} />
  );
}

function isolationForest(points, nTrees = 40) {
  function buildTree(pts, depth, maxDepth) {
    if (pts.length <= 1 || depth >= maxDepth) return { leaf: true, size: pts.length };
    const keys = Object.keys(pts[0]).filter(k => typeof pts[0][k] === "number");
    const feat = keys[Math.floor(Math.random() * keys.length)];
    const vals = pts.map(p => p[feat]);
    const min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) return { leaf: true, size: pts.length };
    const split = min + Math.random() * (max - min);
    return { feat, split,
      left: buildTree(pts.filter(p => p[feat] < split), depth + 1, maxDepth),
      right: buildTree(pts.filter(p => p[feat] >= split), depth + 1, maxDepth) };
  }
  function pathLen(tree, pt, d = 0) {
    if (tree.leaf) return d + (tree.size > 1 ? Math.log2(tree.size) : 0);
    return pt[tree.feat] < tree.split ? pathLen(tree.left, pt, d + 1) : pathLen(tree.right, pt, d + 1);
  }
  const n = points.length;
  const maxDepth = Math.ceil(Math.log2(n));
  const sampleSize = Math.min(256, n);
  const c = sampleSize > 2 ? 2 * (Math.log(sampleSize - 1) + 0.5772) - 2 * (sampleSize - 1) / sampleSize : 1;
  const trees = Array.from({ length: nTrees }, () => {
    const s = [...points].sort(() => Math.random() - 0.5).slice(0, sampleSize);
    return buildTree(s, 0, maxDepth);
  });
  return points.map(pt => {
    const avg = trees.reduce((s, t) => s + pathLen(t, pt), 0) / nTrees;
    const score = parseFloat(Math.pow(2, -avg / c).toFixed(3));
    return { ...pt, score, anomaly: score > 0.6 };
  });
}

function kMeans(points, k = 3, maxIter = 100) {
  if (points.length < k) return points.map((p, i) => ({ ...p, cluster: i % k }));
  const keys = Object.keys(points[0]).filter(k => typeof points[0][k] === "number");
  let centroids = points.slice(0, k).map(p => ({ ...p }));
  let labels = new Array(points.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    const next = points.map(pt => {
      let best = 0, bestD = Infinity;
      centroids.forEach((c, i) => {
        const d = keys.reduce((s, k) => s + (pt[k] - c[k]) ** 2, 0);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    });
    if (!next.some((l, i) => l !== labels[i])) break;
    labels = next;
    centroids = Array.from({ length: k }, (_, ci) => {
      const g = points.filter((_, i) => labels[i] === ci);
      if (!g.length) return centroids[ci];
      return Object.fromEntries(keys.map(k => [k, g.reduce((s, p) => s + p[k], 0) / g.length]));
    });
  }
  return points.map((pt, i) => ({ ...pt, cluster: labels[i] }));
}

function rfClassify({ rate, payload, urgency = 0, credential = 0, financial = 0, urlCount = 0 }) {
  const votes = [
    (rate > 100 && payload > 400) ? "THREAT" : "safe",
    urgency > 2 && credential > 1 ? "PHISHING" : financial > 1 ? "SUSPICIOUS" : "safe",
    rate > 140 || payload > 1000 ? "THREAT" : urlCount > 2 ? "SUSPICIOUS" : "safe",
    credential > 3 ? "PHISHING" : urgency > 3 ? "SUSPICIOUS" : "safe",
    (rate / 100 + payload / 500 + urgency / 5 + credential / 5) > 2 ? "THREAT" : "safe",
  ];
  const counts = votes.reduce((a, v) => { a[v] = (a[v] || 0) + 1; return a; }, {});
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
}

const URGENCY_WORDS = ["urgent","expire","immediately","action required","permanently locked","suspended","hours left","unauthorized","final notice","terminated","freeze"];
const CREDENTIAL_WORDS = ["password","login","verify","credential","office365","click here","auth","sign-in","portal","verification","reset link","mfa","2fa"];
const FINANCIAL_WORDS = ["invoice","wire transfer","payment","bitcoin","crypto","billing","reimbursement","direct deposit","payroll"];

function analyzeEmail(text) {
  const t = (text || "").toLowerCase();
  const urgency = URGENCY_WORDS.filter(w => t.includes(w)).length;
  const credential = CREDENTIAL_WORDS.filter(w => t.includes(w)).length;
  const financial = FINANCIAL_WORDS.filter(w => t.includes(w)).length;
  let score = Math.min(urgency * 12, 30) + Math.min(credential * 12, 35) + Math.min(financial * 10, 15);
  const urls = (text.match(/https?:\/\/[^\s]+/g) || []);
  if (urls.length) { score += 10; if (urls.some(u => /auth|login|verify|update|secure|portal|-|o365/.test(u))) score += 10; }
  score = Math.min(score, 100);
  return { score, urgency, credential, financial, urlCount: urls.length, verdict: score >= 50 ? "PHISHING" : score >= 30 ? "SUSPICIOUS" : "SAFE" };
}

function genNetwork() {
  return Array.from({ length: 60 }, () => ({ rate: Math.floor(Math.random() * 200), payload: Math.floor(Math.random() * 1200) }));
}

const EMAIL_SAMPLES = [
  { label: "Phishing", text: "Your account will be permanently locked in 24 hours. Click here to verify your credentials immediately or face permanent suspension. https://auth-verify-portal.net/login" },
  { label: "Phishing 2", text: "Urgent: Unauthorized login attempt detected. Action required to restore access. Submit password reset link now. https://office365-secure-portal.net" },
  { label: "Benign", text: "Hi team, the Q3 report is ready. Please review and send feedback by Friday." },
  { label: "Suspicious", text: "Invoice #4421 attached for your records. Payment due within 30 days via direct deposit or wire transfer." },
  { label: "Ransom note", text: "Final notice: billing suspended. Verify your account using the link https://secure-billing-update.io/verify now." },
];

const RULES = [
  { id: "R001", condition: "ip==185.220.101.5", action: "BLOCK", target: "185.220.101.5", priority: 1 },
  { id: "R002", condition: "ip==185.220.101.5", action: "LOG", target: "185.220.101.5", priority: 2 },
  { id: "R003", condition: "port==443", action: "ALLOW", target: "443", priority: 3 },
  { id: "R004", condition: "port==443", action: "INSPECT", target: "443", priority: 4 },
  { id: "R005", condition: "rate>140", action: "THROTTLE", target: "rate", priority: 5 },
  { id: "R006", condition: "payload>1000", action: "BLOCK", target: "payload", priority: 6 },
  { id: "R007", condition: "ip==45.227.254.12", action: "BLOCK", target: "45.227.254.12", priority: 7 },
  { id: "R008", condition: "ip==45.227.254.12", action: "ALLOW", target: "45.227.254.12", priority: 8 },
];

const THREAT_INTEL = [
  { ip: "185.220.101.5", type: "Command & Control server", conf: 98, country: "Russia", tags: ["tor-exit","ransomware","c2"], seen: "2 min ago", verdict: "CRITICAL", detail: "This IP is a known Tor exit node used by ransomware operators to relay stolen data. Connections here mean malware on your network is actively calling home." },
  { ip: "45.227.254.12", type: "Phishing host", conf: 91, country: "Nigeria", tags: ["phishing","credential-harvest"], seen: "14 min ago", verdict: "HIGH", detail: "Hosts fake login pages that harvest usernames and passwords. Users who clicked a phishing link may have submitted credentials to this server." },
  { ip: "91.108.4.0", type: "Telegram C2 relay", conf: 74, country: "Netherlands", tags: ["telegram","exfil"], seen: "1 hr ago", verdict: "HIGH", detail: "Attackers route stolen data through Telegram to blend with legitimate traffic. Connections here indicate active data exfiltration." },
  { ip: "198.51.100.42", type: "Port scanner", conf: 62, country: "China", tags: ["shodan","mass-scan"], seen: "3 hr ago", verdict: "MEDIUM", detail: "Automated scanner probing your network for open ports and vulnerabilities. Low immediate risk but indicates reconnaissance activity." },
  { ip: "203.0.113.99", type: "Spam relay", conf: 55, country: "India", tags: ["spam","botnet"], seen: "6 hr ago", verdict: "MEDIUM", detail: "Part of a spam botnet. May be sending phishing emails through your mail servers or using compromised accounts on your domain." },
  { ip: "10.0.0.254", type: "Internal pivot attempt", conf: 88, country: "Internal", tags: ["lateral-movement","internal"], seen: "8 min ago", verdict: "HIGH", detail: "An internal device is attempting to move laterally across your network — a key sign of an active intrusion. The attacker already has a foothold and is escalating." },
];

const MITRE = [
  { id: "T1059", name: "Scripting / command execution", tactic: "Execution", sev: "HIGH", active: true, plain: "Malware is running scripts or shell commands — the classic sign of active exploitation." },
  { id: "T1021", name: "Remote access services", tactic: "Lateral Movement", sev: "HIGH", active: true, plain: "The attacker is using legitimate remote services (RDP, SSH, WMI) to move across machines." },
  { id: "T1486", name: "File encryption (ransomware)", tactic: "Impact", sev: "CRITICAL", active: true, plain: "Files are being encrypted. This is a live ransomware event — isolate affected systems immediately." },
  { id: "T1041", name: "Data theft over C2 channel", tactic: "Exfiltration", sev: "HIGH", active: false, plain: "Data is being sent out through the same channel used to control the malware. Not yet confirmed active." },
  { id: "T1078", name: "Hijacked legitimate accounts", tactic: "Defense Evasion", sev: "MEDIUM", active: false, plain: "Attacker may be using real user credentials to avoid triggering alerts. Check for unusual login times or locations." },
  { id: "T1566", name: "Phishing emails", tactic: "Initial Access", sev: "HIGH", active: true, plain: "Phishing is the confirmed initial entry point. Users received and interacted with malicious emails." },
];

/* ─── Shared UI ───────────────────────────────────────────────────────────── */
const card = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: 12,
  padding: "16px 20px",
};

function Header({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", fontFamily: "'Inter', 'DM Sans', var(--font-sans)" }}>{title}</span>
      </div>
      {sub && <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", paddingLeft: 27, lineHeight: 1.6, fontFamily: "'Inter', var(--font-sans)" }}>{sub}</p>}
    </div>
  );
}

function MetricCards({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
      {items.map(({ label, value, color, animate }) => (
        <div key={label} style={{ background: "var(--color-background-secondary)", borderRadius: 9, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4, letterSpacing: 0.3, textTransform: "uppercase", fontFamily: "'Inter', var(--font-sans)" }}>{label}</div>
          {animate
            ? <AnimCount value={typeof value === "number" ? value : 0} color={color || "var(--color-text-primary)"} />
            : <div style={{ fontSize: 22, fontWeight: 500, color: color || "var(--color-text-primary)", fontFamily: "'JetBrains Mono', var(--font-mono)" }}>{value}</div>}
        </div>
      ))}
    </div>
  );
}

function Table({ cols, rows }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 9, border: "0.5px solid var(--color-border-tertiary)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Inter', var(--font-sans)" }}>
        <thead>
          <tr style={{ background: "var(--color-background-secondary)" }}>
            {cols.map(c => (
              <th key={c.key} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap", letterSpacing: 0.2 }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: row._bg || (i % 2 === 0 ? "var(--color-background-primary)" : "var(--color-background-secondary)"), borderBottom: "0.5px solid var(--color-border-tertiary)", transition: "background 0.3s ease", animation: row._shake ? "rowShake 0.4s ease" : row._fadeIn ? "rowFadeIn 0.4s ease" : undefined }}>
              {cols.map(c => (
                <td key={c.key} style={{ padding: "8px 12px", verticalAlign: "middle", fontFamily: c.mono ? "'JetBrains Mono', var(--font-mono)" : "'Inter', var(--font-sans)", fontSize: c.mono ? 11 : 12 }}>
                  {row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Log({ events, empty = "No events yet." }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [events]);

  function tagStyle(e) {
    if (e.critical) return { bg: RED,    fg: "#fff",       label: e.tag };
    if (e.ok)       return { bg: GREEN,  fg: "#fff",       label: e.tag };
    if (e.tag === "WARN") return { bg: AMBER, fg: "#fff",  label: "WARN" };
    return { bg: "var(--color-border-secondary)", fg: "var(--color-text-secondary)", label: e.tag };
  }

  return (
    <div style={{ borderRadius: 9, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
      {/* Terminal header bar */}
      <div style={{ background: "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "7px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <LiveDot color={events.length > 0 && events[0]?.critical ? RED : GREEN} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>Event stream</span>
        {events.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "'JetBrains Mono', var(--font-mono)", color: "var(--color-text-tertiary)" }}>{events.length} event{events.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Log body */}
      <div ref={ref} style={{ background: "#0f1117", maxHeight: 200, overflowY: "auto", padding: "8px 0" }}>
        {events.length === 0 ? (
          <div style={{ padding: "16px 14px", fontSize: 12, color: "#4a5060", fontFamily: "'JetBrains Mono', var(--font-mono)" }}>
            <span style={{ color: "#2a6e3f" }}>$</span> {empty}
          </div>
        ) : events.map((e, i) => {
          const ts = tagStyle(e);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "5px 14px",
              background: i === 0 && e.critical ? `${RED}18` : i === 0 && e.ok ? `${GREEN}12` : "transparent",
              borderLeft: i === 0 ? `2px solid ${e.critical ? RED : e.ok ? GREEN : e.tag === "WARN" ? AMBER : "transparent"}` : "2px solid transparent",
              animation: i === 0 ? "rowFadeIn 0.25s ease" : undefined,
              transition: "background 0.3s ease",
            }}>
              {/* Timestamp */}
              <span style={{ fontSize: 10, color: "#4a5568", fontFamily: "'JetBrains Mono', var(--font-mono)", flexShrink: 0, marginTop: 1, letterSpacing: 0.3 }}>{e.ts}</span>

              {/* Tag pill */}
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                background: ts.bg, color: ts.fg,
                padding: "1px 6px", borderRadius: 3, flexShrink: 0,
                fontFamily: "'Inter', var(--font-sans)", marginTop: 1,
                minWidth: 52, textAlign: "center",
                boxShadow: e.critical ? `0 0 6px ${RED}55` : e.ok ? `0 0 6px ${GREEN}44` : "none",
              }}>{ts.label}</span>

              {/* Message */}
              <span style={{
                fontSize: 11, fontFamily: "'JetBrains Mono', var(--font-mono)",
                color: e.critical ? "#f87171" : e.ok ? "#4ade80" : e.tag === "WARN" ? "#fbbf24" : "#94a3b8",
                lineHeight: 1.5, wordBreak: "break-word",
              }}>{e.msg}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Animated block button ───────────────────────────────────────────────── */
function Btn({ label, onClick, disabled, variant = "default" }) {
  const [flash, setFlash] = useState(false);
  const [burst, setBurst] = useState(false);
  const styles = {
    default: { bg: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)" },
    danger:  { bg: RED_BG,    color: RED_TEXT,   border: `0.5px solid ${RED}55` },
    warning: { bg: AMBER_BG,  color: AMBER_TEXT, border: `0.5px solid ${AMBER}55` },
    primary: { bg: BLUE,      color: "#fff",      border: "none" },
  };
  const st = styles[variant];
  const isAction = variant === "danger" || variant === "warning";

  function handleClick() {
    if (isAction) {
      setFlash(true);
      setBurst(true);
      setTimeout(() => setFlash(false), 600);
      setTimeout(() => setBurst(false), 700);
    }
    onClick?.();
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <ParticleBurst trigger={burst} color={variant === "danger" ? GREEN : AMBER} />
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          background: flash ? (variant === "danger" ? GREEN_BG : AMBER_BG) : (disabled ? "var(--color-background-secondary)" : st.bg),
          color: flash ? (variant === "danger" ? GREEN_TEXT : AMBER_TEXT) : (disabled ? "var(--color-text-tertiary)" : st.color),
          border: disabled ? "0.5px solid var(--color-border-tertiary)" : (flash ? `0.5px solid ${variant === "danger" ? GREEN : AMBER}55` : st.border),
          borderRadius: 7, padding: "7px 14px", fontSize: 12, cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 500, transition: "all 0.25s ease",
          transform: flash ? "scale(0.96)" : "scale(1)",
          fontFamily: "'Inter', var(--font-sans)",
        }}>
        {flash && isAction ? (variant === "danger" ? "✓ Blocked!" : "✓ Done!") : label}
      </button>
    </div>
  );
}

function Banner({ type = "danger", children }) {
  const map = {
    danger:  { bg: RED_BG,   fg: RED_TEXT,   dot: RED   },
    warning: { bg: AMBER_BG, fg: AMBER_TEXT, dot: AMBER },
    success: { bg: GREEN_BG, fg: GREEN_TEXT, dot: GREEN },
  };
  const { bg, fg, dot } = map[type];
  return (
    <div style={{ background: bg, border: `1px solid ${dot}40`, borderRadius: 9, padding: "11px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10, animation: "rowFadeIn 0.4s ease" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 3, animation: type !== "success" ? "pulse 1.5s ease infinite" : undefined }} />
      <span style={{ fontSize: 13, color: fg, fontFamily: "'Inter', var(--font-sans)", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

function Bar({ value, max = 100 }) {
  const pct = Math.min((value / max) * 100, 100);
  const col = pct >= 50 ? RED : pct >= 30 ? AMBER : GREEN;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 3, transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, minWidth: 28, fontFamily: "'JetBrains Mono', var(--font-mono)" }}>{value}</span>
    </div>
  );
}

/* ─── Home ────────────────────────────────────────────────────────────────── */
function HomeScreen({ onLoad }) {
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const [loadStep, setLoadStep] = useState(0);

  const STEPS = ["Initializing threat engines", "Loading ML models", "Connecting sensor grid", "Console ready"];
  useEffect(() => {
    if (!loading) return;
    const idDots = setInterval(() => setDots(d => (d + 1) % 4), 400);
    const idStep = setInterval(() => setLoadStep(s => Math.min(s + 1, STEPS.length - 1)), 500);
    return () => { clearInterval(idDots); clearInterval(idStep); };
  }, [loading]);

  const modules = [
    { icon: "🖥️", title: "Host XDR", desc: "Process monitoring — spot and kill suspicious programs" },
    { icon: "🌐", title: "Network", desc: "Live connection tracking — detect and block malicious IPs" },
    { icon: "📧", title: "Email analysis", desc: "Scan email text for phishing and social engineering tactics" },
    { icon: "🧠", title: "ML analytics", desc: "Machine learning models that surface hidden patterns in traffic" },
    { icon: "⚙️", title: "Gateway monitor", desc: "API traffic scoring — flag unusual request patterns" },
    { icon: "📁", title: "File integrity", desc: "Watch for ransomware-style file changes in real time" },
    { icon: "🎯", title: "Threat intel", desc: "Know which IPs are dangerous and what tactics attackers use" },
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 40px", textAlign: "center", fontFamily: "'Inter', 'DM Sans', var(--font-sans)" }}>
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: BLUE, fontWeight: 600, marginBottom: 14 }}>Sentinel EDR · XDR Platform</div>
      <h1 style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.3, margin: "0 0 14px", letterSpacing: "-0.03em", color: "var(--color-text-primary)" }}>
        Unified endpoint &amp; network<br />defense console
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.75, maxWidth: 500, margin: "0 auto 36px" }}>
        A full security operations center in your browser. Each tab is a different layer of defense.
      </p>

      {!loading ? (
        <button onClick={() => { setLoading(true); setTimeout(onLoad, 2200); }}
          style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 9, padding: "14px 44px", fontSize: 15, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em", transition: "transform 0.15s, box-shadow 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          Launch console
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 40, height: 40 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid var(--color-border-tertiary)`, borderTopColor: BLUE, animation: "spin 0.8s linear infinite" }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", letterSpacing: 0.3 }}>
            <Typewriter text={STEPS[loadStep]} speed={20} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i <= loadStep ? 18 : 6, height: 4, borderRadius: 2, background: i <= loadStep ? BLUE : "var(--color-border-tertiary)", transition: "all 0.4s ease" }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 48 }}>
        {modules.map((m, i) => (
          <div key={m.title} style={{ ...card, textAlign: "left", padding: "14px 16px", animation: `rowFadeIn 0.4s ease ${i * 0.06}s both` }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, letterSpacing: "-0.01em" }}>{m.title}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Host XDR ────────────────────────────────────────────────────────────── */
function HostXDR() {
  const BASE = [
    { pid: 1042, name: "svchost.exe",       cpu: "2.1%", mem: "48 MB",  state: "nominal"   },
    { pid: 2233, name: "python.exe",         cpu: "4.8%", mem: "182 MB", state: "system"    },
    { pid: 3301, name: "explorer.exe",       cpu: "1.3%", mem: "94 MB",  state: "nominal"   },
    { pid: 4412, name: "chrome.exe",         cpu: "8.2%", mem: "412 MB", state: "nominal"   },
    { pid: 5501, name: "streamlit.exe",      cpu: "3.1%", mem: "201 MB", state: "system"    },
    { pid: 6610, name: "SearchIndexer.exe",  cpu: "0.8%", mem: "68 MB",  state: "nominal"   },
    { pid: 7720, name: "[Access Denied]",    cpu: "—",    mem: "—",      state: "protected" },
  ];

  const [procs, setProcs]       = useState(BASE);
  const [killed, setKilled]     = useState(new Set());
  const [threatUp, setThreatUp] = useState(false);
  const [events, setEvents]     = useState([]);
  const [scanning, setScanning] = useState(false);
  const [verdict, setVerdict]   = useState(null);
  const [phase, setPhase]       = useState("waiting");
  const [shakeRow, setShakeRow] = useState(null);
  const [killFlash, setKillFlash] = useState(false);

  const addEvent = useCallback((tag, msg, critical = false, ok = false) => {
    setEvents(p => [{ tag, msg, ts: new Date().toLocaleTimeString(), critical, ok }, ...p].slice(0, 30));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setThreatUp(true);
      setPhase("appeared");
      setShakeRow(9999);
      setProcs(p => [{ pid: 9999, name: "sys_update_agent.exe", cpu: "18.4%", mem: "112 MB", state: "threat", _fadeIn: true }, ...p]);
      addEvent("ALERT", "PID 9999 — beacon pattern detected on port 443", true);
      setTimeout(() => setShakeRow(null), 600);
    }, 5000);
    return () => clearTimeout(id);
  }, []);

  function killPID(pid) {
    setKilled(p => new Set([...p, pid]));
    setProcs(p => p.filter(x => x.pid !== pid));
    if (pid === 9999) {
      setThreatUp(false);
      setPhase("killed");
      setKillFlash(true);
      setTimeout(() => setKillFlash(false), 50);
    }
    const v = rfClassify({ rate: 180, payload: 800, urgency: 4, credential: 2 });
    setVerdict(v);
    addEvent("KILLED", `PID ${pid} terminated`, false, true);
  }

  function scan() {
    setScanning(true);
    addEvent("SCAN", "Full process audit started");
    setTimeout(() => {
      setScanning(false);
      addEvent("SCAN", `Audit complete — ${procs.length} processes inspected`, false, true);
    }, 1800);
  }

  const stateTag = s => ({
    nominal:   <Tag color="success">Normal</Tag>,
    system:    <Tag color="info">System</Tag>,
    protected: <Tag color="gray">Protected</Tag>,
    threat:    <Tag color="danger">Suspicious</Tag>,
  }[s] || <Tag>{s}</Tag>);

  const rows = procs.filter(p => !killed.has(p.pid)).map(p => ({
    pid:    p.pid,
    name:   p.name,
    cpu:    p.cpu,
    mem:    p.mem,
    status: stateTag(p.state),
    action: p.state === "threat"
      ? <Btn label="Force kill" onClick={() => killPID(p.pid)} variant="danger" />
      : "—",
    _bg:     p.state === "threat" ? `${RED}18` : undefined,
    _shake:  shakeRow === p.pid,
    _fadeIn: p._fadeIn,
  }));

  return (
    <div>
      <ScreenFlash trigger={killFlash} color={GREEN} />
      <Header icon="🖥️" title="Host XDR — Process monitor"
        sub="Shows every running program. The AI checks each one for suspicious behaviour like hidden network calls or unusual CPU spikes." />

      <MetricCards items={[
        { label: "Running processes", value: procs.length, color: BLUE, animate: true },
        { label: "Active threats",    value: threatUp ? 1 : 0, color: threatUp ? RED : GREEN, animate: true },
        { label: "Processes killed",  value: killed.size, color: killed.size ? AMBER : GRAY, animate: true },
        { label: "Threat status",     value: phase === "killed" ? "Cleared" : phase === "appeared" ? "Active" : "Watching", color: phase === "killed" ? GREEN : phase === "appeared" ? RED : GRAY },
      ]} />

      {phase === "appeared" && (
        <Banner type="danger">
          <strong>Suspicious process detected:</strong> sys_update_agent.exe (PID 9999) is using 18.4% CPU and making repeated outbound connections — consistent with malware "calling home" (a C2 beacon). Use Force Kill to remove it.
        </Banner>
      )}
      {phase === "killed" && (
        <Banner type="success">
          Threat neutralised — PID 9999 removed. The process is no longer running.{verdict && ` AI classification: ${verdict}.`}
        </Banner>
      )}
      {phase === "waiting" && (
        <Banner type="warning">
          Monitoring active — a suspicious process will appear in a few seconds to simulate a real infection.
        </Banner>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "'Inter', var(--font-sans)" }}>Process list</span>
        <Btn label={scanning ? "Scanning…" : "Run audit"} onClick={scan} disabled={scanning} />
      </div>

      <Table
        cols={[
          { key: "pid", label: "PID", mono: true },
          { key: "name", label: "Process", mono: true },
          { key: "cpu", label: "CPU" },
          { key: "mem", label: "Memory" },
          { key: "status", label: "Status" },
          { key: "action", label: "Action" },
        ]}
        rows={rows}
      />

      {verdict && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: 9, fontSize: 12, color: "var(--color-text-secondary)", animation: "rowFadeIn 0.4s ease", fontFamily: "'Inter', var(--font-sans)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--color-text-primary)" }}>How AI classification works:</strong> Five independent decision trees each voted on the threat. The majority verdict was{" "}
          <strong style={{ color: verdict === "THREAT" ? RED : AMBER }}>{verdict}</strong>. This is called a "Random Forest" — many simple models voting together are more accurate than one complex model.
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Log events={events} empty="Monitoring processes — events appear here when something happens." />
      </div>
    </div>
  );
}

/* ─── Network ─────────────────────────────────────────────────────────────── */
function NetworkPerimeter() {
  const BASE = [
    { local: "127.0.0.1:8501",      remote: "0.0.0.0",        port: 8501, proto: "TCP", state: "LISTEN",      desc: "Streamlit (this app)", safe: true },
    { local: "192.168.1.104:51022", remote: "142.250.190.46", port: 443,  proto: "TCP", state: "ESTABLISHED", desc: "Google (normal HTTPS)", safe: true },
    { local: "192.168.1.104:52100", remote: "104.18.21.226",  port: 443,  proto: "TCP", state: "ESTABLISHED", desc: "CDN edge node",          safe: true },
    { local: "192.168.1.104:49200", remote: "8.8.8.8",        port: 53,   proto: "UDP", state: "ESTABLISHED", desc: "DNS lookup (normal)",    safe: true },
  ];
  const C2_IP = "185.220.101.5";

  const [sockets, setSockets]   = useState(BASE);
  const [blocked, setBlocked]   = useState(new Set());
  const [c2Active, setC2]       = useState(false);
  const [events, setEvents]     = useState([]);
  const [netData]               = useState(genNetwork);
  const [isoData, setIsoData]   = useState(() => isolationForest(genNetwork()));
  const [blockFlash, setBlockFlash] = useState(false);

  const addEvent = useCallback((tag, msg, critical = false, ok = false) => {
    setEvents(p => [{ tag, msg, ts: new Date().toLocaleTimeString(), critical, ok }, ...p].slice(0, 30));
  }, []);

  function injectC2() {
    if (c2Active) return;
    setC2(true);
    setSockets(p => [{
      local: "192.168.1.104:50244", remote: C2_IP, port: 443, proto: "TCP",
      state: "ESTABLISHED", desc: "Malware C2 — Tor exit relay", safe: false, _fadeIn: true,
    }, ...p]);
    addEvent("THREAT", `Outbound connection to known C2 server ${C2_IP}:443`, true);
  }

  function blockIP(ip) {
    setBlockFlash(true);
    setTimeout(() => setBlockFlash(false), 50);
    setBlocked(p => new Set([...p, ip]));
    setSockets(p => p.map(s => s.remote === ip
      ? { ...s, state: "BLOCKED", desc: "IP blocked — traffic dropped", safe: true }
      : s));
    if (ip === C2_IP) { setC2(false); setIsoData(isolationForest(netData)); }
    addEvent("BLOCKED", `${ip} blocked — all traffic dropped`, false, true);
  }

  const anomalies = isoData.filter(r => r.anomaly);
  const rows = sockets.map(s => ({
    local:  s.local,
    remote: s.remote,
    port:   s.port,
    proto:  s.proto,
    state:  s.state === "BLOCKED"
      ? <Tag color="success">Blocked</Tag>
      : s.state === "ESTABLISHED"
        ? <Tag color={s.safe ? "info" : "danger"}>Active</Tag>
        : <Tag color="gray">{s.state}</Tag>,
    desc:   s.desc,
    action: !s.safe && !blocked.has(s.remote)
      ? <Btn label="Block IP" onClick={() => blockIP(s.remote)} variant="danger" />
      : "—",
    _bg:     !s.safe && !blocked.has(s.remote) ? `${RED}18` : undefined,
    _fadeIn: s._fadeIn,
  }));

  return (
    <div>
      <ScreenFlash trigger={blockFlash} color={GREEN} />
      <Header icon="🌐" title="Network — Active connections"
        sub="Every open connection from this machine. Anything in red is connecting to a known malicious server." />

      <MetricCards items={[
        { label: "Open connections", value: sockets.length, color: BLUE, animate: true },
        { label: "Anomalies found",  value: anomalies.length, color: anomalies.length > 5 ? RED : AMBER, animate: true },
        { label: "IPs blocked",      value: blocked.size, color: blocked.size > 0 ? GREEN : GRAY, animate: true },
        { label: "C2 connection",    value: c2Active ? "Active" : "None", color: c2Active ? RED : GREEN },
      ]} />

      {c2Active && !blocked.has(C2_IP) && (
        <Banner type="danger">
          <strong>Malware is calling home.</strong> A connection is open to {C2_IP}, a known ransomware command server. This means malware on this machine is receiving instructions. Block it now.
        </Banner>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Btn label={c2Active ? "C2 already active" : "Simulate attack (inject C2 connection)"}
          onClick={injectC2} disabled={c2Active} variant="danger" />
      </div>

      <Table
        cols={[
          { key: "local",  label: "Local",      mono: true },
          { key: "remote", label: "Remote IP",  mono: true },
          { key: "port",   label: "Port" },
          { key: "proto",  label: "Proto" },
          { key: "state",  label: "State" },
          { key: "desc",   label: "What it is" },
          { key: "action", label: "Action" },
        ]}
        rows={rows}
      />

      <div style={{ ...card, marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, fontFamily: "'Inter', var(--font-sans)" }}>
          Traffic anomaly scan — {anomalies.length} unusual patterns in {isoData.length} requests
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.6, fontFamily: "'Inter', var(--font-sans)" }}>
          Each square below represents one network request. <strong style={{ color: RED }}>Red</strong> means the request looks unusual — either the data volume or rate is abnormal. This uses "Isolation Forest", which finds outliers by checking how easily a data point can be separated from the rest.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
          {isoData.map((r, i) => (
            <div key={i} title={`Rate: ${r.rate} req/min | Payload: ${r.payload} KB | Score: ${r.score}`}
              style={{ width: 14, height: 14, borderRadius: 2, cursor: "default", background: r.anomaly ? RED : GREEN, opacity: 0.35 + r.score * 0.65, transition: "background 0.4s ease, opacity 0.4s ease" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "'Inter', var(--font-sans)" }}>
          <span><span style={{ display:"inline-block", width:10, height:10, background:RED,   borderRadius:2, marginRight:4 }}/>Anomaly (score above 0.6)</span>
          <span><span style={{ display:"inline-block", width:10, height:10, background:GREEN, borderRadius:2, marginRight:4 }}/>Normal</span>
          <span style={{ marginLeft:"auto", color:"var(--color-text-tertiary)" }}>hover a square for details</span>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Log events={events} empty="No events. Simulate an attack using the button above." />
      </div>
    </div>
  );
}

/* ─── Email analysis ──────────────────────────────────────────────────────── */
function EmailNLP() {
  const [text, setText]    = useState("");
  const [result, setResult] = useState(null);
  const [history, setHist] = useState([]);
  const [scanning, setScanning] = useState(false);

  function run(t) {
    const txt = t ?? text;
    if (!txt.trim()) return;
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      const nlp = analyzeEmail(txt);
      const rv = rfClassify({ rate: 0, payload: txt.length / 10, ...nlp });
      const entry = { ...nlp, rfVerdict: rv, preview: txt.slice(0, 60) + "…", ts: new Date().toLocaleTimeString() };
      setResult(entry);
      setHist(p => [entry, ...p].slice(0, 12));
      setScanning(false);
    }, 600);
  }

  const vcol = v => v === "PHISHING" ? "danger" : v === "SUSPICIOUS" ? "warning" : "success";

  return (
    <div>
      <Header icon="📧" title="Email analysis"
        sub="Paste any email to check for phishing. The scanner looks for urgency language, requests for passwords, suspicious URLs, and financial manipulation." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 5, fontFamily: "'Inter', var(--font-sans)" }}>Email text</div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Paste email content here and click Analyse…"
            style={{ width: "100%", height: 130, borderRadius: 9, border: "0.5px solid var(--color-border-tertiary)", padding: "10px 12px", fontSize: 13, fontFamily: "'Inter', var(--font-sans)", resize: "vertical", background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
            <Btn label={scanning ? "Scanning…" : "Analyse"} onClick={() => run()} variant="primary" disabled={scanning} />
            {EMAIL_SAMPLES.map((s, i) => (
              <Btn key={i} label={s.label} onClick={() => { setText(s.text); run(s.text); }} />
            ))}
          </div>
        </div>

        {result ? (
          <div style={{ ...card, animation: "rowFadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "'Inter', var(--font-sans)" }}>Result</span>
              <Tag color={vcol(result.verdict)}>{result.verdict}</Tag>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 5, fontFamily: "'Inter', var(--font-sans)" }}>Risk score (higher = more dangerous)</div>
              <Bar value={result.score} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, marginBottom: 12 }}>
              {[
                ["Urgency phrases", result.urgency, "Words like 'urgent', 'expires', 'immediately'"],
                ["Password requests", result.credential, "Asks for login, password, or verification"],
                ["Money-related", result.financial, "Mentions invoices, payments, wire transfers"],
                ["Links found", result.urlCount, "Number of URLs in the email"],
              ].map(([l, v, tip]) => (
                <div key={l} title={tip} style={{ background: "var(--color-background-secondary)", borderRadius: 7, padding: "8px 10px" }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "'JetBrains Mono', var(--font-mono)", color: v > 0 ? AMBER : "var(--color-text-primary)" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "'Inter', var(--font-sans)" }}>
              AI ensemble verdict:{" "}<Tag color={vcol(result.rfVerdict)}>{result.rfVerdict}</Tag>
            </div>
          </div>
        ) : scanning ? (
          <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid var(--color-border-tertiary)`, borderTopColor: BLUE, animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontFamily: "'Inter', var(--font-sans)" }}>
              <Typewriter text="Analysing patterns…" speed={40} />
            </span>
          </div>
        ) : (
          <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>Results appear here</span>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, fontFamily: "'Inter', var(--font-sans)" }}>Analysis history</div>
          <Table
            cols={[
              { key: "ts", label: "Time" },
              { key: "preview", label: "Preview" },
              { key: "verdict_el", label: "Verdict" },
              { key: "score", label: "Score", mono: true },
              { key: "urgency", label: "Urgency", mono: true },
              { key: "credential", label: "Cred.", mono: true },
            ]}
            rows={history.map(h => ({ ...h, verdict_el: <Tag color={vcol(h.verdict)}>{h.verdict}</Tag>, _bg: h.verdict === "PHISHING" ? `${RED}18` : h.verdict === "SUSPICIOUS" ? `${AMBER}18` : undefined }))}
          />
        </div>
      )}
    </div>
  );
}

/* ─── ML Analytics ────────────────────────────────────────────────────────── */
function MLAnalytics() {
  const [netData]   = useState(genNetwork);
  const [isoScored, setIso] = useState([]);
  const [clustered, setKm]  = useState([]);
  const [k, setK]           = useState(3);
  const [running, setRun]   = useState(false);

  const conflicts = (() => {
    const out = [];
    for (let i = 0; i < RULES.length; i++)
      for (let j = i + 1; j < RULES.length; j++) {
        const a = RULES[i], b = RULES[j];
        if (a.condition === b.condition && a.action !== b.action)
          out.push({ r1: a.id, r2: b.id, type: "Action conflict", desc: `Same condition "${a.condition}" but different actions: ${a.action} vs ${b.action}` });
        if (a.action === "BLOCK" && b.action === "ALLOW" && a.target === b.target)
          out.push({ r1: a.id, r2: b.id, type: "Block vs Allow", desc: `Target "${a.target}" is both blocked and allowed — one rule will always be ignored` });
      }
    return out;
  })();

  useEffect(() => {
    setRun(true);
    setTimeout(() => {
      setIso(isolationForest(netData));
      setKm(kMeans(netData.map(p => ({ rate: p.rate, payload: p.payload })), k));
      setRun(false);
    }, 400);
  }, [k, netData]);

  const anomalies = isoScored.filter(r => r.anomaly);
  const CCOLORS = [BLUE, GREEN, AMBER, PURPLE, RED];

  return (
    <div>
      <Header icon="🧠" title="ML analytics"
        sub="Three machine learning tools in one view: anomaly detection, traffic clustering, and firewall rule conflict detection." />

      <MetricCards items={[
        { label: "Traffic samples", value: netData.length, color: BLUE, animate: true },
        { label: "Anomalies found", value: anomalies.length, color: RED, animate: true },
        { label: "Clusters",        value: k, color: PURPLE, animate: true },
        { label: "Rule conflicts",  value: conflicts.length, color: conflicts.length > 0 ? AMBER : GREEN, animate: true },
      ]} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { title: "What is Isolation Forest?", body: "Imagine sorting a deck of cards until you isolate one specific card. Unusual data points get isolated faster because they're different. The fewer cuts needed to isolate it, the more anomalous it is." },
          { title: "What is K-Means clustering?", body: "Groups similar network requests together. Choose k=3 and it finds 3 natural groups — e.g. normal traffic, high-volume users, and suspicious bursts. Helps spot patterns that stand out as a group." },
          { title: "What is rule conflict detection?", body: "Your firewall has rules like 'block IP X' and 'allow IP X'. If both exist, one silently wins — and you might not know which. This scanner finds those contradictions before an attacker exploits them." },
        ].map(({ title, body }) => (
          <div key={title} style={{ ...card, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, fontFamily: "'Inter', var(--font-sans)", letterSpacing: "-0.01em" }}>{title}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.6, fontFamily: "'Inter', var(--font-sans)" }}>{body}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, fontFamily: "'Inter', var(--font-sans)" }}>Anomaly map</div>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 10px", lineHeight: 1.5, fontFamily: "'Inter', var(--font-sans)" }}>
            Each square = one network request. Red squares are outliers.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
            {isoScored.map((r, i) => (
              <div key={i} title={`Rate: ${r.rate} req/min | Data: ${r.payload} KB | Score: ${r.score}`}
                style={{ width: 14, height: 14, borderRadius: 2, cursor: "default", background: r.anomaly ? RED : GREEN, opacity: 0.35 + r.score * 0.65, transition: "all 0.3s ease" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 10, fontFamily: "'Inter', var(--font-sans)" }}>
            <span><span style={{ display:"inline-block", width:10, height:10, background:RED,   borderRadius:2, marginRight:4 }}/>Anomaly</span>
            <span><span style={{ display:"inline-block", width:10, height:10, background:GREEN, borderRadius:2, marginRight:4 }}/>Normal</span>
          </div>
          {anomalies.length > 0 && anomalies.slice(0, 4).map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", color: "var(--color-text-secondary)", fontFamily: "'JetBrains Mono', var(--font-mono)" }}>
              <span>Rate {r.rate} req/min · {r.payload} KB payload</span>
              <span style={{ color: RED, fontWeight: 500 }}>score {r.score}</span>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "'Inter', var(--font-sans)" }}>Traffic clusters</div>
            <div style={{ display: "flex", gap: 5 }}>
              {[2, 3, 4, 5].map(kv => (
                <button key={kv} onClick={() => setK(kv)} disabled={running}
                  style={{ background: k === kv ? BLUE : "var(--color-background-secondary)", color: k === kv ? "#fff" : "var(--color-text-primary)", border: k === kv ? "none" : "0.5px solid var(--color-border-tertiary)", borderRadius: 5, padding: "3px 9px", fontSize: 12, cursor: "pointer", fontFamily: "'Inter', var(--font-sans)", transition: "all 0.2s ease" }}>
                  k={kv}
                </button>
              ))}
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 10px", lineHeight: 1.5, fontFamily: "'Inter', var(--font-sans)" }}>
            Each dot = one request. X = request rate, Y = data volume.
          </p>
          <div style={{ position: "relative", marginLeft: 28 }}>
            <div style={{ position: "absolute", left: -28, top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontSize: 10, color: "var(--color-text-tertiary)", whiteSpace: "nowrap", transformOrigin: "center center", fontFamily: "'Inter', var(--font-sans)" }}>data volume (KB)</div>
            <div style={{ position: "relative", height: 150, background: "var(--color-background-secondary)", borderRadius: 6, overflow: "hidden" }}>
              {[25,50,75].map(p => <div key={p} style={{ position:"absolute", left:0, right:0, top:`${p}%`, borderTop:"0.5px solid var(--color-border-tertiary)" }}/>)}
              {[25,50,75].map(p => <div key={p} style={{ position:"absolute", top:0, bottom:0, left:`${p}%`, borderLeft:"0.5px solid var(--color-border-tertiary)" }}/>)}
              {clustered.map((pt, i) => (
                <div key={i} title={`Rate: ${pt.rate} | Payload: ${pt.payload} | Group: ${pt.cluster + 1}`}
                  style={{ position:"absolute", left:`${(pt.rate / 200) * 100}%`, top:`${100 - (pt.payload / 1200) * 100}%`, width:6, height:6, borderRadius:"50%", background: CCOLORS[pt.cluster % CCOLORS.length], transform:"translate(-50%,-50%)", opacity:0.85, transition: "all 0.4s ease" }} />
              ))}
            </div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:10 }}>
            {Array.from({ length:k }, (_,ci) => (
              <span key={ci} style={{ fontSize:11, color:"var(--color-text-secondary)", display:"flex", alignItems:"center", gap:5, fontFamily: "'Inter', var(--font-sans)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:CCOLORS[ci], display:"inline-block" }} />
                Group {ci+1}: {clustered.filter(p => p.cluster === ci).length} requests
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, fontFamily: "'Inter', var(--font-sans)" }}>Firewall rule conflicts</div>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.5, fontFamily: "'Inter', var(--font-sans)" }}>
          Highlighted rows have contradictory rules — the same condition produces two different actions. This can create a security gap where attackers know which rule wins.
        </p>
        {conflicts.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
            {conflicts.map((c, i) => (
              <div key={i} style={{ background: AMBER_BG, border:`0.5px solid ${AMBER}55`, borderRadius: 9, padding:"10px 14px", animation: "rowFadeIn 0.4s ease" }}>
                <div style={{ fontSize:12, fontWeight:500, color:AMBER_TEXT, marginBottom:2, fontFamily: "'Inter', var(--font-sans)" }}>{c.type} — rules {c.r1} and {c.r2}</div>
                <div style={{ fontSize:12, color:"var(--color-text-secondary)", fontFamily: "'Inter', var(--font-sans)" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        )}
        <Table
          cols={[
            { key:"id", label:"Rule ID", mono:true },
            { key:"condition", label:"Condition", mono:true },
            { key:"action", label:"Action" },
            { key:"target", label:"Target", mono:true },
            { key:"priority", label:"Priority", mono:true },
          ]}
          rows={RULES.map(r => ({ ...r, _bg: conflicts.some(c => c.r1 === r.id || c.r2 === r.id) ? `${AMBER}22` : undefined }))}
        />
      </div>
    </div>
  );
}

/* ─── Gateway Monitor ─────────────────────────────────────────────────────── */
function GatewayMonitor() {
  const [rate,    setRate]    = useState(80);
  const [payload, setPayload] = useState(300);
  const [history, setHistory] = useState([]);
  const [live,    setLive]    = useState(false);
  const liveRef = useRef(null);

  const calc = (r, p) => {
    const rw = (r / 200) * 60, pw = (p / 1200) * 40;
    const score = Math.max(Math.min(Math.round(rw + pw), 100), 5);
    return { score, anomaly: r >= 140 || p >= 1000, rf: rfClassify({ rate: r, payload: p }), rw: Math.round(rw), pw: Math.round(pw) };
  };

  const result = calc(rate, payload);

  function push(r, p) {
    const { score, anomaly, rf } = calc(r, p);
    setHistory(prev => [{ ts: new Date().toLocaleTimeString(), rate: r, payload: p, score, verdict: anomaly ? "Anomaly" : "Normal", rf }, ...prev].slice(0, 20));
  }

  useEffect(() => {
    if (live) {
      liveRef.current = setInterval(() => {
        const r = Math.floor(Math.random() * 200), p = Math.floor(Math.random() * 1200);
        setRate(r); setPayload(p); push(r, p);
      }, 1200);
    } else clearInterval(liveRef.current);
    return () => clearInterval(liveRef.current);
  }, [live]);

  const scoreColor = result.score >= 75 ? RED : result.score >= 50 ? AMBER : GREEN;

  return (
    <div>
      <Header icon="⚙️" title="API gateway monitor"
        sub="Watch incoming traffic in real time. The risk score combines request rate and payload size. Anything above 75 is flagged." />

      <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--color-background-secondary)", borderRadius: 9, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6, fontFamily: "'Inter', var(--font-sans)" }}>
        <strong style={{ color: "var(--color-text-primary)" }}>How the score works:</strong> Rate accounts for 60% (high frequency suggests a bot or DDoS). Payload size accounts for 40% (unusually large data could mean exfiltration or injection). Combined score above 75 triggers an anomaly alert.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, fontFamily: "'Inter', var(--font-sans)" }}>Simulate traffic</div>
          {[
            { label: "Request rate (req/min) — danger above 140", value: rate, max: 200, threshold: 140, onChange: v => { setRate(v); push(v, payload); } },
            { label: "Payload size (KB) — danger above 1000", value: payload, max: 1200, threshold: 1000, onChange: v => { setPayload(v); push(rate, v); } },
          ].map(({ label, value, max, threshold, onChange }) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6, fontFamily: "'Inter', var(--font-sans)" }}>
                <span>{label}</span>
                <span style={{ fontWeight: 500, fontFamily: "'JetBrains Mono', var(--font-mono)", color: value >= threshold ? RED : "var(--color-text-primary)" }}>{value}</span>
              </div>
              <input type="range" min={0} max={max} step={1} value={value} onChange={e => onChange(+e.target.value)} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2, fontFamily: "'Inter', var(--font-sans)" }}>
                <span>0</span><span style={{ color: AMBER }}>⚠ {threshold}</span><span>{max}</span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn label={live ? "Stop live feed" : "Start live simulation"} onClick={() => setLive(v => !v)} variant={live ? "danger" : "default"} />
            <Btn label="Random request" onClick={() => { const r = Math.floor(Math.random() * 200), p = Math.floor(Math.random() * 1200); setRate(r); setPayload(p); push(r, p); }} />
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "'Inter', var(--font-sans)" }}>Live risk score</span>
            <Tag color={result.anomaly ? "danger" : "success"}>{result.anomaly ? "Anomaly detected" : "Normal traffic"}</Tag>
          </div>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 56, fontWeight: 500, color: scoreColor, fontFamily: "'JetBrains Mono', var(--font-mono)", lineHeight: 1, transition: "color 0.3s ease" }}>{result.score}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4, fontFamily: "'Inter', var(--font-sans)" }}>out of 100</div>
          </div>
          <div style={{ height: 10, background: "var(--color-background-secondary)", borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${result.score}%`, background: scoreColor, borderRadius: 5, transition: "width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 7, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>Rate contribution (60%)</div>
              <div style={{ fontSize: 18, fontWeight: 500, fontFamily: "'JetBrains Mono', var(--font-mono)" }}>{result.rw}</div>
            </div>
            <div style={{ background: "var(--color-background-secondary)", borderRadius: 7, padding: "8px 10px" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>Payload contribution (40%)</div>
              <div style={{ fontSize: 18, fontWeight: 500, fontFamily: "'JetBrains Mono', var(--font-mono)" }}>{result.pw}</div>
            </div>
            <div style={{ gridColumn: "1/-1", padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: 7 }}>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>AI ensemble decision: </span>
              <Tag color={result.rf === "THREAT" ? "danger" : result.rf === "SUSPICIOUS" ? "warning" : "success"}>{result.rf}</Tag>
            </div>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, fontFamily: "'Inter', var(--font-sans)" }}>Request history</div>
          <Table
            cols={[
              { key: "ts", label: "Time" },
              { key: "rate", label: "Rate (req/min)", mono: true },
              { key: "payload", label: "Payload (KB)", mono: true },
              { key: "score", label: "Score", mono: true },
              { key: "verdict_el", label: "Verdict" },
              { key: "rf_el", label: "AI decision" },
            ]}
            rows={history.map(h => ({ ...h, verdict_el: <Tag color={h.verdict === "Anomaly" ? "danger" : "success"}>{h.verdict}</Tag>, rf_el: <Tag color={h.rf === "THREAT" ? "danger" : h.rf === "SUSPICIOUS" ? "warning" : "success"}>{h.rf}</Tag>, _bg: h.verdict === "Anomaly" ? `${RED}18` : undefined }))}
          />
        </>
      )}
    </div>
  );
}

/* ─── File Integrity ──────────────────────────────────────────────────────── */
const INITIAL_FILES = [
  { name: "sys_kernel_core.log",          size: 2.1,  modified: "62s ago", threat: false },
  { name: "db_backup_manifest.cfg",       size: 0.8,  modified: "47s ago", threat: false },
  { name: "usr_profile_cache.tmp",        size: 1.2,  modified: "31s ago", threat: false },
  { name: "financial_ledger.xlsx.locked", size: 48.3, modified: "12s ago", threat: true  },
  { name: "DECRYPT_INSTRUCTIONS.txt",     size: 3.7,  modified: "11s ago", threat: true  },
];

const BURST_NAMES = [
  "Q3_report.docx","payroll_2026.xlsx","config_backup.tar.gz",
  "access_log.txt","schema_v2.sql","HR_records.xlsx",
  "backup_2026.zip","customer_data.csv","invoice_may.docx","passwords_old.txt",
];

function FileIntegrity() {
  const [files, setFiles]       = useState(INITIAL_FILES);
  const [quarantined, setQuar]  = useState(new Set());
  const [events, setEvents]     = useState([]);
  const [burst, setBurst]       = useState(0);
  const [burstAlert, setBAlert] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [glitchActive, setGlitch] = useState(false);

  const addEvent = useCallback((tag, msg, critical = false, ok = false) => {
    setEvents(p => [{ tag, msg, ts: new Date().toLocaleTimeString(), critical, ok }, ...p].slice(0, 50));
  }, []);

  const isoScores = (() => {
    const pts = files.map((f, i) => ({
      id: i, sizeKB: f.size,
      isLocked: f.name.includes(".locked") ? 1 : 0,
      isDecrypt: f.name.toLowerCase().includes("decrypt") ? 1 : 0,
    }));
    return isolationForest(pts);
  })();

  function simulateBurst() {
    if (scanning) return;
    setScanning(true);
    setBurst(0); setBAlert(false); setTimeline([]);

    let count = 0;
    const tl = [];

    const iv = setInterval(() => {
      count++;
      const name = BURST_NAMES[Math.floor(Math.random() * BURST_NAMES.length)];
      const types = ["MODIFIED","ENCRYPTED","DELETED","CREATED"];
      const type = count > 4 ? "ENCRYPTED" : types[Math.floor(Math.random() * types.length)];
      const ts = new Date().toLocaleTimeString();

      tl.push({ ts, name, type });
      setTimeline([...tl]);
      setBurst(count);
      addEvent(type, name, count > 6);

      if (count === 3) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 600);
        addEvent("WARN", "High change rate — monitoring closely…");
      }
      if (count === 5) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 800);
      }
      if (count >= 8) {
        setBAlert(true);
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 900);
        const locked = name.replace(/\.[^.]+$/, ".xlsx.locked");
        setFiles(p => [...p, { name: locked, size: 24.1, modified: "just now", threat: true, _fadeIn: true }]);
        addEvent("ALERT", `Ransomware confirmed — ${count} file changes in 5s. New encrypted file: ${locked}`, true);
        clearInterval(iv);
        setScanning(false);
      }
    }, 600);
  }

  function quarantine(name) {
    setQuar(p => new Set([...p, name]));
    addEvent("QUAR", `${name} quarantined`, false, true);
  }

  function reset() {
    setFiles(INITIAL_FILES);
    setQuar(new Set());
    setEvents([]);
    setBurst(0);
    setBAlert(false);
    setTimeline([]);
    setScanning(false);
    setGlitch(false);
  }

  const activeThreats = files.filter(f => f.threat && !quarantined.has(f.name)).length;

  return (
    <div style={{ animation: screenShake ? "screenShake 0.5s ease" : undefined }}>
      <Header icon="📁" title="File integrity monitor"
        sub="Watches the filesystem for suspicious changes. Ransomware typically encrypts hundreds of files per minute — this detects that pattern early." />

      <MetricCards items={[
        { label: "Files monitored", value: files.length, color: BLUE, animate: true },
        { label: "Threats found",   value: activeThreats, color: activeThreats > 0 ? RED : GREEN, animate: true },
        { label: "Quarantined",     value: quarantined.size, color: quarantined.size > 0 ? AMBER : GRAY, animate: true },
        { label: "Change burst",    value: burst, color: burst >= 8 ? RED : burst >= 3 ? AMBER : GRAY, animate: true },
      ]} />

      {burstAlert && (
        <Banner type="danger">
          <strong>Ransomware behaviour detected.</strong> {burst} file changes in under 5 seconds — files are being encrypted. Quarantine the encrypted files and isolate this machine from the network immediately.
        </Banner>
      )}

      {/* Glitch overlay during ransomware peak */}
      {glitchActive && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${RED}08 2px, ${RED}08 4px)`,
          animation: "glitchFlash 0.8s ease forwards",
        }} />
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Btn label={scanning ? "Encrypting files…" : "Simulate ransomware attack"} onClick={simulateBurst} disabled={scanning} variant="warning" />
        <Btn label="Reset" onClick={reset} />
      </div>

      {/* Live attack timeline */}
      {timeline.length > 0 && (
        <div style={{ ...card, marginBottom: 16, animation: "rowFadeIn 0.3s ease" }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, fontFamily: "'Inter', var(--font-sans)", display: "flex", alignItems: "center", gap: 8 }}>
            <LiveDot color={RED} />
            Live attack timeline — {timeline.length} changes detected
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {timeline.map((e, i) => {
              const col = e.type === "ENCRYPTED" ? RED : e.type === "DELETED" ? AMBER : GREEN;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--color-text-secondary)", animation: i === timeline.length - 1 ? "rowFadeIn 0.3s ease" : undefined }}>
                  <span style={{ fontFamily: "'JetBrains Mono', var(--font-mono)", color: "var(--color-text-tertiary)" }}>{e.ts}</span>
                  <span style={{ background: col + "22", color: col, border: `0.5px solid ${col}55`, borderRadius: 3, padding: "1px 6px", fontWeight: 500, minWidth: 70, textAlign: "center", fontFamily: "'JetBrains Mono', var(--font-mono)", fontSize: 10 }}>
                    {e.type}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', var(--font-mono)" }}>{e.name}</span>
                </div>
              );
            })}
          </div>
          {burst >= 4 && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: RED_BG, borderRadius: 7, fontSize: 12, color: RED_TEXT, fontFamily: "'Inter', var(--font-sans)", animation: "rowFadeIn 0.4s ease" }}>
              Pattern: files are being renamed with <code style={{ fontFamily: "'JetBrains Mono', var(--font-mono)" }}>.locked</code> extension — classic ransomware encryption. The attacker is encrypting your files and will demand payment for the key.
            </div>
          )}
        </div>
      )}

      <div style={{ overflowX: "auto", borderRadius: 9, border: "0.5px solid var(--color-border-tertiary)", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Inter', var(--font-sans)" }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["Filename","Size","Last changed","Anomaly score","What it means","Action"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)", letterSpacing: 0.2 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => {
              const iso = isoScores[i];
              const isQ = quarantined.has(f.name);
              const isThreat = f.threat && !isQ;
              const bg = isThreat ? `${RED}18` : isQ ? "var(--color-background-secondary)" : i % 2 === 0 ? "var(--color-background-primary)" : "var(--color-background-secondary)";
              const meaning = f.name.includes(".locked") ? "File has been encrypted — you cannot open it without the attacker's key"
                : f.name.toLowerCase().includes("decrypt") ? "Ransom note left by attacker with payment instructions"
                : iso?.anomaly ? "File looks unusual — size or type is out of the ordinary"
                : "Normal file, no issues found";
              return (
                <tr key={f.name} style={{ background: bg, borderBottom: "0.5px solid var(--color-border-tertiary)", transition: "background 0.3s ease", animation: f._fadeIn ? "rowFadeIn 0.4s ease" : undefined }}>
                  <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', var(--font-mono)", fontSize: 11 }}>{f.name}</td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-secondary)" }}>{f.size} KB</td>
                  <td style={{ padding: "8px 12px", color: "var(--color-text-secondary)" }}>{f.modified}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', var(--font-mono)", fontWeight: 500, color: iso?.anomaly ? RED : GREEN }}>{iso?.score ?? "—"}</td>
                  <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--color-text-secondary)", maxWidth: 200 }}>{meaning}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {isQ ? <Tag color="gray">Quarantined</Tag>
                      : isThreat
                      ? (
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <Btn label="Quarantine" onClick={() => quarantine(f.name)} variant="warning" />
                        </div>
                      )
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Log events={events} empty="Idle — click 'Simulate ransomware attack' to begin." />
    </div>
  );
}

/* ─── Threat Intel ────────────────────────────────────────────────────────── */
function ThreatIntel() {
  const [blocked, setBlocked]   = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("iocs");
  const [blockFlash, setBlockFlash] = useState(false);

  const activeCount = MITRE.filter(t => t.active).length;
  const criticalIOC = THREAT_INTEL.filter(i => i.verdict === "CRITICAL").length;
  const sevColor = s => s === "CRITICAL" ? "danger" : s === "HIGH" ? "warning" : "info";

  function handleBlock(ip) {
    setBlockFlash(true);
    setTimeout(() => setBlockFlash(false), 50);
    setBlocked(p => new Set([...p, ip]));
  }

  return (
    <div>
      <ScreenFlash trigger={blockFlash} color={GREEN} />
      <Header icon="🎯" title="Threat intelligence"
        sub="Two things in one: a live feed of dangerous IP addresses, and a map of attacker tactics seen on this network." />

      <MetricCards items={[
        { label: "Known bad IPs",       value: THREAT_INTEL.length, color: RED, animate: true },
        { label: "Critical threats",    value: criticalIOC, color: RED, animate: true },
        { label: "Attack tactics seen", value: activeCount, color: AMBER, animate: true },
        { label: "IPs blocked",         value: blocked.size, color: blocked.size > 0 ? GREEN : GRAY, animate: true },
      ]} />

      <Banner type="danger">
        Active intrusion indicators: ransomware C2 communication confirmed, lateral movement in progress, and phishing was the confirmed entry point. Prioritise isolating affected endpoints.
      </Banner>

      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {[{ id: "iocs", label: "Malicious IPs" }, { id: "mitre", label: "Attack tactics" }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ background: "transparent", border: "none", borderBottom: activeTab === t.id ? `2px solid ${BLUE}` : "2px solid transparent", padding: "10px 16px", fontSize: 13, cursor: "pointer", color: activeTab === t.id ? BLUE : "var(--color-text-secondary)", fontWeight: activeTab === t.id ? 500 : 400, fontFamily: "'Inter', var(--font-sans)", transition: "color 0.2s ease" }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "iocs" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px", lineHeight: 1.6, fontFamily: "'Inter', var(--font-sans)" }}>
            These IP addresses have been seen connecting to or from this network and are confirmed malicious. Click any row to understand what the IP does and why it's dangerous. Block it to drop all traffic.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {THREAT_INTEL.map((ioc, idx) => {
              const isSelected = selected?.ip === ioc.ip;
              const isBlocked = blocked.has(ioc.ip);
              return (
                <div key={ioc.ip} onClick={() => setSelected(s => s?.ip === ioc.ip ? null : ioc)}
                  style={{ ...card, cursor: "pointer", padding: "12px 16px", borderColor: isSelected ? BLUE : "var(--color-border-tertiary)", background: isBlocked ? GREEN_BG : isSelected ? BLUE_BG : "var(--color-background-primary)", transition: "all 0.3s ease", animation: `rowFadeIn 0.4s ease ${idx * 0.04}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <LiveDot color={isBlocked ? GREEN : ioc.verdict === "CRITICAL" ? RED : AMBER} pulse={!isBlocked} />
                      <span style={{ fontFamily: "'JetBrains Mono', var(--font-mono)", fontSize: 13, fontWeight: 500, textDecoration: isBlocked ? "line-through" : undefined, color: isBlocked ? "var(--color-text-tertiary)" : "var(--color-text-primary)" }}>{ioc.ip}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontFamily: "'Inter', var(--font-sans)" }}>{ioc.type} · {ioc.country}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Tag color={isBlocked ? "gray" : sevColor(ioc.verdict)}>{isBlocked ? "BLOCKED" : ioc.verdict}</Tag>
                      {!isBlocked
                        ? (
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <Btn label="Block" onClick={e => { e.stopPropagation(); handleBlock(ioc.ip); }} variant="danger" />
                          </div>
                        )
                        : <span style={{ fontSize: 11, color: GREEN_TEXT, fontWeight: 500, fontFamily: "'Inter', var(--font-sans)" }}>✓ Traffic dropped</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                    {ioc.tags.map(t => (
                      <span key={t} style={{ background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", fontSize: 10, padding: "1px 6px", borderRadius: 3, border: "0.5px solid var(--color-border-tertiary)", fontFamily: "'JetBrains Mono', var(--font-mono)" }}>{t}</span>
                    ))}
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto", fontFamily: "'Inter', var(--font-sans)" }}>last seen {ioc.seen} · {ioc.conf}% confidence</span>
                  </div>
                  {isSelected && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--color-background-secondary)", borderRadius: 8, fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.65, animation: "rowFadeIn 0.3s ease", fontFamily: "'Inter', var(--font-sans)" }}>
                      <strong>What this IP is doing:</strong> {ioc.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "mitre" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px", lineHeight: 1.6, fontFamily: "'Inter', var(--font-sans)" }}>
            The MITRE ATT&CK framework is a standard way to describe what attackers do — step by step. Each row below is a tactic seen or suspected on this network. Red = confirmed active right now.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MITRE.map((t, i) => (
              <div key={t.id} style={{ ...card, padding: "12px 16px", background: t.active ? (t.sev === "CRITICAL" ? `${RED}14` : `${AMBER}14`) : "var(--color-background-secondary)", animation: `rowFadeIn 0.4s ease ${i * 0.05}s both`, transition: "background 0.3s ease" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {t.active ? <LiveDot color={t.sev === "CRITICAL" ? RED : AMBER} /> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-border-tertiary)", display: "inline-block", flexShrink: 0, marginTop: 3 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>{t.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "'Inter', var(--font-sans)", letterSpacing: "-0.01em" }}>{t.name}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>{t.tactic} phase</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5, fontFamily: "'Inter', var(--font-sans)" }}>{t.plain}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <Tag color={sevColor(t.sev)}>{t.sev}</Tag>
                    {t.active ? <span style={{ fontSize: 11, color: RED, fontWeight: 500, fontFamily: "'JetBrains Mono', var(--font-mono)", animation: "pulse 2s ease infinite" }}>● ACTIVE</span> : <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "'Inter', var(--font-sans)" }}>Not confirmed</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Root ────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "xdr",     label: "Host XDR",      icon: "🖥️", component: HostXDR          },
  { id: "network", label: "Network",        icon: "🌐", component: NetworkPerimeter },
  { id: "email",   label: "Email",          icon: "📧", component: EmailNLP         },
  { id: "ml",      label: "ML analytics",   icon: "🧠", component: MLAnalytics      },
  { id: "gateway", label: "Gateway",        icon: "⚙️", component: GatewayMonitor   },
  { id: "file",    label: "File integrity", icon: "📁", component: FileIntegrity    },
  { id: "intel",   label: "Threat intel",   icon: "🎯", component: ThreatIntel      },
];

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab]       = useState("xdr");
  const Active = TABS.find(t => t.id === tab)?.component;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes rowFadeIn    { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowShake     { 0%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} 100%{transform:translateX(0)} }
        @keyframes screenShake  { 0%{transform:translate(0,0)} 15%{transform:translate(-5px,-3px)} 30%{transform:translate(5px,3px)} 45%{transform:translate(-4px,4px)} 60%{transform:translate(4px,-2px)} 75%{transform:translate(-3px,1px)} 90%{transform:translate(2px,-1px)} 100%{transform:translate(0,0)} }
        @keyframes flashFade    { 0%{opacity:1} 100%{opacity:0} }
        @keyframes glitchFlash  { 0%{opacity:0.7} 20%{opacity:0.3} 40%{opacity:0.7} 60%{opacity:0.2} 80%{opacity:0.6} 100%{opacity:0} }
        @keyframes particleFly  { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(0);opacity:0} }

        * { box-sizing: border-box; }
        ::-webkit-scrollbar       { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 2px; }
      `}</style>

      {!loaded ? (
        <HomeScreen onLoad={() => { setLoaded(true); setTab("xdr"); }} />
      ) : (
        <>
          <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 16px", display: "flex", alignItems: "center", gap: 2, overflowX: "auto", flexWrap: "nowrap", position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 16, borderRight: "0.5px solid var(--color-border-tertiary)", marginRight: 8, flexShrink: 0 }}>
              <LiveDot color={GREEN} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--color-text-secondary)", fontFamily: "'Inter', var(--font-sans)" }}>Sentinel</span>
            </div>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ background: "transparent", border: "none", borderBottom: tab === t.id ? `2px solid ${BLUE}` : "2px solid transparent", padding: "11px 11px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", color: tab === t.id ? BLUE : "var(--color-text-secondary)", fontWeight: tab === t.id ? 500 : 400, flexShrink: 0, fontFamily: "'Inter', var(--font-sans)", transition: "color 0.2s ease", letterSpacing: 0.2 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 48px" }}>
            {Active && <Active key={tab} />}
          </div>
        </>
      )}
    </div>
  );
}