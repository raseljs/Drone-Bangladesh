import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { Product } from "../modules/products/product.model.js";
import { User } from "../modules/users/user.model.js";
import { ContentEntry } from "../modules/content/content.model.js";
import { Coupon } from "../modules/coupons/coupon.model.js";
import { Warehouse } from "../modules/inventory/inventory.model.js";

function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
const articleTitles=[
"How to Choose the Right Drone in Bangladesh","Best Drones for Beginners","DJI Drone Buying Guide","Best Camera Drones for Photography and Video","Beginner vs Professional Drones","Drone Features to Check Before Buying","Drone Battery Care and Charging Guide","How to Extend Drone Battery Life","Essential Drone Maintenance Checklist","Drone Propeller Maintenance Guide","Gimbal and Camera Care Guide","Drone Firmware Update Guide","Safe Drone Flying Checklist","Pre-Flight Inspection Guide","Post-Flight Drone Care","Best Drone Accessories for Beginners","Accessories for Professional Drone Pilots","Drone Controller and Remote Guide","ND Filters for Drone Photography","Drone Storage and Travel Safety Guide","Agriculture Drone Uses in Bangladesh","Enterprise Drone Applications","Drone Mapping and Surveying Guide","Drone Inspection for Construction and Industry","Drones for Real Estate Photography","Aerial Photography Tips","Cinematic Drone Video Tips","Drone Warranty and After-Sales Support Guide","Why Genuine Drone Products Matter","How to Identify Genuine Drone Accessories","Drone Repair vs Replacement Guide","Common Drone Problems and Solutions","What to Do After a Drone Crash","GPS and Compass Calibration Guide","How Weather Affects Drone Flying","Choosing a Drone for YouTube and Content Creation"
];
function articleHtml(title:string){return `<h2>${title}</h2><p>Drone Bangladesh created this practical guide to help customers make safer, better informed decisions about drones, cameras and accessories.</p><h3>What to consider</h3><p>Start with your real use case, budget, camera requirement, flight environment and support needs. Compare the complete setup instead of looking only at the aircraft price.</p><ul><li>Check product compatibility and included accessories.</li><li>Review flight time, camera capability and safety features.</li><li>Plan for batteries, charging, storage and after-sales support.</li><li>Follow local rules and fly responsibly.</li></ul><h3>Buying and support</h3><p>For product-specific advice, availability, courier delivery, warranty or maintenance support, contact Drone Bangladesh before ordering.</p>`}

