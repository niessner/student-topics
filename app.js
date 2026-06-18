const state = {
  projects: [],
  activeTags: new Set(),
  activeTypes: new Set(),
  query: "",
  showAllTags: false,
};

async function load() {
  const res = await fetch("projects.json");
  state.projects = await res.json();
  for (const p of state.projects) if (p.type) p.type.sort();

  // Pre-apply a search filter from the URL, e.g. ?search=Haoxuan%20Li
  const initialSearch = new URLSearchParams(location.search).get("search");
  if (initialSearch) {
    state.query = initialSearch.trim().toLowerCase();
    const box = document.getElementById("search");
    if (box) box.value = initialSearch;
  }

  renderTypeFilters();
  renderTagFilters();
  wireClearButton("type-clear", state.activeTypes, renderTypeFilters);
  wireClearButton("tag-clear", state.activeTags, renderTagFilters);
  render();
}

function allTypes() {
  const types = new Set();
  state.projects.forEach((p) => (p.type || []).forEach((t) => types.add(t)));
  return [...types].sort();
}

function tagFrequencies() {
  const counts = new Map();
  state.projects.forEach((p) => (p.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  return counts;
}

function makePill(value, activeSet) {
  const btn = document.createElement("button");
  btn.className = "tag-filter";
  btn.textContent = value;
  if (activeSet.has(value)) btn.classList.add("active");
  btn.addEventListener("click", () => {
    if (activeSet.has(value)) activeSet.delete(value);
    else activeSet.add(value);
    btn.classList.toggle("active");
    render();
  });
  return btn;
}

function renderTypeFilters() {
  const container = document.getElementById("type-filters");
  container.innerHTML = "";
  for (const value of allTypes()) container.appendChild(makePill(value, state.activeTypes));
}

const RARE_TAG_THRESHOLD = 2;

function renderTagFilters() {
  const container = document.getElementById("tag-filters");
  container.innerHTML = "";
  const counts = tagFrequencies();
  const sorted = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
  const activeSet = state.activeTags;
  let hiddenCount = 0;
  for (const tag of sorted) {
    const isCommon = counts.get(tag) >= RARE_TAG_THRESHOLD;
    const visible = isCommon || activeSet.has(tag) || state.showAllTags;
    if (visible) container.appendChild(makePill(tag, activeSet));
    else hiddenCount++;
  }
  const hasUnselectedRare = sorted.some((t) => counts.get(t) < RARE_TAG_THRESHOLD && !activeSet.has(t));
  if (hiddenCount > 0) {
    container.appendChild(makeToggleButton(`+${hiddenCount} more`, true));
  } else if (state.showAllTags && hasUnselectedRare) {
    container.appendChild(makeToggleButton("Show fewer", false));
  }
}

function makeToggleButton(label, expand) {
  const btn = document.createElement("button");
  btn.className = "tag-filter tag-filter-more";
  btn.textContent = label;
  btn.addEventListener("click", () => {
    state.showAllTags = expand;
    renderTagFilters();
  });
  return btn;
}

function wireClearButton(buttonId, activeSet, rerender) {
  document.getElementById(buttonId).addEventListener("click", () => {
    activeSet.clear();
    rerender();
    render();
  });
}

function matches(project) {
  if (state.activeTypes.size) {
    const pTypes = new Set(project.type || []);
    let any = false;
    for (const t of state.activeTypes) if (pTypes.has(t)) { any = true; break; }
    if (!any) return false;
  }
  if (state.activeTags.size) {
    const pTags = new Set(project.tags || []);
    for (const t of state.activeTags) if (!pTags.has(t)) return false;
  }
  if (state.query) {
    const hay = [project.title, project.supervisor?.name, project.teaser, project.abstract, ...(project.tags || []), ...(project.type || [])]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function isFiltering() {
  return state.activeTags.size > 0 || state.activeTypes.size > 0 || state.query.length > 0;
}

function render() {
  const list = document.getElementById("project-list");
  const empty = document.getElementById("empty");
  const count = document.getElementById("visible-count");
  const note = document.getElementById("filtered-note");
  list.innerHTML = "";

  const visible = state.projects.filter(matches);
  empty.hidden = visible.length > 0;
  count.textContent = visible.length;

  if (isFiltering() && visible.length !== state.projects.length) {
    note.hidden = false;
    note.textContent = `(filtered from ${state.projects.length})`;
  } else {
    note.hidden = true;
  }

  document.getElementById("type-clear").hidden = state.activeTypes.size === 0;
  document.getElementById("tag-clear").hidden = state.activeTags.size === 0;

  for (const p of visible) {
    list.appendChild(card(p));
  }
}

function card(p) {
  const el = document.createElement("article");
  el.className = "project-card";

  const teaser = document.createElement("a");
  teaser.href = p.path;
  teaser.className = "project-teaser";
  if (p.image) teaser.style.backgroundImage = `url("${p.image}")`;
  el.appendChild(teaser);

  const body = document.createElement("div");
  body.className = "project-body";

  const title = document.createElement("h2");
  title.className = "project-title";
  const titleLink = document.createElement("a");
  titleLink.href = p.path;
  titleLink.textContent = p.title;
  title.appendChild(titleLink);
  body.appendChild(title);

  if (p.supervisor?.name) {
    const sup = document.createElement("p");
    sup.className = "project-supervisor";
    sup.append("Supervisor: ");
    if (p.supervisor.href) {
      const a = document.createElement("a");
      a.href = p.supervisor.href;
      a.textContent = p.supervisor.name;
      a.target = "_blank";
      a.rel = "noopener";
      sup.appendChild(a);
    } else {
      sup.append(p.supervisor.name);
    }
    if (p.email) {
      const btn = document.createElement("a");
      btn.className = "contact-advisor-btn";
      btn.href = contactAdvisorMailto(p);
      btn.textContent = "Contact advisor →";
      sup.append(" ");
      sup.appendChild(btn);
    }
    body.appendChild(sup);
  }

  if (p.teaser) {
    const desc = document.createElement("p");
    desc.className = "project-description";
    desc.textContent = p.teaser;
    body.appendChild(desc);
  }

  if (p.type?.length) {
    const types = document.createElement("div");
    types.className = "project-types";
    for (const t of p.type) {
      const span = document.createElement("span");
      span.className = "project-type";
      span.textContent = t;
      types.appendChild(span);
    }
    body.appendChild(types);
  }

  if (p.tags?.length) {
    const tags = document.createElement("div");
    tags.className = "project-tags";
    for (const t of p.tags) {
      const span = document.createElement("span");
      span.className = "project-tag";
      span.textContent = t;
      tags.appendChild(span);
    }
    body.appendChild(tags);
  }

  el.appendChild(body);
  return el;
}

function contactAdvisorMailto(p) {
  const body =
    `Dear ${p.supervisor?.name || "advisor"},\n\n` +
    `I would like to apply for the following Master's research topic:\n` +
    `"${p.title}"\n\n` +
    `--- Personal details ---\n` +
    `Full name:\n` +
    `TUM ID:\n` +
    `Study program & semester:\n\n` +
    `--- Research interests ---\n` +
    `(A couple of casual sentences on what interests you in this topic / the direction you'd like to explore.)\n\n` +
    `--- Attachments ---\n` +
    `Please find attached my CV and current transcript of records.\n\n` +
    `Best regards,\n`;
  return (
    `mailto:${p.email}` +
    `?subject=${encodeURIComponent(`Application: ${p.title}`)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

document.getElementById("search").addEventListener("input", (e) => {
  state.query = e.target.value.trim().toLowerCase();
  render();
});

load();
