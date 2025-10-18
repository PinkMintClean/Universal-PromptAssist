// ===== Grab existing HTML elements =====
const container = document.querySelector("#subcategories");
const selectedTags = document.querySelector("#selectedTags");
const promptBox = document.querySelector("#promptBox");
const selected = new Set();

// ===== Initialize Glossary Display =====
function initGlossary(glossary) {
  const container = document.querySelector("#featureList");
  container.innerHTML = "";

  glossary.forEach(group => {
    // Create a large group panel (e.g. Female Anatomy)
    const groupPanel = document.createElement("div");
    groupPanel.className = "category-group glass-panel";

    const groupTitle = document.createElement("h2");
    groupTitle.textContent = group.category || "Unnamed Group";
    groupPanel.appendChild(groupTitle);

    // Each anatomy part inside
    group.sections.forEach(category => {
      const section = document.createElement("div");
      section.className = "category-block";

      const title = document.createElement("h3");
      title.textContent = category.category || "Unnamed Category";
      section.appendChild(title);

      if (category.sections) {
        category.sections.forEach(sub => {
          const subTitle = document.createElement("h4");
          subTitle.textContent = sub.title;
          section.appendChild(subTitle);

          const featureBox = document.createElement("div");
          featureBox.className = "item-container";

          sub.features.forEach(feature => {
            const item = document.createElement("span");
            item.className = "feature-pill";
            item.textContent = feature;
            item.onclick = () => toggleFeature(item, feature);
            featureBox.appendChild(item);
          });

          section.appendChild(featureBox);
        });
      }

      groupPanel.appendChild(section);
    });

    container.appendChild(groupPanel);
  });
}

// ===== Feature Selection =====
function toggleFeature(el, feature) {
  if (selected.has(feature)) {
    selected.delete(feature);
    el.classList.remove("selected");
  } else {
    selected.add(feature);
    el.classList.add("selected");
  }
  updatePrompt();
  updateSelectedTags();
}

function updatePrompt() {
  promptBox.innerText = Array.from(selected).join(", ");
}

function updateSelectedTags() {
  selectedTags.innerHTML = "";
  selected.forEach(f => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = f;

    const remove = document.createElement("span");
    remove.className = "remove";
    remove.textContent = "×";
    remove.onclick = () => toggleFeature(tag, f);

    tag.appendChild(remove);
    selectedTags.appendChild(tag);
  });
}

// ===== Prompt Control Buttons =====
document.querySelector("#copyBtn").onclick = () => {
  navigator.clipboard.writeText(promptBox.innerText);
  alert("✅ Prompt copied to clipboard!");
};

document.querySelector("#exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(Array.from(selected), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt.json";
  a.click();
  URL.revokeObjectURL(url);
};

document.querySelector("#optimizeBtn").onclick = () => {
  const sorted = Array.from(selected).sort();
  promptBox.innerText = [...new Set(sorted)].join(", ");
};

document.querySelector("#randomBtn").onclick = () => {
  const pills = document.querySelectorAll(".feature-pill");
  selected.clear();
  pills.forEach(p => p.classList.remove("selected"));
  [...pills].sort(() => 0.5 - Math.random()).slice(0, 5).forEach(p => {
    p.classList.add("selected");
    selected.add(p.textContent);
  });
  updatePrompt();
  updateSelectedTags();
};

// ===== Clear All Button =====
document.querySelector("#clearAll").onclick = () => {
  selected.clear();
  document.querySelectorAll(".feature-pill").forEach(p => p.classList.remove("selected"));
  updatePrompt();
  updateSelectedTags();
};
