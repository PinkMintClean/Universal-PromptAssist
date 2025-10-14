// ===== Load All Glossary Files (JSON) =====
async function loadGlossary() {
  const files = [
    "data/female_anatomy.json",
    "data/male_anatomy.json",
    "data/micro_features.json",
    "data/style_features.json",
    "data/technical_features.json"
  ];

  try {
    // Fetch and parse all glossary data
    const responses = await Promise.all(files.map(f => fetch(f)));
    const data = await Promise.all(responses.map(r => r.json()));

    // Flatten all data into one array
    const glossary = data.flat();

    console.log("✅ Glossary loaded successfully:", glossary);

    // Initialize display
    if (typeof initGlossary === "function") {
      initGlossary(glossary);
    } else {
      console.warn("⚠️ initGlossary function not found — check script.js");
    }

  } catch (err) {
    console.error("❌ Error loading glossary files:", err);
  }
}

// Run on page load
document.addEventListener("DOMContentLoaded", loadGlossary);
