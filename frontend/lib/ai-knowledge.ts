export type SupportKnowledge = {
  question: string;
  answer: string;
  keywords: string[];
};

type Topic = {
  label: string;
  keywords: string[];
  price: string;
  flight: string;
  camera: string;
  combo: string;
  audience: string;
};

const topics: Topic[] = [
  { label: "DJI Mini 5 Pro", keywords: ["mini 5", "mini 5 pro", "mini5"], price: "৳117,000 থেকে", flight: "up to 52 minutes", camera: "1-inch CMOS camera with 50MP photos and 4K/60fps HDR video", combo: "Fly More Combo Plus with RC2", audience: "travel creators, aerial photographers and advanced beginners" },
  { label: "DJI Air 3S", keywords: ["air 3s", "air3s"], price: "৳154,000 থেকে", flight: "up to 46 minutes", camera: "dual-camera system with wide and telephoto perspectives", combo: "Fly More Combo with RC2", audience: "serious creators who want flexible camera coverage" },
  { label: "DJI Mavic 3 Classic", keywords: ["mavic 3", "mavic 3 classic"], price: "৳195,000 থেকে", flight: "up to 46 minutes", camera: "4/3 CMOS Hasselblad camera", combo: "Fly More Combo", audience: "professional photo and video work" },
  { label: "DJI Avata 2", keywords: ["avata 2", "avata"], price: "৳74,900 থেকে", flight: "up to 23 minutes", camera: "4K/60fps ultra-wide video", combo: "Fly More Combo", audience: "immersive FPV flying and dynamic action footage" },
  { label: "DJI Mini 3", keywords: ["mini 3", "dji mini 3"], price: "৳36,500 থেকে", flight: "up to 38 minutes", camera: "4K HDR video with true vertical shooting", combo: "Fly More Combo", audience: "travel, social content and first-time DJI owners" },
  { label: "DJI Mini 3 Pro", keywords: ["mini 3 pro"], price: "৳69,900 থেকে", flight: "up to 34 minutes", camera: "4K HDR video with intelligent obstacle sensing", combo: "Fly More Combo with RC", audience: "creators who need a compact but capable camera drone" },
  { label: "DJI Mini 2 SE", keywords: ["mini 2 se", "mini2 se"], price: "৳41,500 থেকে", flight: "up to 31 minutes", camera: "2.7K video", combo: "Fly More Combo", audience: "beginners and casual travel pilots" },
  { label: "DJI FPV", keywords: ["dji fpv", "fpv combo"], price: "৳62,900 থেকে", flight: "up to 20 minutes", camera: "4K/60fps video", combo: "Combo with Goggles V2", audience: "pilots looking for high-speed FPV flying" },
  { label: "DJI Tello", keywords: ["tello", "tello boost"], price: "৳17,900 থেকে", flight: "up to 13 minutes", camera: "720p video", combo: "Boost Combo", audience: "students, children with supervision and first practice flights" },
  { label: "DJI Mic Mini", keywords: ["mic mini", "dji mic"], price: "৳15,999 থেকে", flight: "not applicable", camera: "clear wireless audio for cameras and phones", combo: "2 TX + 1 RX kit", audience: "vloggers, interviewers and mobile creators" },
  { label: "DJI Remote Controller", keywords: ["remote controller", "rc2", "controller"], price: "৳19,500 থেকে", flight: "depends on the paired drone", camera: "built-in display on selected models", combo: "RC2 and model-specific controller options", audience: "pilots who want a dedicated control workflow" },
  { label: "Camera Drones", keywords: ["camera drone", "camera drones"], price: "৳36,500 থেকে", flight: "model dependent", camera: "from 2.7K compact cameras to Hasselblad systems", combo: "Fly More options available", audience: "photography, real estate, travel and filmmaking" },
  { label: "FPV Drones", keywords: ["fpv drone", "fpv"], price: "৳62,900 থেকে", flight: "model dependent", camera: "wide-angle 4K options", combo: "goggles and motion controller bundles", audience: "immersive flying and action content" },
  { label: "Fly More Combos", keywords: ["fly more", "combo", "batteries"], price: "varies by model", flight: "extra batteries extend your flying session", camera: "same camera as the selected aircraft", combo: "usually includes batteries, charging hub and accessories", audience: "customers who plan longer shoots" },
  { label: "DJI Care & Warranty", keywords: ["warranty", "care refresh", "replacement", "guarantee"], price: "model and plan dependent", flight: "not applicable", camera: "not applicable", combo: "official warranty and replacement support", audience: "every customer who wants after-sales protection" },
];

