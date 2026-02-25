// app/actions/geofence-importer.ts
"use server"
import osmtogeojson from 'osmtogeojson';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function seedMontgomeryGeofences() {
  // 1. Overpass Query for Montgomery neighborhoods
  const query = `
    [out:json][timeout:25];
    area[name="Montgomery"][admin_level=8]->.searchArea;
    (
      relation["boundary"="administrative"]["name"~"Cloverdale|Centennial Hill|Forest Park"](area.searchArea);
    );
    out geom;
  `;
  
  const osmUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const response = await fetch(osmUrl);
  const osmData = await response.json();

  // 2. Convert OSM format to GeoJSON
  const geojson = osmtogeojson(osmData);

  // 3. Loop through features and save to Supabase
  for (const feature of geojson.features) {
    const name = feature.properties?.name || "Unknown Neighborhood";
    
    const { error } = await supabase.rpc('import_geofence', {
      f_name: name,
      f_type: 'neighborhood',
      f_geom_json: JSON.stringify(feature.geometry)
    });

    if (error) console.error(`Error importing ${name}:`, error.message);
  }

  return { success: true };
}