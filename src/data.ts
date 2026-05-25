import { Article, Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "politics", name_en: "Politics", name_hi: "राजनीति" },
  { id: "local", name_en: "Local", name_hi: "स्थानीय" },
  { id: "world", name_en: "World", name_hi: "दुनिया" },
  { id: "entertainment", name_en: "Entertainment", name_hi: "मनोरंजन" },
  { id: "video", name_en: "Video", name_hi: "वीडियो" },
  { id: "science-health", name_en: "Science & Health", name_hi: "विज्ञान/स्वास्थ्य" },
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: "npg-news-01",
    title: "IPL Bookie Arrested: IPL ऑनलाईन सट्टा गिरोह का भंडाफोड़, कोलकाता-हरियाणा में पुलिस की दबिश, 26 गिरफ्तार",
    summary: "कमिष्णरेट पुलिस ने आईपीएल क्रिकेट मैचों पर सट्टा खिलाने वाले बड़े अंतरराज्यीय गिरोह का पर्दाफाश करते हुए 26 लोगों को गिरफ्तार किया है।",
    content: "रायपुर/कोलकाता। आईपीएल सट्टा के खिलाफ एक बड़ी कार्रवाई में, पुलिस ने अंतरराज्यीय ऑनलाइन सट्टा गिरोह का भंडाफोड़ किया है। पुलिस की विशेष टीमों ने कोलकाता और हरियाणा में एक साथ कई ठिकानों पर दबिश दी। इस गुप्त ऑपरेशन के दौरान कुल 26 सटोरियों को रंगे हाथों गिरफ्तार किया गया है। पुलिस ने इनके पास से करोड़ों रुपयों के लेन-देन के दस्तावेज़, 40 से अधिक लैपटॉप, 100 मोबाइल फोन और 50 से ज्यादा बैंक खातों के एटीएम कार्ड बरामद किए हैं। आईजीपी ने प्रेस वार्ता में बताया कि यह गिरोह विभिन्न ऑनलाइन पोर्टल्स और ऐप्स के जरिए पूरे छत्तीसगढ़ और अन्य राज्यों में सट्टा संचालित कर रहा था। आरोपियों को ट्रांजिट रिमांड पर रायपुर लाया जा रहा है।",
    image_url: "https://images.unsplash.com/photo-1593341646782-e0be10db8421?auto=format&fit=crop&q=80&w=600",
    category: "crime",
    published_at: "मई 26, 2026",
    is_video: false,
    views: 3205,
    author: "NPG क्राइम डेस्क",
    is_breaking: true,
    status: "published"
  }
];
