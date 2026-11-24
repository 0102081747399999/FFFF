/**
 * متجر ملابس رجالي كاجوال وتريندي — كتالوج المنتجات
 * Men's Casual Apparel Catalog (T-Shirts, Hoodies, Cargo, Jeans, Jackets, Shirts)
 */

export const PRODUCTS = [
  {
    id: 'oversized-tee-acid',
    category: 'tshirt',
    categoryName: 'تيشيرتات وأوفر سايز',
    title: 'تيشيرت أوفر سايز قطن معالج — طباعة جرافيك عصرية',
    fabric: 'قطن ميلتون مصري ١٠٠٪ تقيل صيفي',
    desc: 'تيشيرت بقصة أوفر سايز مريحة جداً وأكتاف ساقطة، مصنوع من قطن نقي عالي الجودة معالج ضد الانكماش وبهتان اللون. مثالي للخروجات اليومية والجامعة.',
    price: 380,
    oldPrice: 480,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أسود فحمي', hex: '#111111', class: 'bg-black' },
      { name: 'أبيض ناصع', hex: '#FFFFFF', class: 'bg-white' },
      { name: 'بيج كافيه', hex: '#D2B48C', class: 'bg-[#D2B48C]' },
      { name: 'زيتي مسطردة', hex: '#556B2F', class: 'bg-[#556B2F]' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    badge: 'الأكثر مبيعاً 🔥',
    inStock: true
  },
  {
    id: 'hoodie-heavy-fleece',
    category: 'hoodie',
    categoryName: 'هوديز وسويت شيرت',
    title: 'هودي شتوي ثقيل مبطن فرو ميلتون — لون سادة فخم',
    fabric: 'قطن ميلتون ثقيل مبطن وبرة داخلية دافئة',
    desc: 'هودي شتوي فائق الدفء بجيب كانغارو واسع وكابيشون مزدوج ومطاط مريح عند الأساور والخصر. خامة ناعمة تقاوم الوبر وتدوم طويلاً.',
    price: 650,
    oldPrice: 790,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أسود ملكي', hex: '#181818', class: 'bg-stone-900' },
      { name: 'رمادي ميلانج', hex: '#808080', class: 'bg-stone-500' },
      { name: 'كحلي ليلي', hex: '#161D2B', class: 'bg-slate-900' },
      { name: 'عنابي بوردو', hex: '#4A0E17', class: 'bg-[#4A0E17]' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    badge: 'خصم الشتاء ❄️',
    inStock: true
  },
  {
    id: 'cargo-pants-tactical',
    category: 'pants',
    categoryName: 'بناطيل وجينز وكارجو',
    title: 'بنطلون كارجو ستريت كاجوال بجيوب جانبية — خامة جبردين ليكرا',
    fabric: 'جبردين قطني مرن ومقاوم للتمزق مع ستريتش خفيف',
    desc: 'بنطلون كارجو تريندي بستة جيوب عملية وأستيك كاحل مريح. يعطيك لوك عصري كاجوال ويتماشى تماماً مع السنيكرز والتيشيرتات الأوفر سايز.',
    price: 490,
    oldPrice: 600,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أسود مطفأ', hex: '#1C1C1C', class: 'bg-stone-900' },
      { name: 'بيج رملي', hex: '#C2B280', class: 'bg-[#C2B280]' },
      { name: 'زيتي عسكري', hex: '#4B5320', class: 'bg-[#4B5320]' },
      { name: 'رمادي غامق', hex: '#333333', class: 'bg-stone-700' }
    ],
    sizes: ['30', '32', '34', '36', '38'],
    badge: 'تريند الموسم ⚡',
    inStock: true
  },
  {
    id: 'casual-linen-shirt',
    category: 'shirt',
    categoryName: 'قمصان كاجوال',
    title: 'قميص كاجوال كتان بيور — ياقة ماو صينية ناعمة',
    fabric: 'كتان طبيعي مسامي فائق الراحة والانتعاش',
    desc: 'قميص كاجوال خفيف وأنيق جداً بياقة مودرن بدون ربطة، يمكن ارتداؤه مفتوحاً فوق تيشيرت أبيض أو مقفولاً مع بنطلون جينز أو شورت.',
    price: 420,
    oldPrice: 520,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أبيض ناصع', hex: '#FFFFFF', class: 'bg-white' },
      { name: 'سماوي باستيل', hex: '#BAE6FD', class: 'bg-sky-200' },
      { name: 'بيج كتاني', hex: '#E5D3B3', class: 'bg-[#E5D3B3]' },
      { name: 'أسود كلاسيك', hex: '#111111', class: 'bg-black' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    badge: 'خامة صيفية مريحة 🌿',
    inStock: true
  },
  {
    id: 'puffer-jacket-waterproof',
    category: 'jacket',
    categoryName: 'جاكيتات ومعاطف كاجوال',
    title: 'جاكيت بامب وتربروف منفوخ عازل للمطر والهواء — كاجوال شتوي',
    fabric: 'ألياف ميكروفايبر عازلة مع طبقة خارجية طاردة للمياه',
    desc: 'جاكيت بامب فخم خفيف في الوزن لكنه فائق الدفء، مع سحّاب أمامي متين وجيوب بسوستة مبطنة لتدفئة اليدين في أشد أيام الشتاء برودة.',
    price: 890,
    oldPrice: 1100,
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أسود مط', hex: '#111111', class: 'bg-black' },
      { name: 'زيتي غامق', hex: '#2E3A23', class: 'bg-emerald-950' },
      { name: 'كحلي داكن', hex: '#0B132B', class: 'bg-slate-950' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    badge: 'مقاوم للأمطار 🌧️',
    inStock: true
  },
  {
    id: 'denim-pants-slim',
    category: 'pants',
    categoryName: 'بناطيل وجينز وكارجو',
    title: 'بنطلون جينز كلاسيك سليم فيت — خامة تركي ليكرا ممتازة',
    fabric: 'جينز قطن ٩٨٪ مع ٢٪ إيلاستين لراحة تامة في الحركة',
    desc: 'جينز سليم فيت شبابي مع غسيل خفيف معتق وخياطة مزدوجة متينة. مريح جداً عند الجلوس والحركة ومناسب لجميع المناسبات والخروجات.',
    price: 480,
    oldPrice: 590,
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أزرق كلاسيك', hex: '#254E70', class: 'bg-blue-800' },
      { name: 'أزرق ثلجي فاتح', hex: '#6395B8', class: 'bg-sky-600' },
      { name: 'أسود فاحم', hex: '#1A1A1A', class: 'bg-stone-900' }
    ],
    sizes: ['30', '32', '34', '36', '38'],
    badge: 'قطن ليكرا مريح',
    inStock: true
  },
  {
    id: 'crewneck-sweatshirt',
    category: 'hoodie',
    categoryName: 'هوديز وسويت شيرت',
    title: 'سويت شيرت راوند كلاسيك — قطن ميلتون ناعم بدون كابيشون',
    fabric: 'ميلتون قطني ثقيل ١٠٠٪ مع لمعة ناعمة',
    desc: 'قطعة بيزك أساسية في دولاب كل شاب، سهلة التنسيق فوق قميص أو بمفردها، متينة جداً بعد الغسيل ومريحة لأقصى درجة.',
    price: 450,
    oldPrice: 550,
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أوف وايت عاجي', hex: '#F0EAD6', class: 'bg-[#F0EAD6]' },
      { name: 'أسود سوبر', hex: '#000000', class: 'bg-black' },
      { name: 'رمادي فاتح', hex: '#D3D3D3', class: 'bg-stone-300' },
      { name: 'بيستاجيو / زيتي هادئ', hex: '#93A27D', class: 'bg-[#93A27D]' }
    ],
    sizes: ['M', 'L', 'XL', 'XXL', '3XL'],
    badge: 'قطعة أساسية ✨',
    inStock: true
  },
  {
    id: 'basic-tee-summer',
    category: 'tshirt',
    categoryName: 'تيشيرتات وأوفر سايز',
    title: 'تيشيرت بيزك ريجولار فيت — قطن مصري ممتاز ١٠٠٪',
    fabric: 'قطن مصري ناعم ممشط مروي',
    desc: 'التيشيرت اليومي الأكثر راحة وخفة، ياقة دائرية متماسكة ونسيج يسمح بتنفس البشرة. مناسب تحت القمصان والجاكيتات أو بمفرده.',
    price: 290,
    oldPrice: 380,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    colors: [
      { name: 'أبيض قطني', hex: '#FFFFFF', class: 'bg-white' },
      { name: 'أسود ناعم', hex: '#111111', class: 'bg-black' },
      { name: 'كحلي غامق', hex: '#151E3F', class: 'bg-slate-900' },
      { name: 'بيج نود', hex: '#D8C3A5', class: 'bg-[#D8C3A5]' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    badge: 'أفضل قيمة مقابل سعر 💯',
    inStock: true
  }
];

export function formatEGP(num) {
  if (typeof num !== 'number') num = Number(num) || 0;
  return num.toLocaleString('ar-EG') + ' ج.م';
}

export function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}
