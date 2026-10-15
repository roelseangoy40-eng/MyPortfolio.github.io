/* ---------- Reliable project loading (paste at the very bottom) ---------- */
const BACKUP_PROJECTS = [
  {
    title: "Grade Calculator",
    description: "A web app that computes weighted grades and shows the score needed on the final exam.",
    technologies: ["HTML", "CSS", "JavaScript"],
    role: "Sole developer: design, logic and testing",
    screenshot: "project1.png",
    link: "grade-calculator/index.html"
  },
  {
    title: "Weather Dashboard",
    description: "Shows current weather and a 5-day forecast for any city using a public weather API.",
    technologies: ["JavaScript", "REST API", "JSON"],
    role: "Built the API integration and the responsive layout",
    screenshot: "project2.png",
    link: "weather-dashboard/index.html"
  },
  {
    title: "Student Task Tracker",
    description: "A to-do list with categories and due dates. Tasks stay saved in the browser.",
    technologies: ["HTML", "CSS", "JavaScript"],
    role: "Team of 3: I wrote the task storage and filtering",
    screenshot: "project3.png",
    link: "task-tracker/index.html"
  }
];

async function loadProjects() {
  const list = document.getElementById("project-list");
  let projects = null;

  for (const path of ["projects.json", "data/projects.json"]) {
    try {
      const res = await fetch(path);
      if (res.ok) { projects = await res.json(); break; }
    } catch (err) {
      console.warn("Could not load " + path, err);
    }
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    console.warn("Using built-in project list instead of projects.json");
    projects = BACKUP_PROJECTS;
  }

  list.replaceChildren(...projects.map(p => {
    const img = el("img", { src: p.screenshot, alt: "Screenshot of " + p.title, loading: "lazy" });
    let retried = false;
    img.addEventListener("error", () => {
      if (!retried) { retried = true; img.src = "images/" + p.screenshot; }
      else img.remove();
    });
    const chips = el("ul", { className: "chips" },
      p.technologies.map(t => el("li", { textContent: t })));
    const body = el("div", { className: "card-body" }, [
      el("h3", { textContent: p.title }),
      el("p", { textContent: p.description }),
      el("p", { className: "role", textContent: "Role: " + p.role }),
      chips,
      el("a", { className: "card-link", href: p.link, target: "_blank",
                rel: "noopener", textContent: "Open project" })
    ]);
    return el("article", { className: "card" }, [img, body]);
  }));
}

loadProjects();
