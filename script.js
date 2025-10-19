// ===== Global Selection Set =====
const selectedFeatures = new Set();

// ===== Prompt Box =====
let promptBox = document.querySelector("#promptBox");

// ===== Toggle Feature Function =====
function toggleFeature(el, feature){
  if(selectedFeatures.has(feature)){
    selectedFeatures.delete(feature);
    el.classList.remove("selected");
  }else{
    selectedFeatures.add(feature);
    el.classList.add("selected");
  }
  updatePrompt();
}

// ===== Update Prompt =====
function updatePrompt(){
  const includeRatios = document.querySelector("#includeRatios").checked;
  let text = Array.from(selectedFeatures).join(", ");
  
  if(includeRatios){
    const ratios = Array.from(document.querySelectorAll(".sliders input")).map(sl=>{
      return `${sl.previousSibling.textContent.trim()} ${sl.value}%`;
    });
    text += ratios.length ? ", " + ratios.join(", ") : "";
  }
  
  promptBox.textContent = text;
}

// ===== Clear All Button =====
document.querySelector("#clearAll").onclick = ()=>{
  selectedFeatures.clear();
  document.querySelectorAll(".feature-pill.selected").forEach(el=>el.classList.remove("selected"));
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

      cat.sections.forEach(section=>{
        const secTitle = document.createElement("h4");
        secTitle.textContent = section.title;
        catBox.appendChild(secTitle);

        const featuresContainer = document.createElement("div");
        featuresContainer.className = "item-container";

        section.features.forEach(f=>{
          const pill = document.createElement("span");
          pill.className="feature-pill";
          pill.textContent=f;
          pill.onclick = ()=>toggleFeature(pill,f);
          featuresContainer.appendChild(pill);
        });

        catBox.appendChild(featuresContainer);

        // Add show more button if needed
        if(featuresContainer.scrollHeight>80){
          const toggle = document.createElement("button");
          toggle.className="collapsible-toggle";
          toggle.textContent="Show More";
          featuresContainer.after(toggle);
          toggle.onclick = ()=>{
            const expanded = featuresContainer.classList.toggle("expanded");
            toggle.textContent = expanded?"Show Less":"Show More";
          };
        }
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

  // color based on gender hint
  const type = slider.dataset.type||"neutral";
  if(type==="feminine") badge.classList.add("feminine");
  if(type==="masculine") badge.classList.add("masculine");

  const updateBadge = ()=>{
    const min = slider.min||0;
    const max = slider.max||100;
    const percent = (slider.value-min)/(max-min)*100;
    badge.style.left = percent+"%";
    badge.textContent = slider.value+"%";
  };
  
  slider.addEventListener("input", updateBadge);
  updateBadge();
});

// ===== Apply Ratios Button =====
document.querySelector("#applyRatios").onclick=()=>{
  updatePrompt();
  // small reminder message
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
