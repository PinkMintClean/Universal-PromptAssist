// glossary.js — robust loader for modular JSONs (female/male anatomy)
// safeFetchJson, loadGroup, loadGlossary — returns categories with sections
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

// Convert a subfeature object into an ordered list of sections
function buildSectionsFromSubpart(subpart) {
  const sections = [];

  // SIZE: produce sections for Small/Medium/Large showing descriptor arrays
  if (subpart.Size && typeof subpart.Size === "object") {
    Object.keys(subpart.Size).forEach(sz => {
      const list = Array.isArray(subpart.Size[sz]) ? subpart.Size[sz] : [];
      sections.push({ title: sz, features: list, meta: { kind: "Size" } });
    });
  }

  // SHAPE: shape keys may be an object of arrays
  if (subpart.Shape && typeof subpart.Shape === "object") {
    Object.keys(subpart.Shape).forEach(sh => {
      const list = Array.isArray(subpart.Shape[sh]) ? subpart.Shape[sh] : [];
      sections.push({ title: sh, features: list, meta: { kind: "Shape" } });
    });
  }

  // Ordered descriptor arrays (Anatomical, Animated, General)
  if (Array.isArray(subpart.Descriptors_Anatomical) && subpart.Descriptors_Anatomical.length)
    sections.push({ title: "Anatomical", features: subpart.Descriptors_Anatomical.slice(), meta: { kind: "Descriptors_Anatomical" } });
  if (Array.isArray(subpart.Descriptors_Animated) && subpart.Descriptors_Animated.length)
    sections.push({ title: "Animated", features: subpart.Descriptors_Animated.slice(), meta: { kind: "Descriptors_Animated" } });
  if (Array.isArray(subpart.Descriptors_General) && subpart.Descriptors_General.length)
    sections.push({ title: "General", features: subpart.Descriptors_General.slice(), meta: { kind: "Descriptors_General" } });

  // Overall_Shapes array (if present)
  if (Array.isArray(subpart.Overall_Shapes) && subpart.Overall_Shapes.length)
    sections.push({ title: "Overall Shapes", features: subpart.Overall_Shapes.slice(), meta: { kind: "Overall_Shapes" } });

  return sections;
}

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
      console.warn("skip invalid json:", filePath);
      continue;
    }

    // Each file expected to have a single top-level key (e.g. "Head", "Face")
    Object.keys(json).forEach(topKey => {
      const part = json[topKey];

      // If part has Subfeatures, iterate those as sub-categories; otherwise treat direct keys as subfeatures
      const subfeatures = (part && part.Subfeatures && typeof part.Subfeatures === "object") ? part.Subfeatures : (() => {
        // If the file already uses the flat style (e.g., part.Size at top), convert to a single subfeature named topKey
        // so the UI displays one subfeature box for that file.
        const fallback = {};
        // include Size/Shape/Descriptors_... if present at top level
        fallback[topKey] = {};
        ["Size","Shape","Descriptors_Anatomical","Descriptors_Animated","Descriptors_General","Overall_Shapes","Subfeatures"].forEach(k=>{
          if (part[k] !== undefined) fallback[topKey][k] = part[k];
        });
        return fallback;
      })();

      // For each subfeature (like "Forehead", "Temples", or the fallback single subKey)
      Object.keys(subfeatures).forEach(subKey => {
        const subpart = subfeatures[subKey];
        const sections = buildSectionsFromSubpart(subpart || {});
        // Only push if sections exist (keeps empty parts out)
        if (sections.length) {
          groupResult.categories.push({
            category: topKey,      // "Head", "Face", etc.
            subfeature: subKey,    // "Forehead", "Cheeks", or topKey fallback
            sections                // array of {title, features, meta}
          });
        }
      });
    });
  }

  return groupResult;
}

async function loadGlossary() {
  const base = "./data/";
  const groups = [
    { name: "Female Anatomy", index: base + "female_anatomy/female_anatomy_index.json", basePath: base + "female_anatomy/" },
    { name: "Male Anatomy",   index: base + "male_anatomy/male_anatomy_index.json",     basePath: base + "male_anatomy/"   }
  ];

  const finalGlossary = [];

  for (const g of groups) {
    const groupData = await loadGroup(g.index, g.basePath, g.name);
    finalGlossary.push(groupData);
  }

  console.log("Glossary loaded", finalGlossary);
  if (typeof initGlossary === "function") initGlossary(finalGlossary);

  // allow UI to init ratio area after data rendered
  setTimeout(()=>{ if (typeof initRatioSection === "function") initRatioSection(); }, 200);
}

// Fire
document.addEventListener("DOMContentLoaded", loadGlossary);
