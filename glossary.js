// glossary.js

let glossary = [];

// ===== Load All Glossary Files =====
async function loadGlossary() {
  const files = [
    "./data/female_anatomy.json",
    "./data/male_anatomy.json"
  ];

  try {
    // Fetch and parse each file
    const responses = await Promise.all(files.map(path => fetch(path)));
    const data = await Promise.all(responses.map(r => {
      if (!r.ok) throw new Error(`Failed to load ${r.url}`);
      return r.json();
    }));

    // Merge all arrays
    glossary = data.flat();
    console.log("✅ Glossary loaded successfully:", glossary);

    // Initialize the glossary if your UI function exists
    if (typeof initGlossary === "function") initGlossary(glossary);
  } catch (err) {
    console.error("❌ Error loading glossary files:", err);
  }
}

// Load when ready
document.addEventListener("DOMContentLoaded", loadGlossary);
