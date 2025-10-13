/* script.js - UI logic for the glossary app
   Requires glossaryData to be populated by glossary.js
*/

let appData = { categories: [] }; // internal structure (copied from glossaryData)
let selected = []; // selected features: {category, subcategory, item}
let includeRatios = false;
let ratios = {
  chest: 50, waist: 35, hips: 50, shoulders: 50, legs: 50, muscle: 20
};

// --- Utility ---
function uid() { return Math.random().toString(36).slice(2,9); }

// --- DOM refs ---
const categoryList = document.getElementById("categoryList");
const subcategoriesNode = document.getElementById("subcategories");
const featureTitle = document.getElementById("featureTitle");
const selectedTags = document.getElementById("selectedTags");
const promptBox = document.getElementById("promptBox");
const searchInput = document.getElementById("searchInput");
const clearAllBtn = document.getElementById("clearAll");
const randomBtn = document.getElementById("randomBtn");
const optimizeBtn = document.getElementById("optimizeBtn");
const copyBtn = document.getElementById("copyBtn");
const exportBtn = document.getElementById("exportBtn");
const includeRatiosToggle = document.getElementById("includeRatios");

const sliderIds = ["chest","waist","hips","shoulders","legs","muscle"];
sliderIds.forEach(id => {
  const el = document.getElementById(id);
  const val = document.getElementById(id + "Val");
  if (el && val) {
    el.addEventListener("input", () => {
      ratios[id] = el.value;
      val.textContent = `${el.value}%`;
      if (includeRatios) updatePromptFromSelection();
    });
  }
});

// --- Init app after data loaded ---
function initApp(glossary) {
  // normalize: each entry assumed to be an object like:
  // { category: "Hair", subcategories: [{ name:"Length", items:[..] }, ...] }
  appData.categories = (glossary || []).filter(Boolean);
  renderCategories();
  bindControls();
}

// --- Render categories list ---
function renderCategories(){
  categoryList.innerHTML = "";
  appData.categories.forEach(cat => {
    const btn = document.createElement("div");
    btn.className = "category-item";
    btn.tabIndex = 0;
    btn.setAttribute("role","listitem");
    btn.textContent = cat.category || cat.name || "Unnamed";
    btn.dataset.category = JSON.stringify(cat);
    btn.addEventListener("click", () => openCategory(cat));
    btn.addEventListener("keypress", (e) => { if (e.key === "Enter") openCategory(cat); });
    categoryList.appendChild(btn);
  });
  // if categories exist, open first by default
  if (appData.categories.length > 0) openCategory(appData.categories[0]);
}

// --- Open a category ---
function openCategory(cat){
  featureTitle.textContent = cat.category || cat.name || "Category";
  subcategoriesNode.innerHTML = "";
  (cat.subcategories || []).forEach(sub => {
    const wrap = document.createElement("div");
    wrap.className = "subcat";
    const h = document.createElement("h4");
    h.textContent = sub.name || sub.title || "Subcategory";
    wrap.appendChild(h);

    const itemContainer = document.createElement("div");
    itemContainer.className = "item-container";
    (sub.items || []).forEach(it => {
      const f = document.createElement("div");
      f.className = "feature-box";
      f.textContent = it;
      f.tabIndex = 0;
      f.setAttribute("role","button");
      f.addEventListener("click", () => toggleSelect(cat.category, sub.name, it, f));
      f.addEventListener("keypress", (e) => { if (e.key === "Enter") toggleSelect(cat.category, sub.name, it, f); });
      // mark selected if present
      if (selected.some(s => s.category===cat.category && s.subcategory===sub.name && s.item===it)){
        f.classList.add("selected");
      }
      itemContainer.appendChild(f);
    });

    wrap.appendChild(itemContainer);
    subcategoriesNode.appendChild(wrap);
  });
}

