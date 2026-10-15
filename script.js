"use strict";

const GITHUB_USERNAME = "yourusername"; // <- change this

/* ---------- Helper: build an element safely ---------- */
function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  children.forEach(c => node.append(c));
  return node;
}

/* ---------- Projects from JSON ---------- */
async function loadProjects() {
  const list = document.getElementById("project-list");
  try {
    const res = await fetch("data/projects.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const projects = await res.json();
    list.replaceChildren(...projects.map(buildCard));
  } catch (err) {
    console.warn("Projects failed to load:", err);
    list.replaceChildren(el("p", {
      className: "status is-error",
      textContent: "Projects could not be loaded. Please try again later."
    }));
  }
}

function buildCard(p) {
  const img = el("img", {
    src: "images/" + p.screenshot,
    alt: "Screenshot of " + p.title,
    loading: "lazy"
  });
  img.addEventListener("error", () => img.remove());

  const chips = el("ul", { className: "chips" },
    p.technologies.map(t => el("li", { textContent: t })));

  const body = el("div", { className: "card-body" }, [
    el("h3", { textContent: p.title }),
    el("p", { textContent: p.description }),
    el("p", { className: "role", textContent: "Role: " + p.role }),
    chips,
    el("a", { className: "card-link", href: p.link, target: "_blank",
              rel: "noopener", textContent: "View on GitHub" })
  ]);

  return el("article", { className: "card" }, [img, body]);
}

/* ---------- Latest GitHub repositories (REST API) ---------- */
async function loadRepos() {
  const list = document.getElementById("repo-list");
  const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=5`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const repos = await res.json();
    if (repos.length === 0) {
      list.replaceChildren(el("li", { className: "status", textContent: "No public repositories yet." }));
      return;
    }
    list.replaceChildren(...repos.map(r => el("li", {}, [
      el("a", { href: r.html_url, target: "_blank", rel: "noopener", textContent: r.name }),
      el("span", { className: "lang", textContent: r.language || "No language detected" })
    ])));
  } catch (err) {
    console.warn("GitHub data unavailable:", err);
    list.replaceChildren(el("li", {
      className: "status is-error",
      textContent: "GitHub data is unavailable right now. Please try again later."
    }));
  }
}

/* ---------- Contact form ---------- */
function setupForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function check(id, message, isValid) {
    const input = document.getElementById(id);
    const err = document.getElementById(id + "-error");
    const ok = isValid(input.value.trim());
    err.textContent = ok ? "" : message;
    input.classList.toggle("invalid", !ok);
    return ok;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    status.textContent = "";
    const results = [
      check("name", "Enter your name.", v => v.length > 0),
      check("email", "Enter a valid email address, like name@example.com.", v => emailPattern.test(v)),
      check("message", "Enter a message.", v => v.length > 0)
    ];
    if (results.every(Boolean)) {
      // A static site has no back end, so nothing is actually sent.
      form.reset();
      status.textContent = "Thank you! Your message has been received.";
    }
  });
}

/* ---------- Own feature: light/dark theme switch ---------- */
function setupTheme() {
  const btn = document.getElementById("theme-toggle");
  const root = document.documentElement;

  function apply(theme) {
    root.dataset.theme = theme;
    btn.textContent = theme === "dark" ? "Light" : "Dark";
    btn.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " theme");
  }

  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  apply(saved || preferred);

  btn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
}

/* ---------- Start ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
setupTheme();
setupForm();
loadProjects();
loadRepos();