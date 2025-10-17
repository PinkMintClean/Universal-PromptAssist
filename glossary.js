// glossary.js

let glossary = [];

// ====== Core Loader Function ======
async function loadGlossaryFiles(paths) {
  const glossaryArray = [];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${path}`);
      const json = await res.json();

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

    } catch (err) {
      console.error("❌ Failed to load:", path, err);
    }
  }

  glossary = glossaryArray;
  console.log("✅ Glossary loaded successfully:", glossary);

  if (typeof initGlossary === "function") initGlossary(glossary);
}

// ====== Universal Index Loader ======
async function loadGlossaryFromIndex(folder) {
  try {
    const indexPath = `/Universal-PromptAssist/data/${folder}/${folder}_index.json`;
    const indexRes = await fetch(indexPath);
    if (!indexRes.ok) throw new Error(`Failed to load index: ${indexPath}`);

    const { files } = await indexRes.json();
    const filePaths = files.map(f => `/Universal-PromptAssist/data/${folder}/${f}`);
    await loadGlossaryFiles(filePaths);

  } catch (err) {
    console.error(`❌ Could not load ${folder}_index.json:`, err);
  }
}

// ====== Run Automatically on Page Load ======
document.addEventListener("DOMContentLoaded", async () => {
  await loadGlossaryFromIndex("female_anatomy");
  // later you can easily add:
  // await loadGlossaryFromIndex("male_anatomy");
});