// --- Toggle select/unselect feature ---
function toggleSelect(category, subcategory, item, node){
  const idx = selected.findIndex(s => s.category===category && s.subcategory===subcategory && s.item===item);
  if (idx >= 0){
    selected.splice(idx,1);
    if (node) node.classList.remove("selected");
  } else {
    selected.push({ id: uid(), category, subcategory, item });
    if (node) node.classList.add("selected");
  }
  refreshSelectedUI();
  updatePromptFromSelection();
}

// --- Refresh selected tags area ---
function refreshSelectedUI(){
  selectedTags.innerHTML = "";
  selected.forEach(s => {
    const t = document.createElement("div");
    t.className = "tag";
    t.textContent = `${s.category} • ${s.subcategory}: ${s.item}`;
    const rem = document.createElement("span");
    rem.className = "remove";
    rem.innerHTML = "✕";
    rem.title = "Remove";
    rem.addEventListener("click", () => {
      const idx = selected.findIndex(x => x.id===s.id);
      if (idx>=0) {
        selected.splice(idx,1);
        refreshSelectedUI();
        updatePromptFromSelection();
        // update main list highlight
        // re-render current category to remove highlight
        const currentCategory = (document.querySelector(".category-item[aria-current='true']')?.dataset?.category);
      }
    });
    t.appendChild(rem);
    selectedTags.appendChild(t);
  });
}

// --- Build prompt from selected features & optional ratios ---
function updatePromptFromSelection(){
  let parts = [];
  // group by category -> produce concise phrase per category
  const byCategory = {};
  selected.forEach(s => {
    byCategory[s.category] = byCategory[s.category] || [];
    byCategory[s.category].push(`${s.subcategory}: ${s.item}`);
  });

  Object.keys(byCategory).forEach(cat => {
    parts.push(`${cat} — ${byCategory[cat].join("; ")}`);
  });

  if (includeRatios || document.getElementById("includeRatios").checked) {
    parts.push(`Ratios: chest ${ratios.chest}%, waist ${ratios.waist}%, hips ${ratios.hips}%, shoulders ${ratios.shoulders}%, legs ${ratios.legs}%, muscle ${ratios.muscle}%`);
  }

  const assembled = parts.join(" | ");
  promptBox.textContent = assembled || "Your final, optimized description will appear here...";
}

// --- Buttons: Random Character ---
function pickRandomCharacter(){
  selected = [];
  // choose one random item per category-subcategory
  appData.categories.forEach(cat => {
    (cat.subcategories||[]).forEach(sub => {
      const items = sub.items || [];
      if (items.length){
        const pick = items[Math.floor(Math.random()*items.length)];
        selected.push({ id: uid(), category: cat.category || cat.name, subcategory: sub.name || sub.title, item: pick });
      }
    });
  });
  refreshSelectedUI();
  updatePromptFromSelection();
  // re-render current category to show selected highlights
  const openCategoryTitle = featureTitle.textContent;
  const match = appData.categories.find(c => (c.category||c.name) === openCategoryTitle);
  if (match) openCategory(match);
}

// --- Buttons: Optimize Prompt (basic: dedupe & sort) ---
function optimizePrompt(){
  // remove duplicates, sort alphabetically per category
  const grouped = {};
  selected.forEach(s => {
    const key = `${s.category}|${s.subcategory}|${s.item}`;
    grouped[key] = s;
  });
  const unique = Object.values(grouped);
  unique.sort((a,b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.subcategory !== b.subcategory) return a.subcategory.localeCompare(b.subcategory);
    return a.item.localeCompare(b.item);
  });
  selected = unique;
  refreshSelectedUI();
  updatePromptFromSelection();
}

// --- Copy to clipboard ---
async function copyPrompt(){
  try {
    await navigator.clipboard.writeText(promptBox.textContent || "");
    copyBtn.textContent = "Copied ✓";
    setTimeout(()=> copyBtn.textContent = "Copy", 1200);
  } catch (err) {
    console.warn("copy failed", err);
    copyBtn.textContent = "Copy (failed)";
    setTimeout(()=> copyBtn.textContent = "Copy", 1200);
  }
}

// --- Export JSON ---
function exportJSON(){
  const payload = {
    timestamp: new Date().toISOString(),
    selections: selected,
    includeRatios: includeRatios,
    ratios
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-selections-${(new Date()).toISOString().slice(0,19).replace(/:/g,'')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Search (debounced) ---
let searchTimer = null;
function bindSearch(){
  if (!searchInput) return;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        // re-open first category
        if (appData.categories.length) openCategory(appData.categories[0]);
        return;
      }
      // find matching items across categories
      const matches = [];
      appData.categories.forEach(cat => {
        (cat.subcategories||[]).forEach(sub => {
          (sub.items||[]).forEach(item => {
            if (String(item).toLowerCase().includes(q) || String(sub.name||"").toLowerCase().includes(q) || String(cat.category||"").toLowerCase().includes(q)) {
              matches.push({ category: cat.category || cat.name, subcategory: sub.name || sub.title, item });
            }
          });
        });
      });
      renderSearchResults(matches, q);
    }, 220);
  });
}

