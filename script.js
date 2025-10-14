// ===== Initialize Glossary Display =====
function initGlossary(glossary) {
  const container = document.querySelector("#featureList");
  container.innerHTML = "";

  glossary.forEach(category => {
    const section = document.createElement("div");
    section.className = "category-block glass-panel";

    const title = document.createElement("h2");
    title.textContent = category.category || "Unnamed Category";
    section.appendChild(title);

    if (category.sections) {
      category.sections.forEach(sub => {
        const subTitle = document.createElement("h3");
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

    container.appendChild(section);
  });
}

// ===== Selected Features & Prompt Builder =====
const selected = new Set();
const promptBox = document.createElement("textarea");
promptBox.id = "promptBox";
promptBox.placeholder = "Your smart prompt will appear here...";
document.querySelector("body").prepend(promptBox);

function toggleFeature(el, feature) {
  if (selected.has(feature)) {
    selected.delete(feature);
    el.classList.remove("selected");
  } else {
    selected.add(feature);
    el.classList.add("selected");
  }
  updatePrompt();
}

function updatePrompt() {
  promptBox.value = Array.from(selected).join(", ");
}

// ===== Control Buttons =====
const controls = document.createElement("div");
controls.className = "prompt-controls glass-panel";
controls.innerHTML = `
  <button id="randomize">🎲 Random Character</button>
  <button id="optimize">✨ Optimize Prompt</button>
  <button id="copy">📋 Copy Prompt</button>
  <button id="export">💾 Export JSON</button>
`;
document.body.prepend(controls);

document.querySelector("#copy").onclick = () => {
  navigator.clipboard.writeText(promptBox.value);
  alert("✅ Prompt copied to clipboard!");
};

document.querySelector("#export").onclick = () => {
  const blob = new Blob([JSON.stringify(Array.from(selected), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt.json";
  a.click();
  URL.revokeObjectURL(url);
};

document.querySelector("#optimize").onclick = () => {
  const sorted = Array.from(selected).sort();
  promptBox.value = [...new Set(sorted)].join(", ");
};

// Randomize (demo: selects 5 random features)
document.querySelector("#randomize").onclick = () => {
  const pills = document.querySelectorAll(".feature-pill");
  selected.clear();
  pills.forEach(p => p.classList.remove("selected"));
  [...pills].sort(() => 0.5 - Math.random()).slice(0, 5).forEach(p => {
    p.classList.add("selected");
    selected.add(p.textContent);
  });
  updatePrompt();
};
