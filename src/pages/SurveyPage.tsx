import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Info, Heart, Play } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../LanguageContext";
import { Survey } from "../types";
import { Button } from "@/components/ui/button";
import SurveyTaker from "../components/SurveyTaker";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function SurveyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [started, setStarted] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (id) fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${id}`).then(res => res.json()).then(setSurvey);
  }, [id]);

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading survey...</p>
        </div>
      </div>
    );
  }

  const getTranslatedContent = () => {
    if (language === "en" || !survey.translations?.[language]) {
      return { title: survey.title, description: survey.description };
    }
    return { title: survey.translations[language].title, description: survey.translations[language].description };
  };
  const content = getTranslatedContent();

  if (!started) {
    return (
      <div className="min-h-screen relative z-10 py-5 px-3 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>
          <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/30">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {t("researchInfo")}
                  </span>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{content.title}</h1>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{content.description}</p>
              </div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-blue-200/50 mb-6">
                <div className="flex gap-2">
                  <Heart className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                      {t("participantConsent")}
                    </h3>
                    <p className="text-xs text-blue-600/80 dark:text-blue-300/80 leading-relaxed">{t("consentText")}</p>
                  </div>
                </div>
              </motion.div>
              <div className="flex flex-col gap-3">
                <Button variant="secondary" className="h-11 rounded-xl bg-white/50 hover:bg-white/70 text-slate-700 font-medium" onClick={() => navigate("/")}>
                  {t("cancel")}
                </Button>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30" onClick={() => setStarted(true)}>
                    {t("startSurvey")}
                    <Play className="w-4 h-4 ml-2 fill-current" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <SurveyTaker surveyId={id!} onComplete={() => navigate("/")} onBack={() => setStarted(false)} />;
}
