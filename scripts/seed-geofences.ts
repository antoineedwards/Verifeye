// scripts/seed-geofences.ts
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import osmtogeojson from "osmtogeojson";

config({ path: ".env.local" });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedMontgomeryGeofences() {
    console.log("🚀 Starting Bulk Geofence Seed...");

    // 1. Optimized Query: Fetch EVERYTHING that looks like a neighborhood
    // We avoid regex searches here to prevent 504 Timeouts.
    const query = `
    [out:json][timeout:60];
    area[name="Montgomery"][admin_level=8]->.searchArea;
    (
      // Get all official neighborhoods, suburbs, and historic districts
      relation["place"~"neighbourhood|suburb|quarter"](area.searchArea);
      relation["boundary"="historic"](area.searchArea);
      // Also get ways (simpler polygons)
      way["place"~"neighbourhood|suburb|quarter"](area.searchArea);
    );
    out geom;
  `;

    const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    console.log("📡 Fetching all neighborhood data...");

    try {
        const response = await fetch(osmUrl, {
            headers: {
                // REQUIRED: Identification header to avoid 429 blocks
                "User-Agent": "Verifeye-App-Seeder/1.0 (edu-project)"
            }
        });

        if (response.status === 429) {
            throw new Error("Rate Limited (429). Please wait 5 minutes before running again.");
        }
        if (!response.ok) {
            throw new Error(`Overpass Error: ${response.status} ${response.statusText}`);
        }

        const osmData = await response.json();
        console.log(`✅ Downloaded ${osmData.elements.length} raw elements.`);

        const geojson = osmtogeojson(osmData);
        console.log(`🗺️  Parsed ${geojson.features.length} total polygons.`);

        // 2. Local Filter: Now WE decide what to keep
        const targetNeighborhoods = [
            "Cloverdale",
            "Idlewild",
            "Centennial Hill",
            "Forest Park",
            "Garden District",
            "Old Cloverdale",
            "Capitol Heights"
        ];

        let importedCount = 0;

        for (const feature of geojson.features) {
            const name = feature.properties?.name;
            const type = feature.geometry?.type;

            // Skip invalid shapes
            if (!name || (type !== 'Polygon' && type !== 'MultiPolygon')) continue;

            // 3. Fuzzy Match: Check if the name contains any of our targets
            const isMatch = targetNeighborhoods.some(target =>
                name.toLowerCase().includes(target.toLowerCase())
            );

            if (isMatch) {
                console.log(`   Processing: ${name}...`);

                const { error } = await supabase.rpc("import_geofence", {
                    f_name: name,
                    f_type: feature.properties?.place || "neighborhood",
                    f_geom_json: JSON.stringify(feature.geometry),
                });

                if (error) {
                    console.error(`   ❌ Failed to save ${name}:`, error.message);
                } else {
                    console.log(`   ✨ Saved: ${name}`);
                    importedCount++;
                }
            }
        }

        console.log(`\n🏁 Done! Successfully imported ${importedCount} priority neighborhoods.`);

    } catch (err: any) {
        console.error("💥 Script Failed:", err.message);
    }
}

seedMontgomeryGeofences();