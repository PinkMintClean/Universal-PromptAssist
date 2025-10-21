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

      // Check for nested Subfeatures
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
        // Fallback for flat JSON structure
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
