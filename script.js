// script.js — UI renderer, selection & prompt logic (drop-in replacement)

// GLOBAL
const selectedFeatures = new Set();
let showDescriptorTypes = false;
const promptBox = document.querySelector("#promptBox");

// Toggle selected feature (featureObj must contain at least {category, subfeature, sectionTitle, value, meta})
function toggleFeature(el, featureObj) {
  // Use a small stable key to compare (we'll serialize a minimal identity)
  const key = `${featureObj.category}||${featureObj.subfeature}||${featureObj.sectionTitle}||${featureObj.value}`;

  // attach key to element for UI toggling
  if (!el.dataset._featKey) el.dataset._featKey = key;

  // Find existing by key (we store the object inside a Map-like Set using .key property)
  let found = null;
  for (const f of selectedFeatures) {
    if (f._key === key) { found = f; break; }
  }

  if (found) {
    selectedFeatures.delete(found);
    el.classList.remove("selected");
  } else {
    const store = Object.assign({}, featureObj);
    store._key = key;
    selectedFeatures.add(store);
    el.classList.add("selected");
  }
  updatePrompt();
}

// Build a flowing prompt from selectedFeatures
function updatePrompt() {
  const includeRatios = document.querySelector("#includeRatios")?.checked;
  const parts = [];

  for (const f of selectedFeatures) {
    // By default, we include just the value string (clean)
    let partText = f.value;

    // If we have meta info and showDescriptorTypes is ON, append a short label in parentheses
    if (showDescriptorTypes && f.meta && f.meta.kind) {
      // present readable short types
      const map = {
        "Descriptors_Anatomical": "Anatomical",
        "Descriptors_Animated": "Animated",
        "Overall_Shapes": "Shape",
        "Size": "Size",
        "Shape": "Shape",
      };
      const label = map[f.meta.kind] || f.meta.kind;
      partText += ` (${label})`;
    }

    // Optionally prefix with subfeature for clarity (only when multiple different subfeatures selected)
    // We'll not prefix by default to keep prompt clean (per your request 3 = yes)
    parts.push(partText);
  }

  let text = parts.join(", ");
  if (includeRatios) {
    const ratios = Array.from(document.querySelectorAll(".sliders input")).map(sl=>{
      const labelNode = sl.previousSibling;
      const label = labelNode ? labelNode.textContent.trim() : sl.id;
      return `${label} ${sl.value}%`;
    });
    if (ratios.length) text += text ? ", " + ratios.join(", ") : ratios.join(", ");
  }

  promptBox.textContent = text;
}

// Clear all
document.querySelector("#clearAll").onclick = () => {
  selectedFeatures.clear();
  document.querySelectorAll(".feature-pill.selected").forEach(el=>el.classList.remove("selected"));
  updatePrompt();
};

// Toggle descriptor types (debug)
const toggleButton = document.createElement("button");
toggleButton.id = "toggleDescriptorTypes";
toggleButton.className = "btn small";
toggleButton.textContent = "Show Descriptor Types";
document.querySelector(".tools").appendChild(toggleButton);
toggleButton.addEventListener("click", ()=>{
  showDescriptorTypes = !showDescriptorTypes;
  toggleButton.classList.toggle("active", showDescriptorTypes);
  updatePrompt();
});

// INIT GLOSSARY: expects groups array from glossary.js
function initGlossary(groups) {
  const container = document.querySelector("#subcategories");
  container.innerHTML = "";

  groups.forEach(group => {
    const groupBox = document.createElement("div");
    groupBox.className = "glass-panel";

    const groupTitle = document.createElement("h2");
    groupTitle.textContent = group.group;
    groupBox.appendChild(groupTitle);

    // We changed loader to produce categories as rows (category + subfeature + sections)
    // We'll group by category to cluster subfeatures under the category
    const byCategory = {};
    group.categories.forEach(entry => {
      if (!byCategory[entry.category]) byCategory[entry.category] = [];
      byCategory[entry.category].push(entry);
    });

    Object.keys(byCategory).forEach(categoryName => {
      const catBox = document.createElement("div");
      catBox.className = "subcat";

      const catTitle = document.createElement("h3");
      catTitle.textContent = categoryName;
      catBox.appendChild(catTitle);

      // Each entry is one subfeature (e.g., Forehead, Cheeks)
      byCategory[categoryName].forEach(entry => {
        const subBox = document.createElement("div");
        subBox.className = "subfeature-box";

        const subTitle = document.createElement("h4");
        subTitle.textContent = entry.subfeature;
        subBox.appendChild(subTitle);

        // Render each section (Small/Medium/Large, Anatomical, Animated, General, etc.)
        entry.sections.forEach(section => {
          const sectionBox = document.createElement("div");
          sectionBox.className = "descriptor-section";

          const sectionTitle = document.createElement("h5");
          sectionTitle.textContent = section.title;
          sectionBox.appendChild(sectionTitle);

          const featuresContainer = document.createElement("div");
          featuresContainer.className = "item-container";

          (section.features || []).forEach(item => {
            // item expected to be a string descriptor
            const pill = document.createElement("span");
            pill.className = "feature-pill";
            pill.textContent = item;

            // build a feature object we can toggle/store
            const featureObj = {
              category: categoryName,
              subfeature: entry.subfeature,
              sectionTitle: section.title,
              value: item,
              meta: section.meta || {}
            };

            pill.onclick = () => toggleFeature(pill, featureObj);
            featuresContainer.appendChild(pill);
          });

          sectionBox.appendChild(featuresContainer);
          subBox.appendChild(sectionBox);

          // Add Show More toggle if content is long (defer size check slightly)
          setTimeout(()=>{
            if (featuresContainer.scrollHeight > 120) {
              const tbtn = document.createElement("button");
              tbtn.className = "collapsible-toggle";
              tbtn.textContent = "Show More";
              featuresContainer.after(tbtn);
              tbtn.onclick = () => {
                const expanded = featuresContainer.classList.toggle("expanded");
                tbtn.textContent = expanded ? "Show Less" : "Show More";
              };
            }
          }, 80);
        });

        catBox.appendChild(subBox);
      });

      groupBox.appendChild(catBox);
    });

    container.appendChild(groupBox);
  });
}

// Slider badges (same UX)
document.querySelectorAll(".sliders input").forEach((slider) => {
  const badge = document.createElement("div");
  badge.className = "slider-badge";
  slider.parentElement.style.position = "relative";
  slider.parentElement.appendChild(badge);

  const type = slider.dataset.type || "neutral";
  if (type === "feminine") badge.classList.add("feminine");
  if (type === "masculine") badge.classList.add("masculine");

  const updateBadge = () => {
    const min = slider.min || 0;
    const max = slider.max || 100;
    const percent = ((slider.value - min) / (max - min)) * 100;
    badge.style.left = percent + "%";
    badge.textContent = slider.value + "%";
  };

  slider.addEventListener("input", updateBadge);
  updateBadge();
});

// Apply ratios button
document.querySelector("#applyRatios").onclick = () => {
  updatePrompt();
  const reminder = document.querySelector("#ratioReminder");
  if (!reminder) {
    const r = document.createElement("small");
    r.id = "ratioReminder";
    r.textContent = "✅ Ratios applied to prompt!";
    r.style.color = "#ff79c6";
    r.style.display = "block";
    r.style.marginTop = "4px";
    document.querySelector(".right-panel").prepend(r);
    setTimeout(()=>r.remove(),2500);
  }
};