const policyPages=[
  ["about-us","About Us","Drone Bangladesh is a specialist destination for drones, handheld cameras and accessories in Bangladesh.","<h2>About Drone Bangladesh</h2><p>We help hobbyists, creators, businesses and enterprise teams choose suitable aerial and imaging products. Our focus is genuine products, clear product guidance, dependable courier delivery and practical after-sales support.</p><h2>What we do</h2><p>Our catalogue includes camera drones, controllers, handheld imaging products, microphones, batteries, accessories and selected enterprise solutions. We also provide maintenance support and product guidance.</p><h2>Our commitment</h2><p>We aim to present accurate product information, transparent pricing and responsive customer service. Availability, warranty coverage and delivery timing can vary by product, brand and destination.</p>"],
  ["terms","Terms & Conditions","The rules for using Drone Bangladesh and placing orders.","<h2>Orders and pricing</h2><p>Orders are subject to stock availability, verification and confirmation. Prices may change before an order is confirmed.</p><h2>Product information</h2><p>We work to keep specifications and images accurate, but manufacturers may revise packaging, accessories or specifications.</p><h2>Customer responsibility</h2><p>Customers must provide correct delivery and contact information and use products responsibly and lawfully.</p>"],
  ["privacy","Privacy Policy","How Drone Bangladesh handles customer information.","<h2>Information we collect</h2><p>We may collect name, phone, email, delivery address, account information, order history and support messages needed to operate the store.</p><h2>How we use information</h2><p>Information is used to process orders, provide support, prevent abuse, improve the service and meet legal obligations.</p><h2>Security</h2><p>We use reasonable technical and organizational safeguards. Payment credentials for external gateways are handled by the relevant payment provider.</p>"],
  ["shipping","Shipping Policy","Courier delivery information for orders across Bangladesh.","<h2>Courier Delivery</h2><p>Drone Bangladesh uses Courier Delivery as the checkout delivery method. The standard website delivery charge is ৳150 unless a confirmed order or special destination requires a different arrangement.</p><h2>Delivery timing</h2><p>Estimated delivery depends on destination, stock, order verification and courier operations. Tracking information is shown when available.</p><h2>Receiving your parcel</h2><p>Inspect package condition before accepting delivery where courier rules allow and contact support promptly if there is visible damage.</p>"],
  ["returns","Return Policy","Eligibility and process for requesting a return.","<h2>Return eligibility</h2><p>Return eligibility depends on product condition, packaging, accessories, warranty status and the reason for return. Damage caused by misuse or unauthorized repair may not qualify.</p><h2>How to request</h2><p>Sign in to your account and submit a Return/Refund request against the relevant order, or contact support with the order number.</p>"],
  ["refund","Refund & Returns","How approved refunds and returns are handled.","<h2>Refund review</h2><p>Refunds are processed only after the request is reviewed and, when necessary, the returned product is inspected.</p><h2>Refund method</h2><p>Approved refunds may be returned through the original supported payment method or store credit, depending on the order and operational requirements.</p>"],
  ["warranty","Warranty Policy","Warranty and after-sales support information.","<h2>Warranty coverage</h2><p>Warranty depends on the specific product, manufacturer, supplier and sales terms shown at purchase. Keep your invoice, serial number and included packaging.</p><h2>Warranty exclusions</h2><p>Crash damage, water damage, misuse, unauthorized repair, normal wear and consumable items may be excluded unless a specific product warranty states otherwise.</p>"],
  ["faqs","Frequently Asked Questions","Quick answers for buying and using products from Drone Bangladesh.","<h2>Do you deliver outside Dhaka?</h2><p>Yes. Courier delivery is available across Bangladesh for eligible products.</p><h2>Can I track an order?</h2><p>Yes. Use Track Order with your order number and checkout phone number.</p><h2>Can I request drone maintenance?</h2><p>Yes. Submit a service request from the Maintenance page.</p><h2>How much is courier delivery?</h2><p>The standard website courier delivery charge is ৳150.</p><h2>Do you support returns?</h2><p>Eligible orders can submit a return/refund request for review.</p>"],
];

