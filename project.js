function getSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

function el(tag, opts = {}) {
  const e = document.createElement(tag);
  if (opts.className) e.className = opts.className;
  if (opts.text != null) e.textContent = opts.text;
  if (opts.html != null) e.innerHTML = opts.html;
  if (opts.href) e.href = opts.href;
  if (opts.target) e.target = opts.target;
  if (opts.rel) e.rel = opts.rel;
  return e;
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

function renderList(items) {
  const ul = document.createElement("ul");
  for (const item of items) ul.appendChild(el("li", { text: item }));
  return ul;
}

function renderReferences(refs) {
  const ul = document.createElement("ul");
  for (const r of refs) {
    const li = document.createElement("li");
    if (r && typeof r === "object" && r.href) {
      li.appendChild(el("a", { text: r.label || r.href, href: r.href, target: "_blank", rel: "noopener" }));
    } else {
      li.textContent = typeof r === "string" ? r : JSON.stringify(r);
    }
    ul.appendChild(li);
  }
  return ul;
}

function renderProject(p) {
  const root = document.getElementById("project");
  document.title = `${p.title} — Student Topics`;

  root.appendChild(el("h1", { text: p.title }));

  const meta = el("p", { className: "meta" });
  meta.append("Supervisor: ");
  if (p.supervisor?.href) {
    meta.appendChild(el("a", { text: p.supervisor.name, href: p.supervisor.href, target: "_blank", rel: "noopener" }));
  } else {
    meta.append(p.supervisor?.name || "");
  }
  if (p.type?.length) meta.append(` · ${p.type.join(" / ")}`);
  if (p.email) {
    meta.append(" ");
    meta.appendChild(el("a", { text: "Contact advisor →", href: contactAdvisorMailto(p), className: "contact-advisor-btn" }));
  }
  root.appendChild(meta);

  if (p.slug) {
    const img = el("img", { className: "project-hero" });
    img.src = `assets/${p.slug}.jpg`;
    img.alt = p.title;
    root.appendChild(img);
  }

  if (p.abstract) root.appendChild(el("p", { text: p.abstract }));

  if (p.milestones?.length) {
    root.appendChild(el("h2", { text: "Milestones" }));
    root.appendChild(renderList(p.milestones));
  }
  if (p.prerequisites?.length) {
    root.appendChild(el("h2", { text: "Prerequisites" }));
    root.appendChild(renderReferences(p.prerequisites));
  }
  if (p.references?.length) {
    root.appendChild(el("h2", { text: "References" }));
    root.appendChild(renderReferences(p.references));
  }
}

function renderError(msg) {
  const root = document.getElementById("project");
  root.appendChild(el("h1", { text: "Project not found" }));
  root.appendChild(el("p", { text: msg }));
  const back = el("a", { text: "← All projects", href: "index.html" });
  root.appendChild(back);
}

async function load() {
  const slug = getSlug();
  if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
    renderError("Missing or invalid ?slug= parameter.");
    return;
  }
  try {
    const res = await fetch(`projects/${slug}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const p = await res.json();
    p.slug = slug;
    renderProject(p);
  } catch (e) {
    renderError(`Could not load projects/${slug}.json (${e.message}).`);
  }
}

load();
