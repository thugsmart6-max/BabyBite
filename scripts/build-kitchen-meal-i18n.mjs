import fs from "fs";

const T = {
  "Soft scrambled eggs with multigrain bread — high protein snack-meal.": {
    ta: "மல்டிகிரெயின் டோஸ்ட்-உடன் மென்மையான முட்டை புரிஜி — புரதம் நிறைந்த சிற்றுண்டி உணவு.",
    hi: "मल्टीग्रेन ब्रेड के साथ नरम अंडा भुर्जी — प्रोटीन भरपूर स्नैक-भोजन।",
  },
  "Flattened rice poha with peas and a boiled egg on the side.": {
    ta: "பட்டாணி அவல், பக்கத்தில் வேகவைத்த முட்டை.",
    hi: "मटर वाली पोहा, साइड में उबला अंडा।",
  },
  "Light poha with peanuts omitted — turmeric, peas, and lemon.": {
    ta: "வேர்க்கடலை இல்லாமல் லேசான அவல் — மஞ்சள், பட்டாணி, எலுமிச்சை.",
    hi: "बिना मूंगफली हल्की पोहा — हल्दी, मटर और नींबू।",
  },
  "Mild chicken tikka with soft roti and cucumber raita.": {
    ta: "வேர்வளம் குறைந்த சிக்கன் டிக்கா, மென்மையான ரொட்டி, வெள்ளரிக்காய் ராய்த்தா.",
    hi: "हल्की चिकन टिक्का, नरम रोटी और खीरा रायता।",
  },
  "Mild coconut chicken stew with a soft appam.": {
    ta: "வேர்வளம் குறைந்த தேங்காய் சிக்கன் ஸ்டூ, மென்மையான அப்பம்.",
    hi: "हल्की नारियल चिकन स्टू, नरम अप्पम के साथ।",
  },
  "Banana, almond powder, and milk smoothie — calorie-dense.": {
    ta: "வாழை, பாதாம் தூள், பால் ஸ்மூத்தி — கலோரி நிறைந்தது.",
    hi: "केला, बादाम पाउडर और दूध स्मूदी — कैलोरी भरपूर।",
  },
  "Banana and oats blended with unsweetened soy milk.": {
    ta: "வாழை, ஓட்ஸ், சர்க்கரை இல்லாமல் சோயா பாலில் கலந்தது.",
    hi: "केला और ओट्स, बिना चीनी सोया दूध में ब्लेंड।",
  },
  "Colorful sprouts chaat with lemon and pomegranate seeds.": {
    ta: "வண்ணமயமான முளை சாட், எலுமிச்சை, மாதுளை விதைகள்.",
    hi: "रंग-बिरंगी अंकुर चाट, नींबू और अनार के दाने।",
  },
  "Roasted chana with apple or banana slices — crunchy protein snack.": {
    ta: "வறுத்த கடலை, ஆப்பிள்/வாழை துண்டுகள் — crunch புரத snack.",
    hi: "भुनी चना, सेब या केले के टुकड़े — कुरकुरा प्रोटीन स्नैक।",
  },
};

const path = "src/lib/kitchen-meal-descriptions-i18n.ts";
let text = fs.readFileSync(path, "utf8");
for (const [key, val] of Object.entries(T)) {
  const esc = key.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const re = new RegExp(
    `(  "${esc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}": \\{\\s*ta: ")[^"]*(",\\s*hi: ")[^"]*(")`,
    "s"
  );
  if (!re.test(text)) {
    console.error("missing key", key.slice(0, 40));
    continue;
  }
  text = text.replace(re, `$1${val.ta}$2${val.hi}$3`);
}
fs.writeFileSync(path, text);
console.log("patched", Object.keys(T).length);
