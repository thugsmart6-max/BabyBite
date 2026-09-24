import { MEAL_DESCRIPTION_I18N } from "@/lib/kitchen-meal-descriptions-i18n";
import { motherCopy, type MotherCopyKey, type MotherLang } from "@/lib/mother-copy";

const KITCHEN: Record<string, { ta: string; hi: string }> = {
  "ragi dosa with coconut chutney": { ta: "ராகி தோசை தேங்காய் சட்னி", hi: "रागी डोसा नारियल चटनी" },
  "idli with vegetable sambar": { ta: "இட்லி காய்கறி சாம்பார்", hi: "इडली सब्ज़ी सांभर" },
  "pongal with sambar": { ta: "பொங்கல் சாம்பார்", hi: "पोंगल सांभर" },
  "paneer paratha with curd": { ta: "பனீர் பராத்தா தயிர்", hi: "पनीर पराठा दही" },
  "vegetable upma with peanuts": { ta: "காய்கறி உப்புமா வேர்க்கடலை", hi: "सब्ज़ी उपमा मूंगफली" },
  "moong dal khichdi with ghee": { ta: "பாசிப்பயறு கிச்சடி நெய்", hi: "मूंग दाल खिचड़ी घी" },
  "plain moong khichdi": { ta: "பாசிப்பயறு கிச்சடி", hi: "मूंग खिचड़ी" },
  "rajma rice with salad": { ta: "ராஜ்மா சாதம் சாலட்", hi: "राजमा चावल सलाद" },
  "sambar rice with poriyal": { ta: "சாம்பார் சாதம் பொரியல்", hi: "सांभर चावल पोरियल" },
  "paneer tikka wrap": { ta: "பனீர் திக்கா ரேப்", hi: "पनीर टिक्का रैप" },
  "chickpea chole with jeera rice": { ta: "கொண்டைக்கடலை சோளே சீரக சாதம்", hi: "चने छोले जीरा राइस" },
  "egg bhurji with multigrain toast": { ta: "முட்டை புர்ஜி மல்டிகிரெயின் டோஸ்ட்", hi: "अंडा भुर्जी मल्टीग्रेन टोस्ट" },
  "boiled eggs with vegetable poha": { ta: "வேகவைத்த முட்டை காய்கறி பொஹா", hi: "उबले अंडे सब्ज़ी पोहा" },
  "vegetable poha": { ta: "காய்கறி பொஹா", hi: "सब्ज़ी पोहा" },
  "grilled chicken tikka with roti": { ta: "கிரில் சிக்கன் திக்கா ரொட்டி", hi: "ग्रिल्ड चिकन टिक्का रोटी" },
  "chicken stew with appam": { ta: "சிக்கன் ஸ்டூ அப்பம்", hi: "चिकन स्टू अप्पम" },
  "banana almond smoothie": { ta: "வாழை பாதாம் ஸ்மூத்தி", hi: "केला बादाम स्मूदी" },
  "banana oat smoothie with soy milk": { ta: "வாழை ஓட் ஸ்மூத்தி சோயா பால்", hi: "केला ओट स्मूदी सोया दूध" },
  "sprouts chaat with pomegranate": { ta: "முளை சாட் மாதுளை", hi: "अंकुर चाट अनार" },
  "roasted chana and fruit cup": { ta: "வறுத்த கடலை பழக் கிண்ணம்", hi: "भुना चना और फल" },
  "vegetable pulao with raita": { ta: "காய்கறி புலாவ் ராய்த்தா", hi: "सब्ज़ी पुलाव रायता" },
  "vegetable pulao with cucumber salad": { ta: "காய்கறி புலாவ் வெள்ளரி சாலட்", hi: "सब्ज़ी पुलाव खीरा सलाद" },
  "curd rice with pickle": { ta: "தயிர் சாதம் ஊறுகாய்", hi: "दही चावल अचार" },
  "lemon rice with beans poriyal": { ta: "எலுமிச்சை சாதம் பீன்ஸ் பொரியல்", hi: "नींबू चावल बीन्स पोरियल" },
  "masala oats with nuts": { ta: "மசாலா ஓட்ஸ் கொட்டைகள்", hi: "मसाला ओट्स मेवे" },
  "savory vegetable oats": { ta: "காய்கறி ஓட்ஸ்", hi: "सब्ज़ी ओट्स" },
  "ragi porridge with jaggery": { ta: "ராகி கஞ்சி வெல்லம்", hi: "रागी दलिया गुड़" },
  "dalia with milk and dates": { ta: "கோதுமை ரவை பால் பேரிச்சை", hi: "दलिया दूध और खजूर" },
  "paneer dosa": { ta: "பனீர் தோசை", hi: "पनीर डोसा" },
  "masala dosa with potato filling": { ta: "மசாலா தோசை உருளைக்கிழங்கு", hi: "मसाला डोसा आलू" },
  "mixed veg paratha with pickle": { ta: "காய்கறி பராத்தா ஊறுகாய்", hi: "मिक्स्ड वेज पराठा अचार" },
  "bajra roti with mixed vegetable sabzi": { ta: "கம்பு ரொட்டி காய்கறி சப்ஜி", hi: "बाजरा रोटी मिक्स सब्ज़ी" },
  "fruit and nut energy bowl": { ta: "பழம் கொட்டை கிண்ணம்", hi: "फल और मेवे का कटोरा" },
  "seasonal fruit bowl": { ta: "பருவ பழக் கிண்ணம்", hi: "मौसमी फल कटोरा" },
  "fish curry with rice": { ta: "மீன் குழம்பு சாதம்", hi: "मछली करी चावल" },
  "tofu bhurji with millet roti": { ta: "டோஃபு புர்ஜி சிறுதானிய ரொட்டி", hi: "टोफू भुर्जी मिलेट रोटी" },
  "palak dal with rice": { ta: "கீரை பருப்பு சாதம்", hi: "पालक दाल चावल" },
  "besan cheela with mint chutney": { ta: "கடலை மாவு தோசை புதினா சட்னி", hi: "बेसन चीला पुदीना चटनी" },
  "coconut rice with cabbage thoran": { ta: "தேங்காய் சாதம் முட்டைகோஸ் தொரன்", hi: "नारियल चावल पत्तागोभी थोरन" },
  "tomato rasam rice with beans poriyal": { ta: "தக்காளி ரசம் சாதம் பீன்ஸ் பொரியல்", hi: "टमाटर रसम चावल बीन्स पोरियल" },
  "vegetable kootu with steamed rice": { ta: "காய்கறி கூட்டு சாதம்", hi: "सब्ज़ी कूटू भात" },
  "onion uttapam with sambar": { ta: "வெங்காய உத்தப்பம் சாம்பார்", hi: "प्याज़ उत्तपम सांभर" },
  "egg dosa with tomato chutney": { ta: "முட்டை தோசை தக்காளி சட்னி", hi: "अंडा डोसा टमाटर चटनी" },
  "mild fish fry with lemon rice": { ta: "மீன் வறுவல் எலுமிச்சை சாதம்", hi: "हल्की मछली फ्राई नींबू चावल" },
  "keerai masiyal with rice": { ta: "கீரை மசியல் சாதம்", hi: "कीराई मसियाल चावल" },
  "boiled peanut sundal": { ta: "வேர்க்கடலை சுண்டல்", hi: "उबला मूंगफली सुंडल" },
  "steamed rice with moong dal and vegetables": { ta: "சாதம் பாசிப்பயறு காய்கறி", hi: "भात मूंग दाल सब्ज़ी" },
  "roasted makhana with jaggery": { ta: "வறுத்த மகானா வெல்லம்", hi: "भुना मखाना गुड़" },
  "cucumber curd sandwich": { ta: "வெள்ளரி தயிர் சாண்ட்விச்", hi: "खीरा दही सैंडविच" },
  "banana with peanut butter": { ta: "வாழை வேர்க்கடலை வெண்ணெய்", hi: "केला पीनट बटर" },
  "boiled corn with lemon": { ta: "சோளம் எலுமிச்சை", hi: "उबला भुट्टा नींबू" },
  "curd banana chana cup": { ta: "தயிர் வாழை கடலை கிண்ணம்", hi: "दही केला चना कटोरा" },
  "phulka with moong dal and vegetables": { ta: "புல்கா பாசிப்பயறு காய்கறி", hi: "फुलका मूंग दाल सब्ज़ी" },
  "jowar roti with tomato sabzi": { ta: "சோள ரொட்டி தக்காளி சப்ஜி", hi: "ज्वार रोटी टमाटर सब्ज़ी" },
  "leftover roti with vegetable tadka": { ta: "மிச்ச ரொட்டி காய்கறி தாளிப்பு", hi: "बची रोटी सब्ज़ी तड़का" },
  "moong chilla with mint chutney": { ta: "பாசிப்பயறு சீலா புதினா சட்னி", hi: "मूंग चीला पुदीना चटनी" },
  "ragi roti with mixed vegetable sabzi": { ta: "ராகி ரொட்டி காய்கறி சப்ஜி", hi: "रागी रोटी मिक्स सब्ज़ी" },
  "white chana sundal": { ta: "கொண்டைக்கடலை சுண்டல்", hi: "सफेद चना सुंडल" },
  "vegetable dalia khichdi": { ta: "காய்கறி கோதுமை கிச்சடி", hi: "सब्ज़ी दलिया खिचड़ी" },
  "aloo paratha with pickle": { ta: "உருளைக்கிழங்கு பராத்தா ஊறுகாய்", hi: "आलू पराठा अचार" },
  "egg bhurji roti roll": { ta: "முட்டை புர்ஜி ரொட்டி ரோல்", hi: "अंडा भुर्जी रोटी रोल" },
  "chicken tikka wrap": { ta: "சிக்கன் திக்கா ரேப்", hi: "चिकन टिक्का रैप" },
  "if they refuse rice tonight": { ta: "இன்றிரவு சோறு மறுத்தால்", hi: "आज रात चावल मना करें तो" },
  "ready in 10 minutes": { ta: "10 நிமிடத்தில் தயார்", hi: "10 मिनट में तैयार" },
  "uses what is already in the box": { ta: "பெட்டியில் உள்ளதைப் பயன்படுத்து", hi: "डिब्बे में जो है वही" },
  "travels in a tiffin": { ta: "டிப்பினில் பயணிக்கும்", hi: "टिफिन में चलता है" },
  "another plate for this slot": { ta: "இதே நேரத்துக்கு வேறு தட்டு", hi: "इसी समय की दूसरी थाली" },
  "ragi dosa": { ta: "ராகி தோசை", hi: "रागी डोसा" },
  idli: { ta: "இட்லி", hi: "इडली" },
  sambar: { ta: "சாம்பார்", hi: "सांभर" },
  "lemon rice": { ta: "எலுமிச்சை சாதம்", hi: "नींबू चावल" },
  "masala dosa": { ta: "மசாலா தோசை", hi: "मसाला डोसा" },
  "moong khichdi": { ta: "பாசிப்பயறு கிச்சடி", hi: "मूंग खिचड़ी" },
  "rajma rice": { ta: "ராஜ்மா சாதம்", hi: "राजमा चावल" },
  "vegetable pulao": { ta: "காய்கறி புலாவ்", hi: "सब्ज़ी पुलाव" },
  "besan cheela": { ta: "கடலை மாவு தோசை", hi: "बेसन चीला" },
  "palak dal": { ta: "கீரை பருப்பு", hi: "पालक दाल" },
  "sprouts chaat": { ta: "முளை சாட்", hi: "अंकुर चाट" },
  "ragi porridge": { ta: "ராகி கஞ்சி", hi: "रागी दलिया" },
  "mild chicken stew": { ta: "சிக்கன் ஸ்டூ", hi: "हल्का चिकन स्टू" },
  "moong dal": { ta: "பாசிப்பயறு பருப்பு", hi: "मूंग दाल" },
  chole: { ta: "சோளே", hi: "छोले" },
  "ragi flour": { ta: "ராகி மாவு", hi: "रागी आटा" },
  "idli / dosa batter": { ta: "இட்லி / தோசை மாவு", hi: "इडली / डोसा घोल" },
  coconut: { ta: "தேங்காய்", hi: "नारियल" },
  oats: { ta: "ஓட்ஸ்", hi: "ओट्स" },
  bananas: { ta: "வாழைப்பழம்", hi: "केले" },
  paneer: { ta: "பனீர்", hi: "पनीर" },
  dal: { ta: "பருப்பு", hi: "दाल" },
  rice: { ta: "சாதம்", hi: "चावल" },
  fish: { ta: "மீன்", hi: "मछली" },
  eggs: { ta: "முட்டை", hi: "अंडे" },
  curd: { ta: "தயிர்", hi: "दही" },
  milk: { ta: "பால்", hi: "दूध" },
  palak: { ta: "கீரை", hi: "पालक" },
  tomatoes: { ta: "தக்காளி", hi: "टमाटर" },
  "mixed vegetables": { ta: "கலப்பு காய்கறி", hi: "मिक्स्ड सब्ज़ी" },
  monday: { ta: "திங்கள்", hi: "सोमवार" },
  tuesday: { ta: "செவ்வாய்", hi: "मंगलवार" },
  wednesday: { ta: "புதன்", hi: "बुधवार" },
  thursday: { ta: "வியாழன்", hi: "गुरुवार" },
  friday: { ta: "வெள்ளி", hi: "शुक्रवार" },
  saturday: { ta: "சனி", hi: "शनिवार" },
  sunday: { ta: "ஞாயிறு", hi: "रविवार" },
  "you marked picky eating — this is a plate children usually finish.": {
    ta: "தேர்ச்சி செய்த picky eating — குழந்தைகள் பொதுவாக முடிக்கும் தட்டு.",
    hi: "चुनी हुई picky eating — बच्चे अक्सर यह थाली खत्म करते हैं।",
  },
  "vegetables are mixed in, because they refuse plain sabzi.": {
    ta: "காய்கறி கலந்துள்ளது — சாதா சப்ஜி மறுக்கிறார்கள்.",
    hi: "सब्ज़ी मिली है — सादी sabzi नहीं खाते।",
  },
  "vegetables stay hidden if they refuse the first plate": {
    ta: "முதல் தட்டை மறுத்தாலும் காய்கறி மறைந்திருக்கும்",
    hi: "पहली थाली मना करें तो भी सब्ज़ी छिपी रहे",
  },
  "no milk or curd on this plate, as you asked.": {
    ta: "நீங்கள் கேட்டபடி இந்தத் தட்டில் பால்/தயிர் இல்லை.",
    hi: "जैसा आपने कहा, इस थाली में दूध या दही नहीं।",
  },
  "higher-energy plate for catch-up eating.": {
    ta: "எடை/ஆற்றல் குறைவுக்கு அதிக ஆற்றல் தட்டு.",
    hi: "पकड़ने वाले खाने के लिए ज़्यादा ऊर्जा वाली थाली।",
  },
  "protein-forward, for the energy and sports you noted.": {
    ta: "குறித்த ஆற்றல், விளையாட்டுக்கு புரதம் முன்னிலை.",
    hi: "आपकी ऊर्जा और खेल के लिए प्रोटीन पर ज़ोर।",
  },
  "uses pantry staples for a tight kitchen.": {
    ta: "இறுக்கமான சமையலறை — பெட்டியில் உள்ள பொருட்கள்.",
    hi: "कम बजट — रसोई के बुनियादी सामान।",
  },
  "packs in a school box, from your tiffin answer.": {
    ta: "பள்ளி டிப்பின் பதிலின்படி பெட்டியில் போகும்.",
    hi: "स्कूल टिफिन जवाब से बॉक्स में जाता है।",
  },
  "no plated rice — you asked to skip rice.": {
    ta: "தட்டில் சாதம் இல்லை — சாதம் வேண்டாம் என்றீர்கள்.",
    hi: "थाली में चावल नहीं — आपने चावल छोड़ने को कहा।",
  },
  "softer serving for ages 4–5.": {
    ta: "4–5 வயதுக்கு மென்மையான அளவு.",
    hi: "4–5 साल के लिए हल्की मात्रा।",
  },
  "heartier plate for ages 9–12.": {
    ta: "9–12 வயதுக்கு பெரிய அளவு தட்டு.",
    hi: "9–12 साल के लिए भरपूर थाली।",
  },
  "better eating habits": { ta: "சிறந்த உணவுப் பழக்கம்", hi: "बेहतर खाने की आदतें" },
  "a familiar plate if they refuse this one": {
    ta: "இதை மறுத்தால் பழகிய தட்டு",
    hi: "अगर यह मना करें तो जानी-पहचानी थाली",
  },
  "a familiar plate if they refuse this one.": {
    ta: "இதை மறுத்தால் பழகிய தட்டு.",
    hi: "अगर यह मना करें तो जानी-पहचानी थाली।",
  },
  "another plate for this slot from your kitchen answers": {
    ta: "உங்கள் பதில்களிலிருந்து இதே நேரத்துக்கு வேறு தட்டு",
    hi: "आपके जवाबों से इसी समय की दूसरी थाली",
  },
  "another plate for this slot from your kitchen answers.": {
    ta: "உங்கள் பதில்களிலிருந்து இதே நேரத்துக்கு வேறு தட்டு.",
    hi: "आपके जवाबों से इसी समय की दूसरी थाली।",
  },
  "packed because you asked for school tiffin.": {
    ta: "பள்ளி டிப்பின் கேட்டதால் packing.",
    hi: "स्कूल टिफिन मांगा था — पैक किया।",
  },
  "packable lunch from your kitchen lists.": {
    ta: "உங்கள் kitchen lists-லிருந்து packable lunch.",
    hi: "आपकी kitchen lists से packable lunch।",
  },
  poha: { ta: "அவல்", hi: "पोहा" },
  peas: { ta: "பட்டாணி", hi: "मटर" },
  lemon: { ta: "எலுமிச்சை", hi: "नींबू" },
  papaya: { ta: "பப்பாளி", hi: "पपीता" },
  pomegranate: { ta: "மாதுளை", hi: "अनार" },
  fruit: { ta: "பழம்", hi: "फल" },
  almonds: { ta: "பாதாம்", hi: "बादाम" },
  honey: { ta: "தேன்", hi: "शहद" },
  "dosa batter": { ta: "தோசை மாவு", hi: "डोसा घोल" },
  tomato: { ta: "தக்காளி", hi: "टमाटर" },
  "bajra flour": { ta: "கம்பு மாவு", hi: "बाजरा आटा" },
  vegetables: { ta: "காய்கறி", hi: "सब्ज़ी" },
  oil: { ta: "எண்ணெய்", hi: "तेल" },
  "idli batter": { ta: "இட்லி மாவு", hi: "इडली घोल" },
  "toor dal": { ta: "துவரம் பருப்பு", hi: "अरहर दाल" },
  ghee: { ta: "நெய்", hi: "घी" },
  pepper: { ta: "மிளகு", hi: "काली मिर्च" },
  peanuts: { ta: "வேர்க்கடலை", hi: "मूंगफली" },
  carrots: { ta: "கேரட்", hi: "गाजर" },
  beans: { ta: "பீன்ஸ்", hi: "बीन्स" },
  cucumber: { ta: "வெள்ளரிக்காய்", hi: "खीरा" },
  jeera: { ta: "சீரகம்", hi: "जीरा" },
  jaggery: { ta: "வெல்லம்", hi: "गुड़" },
  cashews: { ta: "முந்திரி", hi: "काजू" },
  dates: { ta: "பேரீச்சை", hi: "खजूर" },
  bread: { ta: "ரொட்டி", hi: "ब्रेड" },
  roti: { ta: "ரொட்டி", hi: "रोटी" },
  appam: { ta: "அப்பம்", hi: "अप्पम" },
  "soy milk": { ta: "சோயா பால்", hi: "सोया दूध" },
  apple: { ta: "ஆப்பிள்", hi: "सेब" },
  raita: { ta: "ராய்த்தா", hi: "रायता" },
  pickle: { ta: "ஊறுகாய்", hi: "अचार" },
  turmeric: { ta: "மஞ்சள்", hi: "हल्दी" },
  potato: { ta: "உருளைக்கிழங்கு", hi: "आलू" },
  cabbage: { ta: "முட்டைகோஸ்", hi: "पत्तागोभी" },
  onion: { ta: "வெங்காயம்", hi: "प्याज" },
  tofu: { ta: "டோஃபு", hi: "टोफू" },
  bajra: { ta: "கம்பு", hi: "बाजरा" },
  sesame: { ta: "எள்", hi: "तिल" },
  chickpeas: { ta: "கொண்டைக்கடலை", hi: "चना" },
  "gram flour": { ta: "கடலை மாவு", hi: "बेसन" },
  mint: { ta: "புதினா", hi: "पुदीना" },
  "lotus seeds": { ta: "மகானா", hi: "मखाना" },
  jam: { ta: "ஜாம்", hi: "जैम" },
  chilli: { ta: "மிளகாய்", hi: "मिर्च" },
  salt: { ta: "உப்பு", hi: "नमक" },
  corn: { ta: "சோளம்", hi: "मकई" },
  "peanut butter": { ta: "வேர்க்கடலை வெண்ணெய்", hi: "पीनट बटर" },
  "almond powder": { ta: "பாதாம் பொடி", hi: "बादाम पाउडर" },
  "multigrain bread": { ta: "மல்டி கிரெயின் ரொட்டி", hi: "मल्टीग्रेन ब्रेड" },
  yogurt: { ta: "தயிர்", hi: "दही" },
  "mint yogurt dip": { ta: "புதினா தயிர்", hi: "पुदीना दही" },
  "cumin rice": { ta: "சீரக சாதம்", hi: "जीरा चावल" },
  "coconut chicken stew": { ta: "தேங்காய் கோழி குளம்பு", hi: "नारियल चिकन स्टू" },
  "mixed vegetable curry": { ta: "கலப்பு காய்கறி குழம்பு", hi: "मिक्स सब्ज़ी करी" },
  "tomato vegetable": { ta: "தக்காளி காய்கறி", hi: "टमाटर सब्ज़ी" },
  "vegetable tadka": { ta: "காய்கறி தாளிப்பு", hi: "सब्ज़ी तड़का" },
  "moong pancake": { ta: "பாசிப்பயறு பண்கேக்", hi: "मूंग का चीला" },
  namkeen: { ta: "நம்கீன்", hi: "नमकीन" },
  chips: { ta: "சிப்ஸ்", hi: "चिप्स" },
  biscuits: { ta: "பிஸ்கட்", hi: "बिस्कुट" },
};

