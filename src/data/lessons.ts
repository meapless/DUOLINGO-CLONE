import type { LanguageCode, Lesson } from "@/types/learning";

/**
 * Sample beginner lessons. Each lesson belongs to a unit (see data/units.ts)
 * via `unitId`. Keep ids stable — progress/XP will reference them later.
 *
 * Naming convention for ids: "<lang>-<unit-slug>-<lesson-slug>".
 */
export const lessons: Lesson[] = [
  // ─────────────────────────── Spanish Basics ───────────────────────────
  {
    id: "es-basics-greetings",
    unitId: "es-basics",
    title: "Greetings",
    description: "Say hello and goodbye like a local.",
    type: "vocabulary",
    xpReward: 10,
    image: "https://picsum.photos/seed/es-greet/80/80",
    goals: ["Greet someone", "Say goodbye", "Ask how someone is"],
    vocabulary: [
      { id: "es-vocab-hola", word: "Hola", translation: "Hello", pronunciation: "OH-lah", example: "¡Hola! ¿Cómo estás?" },
      { id: "es-vocab-adios", word: "Adiós", translation: "Goodbye", pronunciation: "ah-DYOHS", example: "Adiós, hasta mañana." },
      { id: "es-vocab-gracias", word: "Gracias", translation: "Thank you", pronunciation: "GRAH-syahs", example: "Gracias por tu ayuda." },
    ],
    phrases: [
      { id: "es-phrase-como-estas", text: "¿Cómo estás?", translation: "How are you?", pronunciation: "KOH-moh ehs-TAHS" },
      { id: "es-phrase-buenos-dias", text: "Buenos días", translation: "Good morning", pronunciation: "BWEH-nohs DEE-ahs" },
    ],
    activities: [
      { id: "es-basics-greetings-a1", type: "multipleChoice", prompt: 'How do you say "Hello" in Spanish?', options: ["Adiós", "Hola", "Gracias", "Buenos días"], correctIndex: 1, explanation: '"Hola" is the most common greeting in Spanish.' },
      { id: "es-basics-greetings-a2", type: "translate", prompt: "Thank you", answer: "Gracias", hint: "Starts with G." },
      { id: "es-basics-greetings-a3", type: "match", pairs: [{ left: "Hola", right: "Hello" }, { left: "Adiós", right: "Goodbye" }, { left: "Gracias", right: "Thank you" }] },
    ],
  },
  {
    id: "es-basics-numbers",
    unitId: "es-basics",
    title: "Numbers 1–5",
    description: "Count from one to five.",
    type: "vocabulary",
    xpReward: 10,
    image: "https://picsum.photos/seed/es-numbers/80/80",
    goals: ["Count from 1 to 5", "Recognize written numbers"],
    vocabulary: [
      { id: "es-vocab-uno", word: "Uno", translation: "One", pronunciation: "OO-noh" },
      { id: "es-vocab-dos", word: "Dos", translation: "Two", pronunciation: "dohs" },
      { id: "es-vocab-tres", word: "Tres", translation: "Three", pronunciation: "trehs" },
      { id: "es-vocab-cuatro", word: "Cuatro", translation: "Four", pronunciation: "KWAH-troh" },
      { id: "es-vocab-cinco", word: "Cinco", translation: "Five", pronunciation: "SEEN-koh" },
    ],
    phrases: [],
    activities: [
      { id: "es-basics-numbers-a1", type: "multipleChoice", prompt: 'Which word means "Three"?', options: ["Dos", "Cinco", "Tres", "Uno"], correctIndex: 2 },
      { id: "es-basics-numbers-a2", type: "listen", audioText: "Cuatro", answer: "Four", options: ["Two", "Four", "Five", "One"] },
    ],
  },
  {
    id: "es-greetings-meet-tutor",
    unitId: "es-greetings",
    title: "Meet your AI tutor",
    description: "Practice a short greeting conversation out loud.",
    type: "aiTeacher",
    xpReward: 20,
    image: "https://picsum.photos/seed/es-tutor/80/80",
    goals: ["Introduce yourself", "Respond to a greeting", "Say where you are from"],
    vocabulary: [
      { id: "es-vocab-me-llamo", word: "Me llamo", translation: "My name is", pronunciation: "meh YAH-moh", example: "Me llamo Ana." },
      { id: "es-vocab-soy-de", word: "Soy de", translation: "I am from", pronunciation: "soy deh", example: "Soy de México." },
    ],
    phrases: [
      { id: "es-phrase-mucho-gusto", text: "Mucho gusto", translation: "Nice to meet you", pronunciation: "MOO-choh GOOS-toh" },
    ],
    activities: [],
    aiTeacherPrompt: {
      persona: "You're a friendly, upbeat Spanish teacher who loves celebrating small wins. Use contractions, keep things light, and guide the student through one word at a time.",
      objective: "Help the student introduce themselves in Spanish — their name and where they're from — through a short, natural back-and-forth conversation. Stay within the lesson's two phrases only.",
      conversationStarters: [
        "Let's start with something super useful — 'me llamo' means 'my name is'. Can you say 'me llamo' and then add your name?",
        "Love it! Now let's try 'soy de' — that means 'I'm from'. Where are you from?",
      ],
      focusVocabularyIds: ["es-vocab-me-llamo", "es-vocab-soy-de"],
    },
  },

  // ──────────────────────── Spanish Daily Life ──────────────────────────
  {
    id: "es-daily-introductions",
    unitId: "es-daily",
    title: "Greetings & Introductions",
    description: "Introduce yourself and greet people in everyday situations.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/es-intro/80/80",
    goals: ["Introduce yourself formally", "Greet colleagues", "Exchange names"],
    vocabulary: [
      { id: "es-vocab-nombre", word: "Nombre", translation: "Name", pronunciation: "NOHM-breh" },
      { id: "es-vocab-encantado", word: "Encantado", translation: "Pleased to meet you", pronunciation: "en-kan-TAH-doh" },
      { id: "es-vocab-igualmente", word: "Igualmente", translation: "Likewise", pronunciation: "ee-gwal-MEN-teh" },
      { id: "es-vocab-presentar", word: "Presentar", translation: "To introduce", pronunciation: "preh-sen-TAR" },
    ],
    phrases: [
      { id: "es-phrase-mi-nombre", text: "Mi nombre es…", translation: "My name is…" },
      { id: "es-phrase-mucho-placer", text: "Mucho placer", translation: "Much pleasure / Nice to meet you" },
    ],
    activities: [
      { id: "es-daily-intro-a1", type: "multipleChoice", prompt: 'What does "Encantado" mean?', options: ["Goodbye", "Pleased to meet you", "My name is", "Likewise"], correctIndex: 1 },
      { id: "es-daily-intro-a2", type: "translate", prompt: "My name is…", answer: "Mi nombre es…" },
    ],
  },
  {
    id: "es-daily-life",
    unitId: "es-daily",
    title: "Daily Life",
    description: "Talk about your everyday routine and activities.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/es-daily/80/80",
    goals: ["Describe daily routines", "Tell the time", "Talk about work and home"],
    vocabulary: [
      { id: "es-vocab-manana", word: "Mañana", translation: "Morning / Tomorrow", pronunciation: "mah-NYAH-nah" },
      { id: "es-vocab-tarde", word: "Tarde", translation: "Afternoon / Late", pronunciation: "TAR-deh" },
      { id: "es-vocab-trabajo", word: "Trabajo", translation: "Work / I work", pronunciation: "trah-BAH-hoh" },
      { id: "es-vocab-casa", word: "Casa", translation: "House / Home", pronunciation: "KAH-sah" },
    ],
    phrases: [
      { id: "es-phrase-cada-dia", text: "Cada día", translation: "Every day" },
      { id: "es-phrase-a-veces", text: "A veces", translation: "Sometimes" },
    ],
    activities: [
      { id: "es-daily-life-a1", type: "multipleChoice", prompt: 'What does "Casa" mean?', options: ["Work", "House", "Morning", "Afternoon"], correctIndex: 1 },
      { id: "es-daily-life-a2", type: "match", pairs: [{ left: "Mañana", right: "Morning" }, { left: "Tarde", right: "Afternoon" }, { left: "Casa", right: "Home" }] },
    ],
  },
  {
    id: "es-daily-cafe",
    unitId: "es-daily",
    title: "At the Café",
    description: "Order food and drinks at a Spanish café.",
    type: "phrases",
    xpReward: 20,
    image: "https://picsum.photos/seed/es-cafe/80/80",
    goals: ["Order a coffee", "Ask for the bill", "Say what you want"],
    vocabulary: [
      { id: "es-vocab-cafe", word: "Café", translation: "Coffee", pronunciation: "kah-FEH" },
      { id: "es-vocab-agua", word: "Agua", translation: "Water", pronunciation: "AH-gwah" },
      { id: "es-vocab-menu", word: "Menú", translation: "Menu", pronunciation: "meh-NOO" },
      { id: "es-vocab-cuenta", word: "Cuenta", translation: "Bill / Check", pronunciation: "KWEHN-tah" },
    ],
    phrases: [
      { id: "es-phrase-un-cafe", text: "Un café, por favor", translation: "A coffee, please" },
      { id: "es-phrase-la-cuenta", text: "La cuenta, por favor", translation: "The bill, please" },
    ],
    activities: [
      { id: "es-daily-cafe-a1", type: "multipleChoice", prompt: 'How do you say "The bill, please"?', options: ["Un café, por favor", "La cuenta, por favor", "El menú", "Agua, por favor"], correctIndex: 1 },
      { id: "es-daily-cafe-a2", type: "translate", prompt: "Water", answer: "Agua" },
    ],
  },
  {
    id: "es-daily-travel",
    unitId: "es-daily",
    title: "Travel & Directions",
    description: "Ask for directions and get around town.",
    type: "phrases",
    xpReward: 20,
    image: "https://picsum.photos/seed/es-travel/80/80",
    goals: ["Ask for directions", "Understand left and right", "Find key locations"],
    vocabulary: [
      { id: "es-vocab-izquierda", word: "Izquierda", translation: "Left", pronunciation: "ees-KYEHR-dah" },
      { id: "es-vocab-derecha", word: "Derecha", translation: "Right", pronunciation: "deh-REH-chah" },
      { id: "es-vocab-calle", word: "Calle", translation: "Street", pronunciation: "KAH-yeh" },
      { id: "es-vocab-cerca", word: "Cerca", translation: "Near / Close", pronunciation: "SEHR-kah" },
    ],
    phrases: [
      { id: "es-phrase-donde-esta", text: "¿Dónde está…?", translation: "Where is…?" },
      { id: "es-phrase-todo-recto", text: "Todo recto", translation: "Straight ahead" },
    ],
    activities: [
      { id: "es-daily-travel-a1", type: "multipleChoice", prompt: 'What does "Derecha" mean?', options: ["Left", "Straight", "Right", "Near"], correctIndex: 2 },
      { id: "es-daily-travel-a2", type: "translate", prompt: "Where is…?", answer: "¿Dónde está…?" },
    ],
  },
  {
    id: "es-daily-shopping",
    unitId: "es-daily",
    title: "Shopping",
    description: "Buy things and talk about prices in Spanish.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/es-shop/80/80",
    goals: ["Ask the price", "Say what you want to buy", "Count money"],
    vocabulary: [
      { id: "es-vocab-precio", word: "Precio", translation: "Price", pronunciation: "PREH-syoh" },
      { id: "es-vocab-barato", word: "Barato", translation: "Cheap", pronunciation: "bah-RAH-toh" },
      { id: "es-vocab-caro", word: "Caro", translation: "Expensive", pronunciation: "KAH-roh" },
      { id: "es-vocab-comprar", word: "Comprar", translation: "To buy", pronunciation: "kohm-PRAR" },
    ],
    phrases: [
      { id: "es-phrase-cuanto-cuesta", text: "¿Cuánto cuesta?", translation: "How much does it cost?" },
      { id: "es-phrase-quiero-comprar", text: "Quiero comprar…", translation: "I want to buy…" },
    ],
    activities: [
      { id: "es-daily-shop-a1", type: "multipleChoice", prompt: 'What does "Barato" mean?', options: ["Expensive", "Price", "Cheap", "To buy"], correctIndex: 2 },
      { id: "es-daily-shop-a2", type: "translate", prompt: "How much does it cost?", answer: "¿Cuánto cuesta?" },
    ],
  },
  {
    id: "es-daily-family",
    unitId: "es-daily",
    title: "Family & Friends",
    description: "Talk about your family members and relationships.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/es-family/80/80",
    goals: ["Name family members", "Describe relationships", "Talk about your family"],
    vocabulary: [
      { id: "es-vocab-familia", word: "Familia", translation: "Family", pronunciation: "fah-MEE-lyah" },
      { id: "es-vocab-madre", word: "Madre", translation: "Mother", pronunciation: "MAH-dreh" },
      { id: "es-vocab-padre", word: "Padre", translation: "Father", pronunciation: "PAH-dreh" },
      { id: "es-vocab-hermano", word: "Hermano", translation: "Brother", pronunciation: "ehr-MAH-noh" },
      { id: "es-vocab-amigo", word: "Amigo", translation: "Friend", pronunciation: "ah-MEE-goh" },
    ],
    phrases: [
      { id: "es-phrase-tengo-hermanos", text: "Tengo dos hermanos", translation: "I have two brothers" },
    ],
    activities: [
      { id: "es-daily-family-a1", type: "match", pairs: [{ left: "Madre", right: "Mother" }, { left: "Padre", right: "Father" }, { left: "Amigo", right: "Friend" }] },
      { id: "es-daily-family-a2", type: "translate", prompt: "Family", answer: "Familia" },
    ],
  },

  // ──────────────────────────── French Basics ───────────────────────────
  {
    id: "fr-basics-greetings",
    unitId: "fr-basics",
    title: "Greetings",
    description: "Your first French words.",
    type: "vocabulary",
    xpReward: 10,
    image: "https://picsum.photos/seed/fr-greet/80/80",
    goals: ["Greet someone", "Say thank you", "Say goodbye"],
    vocabulary: [
      { id: "fr-vocab-bonjour", word: "Bonjour", translation: "Hello / Good day", pronunciation: "bohn-ZHOOR", example: "Bonjour, ça va ?" },
      { id: "fr-vocab-merci", word: "Merci", translation: "Thank you", pronunciation: "mehr-SEE" },
      { id: "fr-vocab-au-revoir", word: "Au revoir", translation: "Goodbye", pronunciation: "oh ruh-VWAR" },
    ],
    phrases: [
      { id: "fr-phrase-ca-va", text: "Ça va ?", translation: "How's it going?", pronunciation: "sah VAH" },
    ],
    activities: [
      { id: "fr-basics-greetings-a1", type: "multipleChoice", prompt: 'How do you say "Thank you" in French?', options: ["Bonjour", "Au revoir", "Merci", "Ça va"], correctIndex: 2 },
      { id: "fr-basics-greetings-a2", type: "translate", prompt: "Hello", answer: "Bonjour" },
    ],
    aiTeacherPrompt: {
      persona: "You're a cheerful French teacher who makes total beginners feel welcome. Use contractions, stay encouraging, and celebrate every attempt no matter how small.",
      objective: "Teach the student their very first French greetings — bonjour, merci, and au revoir — through a friendly spoken conversation. Stick to these three words only.",
      conversationStarters: [
        "Let's kick things off with the most important word in French — 'bonjour', which just means 'hello'. Can you say 'bonjour' for me?",
        "You've got it! Now 'merci' means 'thank you'. Go ahead and give that one a try!",
      ],
      focusVocabularyIds: ["fr-vocab-bonjour", "fr-vocab-merci", "fr-vocab-au-revoir"],
    },
  },

  // ──────────────────────── French Daily Life ───────────────────────────
  {
    id: "fr-daily-introductions",
    unitId: "fr-daily",
    title: "Greetings & Introductions",
    description: "Learn how to introduce yourself in French.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/fr-intro/80/80",
    goals: ["Introduce yourself", "Greet formally and casually", "Exchange names"],
    vocabulary: [
      { id: "fr-vocab-salut", word: "Salut", translation: "Hi / Hey", pronunciation: "sah-LOO" },
      { id: "fr-vocab-bonsoir", word: "Bonsoir", translation: "Good evening", pronunciation: "bohn-SWAR" },
      { id: "fr-vocab-je-mappelle", word: "Je m'appelle", translation: "My name is", pronunciation: "zhuh mah-PELL" },
      { id: "fr-vocab-enchanté", word: "Enchanté", translation: "Nice to meet you", pronunciation: "ahn-shahn-TAY" },
    ],
    phrases: [
      { id: "fr-phrase-comment-tu-tappelles", text: "Comment tu t'appelles ?", translation: "What is your name?" },
      { id: "fr-phrase-ravi-de-vous", text: "Ravi de vous rencontrer", translation: "Pleased to meet you" },
    ],
    activities: [
      { id: "fr-daily-intro-a1", type: "multipleChoice", prompt: 'What does "Je m\'appelle" mean?', options: ["Good evening", "My name is", "Nice to meet you", "Goodbye"], correctIndex: 1 },
      { id: "fr-daily-intro-a2", type: "translate", prompt: "Nice to meet you", answer: "Enchanté" },
    ],
  },
  {
    id: "fr-daily-life",
    unitId: "fr-daily",
    title: "Daily Life",
    description: "Talk about your everyday routine in French.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/fr-daily/80/80",
    goals: ["Describe your routine", "Talk about morning and evening", "Say what you do"],
    vocabulary: [
      { id: "fr-vocab-matin", word: "Matin", translation: "Morning", pronunciation: "mah-TAN" },
      { id: "fr-vocab-soir", word: "Soir", translation: "Evening", pronunciation: "swar" },
      { id: "fr-vocab-travail", word: "Travail", translation: "Work", pronunciation: "trah-VYE" },
      { id: "fr-vocab-maison", word: "Maison", translation: "House / Home", pronunciation: "meh-ZON" },
    ],
    phrases: [
      { id: "fr-phrase-tous-les-jours", text: "Tous les jours", translation: "Every day" },
      { id: "fr-phrase-je-travaille", text: "Je travaille", translation: "I work" },
    ],
    activities: [
      { id: "fr-daily-life-a1", type: "multipleChoice", prompt: 'What does "Maison" mean?', options: ["Work", "Morning", "Home", "Evening"], correctIndex: 2 },
      { id: "fr-daily-life-a2", type: "match", pairs: [{ left: "Matin", right: "Morning" }, { left: "Soir", right: "Evening" }, { left: "Maison", right: "Home" }] },
    ],
  },
  {
    id: "fr-daily-cafe",
    unitId: "fr-daily",
    title: "At the Café",
    description: "Order like a true Parisian at a French café.",
    type: "phrases",
    xpReward: 20,
    image: "https://picsum.photos/seed/fr-cafe/80/80",
    goals: ["Order a coffee", "Ask for the menu", "Request the bill"],
    vocabulary: [
      { id: "fr-vocab-cafe-2", word: "Café", translation: "Coffee", pronunciation: "kah-FAY" },
      { id: "fr-vocab-eau", word: "Eau", translation: "Water", pronunciation: "oh" },
      { id: "fr-vocab-addition", word: "Addition", translation: "Bill", pronunciation: "ah-dee-SYON" },
      { id: "fr-vocab-garcon", word: "Garçon", translation: "Waiter", pronunciation: "gar-SON" },
    ],
    phrases: [
      { id: "fr-phrase-un-cafe-sil", text: "Un café, s'il vous plaît", translation: "A coffee, please" },
      { id: "fr-phrase-laddition", text: "L'addition, s'il vous plaît", translation: "The bill, please" },
    ],
    activities: [
      { id: "fr-daily-cafe-a1", type: "multipleChoice", prompt: 'How do you say "The bill, please"?', options: ["Un café, s'il vous plaît", "L'addition, s'il vous plaît", "Bonjour", "Merci"], correctIndex: 1 },
      { id: "fr-daily-cafe-a2", type: "translate", prompt: "Water", answer: "Eau" },
    ],
  },
  {
    id: "fr-daily-travel",
    unitId: "fr-daily",
    title: "Travel & Directions",
    description: "Navigate French cities with confidence.",
    type: "phrases",
    xpReward: 20,
    image: "https://picsum.photos/seed/fr-travel/80/80",
    goals: ["Ask for directions", "Understand left and right", "Find the metro"],
    vocabulary: [
      { id: "fr-vocab-gauche", word: "Gauche", translation: "Left", pronunciation: "gohsh" },
      { id: "fr-vocab-droite", word: "Droite", translation: "Right", pronunciation: "drwat" },
      { id: "fr-vocab-rue", word: "Rue", translation: "Street", pronunciation: "roo" },
      { id: "fr-vocab-proche", word: "Proche", translation: "Near / Close", pronunciation: "prohsh" },
    ],
    phrases: [
      { id: "fr-phrase-ou-est", text: "Où est… ?", translation: "Where is… ?" },
      { id: "fr-phrase-tout-droit", text: "Tout droit", translation: "Straight ahead" },
    ],
    activities: [
      { id: "fr-daily-travel-a1", type: "multipleChoice", prompt: 'What does "Droite" mean?', options: ["Left", "Near", "Right", "Street"], correctIndex: 2 },
      { id: "fr-daily-travel-a2", type: "translate", prompt: "Where is… ?", answer: "Où est… ?" },
    ],
  },
  {
    id: "fr-daily-shopping",
    unitId: "fr-daily",
    title: "Shopping",
    description: "Shop at French markets and boutiques.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/fr-shop/80/80",
    goals: ["Ask for a price", "Say what you want", "Understand receipts"],
    vocabulary: [
      { id: "fr-vocab-prix", word: "Prix", translation: "Price", pronunciation: "pree" },
      { id: "fr-vocab-bon-marche", word: "Bon marché", translation: "Cheap / Good price", pronunciation: "bohn mar-SHAY" },
      { id: "fr-vocab-cher", word: "Cher", translation: "Expensive", pronunciation: "shair" },
      { id: "fr-vocab-acheter", word: "Acheter", translation: "To buy", pronunciation: "ash-TAY" },
    ],
    phrases: [
      { id: "fr-phrase-combien-coute", text: "Combien ça coûte ?", translation: "How much does it cost?" },
      { id: "fr-phrase-je-voudrais", text: "Je voudrais…", translation: "I would like…" },
    ],
    activities: [
      { id: "fr-daily-shop-a1", type: "multipleChoice", prompt: 'What does "Cher" mean?', options: ["Cheap", "Price", "To buy", "Expensive"], correctIndex: 3 },
      { id: "fr-daily-shop-a2", type: "translate", prompt: "How much does it cost?", answer: "Combien ça coûte ?" },
    ],
  },
  {
    id: "fr-daily-family",
    unitId: "fr-daily",
    title: "Family & Friends",
    description: "Talk about your loved ones in French.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/fr-family/80/80",
    goals: ["Name family members", "Describe your family", "Talk about friends"],
    vocabulary: [
      { id: "fr-vocab-famille", word: "Famille", translation: "Family", pronunciation: "fah-MEE" },
      { id: "fr-vocab-mere", word: "Mère", translation: "Mother", pronunciation: "mehr" },
      { id: "fr-vocab-pere", word: "Père", translation: "Father", pronunciation: "pair" },
      { id: "fr-vocab-frere", word: "Frère", translation: "Brother", pronunciation: "frair" },
      { id: "fr-vocab-ami", word: "Ami", translation: "Friend", pronunciation: "ah-MEE" },
    ],
    phrases: [
      { id: "fr-phrase-jai-un-frere", text: "J'ai un frère", translation: "I have a brother" },
    ],
    activities: [
      { id: "fr-daily-family-a1", type: "match", pairs: [{ left: "Mère", right: "Mother" }, { left: "Père", right: "Father" }, { left: "Ami", right: "Friend" }] },
      { id: "fr-daily-family-a2", type: "translate", prompt: "Family", answer: "Famille" },
    ],
  },

  // ──────────────────────────── German Basics ───────────────────────────
  {
    id: "de-basics-greetings",
    unitId: "de-basics",
    title: "Greetings",
    description: "Start speaking German today.",
    type: "vocabulary",
    xpReward: 10,
    image: "https://picsum.photos/seed/de-greet/80/80",
    goals: ["Greet someone", "Say thank you", "Say goodbye"],
    vocabulary: [
      { id: "de-vocab-hallo", word: "Hallo", translation: "Hello", pronunciation: "HAH-loh" },
      { id: "de-vocab-danke", word: "Danke", translation: "Thank you", pronunciation: "DAHN-kuh" },
      { id: "de-vocab-tschuss", word: "Tschüss", translation: "Bye", pronunciation: "chooss" },
    ],
    phrases: [
      { id: "de-phrase-wie-gehts", text: "Wie geht's?", translation: "How are you?", pronunciation: "vee gayts" },
    ],
    activities: [
      { id: "de-basics-greetings-a1", type: "multipleChoice", prompt: 'How do you say "Hello" in German?', options: ["Danke", "Hallo", "Tschüss", "Wie geht's"], correctIndex: 1 },
      { id: "de-basics-greetings-a2", type: "match", pairs: [{ left: "Hallo", right: "Hello" }, { left: "Danke", right: "Thank you" }, { left: "Tschüss", right: "Bye" }] },
    ],
    aiTeacherPrompt: {
      persona: "You're an enthusiastic German teacher who keeps lessons short and fun. You warmly encourage every attempt and never make the student feel embarrassed about mistakes.",
      objective: "Teach the student their first three German greetings — hallo, danke, and tschüss — through a conversational audio exchange. Stay within these three words only.",
      conversationStarters: [
        "Let's start with the most important German word — 'hallo', which just means 'hello'. Can you say 'hallo' for me?",
        "Perfect! Now 'danke' means 'thank you' in German. Let's try that one — go ahead!",
      ],
      focusVocabularyIds: ["de-vocab-hallo", "de-vocab-danke", "de-vocab-tschuss"],
    },
  },

  // ──────────────────────── German Daily Life ───────────────────────────
  {
    id: "de-daily-introductions",
    unitId: "de-daily",
    title: "Greetings & Introductions",
    description: "Introduce yourself confidently in German.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/de-intro/80/80",
    goals: ["Say your name", "Greet formally", "Exchange pleasantries"],
    vocabulary: [
      { id: "de-vocab-guten-morgen", word: "Guten Morgen", translation: "Good morning", pronunciation: "GOO-ten MOR-gen" },
      { id: "de-vocab-guten-abend", word: "Guten Abend", translation: "Good evening", pronunciation: "GOO-ten AH-bend" },
      { id: "de-vocab-ich-heisse", word: "Ich heiße", translation: "My name is", pronunciation: "ikh HY-sse" },
      { id: "de-vocab-angenehm", word: "Angenehm", translation: "Pleased to meet you", pronunciation: "AHN-geh-naym" },
    ],
    phrases: [
      { id: "de-phrase-wie-heissen-sie", text: "Wie heißen Sie?", translation: "What is your name? (formal)" },
      { id: "de-phrase-ich-komme", text: "Ich komme aus…", translation: "I come from…" },
    ],
    activities: [
      { id: "de-daily-intro-a1", type: "multipleChoice", prompt: 'What does "Ich heiße" mean?', options: ["Good morning", "My name is", "Pleased to meet you", "Good evening"], correctIndex: 1 },
      { id: "de-daily-intro-a2", type: "translate", prompt: "Good morning", answer: "Guten Morgen" },
    ],
  },
  {
    id: "de-daily-life",
    unitId: "de-daily",
    title: "Daily Life",
    description: "Describe your day-to-day life in German.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/de-daily/80/80",
    goals: ["Describe your routine", "Talk about time", "Name daily activities"],
    vocabulary: [
      { id: "de-vocab-morgen", word: "Morgen", translation: "Morning / Tomorrow", pronunciation: "MOR-gen" },
      { id: "de-vocab-abend", word: "Abend", translation: "Evening", pronunciation: "AH-bend" },
      { id: "de-vocab-arbeit", word: "Arbeit", translation: "Work", pronunciation: "AR-bite" },
      { id: "de-vocab-haus", word: "Haus", translation: "House / Home", pronunciation: "hows" },
    ],
    phrases: [
      { id: "de-phrase-jeden-tag", text: "Jeden Tag", translation: "Every day" },
      { id: "de-phrase-ich-arbeite", text: "Ich arbeite", translation: "I work" },
    ],
    activities: [
      { id: "de-daily-life-a1", type: "multipleChoice", prompt: 'What does "Arbeit" mean?', options: ["Home", "Evening", "Work", "Morning"], correctIndex: 2 },
      { id: "de-daily-life-a2", type: "match", pairs: [{ left: "Morgen", right: "Morning" }, { left: "Abend", right: "Evening" }, { left: "Haus", right: "Home" }] },
    ],
  },
  {
    id: "de-daily-cafe",
    unitId: "de-daily",
    title: "At the Café",
    description: "Order coffee and food at a German café.",
    type: "phrases",
    xpReward: 20,
    image: "https://picsum.photos/seed/de-cafe/80/80",
    goals: ["Order a drink", "Ask for the menu", "Request the bill"],
    vocabulary: [
      { id: "de-vocab-kaffee", word: "Kaffee", translation: "Coffee", pronunciation: "KAH-feh" },
      { id: "de-vocab-wasser", word: "Wasser", translation: "Water", pronunciation: "VAS-er" },
      { id: "de-vocab-rechnung", word: "Rechnung", translation: "Bill", pronunciation: "REK-nung" },
      { id: "de-vocab-kellner", word: "Kellner", translation: "Waiter", pronunciation: "KELL-ner" },
    ],
    phrases: [
      { id: "de-phrase-einen-kaffee", text: "Einen Kaffee, bitte", translation: "A coffee, please" },
      { id: "de-phrase-die-rechnung", text: "Die Rechnung, bitte", translation: "The bill, please" },
    ],
    activities: [
      { id: "de-daily-cafe-a1", type: "multipleChoice", prompt: 'What does "Rechnung" mean?', options: ["Coffee", "Waiter", "Water", "Bill"], correctIndex: 3 },
      { id: "de-daily-cafe-a2", type: "translate", prompt: "Water", answer: "Wasser" },
    ],
  },
  {
    id: "de-daily-travel",
    unitId: "de-daily",
    title: "Travel & Directions",
    description: "Get around German cities like a local.",
    type: "phrases",
    xpReward: 20,
    image: "https://picsum.photos/seed/de-travel/80/80",
    goals: ["Ask for directions", "Understand left and right", "Use public transport"],
    vocabulary: [
      { id: "de-vocab-links", word: "Links", translation: "Left", pronunciation: "links" },
      { id: "de-vocab-rechts", word: "Rechts", translation: "Right", pronunciation: "rekts" },
      { id: "de-vocab-strasse", word: "Straße", translation: "Street", pronunciation: "SHTRAH-sse" },
      { id: "de-vocab-nah", word: "Nah", translation: "Near", pronunciation: "nah" },
    ],
    phrases: [
      { id: "de-phrase-wo-ist", text: "Wo ist… ?", translation: "Where is… ?" },
      { id: "de-phrase-geradeaus", text: "Geradeaus", translation: "Straight ahead" },
    ],
    activities: [
      { id: "de-daily-travel-a1", type: "multipleChoice", prompt: 'What does "Rechts" mean?', options: ["Left", "Near", "Straight", "Right"], correctIndex: 3 },
      { id: "de-daily-travel-a2", type: "translate", prompt: "Where is… ?", answer: "Wo ist… ?" },
    ],
  },
  {
    id: "de-daily-shopping",
    unitId: "de-daily",
    title: "Shopping",
    description: "Shop at German stores and markets.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/de-shop/80/80",
    goals: ["Ask for prices", "Say what you want", "Handle money"],
    vocabulary: [
      { id: "de-vocab-preis", word: "Preis", translation: "Price", pronunciation: "price" },
      { id: "de-vocab-billig", word: "Billig", translation: "Cheap", pronunciation: "BIL-ig" },
      { id: "de-vocab-teuer", word: "Teuer", translation: "Expensive", pronunciation: "TOY-er" },
      { id: "de-vocab-kaufen", word: "Kaufen", translation: "To buy", pronunciation: "KOW-fen" },
    ],
    phrases: [
      { id: "de-phrase-was-kostet", text: "Was kostet das?", translation: "How much does it cost?" },
      { id: "de-phrase-ich-mochte", text: "Ich möchte…", translation: "I would like…" },
    ],
    activities: [
      { id: "de-daily-shop-a1", type: "multipleChoice", prompt: 'What does "Teuer" mean?', options: ["Cheap", "Price", "Expensive", "To buy"], correctIndex: 2 },
      { id: "de-daily-shop-a2", type: "translate", prompt: "How much does it cost?", answer: "Was kostet das?" },
    ],
  },
  {
    id: "de-daily-family",
    unitId: "de-daily",
    title: "Family & Friends",
    description: "Talk about your family and friends in German.",
    type: "vocabulary",
    xpReward: 15,
    image: "https://picsum.photos/seed/de-family/80/80",
    goals: ["Name family members", "Describe your family", "Talk about relationships"],
    vocabulary: [
      { id: "de-vocab-familie", word: "Familie", translation: "Family", pronunciation: "fah-MEE-lee-eh" },
      { id: "de-vocab-mutter", word: "Mutter", translation: "Mother", pronunciation: "MUT-er" },
      { id: "de-vocab-vater", word: "Vater", translation: "Father", pronunciation: "FAH-ter" },
      { id: "de-vocab-bruder", word: "Bruder", translation: "Brother", pronunciation: "BROO-der" },
      { id: "de-vocab-freund", word: "Freund", translation: "Friend", pronunciation: "froynd" },
    ],
    phrases: [
      { id: "de-phrase-ich-habe", text: "Ich habe einen Bruder", translation: "I have a brother" },
    ],
    activities: [
      { id: "de-daily-family-a1", type: "match", pairs: [{ left: "Mutter", right: "Mother" }, { left: "Vater", right: "Father" }, { left: "Freund", right: "Friend" }] },
      { id: "de-daily-family-a2", type: "translate", prompt: "Family", answer: "Familie" },
    ],
  },
];

/** Find a lesson by its id. */
export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

/** All lessons in a unit, in their stored order. */
export function getLessonsByUnit(unitId: string): Lesson[] {
  return lessons.filter((lesson) => lesson.unitId === unitId);
}

/** All lessons for a language. */
export function getLessonsByLanguage(code: LanguageCode): Lesson[] {
  return lessons.filter((lesson) => lesson.id.startsWith(`${code}-`));
}
