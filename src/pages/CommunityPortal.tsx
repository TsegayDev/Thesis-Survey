import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Sparkles, ChevronRight, Star, Heart, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../LanguageContext";
import { Survey } from "../types";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function CommunityPortal() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys`)
      .then(res => res.json())
      .then(data => { setSurveys(data); setLoading(false); });
  }, []);

  const getTranslatedContent = (s: Survey) => {
    if (language === "en" || !s.translations?.[language]) {
      return { title: s.title, description: s.description };
    }
    return { title: s.translations[language].title, description: s.translations[language].description };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen relative z-10 py-5 px-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-5">
          <LanguageSwitcher />
        </div>

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            className="relative inline-block mb-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-2xl opacity-50" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <Sparkles className="text-white w-8 h-8" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-300 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
            {t("welcome")}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-base max-w-md mx-auto leading-relaxed">
            {t("thankYou")}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl p-5"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full mb-3">
              <Star className="w-3 h-3 text-blue-500" />
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {t("availableSurveys")}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Participate in Research</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your voice matters — help shape the future</p>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white/50 dark:bg-slate-700/50 rounded-xl p-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-600 rounded-lg w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded-lg w-full" />
                  </div>
                </div>
              ))
            ) : surveys.length > 0 ? (
              surveys.map((s, idx) => {
                const content = getTranslatedContent(s);
                return (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/survey/${s.id}`)}
                    className="w-full p-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-xl text-left transition-all border border-white/30 active:bg-white/80"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                          {content.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mt-0.5">
                          {content.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400 dark:text-slate-500">No surveys currently active.</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Check back later!</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="text-center mt-6">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            {t("adminAccess")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
