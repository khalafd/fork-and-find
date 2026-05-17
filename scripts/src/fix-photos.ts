import { db } from '@workspace/db';
import { restaurants } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';

const restaurantPhotos: Record<string, string> = {
  'Myazu': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=600',
  'Rodeo Steakhouse': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
  'Lusin': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
  'Biella': 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=600',
  'Fusions': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600',
  'Al Nakheel': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600',
  'Hakkasan': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600',
  "Carluccio's": 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600',
  'Nozomi': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
  'Maki': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600',
  'Burger Boutique': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600',
  'Ketch Up': 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600',
  'Smoke & Barrel': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600',
  'Maharaja': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
  'Spice Market': 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=600',
  'Bosphorus': 'https://images.unsplash.com/photo-1530648672449-81f6c723e2f1?w=600',
  'Crepaway': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600',
  'Sushi Masa': 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600',
  'Cantuccio': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
  'The Meat Co.': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600',
  'Zahrat Lebnan': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
  'Leila': 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600',
  'Elevation Burger': 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600',
  'Sakura': 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600',
  'Shawarmer': 'https://images.unsplash.com/photo-1561050501-a2b4e33e8d96?w=600',
  'Tutto Bello': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
  'Shrimp House': 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=600',
  'Couqley': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
  'Peppermill': 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600',
  'Sakab': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
};

async function run() {
  for (const [name, photoUrl] of Object.entries(restaurantPhotos)) {
    await db.update(restaurants)
      .set({ photoUrl })
      .where(eq(restaurants.name, name));
    console.log('Updated:', name);
  }
  console.log('Done.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
