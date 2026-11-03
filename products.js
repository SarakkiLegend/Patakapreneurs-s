// Product list (generated from Crackers_Pricing.xlsx).
// mrp = printed rate (shown crossed out) | price = our price (used in the cart)
// rec: true = also shows in the Recommendations dropdown.
// Photos: save as images/products/p<ID>.jpg (e.g. p12.jpg). .jpeg, .png and .webp also work.
const PRODUCTS = [
  // ---------- 🌸 Flower Pots ----------
  { id: 1, category: "🌸 Flower Pots", name: "Ashoka", mrp: 750, price: 300 },
  { id: 2, category: "🌸 Flower Pots", name: "Colour Koti", mrp: 1250, price: 500 },
  { id: 3, category: "🌸 Flower Pots", name: "Colour Koti Deluxe", mrp: 1625, price: 650 },
  { id: 4, category: "🌸 Flower Pots", name: "Tri Colour", mrp: 1625, price: 650, rec: true },

  // ---------- ✨ Sparklers ----------
  { id: 5, category: "✨ Sparklers", name: "15 cm Sparklers - Pack of 5", mrp: 600, price: 300 },
  { id: 6, category: "✨ Sparklers", name: "30 cm Sparklers - Pack of 5", mrp: 800, price: 400, rec: true },

  // ---------- 🎆 Sky Shots ----------
  { id: 7, category: "🎆 Sky Shots", name: "2\" Shot - 3 Pcs", mrp: 1500, price: 750 },
  { id: 10, category: "🎆 Sky Shots", name: "7 Shots", mrp: 500, price: 200 },
  { id: 11, category: "🎆 Sky Shots", name: "12 Shots", mrp: 750, price: 300 },
  { id: 12, category: "🎆 Sky Shots", name: "25 Shots", mrp: 2000, price: 800, rec: true },
  { id: 13, category: "🎆 Sky Shots", name: "30 Shots", mrp: 2250, price: 900 },
  { id: 14, category: "🎆 Sky Shots", name: "60 Shots", mrp: 4000, price: 1600, rec: true },
  { id: 15, category: "🎆 Sky Shots", name: "120 Shots", mrp: 8000, price: 3200 },

  // ---------- 🧵 Garland Crackers ----------
  { id: 16, category: "🧵 Garland Crackers", name: "1000 Wala", mrp: 700, price: 350 },
  { id: 17, category: "🧵 Garland Crackers", name: "2000 Wala", mrp: 1400, price: 700, rec: true },
  { id: 18, category: "🧵 Garland Crackers", name: "5000 Wala", mrp: 3500, price: 1750 },
  { id: 19, category: "🧵 Garland Crackers", name: "10000 Wala", mrp: 7000, price: 3500 },

  // ---------- 💣 Bombs ----------
  { id: 20, category: "💣 Bombs", name: "Hydrogen - Small", mrp: 300, price: 120 },
  { id: 21, category: "💣 Bombs", name: "Hydrogen - Medium", mrp: 500, price: 200 },
  { id: 22, category: "💣 Bombs", name: "Hydrogen - Classic", mrp: 750, price: 300 },
  { id: 23, category: "💣 Bombs", name: "Hydrogen - Deluxe", mrp: 1250, price: 500, rec: true },

  // ---------- ⭐ Special Items ----------
  { id: 24, category: "⭐ Special Items", name: "Peacock Flower Pot", mrp: 500, price: 350, rec: true },
  { id: 25, category: "⭐ Special Items", name: "Handheld Shots", mrp: 300, price: 150, rec: true }
];