await connectDatabase();
const starterProducts = [
  {name:"DJI Mini 5 Pro Fly More Combo Plus with RC2",slug:"dji-mini-5-pro-fly-more-combo-plus-rc2",brand:"DJI",category:"Personal Drone",sku:"DJI-MINI5PRO",price:117000,oldPrice:140000,stock:10,reorderLevel:5,unitCost:95000,warehouse:"Dhaka Main Warehouse",isActive:true,status:"published",images:["/images/products/mini-5.jpg"],isFeatured:true,isNewArrival:true,isPopular:true},
  {name:"DJI Air 3S Fly More Combo with RC2",slug:"dji-air-3s-fly-more-combo",brand:"DJI",category:"Camera Drone",sku:"DJI-AIR3S",price:154000,oldPrice:185000,stock:8,reorderLevel:4,unitCost:128000,warehouse:"Dhaka Main Warehouse",isActive:true,status:"published",images:["/images/products/air-3.jpg"],isFeatured:true,isNewArrival:true,isPopular:true},
  {name:"DJI Mavic 3 Classic Fly More Combo",slug:"dji-mavic-3-classic-combo",brand:"DJI",category:"Camera Drone",sku:"DJI-MAVIC3C",price:195000,oldPrice:215000,stock:5,reorderLevel:3,unitCost:168000,warehouse:"Dhaka Main Warehouse",isActive:true,status:"published",images:["/images/products/mavic-3.jpg"],isFeatured:true,isNewArrival:false,isPopular:true},
  {name:"DJI Avata 2 Fly More Combo",slug:"dji-avata-2-fly-more-combo",brand:"DJI",category:"FPV Drones",sku:"DJI-AVATA2",price:74900,oldPrice:89000,stock:6,reorderLevel:3,unitCost:61000,warehouse:"Dhaka Main Warehouse",isActive:true,status:"published",images:["/images/products/avata-2.jpg"],isFeatured:false,isNewArrival:true,isPopular:true},
  {name:"DJI Mini 3 Fly More Combo",slug:"dji-mini-3-fly-more-combo",brand:"DJI",category:"Beginner Drone",sku:"DJI-MINI3",price:36500,oldPrice:45000,stock:12,reorderLevel:5,unitCost:29500,warehouse:"Dhaka Main Warehouse",isActive:true,status:"published",images:["/images/products/mini-3.jpg"],isFeatured:false,isNewArrival:false,isPopular:true},
];
for (const product of starterProducts) await Product.updateOne({ slug: product.slug }, { $setOnInsert: product }, { upsert: true });
await User.updateOne({email:env.adminEmail.toLowerCase()},{$setOnInsert:{name:"Drone Bangladesh Admin",email:env.adminEmail.toLowerCase(),passwordHash:await bcrypt.hash(env.adminPassword,12),role:"admin",isActive:true}},{upsert:true});
for (const warehouse of [
  { name:"Dhaka Main Warehouse", code:"DHK-MAIN", address:"Dhaka, Bangladesh" },
  { name:"Chattogram Warehouse", code:"CTG", address:"Chattogram, Bangladesh" },
  { name:"Khulna Warehouse", code:"KHL", address:"Khulna, Bangladesh" },
  { name:"Sylhet Warehouse", code:"SYL", address:"Sylhet, Bangladesh" },
]) await Warehouse.updateOne({code:warehouse.code},{$setOnInsert:{...warehouse,isActive:true}},{upsert:true});
await Coupon.updateOne({code:"WELCOME5"},{$setOnInsert:{code:"WELCOME5",description:"5% welcome discount",discountType:"percent",discountValue:5,minimumSubtotal:5000,maximumDiscount:2000,isActive:true}},{upsert:true});

for (const setting of [
  { name: "facebook-url", title: "Facebook", body: "https://web.facebook.com/dronebangladesh?", sortOrder: 10 },
  { name: "youtube-url", title: "YouTube", body: "https://www.youtube.com/@dronebangladesh9726", sortOrder: 11 },
]) await ContentEntry.updateOne({ entityType: "settings", name: setting.name }, { $set: { entityType: "settings", ...setting, status: "published", isActive: true } }, { upsert: true });

const featured=[
  ["Camera Drone","camera-drone","/images/categories/camera-drone.png"],
  ["DJI Remote Controller","remote-controller","/images/categories/dji-remote-controller.png"],
  ["DJI Mic","dji-mic","/images/categories/dji-mic.png"],
  ["DJI Osmo Series","osmo-series","/images/categories/dji-osmo.png"],
];
for(let i=0;i<featured.length;i++){const [title,slug,image]=featured[i];await ContentEntry.updateOne({entityType:"featured-categories",slug},{$set:{entityType:"featured-categories",name:title,slug,title,image,status:"published",isActive:true,sortOrder:i+1}},{upsert:true});}