const FULL_KITCHEN: Record<string, { ta: string; hi: string }> = {
  ...KITCHEN,
  ...MEAL_DESCRIPTION_I18N,
};

const KITCHEN_KEYS_LONGEST_FIRST = Object.keys(FULL_KITCHEN).sort((a, b) => b.length - a.length);

const GOAL_PHRASE: Record<string, MotherCopyKey> = {
  "healthy nutrition": "goalHealthy",
  "better eating habits": "goalHabits",
  "protein focus": "goalProtein",
  "balanced meals": "goalBalance",
  "improved food variety": "goalVariety",
};

function translateRationalePatterns(lang: MotherLang, text: string): string | null {
  const ready = /^ready in (\d+) minutes — you only have a short cook\.$/i.exec(text.trim());
  if (ready) {
    return lang === "ta"
      ? `${ready[1]} நிமிடத்தில் — குறுகிய சமையல் நேரம்.`
      : `${ready[1]} मिनट में — कम समय में पकाना।`;
  }
  const kept = /^kept off (.+) from your allergy list\.$/i.exec(text.trim());
  if (kept) {
    const items = translateKitchen(lang, kept[1]);
    return lang === "ta"
      ? `நீங்கள் சொன்ன allergy பட்டியலில் இருந்து ${items} விலக்கப்பட்டது.`
      : `आपकी allergy सूची से ${items} हटाया।`;
  }
  const goal = /^chosen for your goal: (.+)\.$/i.exec(text.trim());
  if (goal) {
    const goalKey = GOAL_PHRASE[goal[1].trim().toLowerCase()];
    const label = goalKey ? motherCopy(lang, goalKey) : goal[1];
    return lang === "ta" ? `உங்கள் இலக்குக்காக: ${label}.` : `आपके लक्ष्य के लिए: ${label}.`;
  }
  return null;
}

export function translateKitchen(lang: MotherLang, text: string): string {
  if (lang === "en" || !text) return text;
  const patterned = translateRationalePatterns(lang, text);
  if (patterned) return patterned;

  const trimmed = text.trim();
  const key = trimmed.toLowerCase();
  const exact = FULL_KITCHEN[trimmed] ?? FULL_KITCHEN[key];
  if (exact?.[lang]) return exact[lang];

  let out = text;
  for (const en of KITCHEN_KEYS_LONGEST_FIRST) {
    if (en.length < 4) continue;
    const trans = FULL_KITCHEN[en][lang];
    if (!trans) continue;
    const re = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, trans);
  }
  return out;
}
