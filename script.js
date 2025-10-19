// ===== Global Selection Set =====
const selectedFeatures = new Set();
const sliderValues = {}; // store slider values

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
  const featureText = Array.from(selectedFeatures).join(", ");
  const sliderText = Object.entries(sliderValues).map(([k, v]) => `${k}: ${v}%`).join(", ");
  promptBox.textContent = [featureText, sliderText].filter(Boolean).join(", ");
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

// ===== Create Feature Pills with Collapsible Handling =====
function createFeaturePill(feature) {
  const pill = document.createElement("span");
  pill.className = "feature-pill";
  pill.textContent = feature;
  pill.onclick = () => toggleFeature(pill, feature);
  return pill;
}

// ===== Create Collapsible Section for Overflow Features =====
function createCollapsible(features) {
  const container = document.createElement("div");
  container.className = "collapsible-container";

  const visibleContainer = document.createElement("div");
  visibleContainer.className = "visible-features";

  const hiddenContainer = document.createElement("div");
  hiddenContainer.className = "hidden-features";
  hiddenContainer.style.display = "none";

  features.forEach((f, i) => {
    const pill = createFeaturePill(f);
    if (i < 8) visibleContainer.appendChild(pill);
    else hiddenContainer.appendChild(pill);
  });

  const toggleBtn = document.createElement("button");
  toggleBtn.className = "collapsible-toggle";
  toggleBtn.textContent = "Show More";
  toggleBtn.onclick = () => {
    hiddenContainer.style.display = hiddenContainer.style.display === "none" ? "flex" : "none";
    toggleBtn.textContent = hiddenContainer.style.display === "none" ? "Show More" : "Show Less";
  };

  container.appendChild(visibleContainer);
  container.appendChild(hiddenContainer);
  container.appendChild(toggleBtn);

  return container;
}

// ===== Initialize Glossary =====
function initGlossary(groups) {
  const container = document.querySelector("#featureDisplay #subcategories");
  if (!container) return;
  container.innerHTML = "";

  groups.forEach(group => {
    const groupBox = document.createElement("div");
    groupBox.className = "glass-panel";
    const groupTitle = document.createElement("h2");
    groupTitle.textContent = group.group || "Unnamed Group";
    groupBox.appendChild(groupTitle);

    group.categories.forEach(category => {
      const categoryBox = document.createElement("div");
      categoryBox.className = "subcat";

      const catTitle = document.createElement("h3");
      catTitle.textContent = category.category;
      categoryBox.appendChild(catTitle);

      category.sections.forEach(section => {
        const sectionTitle = document.createElement("h4");
        sectionTitle.textContent = section.title;
        categoryBox.appendChild(sectionTitle);

        const featuresContainer = createCollapsible(section.features);
        categoryBox.appendChild(featuresContainer);
      });

      groupBox.appendChild(categoryBox);
    });

    container.appendChild(groupBox);
  });

  // After glossary loads, init sliders
  initSliders();
}

// ===== Slider Section =====
function initSliders() {
  const sliderContainer = document.querySelector("#ratioSliders");
  if (!sliderContainer) return;
  sliderContainer.innerHTML = "";

  const sliders = [
    { label: "Chest", min: 20, max: 95, gender: "feminine" },
    { label: "Waist", min: 15, max: 80, gender: "feminine" },
    { label: "Hip", min: 25, max: 85, gender: "feminine" },
    { label: "Shoulder", min: 20, max: 80, gender: "masculine" },
    { label: "Leg", min: 30, max: 70, gender: "masculine" },
    { label: "Muscle", min: 5, max: 95, gender: "neutral" },
  ];

  sliders.forEach(s => {
    const wrapper = document.createElement("div");
    wrapper.className = "slider-wrapper";

    const label = document.createElement("label");
    label.textContent = `${s.label}: `;
    wrapper.appendChild(label);

    const valueBadge = document.createElement("span");
    valueBadge.className = `slider-badge ${s.gender}`;
    valueBadge.textContent = s.min;
    wrapper.appendChild(valueBadge);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = s.min;
    slider.max = s.max;
    slider.value = s.min;
    slider.className = `ratio-slider ${s.gender}`;
    slider.oninput = () => {
      sliderValues[s.label] = slider.value;
      valueBadge.textContent = slider.value;
      updatePrompt();
    };

    wrapper.appendChild(slider);
    sliderContainer.appendChild(wrapper);
  });
}

// ===== Initialize everything on DOM ready =====
document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadGlossary === "function") loadGlossary();
});
