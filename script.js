// ====== GLOBAL STATE ======
const selectedFeatures = new Set();
let showDescriptorTypes = false;
const promptBox = document.querySelector("#promptBox");

// ====== TOGGLE FEATURE ======
function toggleFeature(el, featureObj) {
  if (selectedFeatures.has(featureObj)) {
    selectedFeatures.delete(featureObj);
    el.classList.remove("selected");
  } else {
    selectedFeatures.add(featureObj);
    el.classList.add("selected");
  }
  updatePrompt();
}

// ====== UPDATE PROMPT ======
function updatePrompt() {
  const includeRatios = document.querySelector("#includeRatios").checked;
  let text = Array.from(selectedFeatures)
    .map((f) => {
      // Handle structured descriptors
      if (f.Descriptors_Anatomical || f.Descriptors_Animated) {
        const ana = f.Descriptors_Anatomical || [];
        const ani = f.Descriptors_Animated || [];
        if (showDescriptorTypes) {
          return [
            ...ana.map((d) => `${d} (Anatomical)`),
            ...ani.map((d) => `${d} (Animated)`),
          ].join(", ");
        } else {
          return [...ana, ...ani].join(", ");
        }
      }

      // Handle selected string descriptor
      if (f.selected) return f.selected;

      // Otherwise return raw string
      return f;
    })
    .join("; ");

  // Add ratios if selected
  if (includeRatios) {
    const ratios = Array.from(document.querySelectorAll(".sliders input")).map(
      (sl) => `${sl.previousSibling.textContent.trim()} ${sl.value}%`
    );
    if (ratios.length) text += ", " + ratios.join(", ");
  }

  promptBox.textContent = text;
}

// ====== CLEAR ALL ======
document.querySelector("#clearAll").onclick = () => {
  selectedFeatures.clear();
  document.querySelectorAll(".feature-pill.selected").forEach((el) => el.classList.remove("selected"));
  updatePrompt();
};

// ====== TOGGLE DESCRIPTOR TYPES BUTTON ======
const toggleButton = document.createElement("button");
toggleButton.id = "toggleDescriptorTypes";
toggleButton.className = "btn small";
toggleButton.textContent = "Show Descriptor Types";
document.querySelector(".tools").appendChild(toggleButton);

toggleButton.onclick = () => {
  showDescriptorTypes = !showDescriptorTypes;
  toggleButton.classList.toggle("active", showDescriptorTypes);
  updatePrompt();
};

// ====== INIT GLOSSARY (dynamic & collapsible) ======
function initGlossary(groups) {
  const container = document.querySelector("#subcategories");
  container.innerHTML = "";

  groups.forEach((group) => {
    const groupBox = document.createElement("div");
    groupBox.className = "glass-panel";

    const groupTitle = document.createElement("h2");
    groupTitle.textContent = group.group;
    groupBox.appendChild(groupTitle);

    group.categories.forEach((cat) => {
      const catBox = document.createElement("div");
      catBox.className = "subcat";

      const catTitle = document.createElement("h3");
      catTitle.textContent = cat.category;
      catBox.appendChild(catTitle);

      // Use sections directly
      cat.sections?.forEach((section) => {
        const subBox = document.createElement("div");
        subBox.className = "subfeature-box";

        const subTitle = document.createElement("h4");
        subTitle.textContent = section.title || "Feature";
        subBox.appendChild(subTitle);

        // Container for features
        const featuresContainer = document.createElement("div");
        featuresContainer.className = "item-container";

        (section.features || []).forEach((f) => {
          const pill = document.createElement("span");
          pill.className = "feature-pill";
          pill.textContent = f;
          // attach section metadata
          pill.onclick = () =>
            toggleFeature(pill, {
              ...section,
              selected: f,
            });
          featuresContainer.appendChild(pill);
        });

        subBox.appendChild(featuresContainer);

        // Collapsible logic
        setTimeout(() => {
          if (featuresContainer.scrollHeight > 120) {
            const toggle = document.createElement("button");
            toggle.className = "collapsible-toggle";
            toggle.textContent = "Show More";
            featuresContainer.after(toggle);
            toggle.onclick = () => {
              const expanded = featuresContainer.classList.toggle("expanded");
              toggle.textContent = expanded ? "Show Less" : "Show More";
            };
          }
        }, 150);

        catBox.appendChild(subBox);
      });

      groupBox.appendChild(catBox);
    });

    container.appendChild(groupBox);
  });
}

// ====== SLIDER BADGES ======
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

// ====== APPLY RATIOS ======
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
    setTimeout(() => r.remove(), 2500);
  }
};
