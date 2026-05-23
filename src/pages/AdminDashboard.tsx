import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Layout, TrendingUp, Users, Database, BarChart3, FileJson, Share2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SurveyCreator from "../components/SurveyCreator";
import SurveyList from "../components/SurveyList";
import SurveyResults from "../components/SurveyResults";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Survey } from "../types";

export default function AdminDashboard() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [viewingResultsId, setViewingResultsId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalSurveys: 0, totalResponses: 0 });
  const [activeTab, setActiveTab] = useState<"surveys" | "data">("surveys");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token, logout } = useAuth();

  // Refs for sliding tab indicator
  const surveysTabRef = useRef<HTMLButtonElement>(null);
  const dataTabRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeButton = activeTab === "surveys" ? surveysTabRef.current : dataTabRef.current;
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeTab]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchStats = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys`)
      .then(res => res.json())
      .then(async data => {
        let totalResponses = 0;
        await Promise.all(
          data.map(async (survey: Survey) => {
            try {
              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${survey.id}/submissions`, {
                headers: authHeaders,
              });
              const submissions = await res.json();
              totalResponses += submissions.length || 0;
            } catch {
              // ignore
            }
          })
        );
        setStats({ totalSurveys: data.length, totalResponses });
      });
  };

  useEffect(() => {
    fetchStats();
  }, [activeTab, isCreating]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen relative z-10 py-4 px-3">
      <div className="max-w-6xl mx-auto">
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
          {/* Header – wraps on mobile */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <ClipboardList className="text-white w-6 h-6" />
                </div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
                  {t("adminPanel") || "ADMIN PANEL"}
                </span>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Survey Dashboard
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LanguageSwitcher />
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-white/50 dark:hover:bg-slate-800 h-11 px-4"
                onClick={() => { setViewingResultsId(null); setIsCreating(false); setEditingSurvey(null); }}
              >
                <Layout className="w-4 h-4 mr-2" />
                {t("dashboard") || "Dashboard"}
              </Button>
              <Link to="/">
                <Button variant="ghost" size="sm" className="rounded-full h-11 px-4">
                  {t("public") || "Public"}
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 h-11 px-4 transition-colors"
                onClick={() => { logout(); navigate("/login"); }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards – stacked on mobile, 3 columns on sm+ */}
          <div className="grid grid-cols-1 gap-3 mt-6 sm:grid-cols-3">
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Surveys</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSurveys}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </motion.div>
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Responses</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalResponses}</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </motion.div>
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Response Avg.</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.totalSurveys > 0 ? Math.round(stats.totalResponses / stats.totalSurveys) : 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Enhanced Tabs – now content-width and centered */}
        {!(isCreating || editingSurvey) && !viewingResultsId && (
          <div className="flex justify-center mb-6">
            <div className="relative inline-flex bg-white/40 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/30 dark:border-slate-700/50 backdrop-blur-md shadow-md">
              {/* Sliding indicator */}
              <motion.div
                className="absolute top-1.5 bottom-1.5 bg-white dark:bg-slate-700 rounded-xl shadow-lg"
                initial={false}
                animate={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <button
                ref={surveysTabRef}
                onClick={() => setActiveTab("surveys")}
                className={`relative flex items-center gap-2.5 py-2 px-4 rounded-xl text-sm font-bold transition-all duration-200 z-10 whitespace-nowrap ${activeTab === "surveys"
                    ? "text-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
              >
                <ClipboardList className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Surveys</span>
              </button>
              <button
                ref={dataTabRef}
                onClick={() => setActiveTab("data")}
                className={`relative flex items-center gap-2.5 py-2 px-4 rounded-xl text-sm font-bold transition-all duration-200 z-10 whitespace-nowrap ${activeTab === "data"
                    ? "text-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
              >
                <Database className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>Collected Data</span>
              </button>
            </div>
          </div>
        )}

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl overflow-hidden"
        >
          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              {(isCreating || editingSurvey) ? (
                <motion.div key="creator" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <SurveyCreator
                    initialData={editingSurvey || undefined}
                    onCancel={() => { setIsCreating(false); setEditingSurvey(null); }}
                    onCreated={() => { setIsCreating(false); setEditingSurvey(null); fetchStats(); }}
                  />
                </motion.div>
              ) : viewingResultsId ? (
                <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <SurveyResults surveyId={viewingResultsId} onBack={() => setViewingResultsId(null)} />
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {activeTab === 'surveys' ? "Survey Management" : "Data Export & Analytics"}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {activeTab === 'surveys'
                          ? "Manage your surveys, edit questions, or permanently delete them."
                          : "Export collected submissions to JSON or Excel, and clear response data."}
                      </p>
                    </div>
                    {activeTab === 'surveys' && (
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => { setIsCreating(true); setEditingSurvey(null); }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 h-11 px-4 w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t("new") || "New Survey"}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                  <SurveyList
                    mode={activeTab === 'surveys' ? 'management' : 'data'}
                    onTakeSurvey={(id) => navigate(`/survey/${id}`)}
                    onViewResults={(id) => setViewingResultsId(id)}
                    onEditSurvey={(survey) => setEditingSurvey(survey)}
                    onSurveyDeleted={() => fetchStats()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.main>

        <footer className="mt-8 py-5 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider">
            &copy; {new Date().getFullYear()} ThesisSurvey • Academic Excellence
          </p>
        </footer>
      </div>
    </motion.div>
  );
}