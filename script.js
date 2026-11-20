"use strict";

const GITHUB_USERNAME = "roelseangoy40-eng";
// Repos that should never appear as project cards (this portfolio itself)
const EXCLUDED_REPOS = ["myportfolio.github.io", GITHUB_USERNAME.toLowerCase() + ".github.io"];

const BACKUP_PROJECTS = [
  { title: "Grade Calculator",
    description: "A web app that computes weighted grades and shows the score needed on the final exam.",
    technologies: ["HTML", "CSS", "JavaScript"],
    role: "Sole developer: design, logic and testing",
    screenshot: "project1.png", link: "grade-calculator/index.html" },
  { title: "Weather Dashboard",
    description: "Shows current weather and a 5-day forecast for any city using a public weather API.",
    technologies: ["JavaScript", "REST API", "JSON"],
    role: "Built the API integration and the responsive layout",
    screenshot: "project2.png", link: "weather-dashboard/index.html" },
  { title: "Student Task Tracker",
    description: "A to-do list with categories and due dates. Tasks stay saved in the browser.",
    technologies: ["HTML", "CSS", "JavaScript"],
    role: "Team of 3: I wrote the task storage and filtering",
    screenshot: "project3.png", link: "task-tracker/index.html" }
];

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  children.forEach(c => node.append(c));
  return node;
}

function buildCard(p) {
  const img = el("img", { src: p.screenshot, alt: "Screenshot of " + p.title, loading: "lazy" });
  let retried = false;
  img.addEventListener("error", () => {
    if (!retried) { retried = true; img.src = "images/" + p.screenshot; }
    else img.remove();
  });
  const chips = el("ul", { className: "chips" }, p.technologies.map(t => el("li", { textContent: t })));
  const body = el("div", { className: "card-body" }, [
    el("h3", { textContent: p.title }),
    el("p", { textContent: p.description }),
    el("p", { className: "role", textContent: "Role: " + p.role }),
    chips,
    el("a", { className: "card-link", href: p.link, target: "_blank", rel: "noopener", textContent: "Open project" })
  ]);
  return el("article", { className: "card" }, [img, body]);
}

const slug = str => String(str).toLowerCase().replace(/[^a-z0-9]/g, "");

// One shared request for all public repos (used by both the cards and the "latest" list)
let reposPromise = null;
function fetchRepos() {
  if (!reposPromise) {
    const url = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;
    reposPromise = fetch(url).then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }
  return reposPromise;
}

function prettyName(name) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function repoToProject(r) {
  const tech = [];
  if (r.language) tech.push(r.language);
  (r.topics || []).forEach(t => { if (!tech.includes(t)) tech.push(t); });
  if (tech.length === 0) tech.push("GitHub");
  return {
    title: prettyName(r.name),
    description: r.description || "A project from my GitHub. Open it to see the code and details.",
    technologies: tech.slice(0, 6),
    role: "Developer",
    screenshot: `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/${r.name}`,
    link: r.homepage && /^https?:\/\//.test(r.homepage) ? r.homepage : r.html_url,
    _repoSlug: slug(r.name)
  };
}

async function loadProjects() {
  const list = document.getElementById("project-list");

  // 1) Hand-written projects from projects.json (keeps your custom roles/descriptions)
  let manual = null;
  for (const path of ["projects.json", "data/projects.json"]) {
    try {
      const res = await fetch(path);
      if (res.ok) { manual = await res.json(); break; }
    } catch (err) { console.warn("Could not load " + path, err); }
  }
  if (!Array.isArray(manual) || manual.length === 0) manual = BACKUP_PROJECTS;

  // 2) Every public GitHub repo, added automatically
  let auto = [];
  try {
    const repos = await fetchRepos();
    auto = repos
      .filter(r => !r.fork && !r.archived && !EXCLUDED_REPOS.includes(r.name.toLowerCase()))
      .map(repoToProject);
  } catch (err) {
    console.warn("GitHub projects unavailable:", err);
  }

  // Skip repos you already described by hand in projects.json (match by title or link)
  const known = new Set(manual.flatMap(p => [slug(p.title), ...String(p.link).split("/").map(slug)]));
  const extra = auto.filter(p => !known.has(p._repoSlug));

  list.replaceChildren(...[...manual, ...extra].map(buildCard));
}

async function loadRepos() {
  const list = document.getElementById("repo-list");
  try {
    const all = await fetchRepos();
    const repos = all.filter(r => !EXCLUDED_REPOS.includes(r.name.toLowerCase())).slice(0, 5);
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
    list.replaceChildren(el("li", { className: "status is-error",
      textContent: "GitHub data is unavailable right now. Please try again later." }));
  }
}

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
      form.reset();
      status.textContent = "Thank you! Your message has been received.";
    }
  });
}

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

document.getElementById("year").textContent = new Date().getFullYear();
setupTheme();
setupForm();
loadProjects();
loadRepos();
