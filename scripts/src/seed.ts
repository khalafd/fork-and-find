import { db, restaurants, dishes, adminSettings } from "@workspace/db";

const NEW_SYSTEM_PROMPT = `You are a dining advisor for Al Khobar and Dammam. You have deep knowledge of every restaurant in the area. Your job is to make a confident specific recommendation immediately — do not ask multiple questions. If someone says 'I want sushi', name the best sushi place, the dish to order, and why in 2 sentences. If someone is vague, pick the most likely interpretation and recommend confidently. Only ask one follow-up question maximum, and only if truly needed. Never say curated, evidence level, or based on our data. Be like a well-travelled friend who knows every table in town.`;

const data = [
  {
    restaurant: {
      name: "Myazu",
      city: "Al Khobar", district: "Corniche",
      cuisine: "Japanese", priceRange: "$$$",
      latitude: 26.3062, longitude: 50.2108,
      googleMapsUrl: "https://maps.google.com/?q=Myazu+Al+Khobar",
      instagramUrl: "https://www.instagram.com/myazuksa/",
      photoUrl: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=600",
      reviewConsensusSummary: "Top-tier Japanese in the Eastern Province. Omakase counter is the move.",
      evidenceLevel: "strong", bestFor: "date,fine dining", isFeatured: true,
      strengths: "Exceptional omakase, fresh daily fish", weaknesses: "Book ahead",
    },
    dishes: [
      { name: "Omakase Set", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600" },
      { name: "Wagyu Nigiri", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600" },
      { name: "Tuna Tartare", category: "starter", evidenceLevel: "moderate", recommendationScore: 8, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Rodeo Steakhouse",
      city: "Al Khobar", district: "Tahlia Street",
      cuisine: "Steakhouse", priceRange: "$$$",
      latitude: 26.3055, longitude: 50.1978,
      googleMapsUrl: "https://maps.google.com/?q=Rodeo+Steakhouse+Al+Khobar",
      instagramUrl: "https://www.instagram.com/rodeoksa/",
      photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
      reviewConsensusSummary: "Best steaks in Khobar. Tomahawk is legendary.",
      evidenceLevel: "strong", bestFor: "group,business", isFeatured: true,
      strengths: "Prime beef, great atmosphere", weaknesses: "Busy weekends",
    },
    dishes: [
      { name: "Tomahawk Steak", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600" },
      { name: "Dry-aged Ribeye", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=600" },
      { name: "Truffle Fries", category: "starter", evidenceLevel: "moderate", recommendationScore: 7, photoUrl: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Lusin",
      city: "Al Khobar", district: "Al Hamra",
      cuisine: "Armenian", priceRange: "$$",
      latitude: 26.2980, longitude: 50.2150,
      googleMapsUrl: "https://maps.google.com/?q=Lusin+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
      reviewConsensusSummary: "Outstanding mezze and Armenian-Lebanese food. A hidden gem.",
      evidenceLevel: "moderate", bestFor: "date,family", isFeatured: false,
      strengths: "Unique cuisine, relaxed atmosphere", weaknesses: "Limited hours",
    },
    dishes: [
      { name: "Mixed Mezze", category: "starter", evidenceLevel: "strong", recommendationScore: 9, dietTags: "vegetarian", photoUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600" },
      { name: "Lamb Kebab", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1530469912745-a215c6b256ea?w=600" },
      { name: "Baklava", category: "dessert", evidenceLevel: "moderate", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1598110750624-2e80e54f4e0f?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Biella",
      city: "Al Khobar", district: "Rashid Mall",
      cuisine: "Italian", priceRange: "$$",
      latitude: 26.3421, longitude: 50.1876,
      googleMapsUrl: "https://maps.google.com/?q=Biella+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=600",
      reviewConsensusSummary: "Reliable Italian. Wood-fired pizza is always good.",
      evidenceLevel: "moderate", bestFor: "family,casual", isFeatured: false,
      strengths: "Consistent, family friendly", weaknesses: "Nothing surprising",
    },
    dishes: [
      { name: "Truffle Pizza", category: "main", evidenceLevel: "strong", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600" },
      { name: "Tiramisu", category: "dessert", evidenceLevel: "strong", recommendationScore: 9, photoUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Fusions",
      city: "Al Khobar", district: "Prince Turki Street",
      cuisine: "Asian Fusion", priceRange: "$$$",
      latitude: 26.3198, longitude: 50.1654,
      googleMapsUrl: "https://maps.google.com/?q=Fusions+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600",
      reviewConsensusSummary: "Creative Asian fusion. Black cod miso is unmissable.",
      evidenceLevel: "moderate", bestFor: "date,casual", isFeatured: false,
      strengths: "Creative menu, great vibe", weaknesses: "Inconsistent service",
    },
    dishes: [
      { name: "Black Cod Miso", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600" },
      { name: "Wagyu Dumplings", category: "starter", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600" },
      { name: "Matcha Cheesecake", category: "dessert", evidenceLevel: "moderate", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Al Nakheel",
      city: "Dammam", district: "Corniche",
      cuisine: "Saudi", priceRange: "$$",
      latitude: 26.4367, longitude: 50.1033,
      googleMapsUrl: "https://maps.google.com/?q=Al+Nakheel+Dammam",
      photoUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600",
      reviewConsensusSummary: "Authentic Saudi on the Dammam corniche. Kabsa is the real deal.",
      evidenceLevel: "strong", bestFor: "family,group", isFeatured: true,
      strengths: "Authentic flavours, sea view", weaknesses: "Service slow",
    },
    dishes: [
      { name: "Lamb Kabsa", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600" },
      { name: "Jareesh", category: "main", evidenceLevel: "strong", recommendationScore: 9, photoUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600" },
      { name: "Mutabbaq", category: "starter", evidenceLevel: "moderate", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Hakkasan",
      city: "Al Khobar", district: "Corniche",
      cuisine: "Chinese", priceRange: "$$$$",
      latitude: 26.3089, longitude: 50.2134,
      googleMapsUrl: "https://maps.google.com/?q=Hakkasan+Al+Khobar",
      instagramUrl: "https://www.instagram.com/hakkasan/",
      photoUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600",
      reviewConsensusSummary: "Fine Chinese dining. Peking duck and dim sum are exceptional.",
      evidenceLevel: "strong", bestFor: "date,business,fine dining", isFeatured: true,
      strengths: "World-class dim sum, stunning interior", weaknesses: "Very pricey",
    },
    dishes: [
      { name: "Peking Duck", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600" },
      { name: "Har Gaw Dim Sum", category: "starter", evidenceLevel: "strong", recommendationScore: 9, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Carluccio's",
      city: "Al Khobar", district: "Al Rashid Mall",
      cuisine: "Italian", priceRange: "$$",
      latitude: 26.3445, longitude: 50.1901,
      googleMapsUrl: "https://maps.google.com/?q=Carluccios+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600",
      reviewConsensusSummary: "Casual Italian all-day dining. Great pasta and coffee.",
      evidenceLevel: "moderate", bestFor: "casual,family", isFeatured: false,
      strengths: "All-day menu, good coffee", weaknesses: "Can get crowded",
    },
    dishes: [
      { name: "Cacio e Pepe", category: "main", evidenceLevel: "strong", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600" },
      { name: "Panna Cotta", category: "dessert", evidenceLevel: "moderate", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Nozomi",
      city: "Al Khobar", district: "Prince Faisal Street",
      cuisine: "Japanese", priceRange: "$$$",
      latitude: 26.3145, longitude: 50.1823,
      googleMapsUrl: "https://maps.google.com/?q=Nozomi+Al+Khobar",
      instagramUrl: "https://www.instagram.com/nozomirestaurant/",
      photoUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
      reviewConsensusSummary: "Chic Japanese with a great social scene. Spider roll is iconic.",
      evidenceLevel: "strong", bestFor: "date,group,social", isFeatured: true,
      strengths: "Great atmosphere, reliable sushi", weaknesses: "Loud on weekends",
    },
    dishes: [
      { name: "Spider Roll", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1617196034099-2a4e1e6a1c8d?w=600" },
      { name: "Black Truffle Edamame", category: "starter", evidenceLevel: "strong", recommendationScore: 8, dietTags: "vegetarian", photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Maki",
      city: "Al Khobar", district: "Olaya",
      cuisine: "Japanese", priceRange: "$$",
      latitude: 26.3201, longitude: 50.1745,
      googleMapsUrl: "https://maps.google.com/?q=Maki+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600",
      reviewConsensusSummary: "Casual sushi spot with a loyal following. Great value.",
      evidenceLevel: "moderate", bestFor: "casual,group", isFeatured: false,
      strengths: "Good value, fresh sushi", weaknesses: "No reservations",
    },
    dishes: [
      { name: "Rainbow Roll", category: "main", evidenceLevel: "strong", recommendationScore: 8, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600" },
      { name: "Miso Soup", category: "starter", evidenceLevel: "moderate", recommendationScore: 7, photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Burger Boutique",
      city: "Al Khobar", district: "Tahlia",
      cuisine: "Burgers", priceRange: "$",
      latitude: 26.3178, longitude: 50.1912,
      googleMapsUrl: "https://maps.google.com/?q=Burger+Boutique+Al+Khobar",
      instagramUrl: "https://www.instagram.com/burgerboutiquesa/",
      photoUrl: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600",
      reviewConsensusSummary: "Best smash burger in Khobar. Simple, fast, addictive.",
      evidenceLevel: "strong", bestFor: "casual,quick", isFeatured: false,
      strengths: "Perfect smash patty, crispy edges", weaknesses: "No table service",
    },
    dishes: [
      { name: "Double Smash Burger", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600" },
      { name: "Loaded Fries", category: "starter", evidenceLevel: "strong", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Ketch Up",
      city: "Al Khobar", district: "Corniche",
      cuisine: "Burgers", priceRange: "$",
      latitude: 26.3098, longitude: 50.2045,
      googleMapsUrl: "https://maps.google.com/?q=Ketch+Up+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=600",
      reviewConsensusSummary: "Fun burger spot on the corniche. Great for casual nights.",
      evidenceLevel: "moderate", bestFor: "casual,family", isFeatured: false,
      strengths: "Great location, good burgers", weaknesses: "Can be crowded",
    },
    dishes: [
      { name: "Classic Cheeseburger", category: "main", evidenceLevel: "strong", recommendationScore: 8, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Smoke & Barrel",
      city: "Al Khobar", district: "Al Hamra",
      cuisine: "BBQ", priceRange: "$$",
      latitude: 26.3021, longitude: 50.1989,
      googleMapsUrl: "https://maps.google.com/?q=Smoke+Barrel+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600",
      reviewConsensusSummary: "American BBQ done right. Brisket is smoked for 14 hours.",
      evidenceLevel: "strong", bestFor: "group,casual", isFeatured: false,
      strengths: "Proper smoke ring, tender brisket", weaknesses: "Sells out early",
    },
    dishes: [
      { name: "Smoked Brisket", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600" },
      { name: "BBQ Ribs", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Maharaja",
      city: "Al Khobar", district: "Prince Faisal",
      cuisine: "Indian", priceRange: "$$",
      latitude: 26.3267, longitude: 50.1834,
      googleMapsUrl: "https://maps.google.com/?q=Maharaja+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600",
      reviewConsensusSummary: "Best Indian in Khobar. Butter chicken and naan are perfection.",
      evidenceLevel: "strong", bestFor: "family,casual", isFeatured: false,
      strengths: "Authentic spices, generous portions", weaknesses: "Parking difficult",
    },
    dishes: [
      { name: "Butter Chicken", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600" },
      { name: "Garlic Naan", category: "starter", evidenceLevel: "strong", recommendationScore: 9, dietTags: "vegetarian", photoUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600" },
      { name: "Gulab Jamun", category: "dessert", evidenceLevel: "moderate", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Spice Market",
      city: "Al Khobar", district: "Olaya",
      cuisine: "Thai", priceRange: "$$",
      latitude: 26.3312, longitude: 50.1756,
      googleMapsUrl: "https://maps.google.com/?q=Spice+Market+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=600",
      reviewConsensusSummary: "Thai food that delivers real heat. Pad Thai and green curry stand out.",
      evidenceLevel: "moderate", bestFor: "casual,date", isFeatured: false,
      strengths: "Authentic flavours, good spice levels", weaknesses: "Small space",
    },
    dishes: [
      { name: "Green Curry", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600" },
      { name: "Pad Thai", category: "main", evidenceLevel: "strong", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Bosphorus",
      city: "Al Khobar", district: "Corniche",
      cuisine: "Turkish", priceRange: "$$",
      latitude: 26.3045, longitude: 50.2089,
      googleMapsUrl: "https://maps.google.com/?q=Bosphorus+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1530648672449-81f6c723e2f1?w=600",
      reviewConsensusSummary: "Turkish classics with a view. Mixed grill and mezes are excellent.",
      evidenceLevel: "moderate", bestFor: "family,group", isFeatured: false,
      strengths: "Great view, generous mixed grill", weaknesses: "Service inconsistent",
    },
    dishes: [
      { name: "Mixed Grill Platter", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600" },
      { name: "Hummus & Bread", category: "starter", evidenceLevel: "strong", recommendationScore: 8, dietTags: "vegetarian", photoUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Crepaway",
      city: "Al Khobar", district: "Tahlia",
      cuisine: "French", priceRange: "$",
      latitude: 26.3156, longitude: 50.1867,
      googleMapsUrl: "https://maps.google.com/?q=Crepaway+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
      reviewConsensusSummary: "Crepes for every mood. Sweet or savoury, always satisfying.",
      evidenceLevel: "moderate", bestFor: "casual,family", isFeatured: false,
      strengths: "Great variety, affordable", weaknesses: "Can feel busy",
    },
    dishes: [
      { name: "Nutella Banana Crepe", category: "dessert", evidenceLevel: "strong", recommendationScore: 9, photoUrl: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600" },
      { name: "Chicken Pesto Crepe", category: "main", evidenceLevel: "moderate", recommendationScore: 7, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Sushi Masa",
      city: "Al Khobar", district: "Yarmouk",
      cuisine: "Japanese", priceRange: "$$",
      latitude: 26.3234, longitude: 50.1698,
      googleMapsUrl: "https://maps.google.com/?q=Sushi+Masa+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600",
      reviewConsensusSummary: "Neighbourhood sushi spot. Fresh rolls at fair prices.",
      evidenceLevel: "moderate", bestFor: "casual,date", isFeatured: false,
      strengths: "Fresh fish, reasonable prices", weaknesses: "Limited seating",
    },
    dishes: [
      { name: "Dragon Roll", category: "main", evidenceLevel: "strong", recommendationScore: 8, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1617196034096-4a5c8e3c0ea4?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Cantuccio",
      city: "Al Khobar", district: "Al Hamra",
      cuisine: "Italian", priceRange: "$$",
      latitude: 26.2998, longitude: 50.2034,
      googleMapsUrl: "https://maps.google.com/?q=Cantuccio+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
      reviewConsensusSummary: "Cosy Italian trattoria feel. Carbonara and tiramisu are the highlights.",
      evidenceLevel: "moderate", bestFor: "date,casual", isFeatured: false,
      strengths: "Warm atmosphere, good pasta", weaknesses: "Small menu",
    },
    dishes: [
      { name: "Carbonara", category: "main", evidenceLevel: "strong", recommendationScore: 9, photoUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600" },
      { name: "Tiramisu", category: "dessert", evidenceLevel: "strong", recommendationScore: 9, photoUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600" },
    ],
  },
  {
    restaurant: {
      name: "The Meat Co.",
      city: "Al Khobar", district: "Corniche",
      cuisine: "Steakhouse", priceRange: "$$$",
      latitude: 26.3071, longitude: 50.2156,
      googleMapsUrl: "https://maps.google.com/?q=The+Meat+Co+Al+Khobar",
      instagramUrl: "https://www.instagram.com/themeatco/",
      photoUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600",
      reviewConsensusSummary: "South African steakhouse with great corniche views. Fillet is superb.",
      evidenceLevel: "strong", bestFor: "business,date,group", isFeatured: true,
      strengths: "Outstanding fillet, sea views", weaknesses: "Pricey starters",
    },
    dishes: [
      { name: "Fillet Steak", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600" },
      { name: "Calamari", category: "starter", evidenceLevel: "moderate", recommendationScore: 7, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Zahrat Lebnan",
      city: "Al Khobar", district: "Prince Faisal",
      cuisine: "Lebanese", priceRange: "$$",
      latitude: 26.3289, longitude: 50.1812,
      googleMapsUrl: "https://maps.google.com/?q=Zahrat+Lebnan+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600",
      reviewConsensusSummary: "Authentic Lebanese with the best mixed grill in town.",
      evidenceLevel: "strong", bestFor: "family,group", isFeatured: false,
      strengths: "Authentic mezze, great mixed grill", weaknesses: "Parking tough",
    },
    dishes: [
      { name: "Mixed Grill", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600" },
      { name: "Fattoush", category: "starter", evidenceLevel: "strong", recommendationScore: 8, dietTags: "vegetarian", photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Leila",
      city: "Al Khobar", district: "Olaya",
      cuisine: "Lebanese", priceRange: "$$",
      latitude: 26.3334, longitude: 50.1723,
      googleMapsUrl: "https://maps.google.com/?q=Leila+Restaurant+Al+Khobar",
      instagramUrl: "https://www.instagram.com/leilarestaurants/",
      photoUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600",
      reviewConsensusSummary: "Modern Lebanese in a beautiful space. Great for groups.",
      evidenceLevel: "moderate", bestFor: "group,casual,date", isFeatured: false,
      strengths: "Beautiful interior, good mezze", weaknesses: "Slow on busy nights",
    },
    dishes: [
      { name: "Kibbeh", category: "starter", evidenceLevel: "strong", recommendationScore: 8, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1530648672449-81f6c723e2f1?w=600" },
      { name: "Grilled Halloumi", category: "starter", evidenceLevel: "strong", recommendationScore: 8, dietTags: "vegetarian", photoUrl: "https://images.unsplash.com/photo-1626202145930-9c08d89abad1?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Elevation Burger",
      city: "Al Khobar", district: "Yarmouk",
      cuisine: "Burgers", priceRange: "$",
      latitude: 26.3212, longitude: 50.1689,
      googleMapsUrl: "https://maps.google.com/?q=Elevation+Burger+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1586816001966-79b736744398?w=600",
      reviewConsensusSummary: "Organic beef burgers, guilt-free and delicious.",
      evidenceLevel: "moderate", bestFor: "casual,quick", isFeatured: false,
      strengths: "Organic beef, healthier option", weaknesses: "Limited menu",
    },
    dishes: [
      { name: "Elevation Burger", category: "main", evidenceLevel: "strong", recommendationScore: 8, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1550317138-10000687a72b?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Sakura",
      city: "Al Khobar", district: "Al Khobar Al Shamalia",
      cuisine: "Japanese", priceRange: "$$",
      latitude: 26.3378, longitude: 50.1934,
      googleMapsUrl: "https://maps.google.com/?q=Sakura+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600",
      reviewConsensusSummary: "Dependable Japanese with a warm neighbourhood feel.",
      evidenceLevel: "moderate", bestFor: "casual,family", isFeatured: false,
      strengths: "Friendly service, fresh sushi", weaknesses: "No omakase",
    },
    dishes: [
      { name: "Salmon Sashimi", category: "main", evidenceLevel: "strong", recommendationScore: 8, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Shawarmer",
      city: "Al Khobar", district: "Tahlia",
      cuisine: "Saudi", priceRange: "$",
      latitude: 26.3167, longitude: 50.1923,
      googleMapsUrl: "https://maps.google.com/?q=Shawarmer+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1561050501-a2b4e33e8d96?w=600",
      reviewConsensusSummary: "Best shawarma in the city. A local institution since 1999.",
      evidenceLevel: "strong", bestFor: "casual,quick,family", isFeatured: false,
      strengths: "Iconic shawarma, fast service, cheap", weaknesses: "No ambiance",
    },
    dishes: [
      { name: "Chicken Shawarma", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600" },
      { name: "Meat Shawarma", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Tutto Bello",
      city: "Al Khobar", district: "Corniche",
      cuisine: "Italian", priceRange: "$$$",
      latitude: 26.3034, longitude: 50.2112,
      googleMapsUrl: "https://maps.google.com/?q=Tutto+Bello+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600",
      reviewConsensusSummary: "Upscale Italian on the corniche. Fresh pasta and sea views.",
      evidenceLevel: "strong", bestFor: "date,business,fine dining", isFeatured: true,
      strengths: "Excellent pasta, beautiful setting", weaknesses: "Expensive wine",
    },
    dishes: [
      { name: "Fresh Truffle Pasta", category: "main", evidenceLevel: "strong", recommendationScore: 10, photoUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600" },
      { name: "Sea Bass Carpaccio", category: "starter", evidenceLevel: "strong", recommendationScore: 9, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Shrimp House",
      city: "Dammam", district: "Corniche",
      cuisine: "Seafood", priceRange: "$$",
      latitude: 26.4289, longitude: 50.1112,
      googleMapsUrl: "https://maps.google.com/?q=Shrimp+House+Dammam",
      photoUrl: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=600",
      reviewConsensusSummary: "No-frills seafood on the Dammam corniche. Prawns are incredible.",
      evidenceLevel: "strong", bestFor: "casual,family,group", isFeatured: false,
      strengths: "Ultra-fresh seafood, great value", weaknesses: "Basic setting",
    },
    dishes: [
      { name: "Grilled Tiger Prawns", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600" },
      { name: "Fish Machboos", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Couqley",
      city: "Al Khobar", district: "Al Hamra",
      cuisine: "French", priceRange: "$$$",
      latitude: 26.3009, longitude: 50.2067,
      googleMapsUrl: "https://maps.google.com/?q=Couqley+Al+Khobar",
      instagramUrl: "https://www.instagram.com/couqley/",
      photoUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
      reviewConsensusSummary: "Parisian bistro energy. Steak frites and crème brûlée are must-orders.",
      evidenceLevel: "strong", bestFor: "date,business,casual", isFeatured: true,
      strengths: "Authentic French bistro, excellent wine list", weaknesses: "Small terrace",
    },
    dishes: [
      { name: "Steak Frites", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600" },
      { name: "Crème Brûlée", category: "dessert", evidenceLevel: "strong", recommendationScore: 9, photoUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600" },
      { name: "French Onion Soup", category: "starter", evidenceLevel: "strong", recommendationScore: 8, dietTags: "vegetarian", photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Peppermill",
      city: "Al Khobar", district: "Prince Turki",
      cuisine: "International", priceRange: "$$",
      latitude: 26.3223, longitude: 50.1634,
      googleMapsUrl: "https://maps.google.com/?q=Peppermill+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600",
      reviewConsensusSummary: "Long-standing favourite for international comfort food.",
      evidenceLevel: "moderate", bestFor: "family,casual,business", isFeatured: false,
      strengths: "Reliable, broad menu, good service", weaknesses: "Nothing standout",
    },
    dishes: [
      { name: "Grilled Salmon", category: "main", evidenceLevel: "strong", recommendationScore: 8, dietTags: "seafood", photoUrl: "https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=600" },
      { name: "Beef Tenderloin", category: "main", evidenceLevel: "strong", recommendationScore: 8, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600" },
    ],
  },
  {
    restaurant: {
      name: "Sakab",
      city: "Al Khobar", district: "Olaya",
      cuisine: "Saudi", priceRange: "$",
      latitude: 26.3345, longitude: 50.1712,
      googleMapsUrl: "https://maps.google.com/?q=Sakab+Al+Khobar",
      photoUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
      reviewConsensusSummary: "Local Saudi street food done brilliantly. Mandi and harees.",
      evidenceLevel: "strong", bestFor: "casual,family,quick", isFeatured: false,
      strengths: "Authentic street food, very cheap", weaknesses: "Basic setting",
    },
    dishes: [
      { name: "Mandi Lamb", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat", photoUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600" },
      { name: "Harees", category: "main", evidenceLevel: "strong", recommendationScore: 8, photoUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600" },
    ],
  },
];

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(dishes);
  await db.delete(restaurants);
  await db.delete(adminSettings);
  console.log("Cleared restaurants, dishes, and admin settings.");

  console.log("Inserting admin settings with updated system prompt...");
  await db.insert(adminSettings).values({
    systemPrompt: NEW_SYSTEM_PROMPT,
    chatbotName: "Fork & Find AI",
  });

  console.log(`\nInserting ${data.length} restaurants...`);
  for (const entry of data) {
    const [row] = await db.insert(restaurants).values(entry.restaurant).returning();
    process.stdout.write(`  ${row.name} (id=${row.id}) — ${entry.dishes.length} dishes\n`);
    for (const dish of entry.dishes) {
      await db.insert(dishes).values({ ...dish, restaurantId: row.id });
    }
  }

  console.log("\nSeed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
