// Dynamically import mermaid as an ES module
let mermaid;
(async () => {
  mermaid = (await import("https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs")).default;
  mermaid.initialize({ startOnLoad: false });
})();

    // --- Helpers ---
    function normalize(text) 
    {
      return text.replace(/^(each|every|any|a|an)\s+/gi, "").trim();
    }

    function safeName(name) 
    {
      let n = name.replace(/[^A-Za-z0-9_]/g, "_");
      return n.charAt(0).toUpperCase() + n.slice(1);
    }

    // --- Convert business rules to Mermaid ER ---
    function parseRules(text) 
    {
      // Split input by periods, then trim and filter empty strings
      let lines = text.split('.').map(l => l.trim()).filter(l => l.length > 0);
      const entities = {};
      const relationships = [];

      lines.forEach(line => 
      {
        line = normalize(line);

        // Entity with attributes
        if (line.match(/ has /i)) 
        {
          let [entity, attrs] = line.split(/ has /i);
          entity = safeName(entity);
          attrs = attrs.split(",").map(a => a.trim());
          if (!entities[entity]) entities[entity] = new Set();
          attrs.forEach(a => entities[entity].add(a));
        }

        // Parse relationships: must / can
        let relMatch = line.match(/^(.*)\s+(must|can)\s+(.*)$/i);
        if (relMatch) 
        {
          let e1 = safeName(relMatch[1].trim());
          let keyword = relMatch[2].toLowerCase(); // must / can
          let rest = relMatch[3].trim();

          // Determine cardinality
          let type = rest.includes("many") ? "one-to-many" : "one-to-one";

          // Extract multi-word verb between must/can and one/many
          let verbMatch = rest.match(/^(.*?)\s+(one|many)\s+(.*)$/i);
          let verb = verbMatch ? verbMatch[1].trim().replace(/\s+/g, "_") : "relates_to";
          let rawName = verbMatch[3].trim();

          // Handle plural to singular
          if (rawName.endsWith("ies")) 
          {
            rawName = rawName.slice(0, -3) + "y"; // Enemies -> Enemy
          } 
          else if (rawName.endsWith("s")) 
          {
            rawName = rawName.slice(0, -1); // Players -> Player
          }

          let e2 = safeName(rawName);
          relationships.push([e1, e2, type, keyword, verb]);
        }
      });

      return { entities, relationships };
    }

    // --- Generate Mermaid text ---
    function generateMermaid(entities, relationships) 
    {
      let txt = "erDiagram\n";

      // Entities
      Object.entries(entities).forEach(([e, attrs]) => 
      {
          txt += `  ${e} {\n`;

        if (attrs.size === 0) 
        {
            txt += `    string placeholder\n`;
        } 
        else 
        {
          attrs.forEach(a => 
          {
            let safeAttr = a.replace(/[^A-Za-z0-9_]/g, "_");
              txt += `    string ${safeAttr}\n`;
          });
        }

          txt += `  }\n`;
      });

      // Relationships
      relationships.forEach(([e1, e2, type, keyword, verb]) => 
      {
        let symbol = "";

        if (type === "one-to-many") 
        {
          symbol = (keyword === "must") ? "||--o{" : "o|--o{";
        } 
        else 
        {
          symbol = (keyword === "must") ? "||--||" : "o|--||";
        }

          txt += `  ${e1} ${symbol} ${e2} : ${verb}\n`;
      });

      return txt;
    }

    // --- Main ---
    async function generateERD() 
    {
      const input = document.getElementById("rules").value;
      const { entities, relationships } = parseRules(input);
      const mermaidText = generateMermaid(entities, relationships);

      document.getElementById("raw").textContent = mermaidText;

      const container = document.getElementById("diagram");
      container.innerHTML = "";

      try 
      {
        const { svg } = await mermaid.render('erdSvg', mermaidText);
        container.innerHTML = svg;
      } 
      catch (err) 
      {
        console.error("Mermaid render failed:", err);
        alert("Mermaid error: " + (err.message || err));
      }
    }

    window.generateERD = generateERD;
// Side drawer toggle
document.addEventListener("DOMContentLoaded", () => {
  const drawerBtn = document.getElementById("drawerToggle");
  const sideDrawer = document.getElementById("sideDrawer");

  console.log("drawerBtn:", drawerBtn);
  console.log("sideDrawer:", sideDrawer);

  if (drawerBtn && sideDrawer) {
    drawerBtn.addEventListener("click", () => {
      console.log("Button clicked!");
      sideDrawer.classList.toggle("active");
    });
  } else {
    console.error("Drawer button or drawer not found in DOM");
  }
});