const intents = [
  { phrase: "price", question: (t: Topic) => `What is the price of ${t.label}?`, answer: (t: Topic) => `${t.label} বর্তমানে ${t.price} থেকে শুরু। Final price, stock and combo availability Admin catalog অনুযায়ী পরিবর্তিত হতে পারে।` },
  { phrase: "flight time", question: (t: Topic) => `How long can ${t.label} fly?`, answer: (t: Topic) => `${t.label}-এর advertised flight time ${t.flight}। Wind, payload, temperature এবং flight mode-এর কারণে বাস্তব সময় কম হতে পারে।` },
  { phrase: "camera", question: (t: Topic) => `What camera does ${t.label} have?`, answer: (t: Topic) => `${t.label}-এ ${t.camera} আছে। প্রয়োজন অনুযায়ী product details page-এ full specification দেখুন।` },
  { phrase: "combo", question: (t: Topic) => `What comes with the ${t.label} combo?`, answer: (t: Topic) => `${t.label}-এর available package হলো ${t.combo}। Box contents এবং current stock checkout-এর আগে confirm করা যাবে।` },
  { phrase: "beginner", question: (t: Topic) => `Is ${t.label} good for a beginner?`, answer: (t: Topic) => `${t.label} মূলত ${t.audience}-এর জন্য উপযোগী। প্রথমবার হলে training, GPS return-to-home এবং obstacle sensing থাকা model বেছে নিন।` },
  { phrase: "warranty", question: (t: Topic) => `Does ${t.label} include warranty?`, answer: (t: Topic) => `হ্যাঁ, আমরা official product warranty এবং after-sales support দিই। ${t.label}-এর exact warranty term invoice ও package অনুযায়ী confirm হবে।` },
  { phrase: "delivery", question: (t: Topic) => `Can you deliver ${t.label} anywhere in Bangladesh?`, answer: () => `ঢাকা ও nationwide Bangladesh delivery available। Delivery time location ও stock-এর উপর নির্ভর করে; order করার আগে team confirmation পাওয়া যায়।` },
  { phrase: "payment", question: (t: Topic) => `How can I pay for ${t.label}?`, answer: (t: Topic) => `Cash payment, online payment এবং selected EMI options available। ${t.label}-এর final payment plan checkout বা WhatsApp support থেকে confirm করুন।` },
  { phrase: "order", question: (t: Topic) => `How do I order ${t.label}?`, answer: () => `Product card-এর Add to Cart চাপুন, অথবা Buy Now দিয়ে checkout করুন। Stock বা setup নিয়ে সাহায্য চাইলে WhatsApp-এ আমাদের team-কে message করতে পারেন।` },
  { phrase: "support", question: (t: Topic) => `Can your team help me choose ${t.label}?`, answer: (t: Topic) => `অবশ্যই। আপনার budget, camera use, flight time এবং experience জানালে team ${t.label} আপনার জন্য ঠিক হবে কি না recommend করবে।` },
];

export const AI_KNOWLEDGE_BASE: SupportKnowledge[] = topics.flatMap((topic) => intents.map((intent) => ({
  question: intent.question(topic),
  answer: intent.answer(topic),
  keywords: [topic.label.toLowerCase(), ...topic.keywords, intent.phrase],
})));

export const AI_KNOWLEDGE_COUNT = AI_KNOWLEDGE_BASE.length;

export function findSupportAnswer(query: string, customEntries: SupportKnowledge[] = []) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return "আপনার প্রশ্নটি লিখুন—যেমন: Mini 5 Pro-এর price, flight time বা warranty।";
  const tokens = normalized.split(/[^a-z0-9৳]+/).filter((token) => token.length > 1);
  const pool = [...customEntries, ...AI_KNOWLEDGE_BASE];
  let best: SupportKnowledge | undefined;
  let score = 0;
  for (const entry of pool) {
    const current = entry.keywords.reduce((total, keyword) => total + (normalized.includes(keyword.toLowerCase()) ? (keyword.length > 4 ? 3 : 1) : 0), 0)
      + tokens.reduce((total, token) => total + (entry.question.toLowerCase().includes(token) ? 1 : 0), 0);
    if (current > score) { score = current; best = entry; }
  }
  if (best && score > 1) return best.answer;
  return "এই প্রশ্নটির নির্দিষ্ট উত্তর আমার knowledge base-এ নেই। আপনার budget বা product model লিখুন, অথবা WhatsApp support-এ human team-এর সঙ্গে কথা বলুন।";
}
