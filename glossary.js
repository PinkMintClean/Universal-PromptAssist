// ===== Universal PromptAssist — Automatic Glossary Loader =====

let glossary = [];

// ===== Load Glossary Groups (Female + Male Anatomy) =====
async function loadGlossary() {
  const anatomyGroups = [
    {
      name: "Female Anatomy",
      indexPath: "./data/female_anatomy/female_anatomy_index.json",
      basePath: "./data/female_anatomy/"
    },
    {
      name: "Male Anatomy",
      indexPath: "./data/male_anatomy/male_anatomy_index.json",
      basePath: "./data/male_anatomy/"
    }
  ];

  const glossaryArray = [];

  for (const group of anatomyGroups) {
    try {
      const indexRes = await fetch(group.indexPath);
      if (!indexRes.ok) throw new Error(`Could not load ${group.indexPath}`);
      const indexData = await indexRes.json();

      console.log(`📁 Loading ${group.name} from ${group.indexPath}`);

      const groupSections = [];

      for (const file of indexData.files) {
        const filePath = group.basePath + file;
        try {
          const res = await fetch(filePath);
          if (!res.ok) throw new Error(`Could not load ${filePath}`);
          const json = await res.json();

          Object.keys(json).forEach(key => {
            const part = json[key];
            const sections = [];

            if (part.Size)
              sections.push({ title: "Size", features: Object.keys(part.Size) });
            if (part.Tone)
              sections.push({ title: "Tone", features: Object.keys(part.Tone) });
            if (part.Peak_Height)
              sections.push({
                title: "Peak Height",
                features: Object.keys(part.Peak_Height)
              });
            if (part.Overall_Shapes)
              sections.push({
                title: "Overall Shapes",
                features: part.Overall_Shapes
              });
            if (part.Descriptors_General)
              sections.push({
                title: "General Descriptors",
                features: part.Descriptors_General
              });

            groupSections.push({ category: key, sections });
          });
        } catch (err) {
          console.warn(`⚠️ Skipped file (invalid JSON or missing): ${filePath}`);
        }
      }

      glossaryArray.push({ group: group.name, categories: groupSections });
    } catch (err) {
      console.error(`❌ Could not load ${group.indexPath}:`, err);
    }
  }

  glossary = glossaryArray;
  console.log("✅ Glossary loaded successfully:", glossary);

  if (typeof initGlossary === "function") initGlossary(glossary);
}

// ===== Display Glossary Dynamically =====
function initGlossary(glossaryData) {
  const container = document.querySelector("#featureList") || document.querySelector("#subcategories");
  if (!container) return;
  container.innerHTML = "";

  glossaryData.forEach(group => {
    const groupBox = document.createElement("div");
    groupBox.className = "subcat glass-panel";
    groupBox.style.marginBottom = "20px";

    const groupTitle = document.createElement("h2");
    groupTitle.textContent = group.group;
    groupBox.appendChild(groupTitle);

    group.categories.forEach(cat => {
      const catBox = document.createElement("div");
      catBox.className = "subcat-inner";
      catBox.style.margin = "10px 0";
      catBox.style.padding = "12px";
      catBox.style.border = "1px solid rgba(255,255,255,0.08)";
      catBox.style.borderRadius = "10px";

      const catTitle = document.createElement("h3");
      catTitle.textContent = cat.category;
      catBox.appendChild(catTitle);

      cat.sections.forEach(section => {
        const sec = document.createElement("div");
        sec.className = "feature-section";
        const secTitle = document.createElement("h4");
        secTitle.textContent = section.title;
        sec.appendChild(secTitle);

        const featureBox = document.createElement("div");
        featureBox.className = "item-container";

        section.features.forEach(f => {
          const pill = document.createElement("span");
          pill.className = "feature-pill";
          pill.textContent = f;
          pill.onclick = () => toggleFeature(pill, f);
          featureBox.appendChild(pill);
        });

        sec.appendChild(featureBox);
        catBox.appendChild(sec);
      });

      groupBox.appendChild(catBox);
    });

    container.appendChild(groupBox);
  });
}

// ===== Prompt Feature Handling =====
const selected = new Set();

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
  const promptBox =
    document.querySelector("#promptBox") ||
    document.createElement("textarea");
  promptBox.value = Array.from(selected).join(", ");
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", loadGlossary);
