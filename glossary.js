// =============================
// 📘 Universal PromptAssist — Glossary Loader
// =============================

let glossary = [];

// ===== Main Load Function =====
async function loadGlossary() {
  const indexPath = "./data/female_anatomy/female_anatomy_index.json";
  const basePath = "./data/female_anatomy/";

  try {
    const indexRes = await fetch(indexPath);
    if (!indexRes.ok) throw new Error(`Could not load ${indexPath}`);
    const indexData = await indexRes.json();

    if (!indexData.files || !Array.isArray(indexData.files)) {
      throw new Error("Invalid index structure — missing 'files' array");
    }

    console.log(`📁 Found ${indexData.files.length} files in index:`, indexData.files);

    const glossaryArray = [];

    // Loop through each JSON file in the index
    for (const filename of indexData.files) {
      const path = basePath + filename;
      try {
        const res = await fetch(path);
        if (!res.ok) {
          console.warn(`⚠️ Skipped missing file: ${path}`);
          continue;
        }
        const json = await res.json();

        // Convert JSON structure to UI-friendly array
        Object.keys(json).forEach(key => {
          const part = json[key];
          const sections = [];

          if (part.Size) sections.push({ title: "Size", features: Object.keys(part.Size) });
          if (part.Tone) sections.push({ title: "Tone", features: Object.keys(part.Tone) });
          if (part.Peak_Height) sections.push({ title: "Peak Height", features: Object.keys(part.Peak_Height) });
          if (part.Overall_Shapes) sections.push({ title: "Overall Shapes", features: part.Overall_Shapes });
          if (part.Descriptors_General) sections.push({ title: "General Descriptors", features: part.Descriptors_General });

          glossaryArray.push({ category: key, sections });
        });

        console.log(`✅ Loaded: ${filename}`);
      } catch (err) {
        console.warn(`❌ Failed to parse ${filename}:`, err);
      }
    }

    glossary = glossaryArray;

    if (!glossary.length) {
      console.warn("⚠️ No glossary data found after processing index.");
    } else {
      console.log("✅ Glossary loaded successfully:", glossary);
    }

    // Initialize UI
    if (typeof initGlossary === "function") {
      initGlossary(glossary);
    } else {
      console.error("❌ initGlossary() not found — check script load order in index.html");
    }

  } catch (err) {
    console.error(`❌ Could not load female_anatomy_index.json:`, err);
  }
}

// ===== Run When Ready =====
document.addEventListener("DOMContentLoaded", loadGlossary);
