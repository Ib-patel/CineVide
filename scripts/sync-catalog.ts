import { tmdbProvider } from "../src/server/catalog/tmdb";
import { syncCatalog } from "../src/server/catalog/sync";

async function main() {
  console.log("=== Cinevide Catalog Synchronization ===");
  console.log("Syncing metadata from TMDB provider...");

  const result = await syncCatalog(tmdbProvider);

  console.log(`Synchronization finished:`);
  console.log(`- Inserted: ${result.inserted}`);
  console.log(`- Updated:  ${result.updated}`);
  console.log(`- Failed:   ${result.failed}`);

  if (result.errors.length > 0) {
    console.error("Errors encountered:");
    result.errors.forEach((err) => console.error(`  * ${err}`));
  }
}

main()
  .catch((err) => {
    console.error("Sync script fatal error:", err);
    process.exit(1);
  });
