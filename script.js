// ===== Global Selection Set =====
const selectedFeatures = new Set();

// ===== Prompt Box =====
let promptBox = document.querySelector("#promptBox");

// ===== Show Descriptor Types Toggle =====
let showDescriptorTypes = false;

// ===== Toggle Feature Function =====
function toggleFeature(el, feature){
  if(selectedFeatures.has(feature)){
    selectedFeatures.delete(feature);
    el.classList.remove("selected");
  } else {
    selectedFeatures.add(feature);
    el.classList.add("selected");
  }
  updatePrompt();
}

// ===== Update Prompt =====
function updatePrompt(){
  const includeRatios = document.querySelector("#includeRatios").checked;
  let text = Array.from(selectedFeatures).map(f => {
    // Check if feature has anatomical/animated descriptors
    if(f.Descriptors_Anatomical && f.Descriptors_Animated){
      if(showDescriptorTypes){
        return [
          ...f.Descriptors_Anatomical.map(d=>`${d} (Anatomical)`),
          ...f.Descriptors_Animated.map(d=>`${d} (Animated)`)
        ].join(", ");
      } else {
        // Merge arrays naturally for clean prompt flow
        return [...f.Descriptors_Anatomical, ...f.Descriptors_Animated].join(", ");
      }
    }
    // If feature is a simple string array
    if(Array.isArray(f)) return f.join(", ");
    return f;
  }).join("; ");

  // Include ratios if checkbox is checked
  if(includeRatios){
    const ratios = Array.from(document.querySelectorAll(".sliders input")).map(sl=>{
      return `${sl.previousSibling.textContent.trim()} ${sl.value}%`;
    });
    text += ratios.length ? ", " + ratios.join(", ") : "";
  }

  promptBox.textContent = text;
}

// ===== Clear All Button =====
document.querySelector("#clearAll").onclick = () => {
  selectedFeatures.clear();
  document.querySelectorAll(".feature-pill.selected").forEach(el=>el.classList.remove("selected"));
  updatePrompt();
};

// ===== Toggle Descriptor Types Button =====
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

// ===== Initialize Glossary =====
function initGlossary(groups){
  const container = document.querySelector("#subcategories");
  container.innerHTML = "";

  groups.forEach(group=>{
    const groupBox = document.createElement("div");
    groupBox.className = "glass-panel";

    const groupTitle = document.createElement("h2");
    groupTitle.textContent = group.group;
    groupBox.appendChild(groupTitle);

    group.categories.forEach(cat=>{
      const catBox = document.createElement("div");
      catBox.className = "subcat";

      const catTitle = document.createElement("h3");
      catTitle.textContent = cat.category;
      catBox.appendChild(catTitle);

      cat.subcategories?.forEach(sub=>{
        const subBox = document.createElement("div");
        subBox.className = "subfeature-box";

        const subTitle = document.createElement("h4");
        subTitle.textContent = sub.name || sub.title || "Feature";
        subBox.appendChild(subTitle);

        // Loop through descriptor arrays
        ["Descriptors_Anatomical","Descriptors_Animated","Overall_Shapes","Descriptors_General"].forEach(key=>{
          if(sub[key] && sub[key].length){
            const featuresContainer = document.createElement("div");
            featuresContainer.className = "item-container";

            sub[key].forEach(f=>{
              const pill = document.createElement("span");
              pill.className = "feature-pill";
              pill.textContent = f;
              pill.onclick = () => toggleFeature(sub); // attach full subfeature for prompt
              featuresContainer.appendChild(pill);
            });

            subBox.appendChild(featuresContainer);

            // Collapsible logic
            if(featuresContainer.scrollHeight > 80){
              const toggle = document.createElement("button");
              toggle.className = "collapsible-toggle";
              toggle.textContent = "Show More";
              featuresContainer.after(toggle);
              toggle.onclick = () => {
                const expanded = featuresContainer.classList.toggle("expanded");
                toggle.textContent = expanded ? "Show Less" : "Show More";
              };
            }
          }
        });

        catBox.appendChild(subBox);
      });

      groupBox.appendChild(catBox);
    });

    container.appendChild(groupBox);
  });
}

// ===== Ratio Sliders =====
document.querySelectorAll(".sliders input").forEach(slider=>{
  const badge = document.createElement("div");
  badge.className="slider-badge";
  slider.parentElement.style.position="relative";
  slider.parentElement.appendChild(badge);

  // Color-coded glow
  const type = slider.dataset.type || "neutral";
  if(type==="feminine") badge.classList.add("feminine");
  if(type==="masculine") badge.classList.add("masculine");

  const updateBadge = ()=>{
    const min = slider.min||0;
    const max = slider.max||100;
    const percent = (slider.value - min) / (max - min) * 100;
    badge.style.left = percent+"%";
    badge.textContent = slider.value+"%";
  };

  slider.addEventListener("input", updateBadge);
  updateBadge();
});

// ===== Apply Ratios Button =====
document.querySelector("#applyRatios").onclick = () => {
  updatePrompt();
  const reminder = document.querySelector("#ratioReminder");
  if(!reminder){
    const r = document.createElement("small");
    r.id="ratioReminder";
    r.textContent="✅ Ratios applied to prompt!";
    r.style.color="#ff79c6";
    r.style.display="block";
    r.style.marginTop="4px";
    document.querySelector(".right-panel").prepend(r);
    setTimeout(()=>r.remove(),2500);
  }
};
