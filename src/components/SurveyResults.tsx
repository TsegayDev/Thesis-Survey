import React, { useState, useEffect } from "react";
import { Survey, Submission, Question } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Users, MessageSquare, PieChart as PieChartIcon, TrendingUp, CheckCircle2, Clock, Share2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";

interface SurveyResultsProps {
  surveyId: string;
  onBack: () => void;
}

// Helper to get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function SurveyResults({ surveyId, onBack }: SurveyResultsProps) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveyRes, submissionsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${surveyId}`),
          fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${surveyId}/submissions`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
        ]);
        const surveyData = await surveyRes.json();
        const submissionsData = await submissionsRes.json();
        setSurvey(surveyData);
        setSubmissions(submissionsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [surveyId]);

  const getTranslatedSurveyContent = (s: Survey) => {
    if (language === "en" || !s.translations?.[language]) {
      return { title: s.title, description: s.description };
    }
    return {
      title: s.translations[language].title,
      description: s.translations[language].description
    };
  };

  const getTranslatedQuestionText = (q: Question) => {
    if (language === "en" || !survey?.translations?.[language]?.questions?.[q.id]) {
      return q.text;
    }
    return survey.translations[language].questions[q.id].text;
  };

  const exportToCSV = () => {
    if (!survey || submissions.length === 0) return;

    const headers = ["Submitted At", ...survey.questions.map(q => q.text)];
    const rows = submissions.map(s => [
      new Date(s.submittedAt).toLocaleString(),
      ...survey.questions.map(q => {
        const ans = s.answers[q.id];
        if (Array.isArray(ans)) return ans.join(", ");
        return ans || "";
      })
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${survey.title.replace(/\s+/g, "_")}_results.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate response trends
  const getResponseTrend = () => {
    const trends: Record<string, number> = {};
    submissions.forEach(s => {
      const date = new Date(s.submittedAt).toLocaleDateString();
      trends[date] = (trends[date] || 0) + 1;
    });
    return Object.entries(trends).map(([date, count]) => ({ date, count }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="mt-5 text-slate-500 dark:text-slate-400 text-sm font-medium">Analyzing survey data...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
          <PieChartIcon className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Survey not found or has been deleted.</p>
        <Button onClick={onBack} variant="ghost" className="mt-5 h-11 rounded-xl">Go Back</Button>
      </div>
    );
  }

  const surveyContent = getTranslatedSurveyContent(survey);
  const totalResponses = submissions.length;
  const responseTrend = getResponseTrend();
  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#06b6d4", "#ef4444"];
  const completionRate = totalResponses > 0 ? 100 : 0;
  const avgDaily = totalResponses > 0 && responseTrend.length > 0
    ? Math.round(totalResponses / responseTrend.length)
    : 0;

  const renderQuestionAnalysis = (question: Question) => {
    if (question.type === "multiple-choice" || question.type === "boolean" || question.type === "checkbox") {
      const counts: Record<string, number> = {};
      submissions.forEach(s => {
        const val = s.answers[question.id];
        if (val) {
          if (Array.isArray(val)) {
            val.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
          } else {
            counts[val] = (counts[val] || 0) + 1;
          }
        }
      });
      const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

      return (
        <div className="h-64 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#1e293b", fontSize: 11 }} width={100} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  background: "rgba(255,255,255,0.9)",
                  backdropFilter: "blur(8px)",
                  fontSize: "12px"
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (question.type === "rating") {
      const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      submissions.forEach(s => {
        const val = s.answers[question.id];
        if (val && typeof val === 'number') counts[val] = (counts[val] || 0) + 1;
      });
      const data = Object.entries(counts).map(([name, value]) => ({ name: `${name}⭐`, value }));
      const average = submissions.reduce((acc, s) => {
        const val = s.answers[question.id];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0) / totalResponses;

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-3">
            <div className="text-2xl font-bold text-blue-600">{average.toFixed(1)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Average rating</div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (question.type === "text") {
      const recentAnswers = submissions
        .map(s => s.answers[question.id])
        .filter(Boolean)
        .slice(-6);

      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Recent responses
          </p>
          {recentAnswers.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recentAnswers.map((ans, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-white/60 dark:bg-slate-800/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 border border-white/30"
                >
                  “{ans}”
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No text responses yet.</p>
          )}
          {submissions.length > 6 && (
            <p className="text-xs text-slate-400 text-center mt-2">Showing 6 of {submissions.length} responses</p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-white/50 dark:bg-slate-800/50 h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {getGreeting()}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t("dataAnalysis")}
              </span>
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent line-clamp-1">
              {surveyContent.title}
            </h2>
            {surveyContent.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{surveyContent.description}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={submissions.length === 0}
            className="bg-white/70 backdrop-blur-sm rounded-xl shadow-md h-10 px-3 text-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {t("exportCsv")}
          </Button>
        </div>
      </div>

      {/* Stats Cards – stacked on mobile */}
      <div className="grid grid-cols-1 gap-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-lg flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Responses</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{totalResponses}</p>
          </div>
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-lg flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completion Rate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5">{completionRate}%</p>
          </div>
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-lg flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg. Daily</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{avgDaily}</p>
          </div>
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-lg flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Since</p>
            <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{new Date(survey.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </motion.div>
      </div>

      {/* Response Trend Chart */}
      {responseTrend.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-lg"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Response Trend Over Time
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)", fontSize: "12px" }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Questions Analysis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t("questionAnalysis")}</h3>
          <span className="text-xs text-slate-500">{survey.questions.length} questions</span>
        </div>
        <div className="space-y-4">
          {survey.questions.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="cursor-pointer"
              onClick={() => setSelectedQuestionId(selectedQuestionId === q.id ? null : q.id)}
            >
              <Card className={`glass-card border-white/40 dark:border-slate-700/50 rounded-xl overflow-hidden transition-all duration-200 ${selectedQuestionId === q.id ? 'ring-2 ring-blue-500/50 shadow-lg' : 'hover:shadow-md'}`}>
                <CardHeader className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                        {getTranslatedQuestionText(q)}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {totalResponses} responses
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                          {q.type}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {selectedQuestionId === q.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="px-4 pb-4 pt-0">
                        {renderQuestionAnalysis(q)}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {totalResponses === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/40"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{t("noResponses")}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {t("shareSurvey")}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}