function renderSearchResults(matches, q){
  featureTitle.textContent = `Search: "${q}" — ${matches.length} result(s)`;
  subcategoriesNode.innerHTML = "";
  if (!matches.length) {
    subcategoriesNode.innerHTML = `<div class="subcat"><p style="color:var(--muted)">No results. Try different keywords.</p></div>`;
    return;
  }
  // group matches by category -> subcat
  const grouped = {};
  matches.forEach(m => {
    grouped[m.category] = grouped[m.category] || {};
    grouped[m.category][m.subcategory] = grouped[m.category][m.subcategory] || new Set();
    grouped[m.category][m.subcategory].add(m.item);
  });

  Object.keys(grouped).forEach(catName => {
    const wrap = document.createElement("div");
    wrap.className = "subcat";
    const h = document.createElement("h4"); h.textContent = catName;
    wrap.appendChild(h);
    const itemContainer = document.createElement("div"); itemContainer.className = "item-container";
    Object.keys(grouped[catName]).forEach(subName => {
      const subWrap = document.createElement("div");
      const subTitle = document.createElement("div"); subTitle.textContent = subName; subTitle.style.fontSize = "0.9rem"; subTitle.style.opacity = 0.9;
      itemContainer.appendChild(subTitle);
      grouped[catName][subName].forEach(it => {
        const f = document.createElement("div");
        f.className = "feature-box";
        f.textContent = it;
        f.addEventListener("click", () => toggleSelect(catName, subName, it, f));
        itemContainer.appendChild(f);
      });
    });
    wrap.appendChild(itemContainer);
    subcategoriesNode.appendChild(wrap);
  });
}

// --- Bind top-level controls ---
function bindControls(){
  clearAllBtn.addEventListener("click", () => {
    selected = [];
    refreshSelectedUI();
    updatePromptFromSelection();
    // re-render current category
    if (appData.categories.length) openCategory(appData.categories[0]);
  });

  randomBtn.addEventListener("click", pickRandomCharacter);
  optimizeBtn.addEventListener("click", optimizePrompt);
  copyBtn.addEventListener("click", copyPrompt);
  exportBtn.addEventListener("click", exportJSON);
  includeRatiosToggle.addEventListener("change", (e) => {
    includeRatios = e.target.checked;
    updatePromptFromSelection();
  });

  document.getElementById("applyRatios").addEventListener("click", () => {
    includeRatios = true;
    includeRatiosToggle.checked = true;
    updatePromptFromSelection();
  });

  document.getElementById("randomRatios").addEventListener("click", () => {
    sliderIds.forEach(id => {
      const el = document.getElementById(id);
      const v = Math.floor(Math.random()*(parseInt(el.max)-parseInt(el.min))+parseInt(el.min));
      el.value = v; document.getElementById(id + "Val").textContent = `${v}%`;
      ratios[id] = v;
    });
    if (includeRatios) updatePromptFromSelection();
  });

  bindSearch();

  // keyboard: press "/" to focus search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

// --- Expose initApp for loader ---
window.initApp = initApp;
