// ===== Safe JSON fetch =====
async function safeFetchJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      console.warn("Failed to fetch:", path, res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn("Fetch error:", path, e);
    return null;
  }
}

// ===== Load a single JSON file and parse subfeatures =====
async function loadGroup(indexPath, basePath, groupName) {
  const groupResult = { group: groupName, categories: [] };

  const index = await safeFetchJson(indexPath);
  if (!index || !Array.isArray(index.files)) {
    console.warn("Invalid or missing index:", indexPath);
    return groupResult;
  }

  for (const fname of index.files) {
    const filePath = basePath + fname;
    const json = await safeFetchJson(filePath);
    if (!json) {
      console.warn("Skipped missing/invalid file:", filePath);
      continue;
    }

    Object.keys(json).forEach(key => {
      const part = json[key];
      const categories = [];

      // Handle nested Subfeatures
      if (part.Subfeatures && typeof part.Subfeatures === "object") {
        const subcategories = [];

        Object.keys(part.Subfeatures).forEach(subKey => {
          const sub = part.Subfeatures[subKey];
          subcategories.push({
            name: subKey,
            Descriptors_Anatomical: sub.Descriptors_Anatomical || [],
            Descriptors_Animated: sub.Descriptors_Animated || [],
            Overall_Shapes: sub.Overall_Shapes || [],
            Descriptors_General: sub.Descriptors_General || []
          });
        });

        categories.push({
          category: key,
          subcategories
        });

      } else {
        // Fallback for flat JSON
        const sections = [];
        if (part.Size && typeof part.Size === "object") sections.push({ title: "Size", features: Object.keys(part.Size) });
        if (part.Tone && typeof part.Tone === "object") sections.push({ title: "Tone", features: Object.keys(part.Tone) });
        if (Array.isArray(part.Overall_Shapes)) sections.push({ title: "Overall Shapes", features: part.Overall_Shapes });
        if (Array.isArray(part.Descriptors_General)) sections.push({ title: "General Descriptors", features: part.Descriptors_General });

        categories.push({ category: key, sections });
      }

      groupResult.categories.push(...categories);
    });
  }

  return groupResult;
}

// ===== Load All Groups =====
async function loadGlossary() {
  const base = "./data/";
  const groups = [
    { name: "Female Anatomy", index: base + "female_anatomy/female_anatomy_index.json", basePath: base + "female_anatomy/" },
    { name: "Male Anatomy", index: base + "male_anatomy/male_anatomy_index.json", basePath: base + "male_anatomy/" }
  ];

  const finalGlossary = [];

  for (const g of groups) {
    const groupData = await loadGroup(g.index, g.basePath, g.name);
    finalGlossary.push(groupData);
  }

  console.log("✅ Glossary loaded:", finalGlossary);

  if (typeof initGlossary === "function") initGlossary(finalGlossary);

  // Initialize ratio section after glossary
  setTimeout(() => initRatioSection?.(), 200);
}

// ===== DOM Ready =====
document.addEventListener("DOMContentLoaded", loadGlossary);

// ===== Example initGlossary compatible snippet =====
// (Replace your current initGlossary with this if you haven't already)

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

      // Handle nested subcategories
      if(cat.subcategories){
        cat.subcategories.forEach(sub=>{
          const subBox = document.createElement("div");
          subBox.className = "subfeature-box";

          const subTitle = document.createElement("h4");
          subTitle.textContent = sub.name;
          subBox.appendChild(subTitle);

          const features = [
            ...(sub.Descriptors_Anatomical || []),
            ...(sub.Descriptors_Animated || []),
            ...(sub.Overall_Shapes || []),
            ...(sub.Descriptors_General || [])
          ];

          const featuresContainer = document.createElement("div");
          featuresContainer.className = "item-container";

          features.forEach(f=>{
            const pill = document.createElement("span");
            pill.className = "feature-pill";
            pill.textContent = f;
            pill.onclick = ()=>toggleFeature(sub);
            featuresContainer.appendChild(pill);
          });

          subBox.appendChild(featuresContainer);

          // Collapsible logic
          if(featuresContainer.scrollHeight > 80){
            const toggle = document.createElement("button");
            toggle.className = "collapsible-toggle";
            toggle.textContent = "Show More";
            featuresContainer.after(toggle);
            toggle.onclick = ()=>{
              const expanded = featuresContainer.classList.toggle("expanded");
              toggle.textContent = expanded ? "Show Less" : "Show More";
            };
          }

          catBox.appendChild(subBox);
        });
      } else if(cat.sections){
        // fallback for flat JSON
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
            pill.onclick = ()=>toggleFeature(f);
            featuresContainer.appendChild(pill);
          });

          catBox.appendChild(featuresContainer);
        });
      }

      groupBox.appendChild(catBox);
    });

    container.appendChild(groupBox);
  });
}
