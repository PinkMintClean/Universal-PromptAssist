// ===== Global Selection Set =====
const selectedFeatures = new Set();

// ===== Prompt Box =====
let promptBox = document.querySelector("#promptBox");
if (!promptBox) {
  promptBox = document.createElement("div");
  promptBox.id = "promptBox";
  promptBox.className = "prompt-box";
  promptBox.contentEditable = "true";
  promptBox.textContent = "Your final, optimized description will appear here...";
  document.body.prepend(promptBox);
}

// ===== Toggle Feature Function =====
function toggleFeature(el, feature) {
  if (selectedFeatures.has(feature)) {
    selectedFeatures.delete(feature);
    el.classList.remove("selected");
  } else {
    selectedFeatures.add(feature);
    el.classList.add("selected");
  }
  updatePrompt();
}

// ===== Update Prompt =====
function updatePrompt() {
  promptBox.textContent = Array.from(selectedFeatures).join(", ");
}

// ===== Clear All Button =====
const clearBtn = document.querySelector("#clearAll");
if (clearBtn) {
  clearBtn.onclick = () => {
    selectedFeatures.clear();
    document.querySelectorAll(".feature-pill.selected").forEach(el => el.classList.remove("selected"));
    updatePrompt();
  };
}

// ===== Create Feature Pills =====
function createFeaturePill(feature) {
  const pill = document.createElement("span");
  pill.className = "feature-pill";
  pill.textContent = feature;
  pill.onclick = () => toggleFeature(pill, feature);
  return pill;
}

// ===== Initialize Glossary =====
function initGlossary(groups) {
  const container = document.querySelector("#featureDisplay #subcategories");
  if (!container) return;
  container.innerHTML = "";

  groups.forEach(group => {
    // Group box (Female Anatomy / Male Anatomy)
    const groupBox = document.createElement("div");
    groupBox.className = "glass-panel";
    const groupTitle = document.createElement("h2");
    groupTitle.textContent = group.group || "Unnamed Group";
    groupBox.appendChild(groupTitle);

    // Body parts inside the group
    group.categories.forEach(category => {
      const categoryBox = document.createElement("div");
      categoryBox.className = "subcat";

      const catTitle = document.createElement("h3");
      catTitle.textContent = category.category;
      categoryBox.appendChild(catTitle);

      // Feature sections (Size, Tone, etc.)
      category.sections.forEach(section => {
        const sectionTitle = document.createElement("h4");
        sectionTitle.textContent = section.title;
        categoryBox.appendChild(sectionTitle);

        const featuresContainer = document.createElement("div");
        featuresContainer.className = "item-container";

        section.features.forEach(f => {
          const pill = createFeaturePill(f);
          featuresContainer.appendChild(pill);
        });

        categoryBox.appendChild(featuresContainer);
      });

      groupBox.appendChild(categoryBox);
    });

    container.appendChild(groupBox);
  });
}
