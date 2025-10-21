// ===== glossary.js — Smart Loader for Female & Male Anatomy + Ratios =====

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

// ===== Recursive Subfeature Parser =====
function parseSubfeatures(subfeatures) {
  const sections = [];
  Object.keys(subfeatures).forEach(subkey => {
    const subpart = subfeatures[subkey];

    // Size
    if (subpart.Size && typeof subpart.Size === "object") {
      Object.keys(subpart.Size).forEach(sz => {
        sections.push({
          title: sz,
          features: subpart.Size[sz]
        });
      });
    }

    // Shape
    if (subpart.Shape && typeof subpart.Shape === "object") {
      Object.keys(subpart.Shape).forEach(sh => {
        sections.push({
          title: sh,
          features: subpart.Shape[sh]
        });
      });
    }

    // Descriptors
    if (Array.isArray(subpart.Descriptors_Anatomical)) {
      sections.push({ title: "Anatomical", features: subpart.Descriptors_Anatomical });
    }
    if (Array.isArray(subpart.Descriptors_Animated)) {
      sections.push({ title: "Animated", features: subpart.Descriptors_Animated });
    }
    if (Array.isArray(subpart.Descriptors_General)) {
      sections.push({ title: "General", features: subpart.Descriptors_General });
    }

    // Nested Subfeatures
    if (subpart.Subfeatures && typeof subpart.Subfeatures === "object") {
      const nestedSections = parseSubfeatures(subpart.Subfeatures);
      sections.push(...nestedSections.map(ns => ({
        title: `${subkey} > ${ns.title}`,
        features: ns.features
      })));
    }
  });

  return sections;
}

// ===== Load Group =====
async function loadGroup(indexPath, basePath, groupName) {
  const groupResult = { group: groupName, categories: [] };
  const index = await safeFetchJson(indexPath);
  if (!index || !Array.isArray(index.files)) return groupResult;

  for (const fname of index.files) {
    const filePath = basePath + fname;
    const json = await safeFetchJson(filePath);
    if (!json) continue;

    Object.keys(json).forEach(key => {
      const part = json[key];
      let subfeatures = part.Subfeatures || { [key]: part };
      const sections = parseSubfeatures(subfeatures);
      groupResult.categories.push({ category: key, sections });
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
  setTimeout(() => {
    if (typeof initRatioSection === "function") initRatioSection();
  }, 200);
}

// ===== DOM Ready =====
document.addEventListener("DOMContentLoaded", loadGlossary);
