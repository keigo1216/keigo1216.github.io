const $ = (sel) => document.querySelector(sel);

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
    listEl.innerHTML = html || `<p class="note">該当するpublicationがありません。</p>`;
  }
}

async function initPubs() {
  const listEl = $("#pubList");
  if (!listEl) return;

  try {
    const res = await fetch("assets/data/publications.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch publications.json");
    const pubs = await res.json();

    const searchEl = $("#pubSearch");
    const filterEl = $("#pubFilter");

    const rerender = () =>
      renderPublications(pubs, searchEl?.value ?? "", filterEl?.value ?? "all");

    searchEl?.addEventListener("input", rerender);
    filterEl?.addEventListener("change", rerender);

    rerender();
  } catch (e) {
    listEl.innerHTML =
      `<p class="note">publicationsの読み込みに失敗しました。<code>assets/data/publications.json</code> のJSON形式を確認してください。</p>`;
  }
}

function initYear() {
  const yEls = document.querySelectorAll("#year");
  const year = String(new Date().getFullYear());
  yEls.forEach((el) => (el.textContent = year));
}

initYear();
initPubs();
