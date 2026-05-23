import React from "react";
import { motion } from "motion/react";
import { useLanguage } from "../LanguageContext";
import { Language } from "../types";
import { Globe } from "lucide-react"; // or Languages

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const languages = [
    { code: "en" as Language, label: "EN", name: "English" },
    { code: "am" as Language, label: "አማ", name: "አማርኛ" },
    { code: "ti" as Language, label: "ትግ", name: "ትግርኛ" }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-lg">
      {languages.map((lang) => (
        <motion.button
          key={lang.code}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLanguage(lang.code)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all ${language === lang.code
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
              : "text-slate-600 hover:bg-white/20 dark:text-slate-300"
            }`}
        >
          <Globe className="w-5 h-5" />
          <span>{lang.label}</span>
        </motion.button>
      ))}
    </div>
  );
}