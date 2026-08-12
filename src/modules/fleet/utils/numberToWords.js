const LOCALE_WORDS = {
  en: {
    ones: [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ],
    tens: ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"],
    hundred: "Hundred",
    thousand: "Thousand",
    lakh: "Lakh",
    crore: "Crore",
    zero: "Zero",
  },
  hi: {
    ones: [
      "", "एक", "दो", "तीन", "चार", "पांच", "छह", "सात", "आठ", "नौ", "दस",
      "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
    ],
    tens: ["", "", "बीस", "तीस", "चालीस", "पचास", "साठ", "सत्तर", "अस्सी", "नब्बे"],
    hundred: "सौ",
    thousand: "हज़ार",
    lakh: "लाख",
    crore: "करोड़",
    zero: "शून्य",
  },
};

function twoDigits(n, w) {
  if (n < 20) return w.ones[n];
  const tensPart = w.tens[Math.floor(n / 10)];
  const onesPart = n % 10 ? ` ${w.ones[n % 10]}` : "";
  return `${tensPart}${onesPart}`;
}

function threeDigits(n, w) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let str = "";
  if (hundred) str += `${w.ones[hundred]} ${w.hundred}`;
  if (rest) str += `${str ? " " : ""}${twoDigits(rest, w)}`;
  return str;
}

// Converts a number to words using the Indian numbering system (crore/lakh/thousand).
export function numberToIndianWords(value, lang = "en") {
  const w = LOCALE_WORDS[lang] || LOCALE_WORDS.en;
  let num = Math.round(Number(value) || 0);
  if (num === 0) return w.zero;
  if (num < 0) num = Math.abs(num);

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  const parts = [];
  if (crore) parts.push(`${threeDigits(crore, w)} ${w.crore}`);
  if (lakh) parts.push(`${threeDigits(lakh, w)} ${w.lakh}`);
  if (thousand) parts.push(`${threeDigits(thousand, w)} ${w.thousand}`);
  if (hundred) parts.push(threeDigits(hundred, w));
  return parts.join(" ");
}
