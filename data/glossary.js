// glossary.js - loads multiple JSON data files (graceful on missing files)
const GLOSSARY_FILES = [
  "data/female.json",
  "data/male.json",
  "data/universal.json",
  "data/style.json",
  "data/scene.json",
  "data/ratios.json",
  // include legacy names if you have them
  "data/head.json",
  "data/eyes.json",
  "data/hair.json",
  "data/body.json",
  "data/makeup.json",
  "data/nails.json"
];

let glossaryData = []; // merged categories

async function loadGlossaryFiles(list = GLOSSARY_FILES) {
  const fetches = list.map(url =>
    fetch(url).then(async res => {
      if (!res.ok) {
        // Not found or other error -> gracefully ignore
        console.warn(`glossary.js: could not load ${url} — ${res.status}`);
        return null;
      }
      try {
        return await res.json();
      } catch (err) {
        console.error(`glossary.js: invalid JSON in ${url}`, err);
        return null;
      }
    }).catch(err => {
      console.warn(`glossary.js: fetch failed for ${url}`, err);
      return null;
    })
  );

  const results = await Promise.all(fetches);
  // Flatten arrays and ignore nulls
  glossaryData = results.filter(Boolean).flat();
  console.info("✅ Glossary loaded successfully:", glossaryData);
  // Fire global initializer if available
  if (typeof initApp === "function") {
    initApp(glossaryData);
  }
}

// load after DOM ready if not loaded by script defer
document.addEventListener("DOMContentLoaded", () => {
  loadGlossaryFiles();
});
