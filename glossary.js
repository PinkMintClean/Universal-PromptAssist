// glossary.js — Automatic Loader for Female & Male Anatomy + Ratio Section

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

// ===== Load Group =====
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
      const sections = [];

      if (part && typeof part === "object") {
        if (part.Size && typeof part.Size === "object")
          sections.push({ title: "Size", features: Object.keys(part.Size) });
        if (part.Tone && typeof part.Tone === "object")
          sections.push({ title: "Tone", features: Object.keys(part.Tone) });
        if (part.Peak_Height && typeof part.Peak_Height === "object")
          sections.push({ title: "Peak Height", features: Object.keys(part.Peak_Height) });
        if (Array.isArray(part.Overall_Shapes))
          sections.push({ title: "Overall Shapes", features: part.Overall_Shapes });
        if (Array.isArray(part.Descriptors_General))
          sections.push({ title: "General Descriptors", features: part.Descriptors_General });
      }

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
  setTimeout(() => initRatioSection(), 200);
}

// ===== DOM Ready =====
document.addEventListener("DOMContentLoaded", loadGlossary);