const banners=[
  {name:"EXPLORE. CAPTURE. INSPIRE.",title:"Premium drones. Limitless possibilities.",body:"Official DJI products, expert guidance, and fast delivery across Bangladesh.",image:"/images/hero-drone.jpg",sortOrder:1,data:{primaryLabel:"Shop now",primaryUrl:"/products",secondaryLabel:"Explore drones",secondaryUrl:"/categories/camera-drone",trustOne:"BN Authorized Dealer",trustTwo:"Nationwide delivery & support",warrantyText:"1 year official warranty"}},
  {name:"FLY. CREATE. EXPLORE.",title:"Aerial excellence for every mission.",body:"Advanced drone technology for filmmaking, mapping, inspection and professional creative work.",image:"/images/products/air-3.jpg",sortOrder:2,data:{primaryLabel:"Explore products",primaryUrl:"/products",secondaryLabel:"Enterprise solutions",secondaryUrl:"/categories/enterprise",trustOne:"100% genuine products",trustTwo:"Expert product support",warrantyText:"Official support available"}},
  {name:"SMART. STABLE. POWERFUL.",title:"Professional performance. Trusted support.",body:"Discover reliable drones, genuine accessories and dependable after-sales service from Drone Bangladesh.",image:"/images/products/mavic-3.jpg",sortOrder:3,data:{primaryLabel:"Shop now",primaryUrl:"/products",secondaryLabel:"Maintenance",secondaryUrl:"/maintenance",trustOne:"Courier delivery across Bangladesh",trustTwo:"After-sales support",warrantyText:"Warranty support"}},
];
for(const banner of banners) await ContentEntry.updateOne({entityType:"banners",name:banner.name},{$set:{entityType:"banners",...banner,status:"published",isActive:true}},{upsert:true});

