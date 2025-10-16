let glossary = [];

// ===== Load Individual Body-Part JSON Files =====
async function loadGlossaryFiles(paths) {
  const glossaryArray = [];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
      const json = await res.json();

      // Transform JSON object to array format for initGlossary
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
      console.error("❌ Failed to load JSON:", err);
    }
  }

  glossary = glossaryArray;
  console.log("✅ Glossary loaded successfully:", glossary);

  if (typeof initGlossary === "function") initGlossary(glossary);
}

// ===== Example: Load Female Anatomy Only =====
document.addEventListener("DOMContentLoaded", () => {
  loadGlossaryFiles([
    "/Universal-PromptAssist/data/female_anatomy/shoulders.json",
    "/Universal-PromptAssist/data/female_anatomy/biceps.json"
    // add more files here
  ]);
});
