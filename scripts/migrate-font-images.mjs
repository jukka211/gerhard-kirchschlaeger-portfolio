// One-off migration: flattens fontsPage.columns.{left,middle,right} into a
// single fontsPage.images array (dropping marginTopVh/marginBottomVh, which
// no longer exist on fontImageItem).
//
// Run once with: npx sanity exec scripts/migrate-font-images.mjs --with-user-token
import { getCliClient } from "sanity/cli";

const client = getCliClient();

const doc = await client.fetch(`*[_type == "fontsPage"][0]{_id, columns}`);

if (!doc) {
  console.log("No fontsPage document found, nothing to migrate.");
  process.exit(0);
}

if (!doc.columns) {
  console.log("No columns field on fontsPage, nothing to migrate.");
  process.exit(0);
}

const images = [
  ...(doc.columns.left ?? []),
  ...(doc.columns.middle ?? []),
  ...(doc.columns.right ?? []),
].map(({ marginTopVh, marginBottomVh, ...item }) => item);

console.log(`Migrating ${images.length} images into fontsPage.images...`);

await client.patch(doc._id).set({ images }).unset(["columns"]).commit();

console.log("Done.");