const enterpriseMenu=[
  ["DJI Enterprise Drones","DJI Matrice 400","/images/products/mavic-3.jpg","/products/dji-mavic-3-classic-combo",1],
  ["DJI Enterprise Drones","DJI Matrice 4D Series","/images/products/mavic-3.jpg","/products/dji-mavic-3-classic-combo",2],
  ["DJI Enterprise Drones","DJI Matrice 4 Series","/images/products/mavic-3.jpg","/products/dji-mavic-3-classic-combo",3],
  ["DJI Enterprise Drones","Matrice 30","/images/products/mavic-3.jpg","/products/dji-mavic-3-classic-combo",4],
  ["DJI Enterprise Drones","DJI Mavic 3 Enterprise","/images/products/mavic-3.jpg","/products/dji-mavic-3-classic-combo",5],
  ["DJI Enterprise Drones","Matrice 350 RTK","/images/products/mavic-3.jpg","/products/dji-mavic-3-classic-combo",6],
  ["Payloads","LiDAR","/images/categories/dji-osmo.png","/products/dji-osmo-pocket-3",10],
  ["Payloads","Public Safety","/images/categories/dji-osmo.png","/products/dji-osmo-pocket-3",11],
  ["Payloads","Thermal","/images/categories/dji-osmo.png","/products/dji-osmo-pocket-3",12],
  ["Payloads","Gas Detection","/images/categories/dji-osmo.png","/products/dji-osmo-pocket-3",13],
  ["Payloads","Photogrammetry","/images/categories/dji-osmo.png","/products/dji-osmo-pocket-3",14],
  ["Payloads","Water Sampling","/images/categories/dji-osmo.png","/products/dji-osmo-pocket-3",15],
  ["DJI Dock","DJI Dock 3","/images/hero-drone.jpg","/products/dji-mini-5-pro-fly-more-combo-plus-rc2",20],
  ["DJI Dock","DJI Dock 2","/images/hero-drone.jpg","/products/dji-mini-5-pro-fly-more-combo-plus-rc2",21],
  ["DJI Dock","DJI Dock","/images/hero-drone.jpg","/products/dji-mini-5-pro-fly-more-combo-plus-rc2",22],
  ["AGRAS","DJI AGRAS T100","/images/products/air-3.jpg","/products/dji-air-3s-fly-more-combo",30],
  ["AGRAS","DJI AGRAS T70P","/images/products/air-3.jpg","/products/dji-air-3s-fly-more-combo",31],
  ["AGRAS","DJI AGRAS T50","/images/products/air-3.jpg","/products/dji-air-3s-fly-more-combo",32],
  ["AGRAS","DJI AGRAS T25P","/images/products/air-3.jpg","/products/dji-air-3s-fly-more-combo",33],
  ["AGRAS","DJI Mavic 3 Multispectral","/images/products/air-3.jpg","/products/dji-air-3s-fly-more-combo",34],
  ["DJI Delivery","DJI FlyCart 100","/images/products/avata-2.jpg","/products/dji-avata-2-fly-more-combo",40],
  ["DJI Delivery","DJI FlyCart 30","/images/products/avata-2.jpg","/products/dji-avata-2-fly-more-combo",41],
  ["DJI Enterprise Accessories","D-RTK 3","/images/categories/dji-remote-controller.png","/products/dji-mini-5-pro-fly-more-combo-plus-rc2",50],
  ["DJI Enterprise Accessories","Manifold 3","/images/categories/dji-remote-controller.png","/products/dji-mini-5-pro-fly-more-combo-plus-rc2",51],
  ["DJI Enterprise Accessories","DJI FlightHub 2 AIO","/images/categories/dji-remote-controller.png","/products/dji-mini-5-pro-fly-more-combo-plus-rc2",52],
  ["DJI Enterprise Accessories","DJI O4 Ground Station","/images/categories/dji-remote-controller.png","/products/dji-mini-5-pro-fly-more-combo-plus-rc2",53],
] as const;
for(const [name,title,image,body,sortOrder] of enterpriseMenu) await ContentEntry.updateOne({entityType:"enterprise-menu",name,title},{$set:{entityType:"enterprise-menu",name,title,image,body,sortOrder,data:{menuKind:"category"},status:"published",isActive:true}},{upsert:true});
const enterprisePromos=[
  {name:"Enterprise Promo",title:"DJI FlightHub 2",image:"/images/articles/articles-reference.png",body:"/articles",sortOrder:100,data:{menuKind:"promo",description:"Unified drone operations platform for monitoring, planning and analysis."}},
  {name:"Enterprise Promo",title:"D-RTK 3",image:"/images/categories/dji-remote-controller.png",body:"/products",sortOrder:101,data:{menuKind:"promo",description:"High-precision positioning for mapping, surveying and inspection."}},
  {name:"Enterprise Promo",title:"DJI Care Enterprise",image:"/images/hero-drone.jpg",body:"/maintenance",sortOrder:102,data:{menuKind:"promo",description:"Comprehensive protection and expert support for your enterprise drones."}},
];
for(const promo of enterprisePromos) await ContentEntry.updateOne({entityType:"enterprise-menu",name:promo.name,title:promo.title},{$set:{entityType:"enterprise-menu",...promo,status:"published",isActive:true}},{upsert:true});
for(let i=0;i<articleTitles.length;i++){const title=articleTitles[i];const slug=slugify(title);await ContentEntry.updateOne({entityType:"articles",slug},{$set:{entityType:"articles",name:["Buying Guides","Beginner Guides","Maintenance","Safety","Accessories","Enterprise"][i%6],slug,title,body:`A practical Drone Bangladesh guide: ${title}.`,bodyHtml:articleHtml(title),image:["/images/hero-drone.jpg","/images/products/air-3.jpg","/images/products/mini-3.jpg","/images/categories/dji-osmo.png"][i%4],status:"published",isActive:true,sortOrder:i+1}},{upsert:true});}
for(const [slug,title,body,bodyHtml] of policyPages){await ContentEntry.updateOne({entityType:"pages",slug},{$set:{entityType:"pages",name:title,slug,title,body,bodyHtml,status:"published",isActive:true}},{upsert:true});}
console.log(`Seed complete: admin, demo products, ${articleTitles.length} articles, policy pages, featured categories, multi-banners, enterprise mega menu, coupon and warehouses.`);
process.exit(0);
