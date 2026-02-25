// scripts/seed-asu.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import osmtogeojson from "osmtogeojson";

config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

async function seedASU() {
  console.log("🚀 Starting ASU Campus Seed...");

  // 1. Specific Query for Alabama State University
  // We look for the main campus boundary (amenity=university)
  const query = `
    [out:json][timeout:60];
    area[name="Montgomery"][admin_level=8]->.searchArea;
    (
      way["name"="Alabama State University"]["amenity"="university"](area.searchArea);
      relation["name"="Alabama State University"]["amenity"="university"](area.searchArea);
    );
    out geom;
  `;

  const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(osmUrl, {
      headers: { "User-Agent": "Verifeye-App-Seeder/1.0" }
    });

    if (!response.ok) throw new Error(`Overpass Error: ${response.statusText}`);

    const osmData = await response.json();
    const geojson = osmtogeojson(osmData);

    console.log(`📍 Found ${geojson.features.length} campus boundaries.`);

    for (const feature of geojson.features) {
      const name = feature.properties?.name;
      
      // Ensure it is a Polygon (Area), not just a point
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        
        console.log(`   Importing: ${name}...`);

        const { error } = await supabase.rpc("import_geofence", {
          f_name: name,
          f_type: "university", // Tagging it differently than 'neighborhood'
          f_geom_json: JSON.stringify(feature.geometry),
        });

        if (error) console.error(`   ❌ Error:`, error.message);
        else console.log(`   ✅ Success! ASU is now a geofence.`);
        
      } else {
        console.log(`   ⚠️ Skipping ${name} (Not a polygon shape)`);
      }
    }

  } catch (err) {
    console.error("💥 Error:", err);
  }
}

seedASU();
