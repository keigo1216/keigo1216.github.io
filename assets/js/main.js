const $ = (sel) => document.querySelector(sel);

const GITHUB_REPO = "keigo1216/keigo1216.github.io";
const NEWS_LABEL = "news";
const PUB_LABEL = "pub";
const PUB_LINK_KEYS = ["paper", "doi", "arxiv", "code", "project", "slides", "video"];

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkButtons(links = {}) {
  const entries = Object.entries(links).filter(([, url]) => !!url);
  if (!entries.length) return "";

  // 表示順の好み
  const order = ["paper", "doi", "arxiv", "code", "project", "slides", "video"];
  entries.sort((a, b) => (order.indexOf(a[0]) - order.indexOf(b[0])));

  return `
    <div class="pub-links">
      ${entries
        .map(([k, url]) => {
          const label = k.toUpperCase();
          return `<a class="chip" href="${escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>`;
        })
        .join("")}
    </div>
  `;
}

function renderPublications(pubs, query = "", type = "all") {
  const q = query.trim().toLowerCase();

  const filtered = pubs.filter((p) => {
    const hay = `${p.title ?? ""} ${p.authors ?? ""} ${p.venue ?? ""} ${p.year ?? ""}`.toLowerCase();
    const okQuery = !q || hay.includes(q);
    const okType = type === "all" || p.type === type;
    return okQuery && okType;
  });

  // 年降順
  filtered.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  const html = filtered
    .map((p) => {
      return `
        <article class="pub-item">
          <div class="pub-main">
            <div class="pub-year">${escapeHtml(p.year ?? "")}</div>
            <div class="pub-body">
              <h3 class="pub-title">${escapeHtml(p.title ?? "")}</h3>
              <div class="pub-authors">${escapeHtml(p.authors ?? "")}</div>
              <div class="pub-venue">
                ${escapeHtml(p.venue ?? "")}
                ${p.type ? ` · <span class="badge">${escapeHtml(p.type)}</span>` : ""}
              </div>
              ${p.note ? `<div class="pub-note">${escapeHtml(p.note)}</div>` : ""}
              ${linkButtons(p.links)}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  const listEl = $("#pubList");
  if (listEl) {
    listEl.innerHTML = html || `<p class="note">No publications yet.</p>`;
  }
}

function parseIssueToPub(issue) {
  const fields = {};
  const links = {};

  (issue.body ?? "").split("\n").forEach((line) => {
    const m = line.match(/^\s*([A-Za-z]+)\s*:\s*(.+?)\s*$/);
    if (!m) return;
    const key = m[1].toLowerCase();
    const value = m[2];
    if (PUB_LINK_KEYS.includes(key)) {
      links[key] = value;
    } else {
      fields[key] = value;
    }
  });

  return {
    year: fields.year ? Number(fields.year) : new Date(issue.created_at).getFullYear(),
    type: fields.type ?? "",
    title: issue.title ?? "",
    authors: fields.authors ?? "",
    venue: fields.venue ?? "",
    note: fields.note ?? "",
    links,
  };
}

async function initPubs() {
  const listEl = $("#pubList");
  if (!listEl) return;

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=${encodeURIComponent(PUB_LABEL)}&state=all&per_page=50&sort=created&direction=desc`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error("Failed to fetch publication issues");
    const issues = await res.json();
    const pubs = issues.filter((i) => !i.pull_request).map(parseIssueToPub);

    const searchEl = $("#pubSearch");
    const filterEl = $("#pubFilter");

    const rerender = () =>
      renderPublications(pubs, searchEl?.value ?? "", filterEl?.value ?? "all");

    searchEl?.addEventListener("input", rerender);
    filterEl?.addEventListener("change", rerender);

    rerender();
  } catch (e) {
    listEl.innerHTML = `<p class="note">Failed to load publications.</p>`;
  }
}

function renderNews(items) {
  const listEl = $("#newsList");
  if (!listEl) return;

  if (!items.length) {
    listEl.innerHTML = `<p class="note">No news yet.</p>`;
    return;
  }

  listEl.innerHTML = items
    .map((item) => {
      const date = (item.created_at ?? "").slice(0, 10);
      return `
        <article class="news-item">
          <div class="news-date">${escapeHtml(date)}</div>
          <div class="news-body">
            <a class="news-title" href="${escapeHtml(item.html_url)}" target="_blank" rel="noopener">
              ${escapeHtml(item.title ?? "")}
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

async function initNews() {
  const listEl = $("#newsList");
  if (!listEl) return;

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=${encodeURIComponent(NEWS_LABEL)}&state=all&per_page=20&sort=created&direction=desc`;
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error("Failed to fetch news issues");
    const issues = await res.json();
    renderNews(issues.filter((i) => !i.pull_request));
  } catch (e) {
    listEl.innerHTML = `<p class="note">Failed to load news.</p>`;
  }
}

function initYear() {
  const yEls = document.querySelectorAll("#year");
  const year = String(new Date().getFullYear());
  yEls.forEach((el) => (el.textContent = year));
}

initYear();
initPubs();
initNews();
