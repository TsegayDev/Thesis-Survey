import React, { useState, useEffect } from "react";
import { Survey } from "../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Play, Calendar, Users, FileJson, FileSpreadsheet, Trash2, Edit, ClipboardList, Share2, CheckCircle2, TrendingUp, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import * as XLSX from "xlsx";

interface SurveyListProps {
  onTakeSurvey?: (id: string) => void;
  onViewResults?: (id: string) => void;
  onEditSurvey?: (survey: Survey) => void;
  onSurveyDeleted?: () => void;
  mode?: "management" | "data";
}

// Custom Toast Component
interface ToastMessage {
  show: boolean;
  message: string;
  type: "error" | "success" | "info";
}

function Toast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const bgColor =
    toast.type === "error"
      ? "from-red-500 to-rose-500"
      : toast.type === "success"
        ? "from-green-500 to-emerald-500"
        : "from-blue-500 to-indigo-500";
  const Icon =
    toast.type === "error" ? AlertTriangle : toast.type === "success" ? CheckCircle2 : Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
    >
      <div
        className={`pointer-events-auto max-w-sm w-full bg-gradient-to-r ${bgColor} text-white rounded-xl shadow-2xl p-3 flex items-center gap-3`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-white/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 h-10 rounded-xl" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Prompt Dialog for clearing responses (confirmation with title input)
interface ClearPromptProps {
  open: boolean;
  surveyTitle: string;
  onConfirm: (inputValue: string) => void;
  onCancel: () => void;
}

function ClearPrompt({ open, surveyTitle, onConfirm, onCancel }: ClearPromptProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!open) setInputValue("");
  }, [open]);

  if (!open) return null;

  const isValid = inputValue === surveyTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-white/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Clear Responses</h3>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
          This action will permanently delete all collected responses for{" "}
          <strong className="font-semibold">"{surveyTitle}"</strong>.
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
          Please type the survey title to confirm:
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={surveyTitle}
          className="w-full p-2 rounded-lg border border-white/40 bg-white/60 dark:bg-slate-700/60 text-sm mb-5 focus:ring-2 focus:ring-blue-500/50 outline-none"
        />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 h-10 rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
            disabled={!isValid}
            onClick={() => onConfirm(inputValue)}
          >
            Clear All Responses
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Helper: Info icon for toast
function Info(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

// Gradient generator for cards (subtle background only)
const getCardGradient = (index: number) => {
  const gradients = [
    "from-blue-50/30 to-indigo-50/30 dark:from-blue-950/10 dark:to-indigo-950/10",
    "from-emerald-50/30 to-teal-50/30 dark:from-emerald-950/10 dark:to-teal-950/10",
    "from-rose-50/30 to-pink-50/30 dark:from-rose-950/10 dark:to-pink-950/10",
    "from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10",
    "from-purple-50/30 to-violet-50/30 dark:from-purple-950/10 dark:to-violet-950/10",
  ];
  return gradients[index % gradients.length];
};

export default function SurveyList({
  onTakeSurvey,
  onViewResults,
  onEditSurvey,
  onSurveyDeleted,
  mode = "management",
}: SurveyListProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage>({ show: false, message: "", type: "error" });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; surveyId?: string }>({ open: false });
  const [clearPrompt, setClearPrompt] = useState<{ open: boolean; survey?: Survey }>({ open: false });
  const { t, language } = useLanguage();
  const { token } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const showToast = (message: string, type: "error" | "success" | "info" = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => setToast((prev) => ({ ...prev, show: false }));

  const fetchAll = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys`)
      .then((res) => res.json())
      .then(async (data) => {
        setSurveys(data);
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (survey: Survey) => {
            try {
              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${survey.id}/submissions`, {
                headers: authHeaders,
              });
              const submissions = await res.json();
              counts[survey.id] = submissions.length || 0;
            } catch {
              counts[survey.id] = 0;
            }
          })
        );
        setResponseCounts(counts);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Failed to load surveys.", "error");
      });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const getTranslatedContent = (s: Survey) => {
    if (language === "en" || !s.translations?.[language]) {
      return { title: s.title, description: s.description };
    }
    return {
      title: s.translations[language].title,
      description: s.translations[language].description,
    };
  };

  const copyShareLink = (surveyId: string) => {
    const url = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(surveyId);
    showToast("Survey link copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteSurvey = async (id: string) => {
    setConfirmDialog({ open: false });
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${id}`, { method: "DELETE", headers: authHeaders });
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      if (onSurveyDeleted) onSurveyDeleted();
      showToast("Survey deleted successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete survey.", "error");
    }
  };

  const clearResponses = async (survey: Survey) => {
    const content = getTranslatedContent(survey);
    setClearPrompt({ open: false });
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${survey.id}/submissions`, { method: "DELETE", headers: authHeaders });
      setResponseCounts((prev) => ({ ...prev, [survey.id]: 0 }));
      if (onSurveyDeleted) onSurveyDeleted();
      showToast(`All responses for "${content.title}" cleared.`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to clear responses.", "error");
    }
  };

  const formatAnswers = (survey: Survey, answers: Record<string, any>) => {
    const formatted: Record<string, any> = {};
    for (const [k, v] of Object.entries(answers)) {
      const matchedQuestion = survey.questions.find((q) => q.id === k);
      const finalKey = matchedQuestion ? matchedQuestion.text : k;

      let finalVal = v;
      if (finalVal && typeof finalVal === "object" && !Array.isArray(finalVal)) {
        finalVal = Object.entries(finalVal)
          .map(([nk, nv]) => `${nk}: ${nv}`)
          .join(", ");
      } else if (Array.isArray(finalVal)) {
        finalVal = finalVal.join(", ");
      }
      formatted[finalKey] = finalVal;
    }
    return formatted;
  };

  const exportJSON = async (survey: Survey) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${survey.id}/submissions`, {
        headers: authHeaders,
      });
      const data = await res.json();

      const mappedSubmissions = data.map((sub: any) => ({
        ...sub,
        answers: formatAnswers(survey, sub.answers),
      }));

      const payload = {
        survey: getTranslatedContent(survey),
        submissions: mappedSubmissions,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `survey_${survey.id}_data.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("JSON export completed.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export JSON.", "error");
    }
  };

  const exportXLSX = async (survey: Survey) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${survey.id}/submissions`, {
        headers: authHeaders,
      });
      const submissions = await res.json();

      const rows = submissions.map((sub: any) => ({
        SubmissionID: sub.id,
        Date: new Date(sub.submittedAt).toLocaleString(),
        ...formatAnswers(survey, sub.answers),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Note: "No submissions yet" }]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
      XLSX.writeFile(workbook, `survey_${survey.id}_data.xlsx`);
      showToast("Excel export completed.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export Excel.", "error");
    }
  };

  // Loading skeletons – mobile first
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-56 bg-white/40 dark:bg-slate-800/40 rounded-2xl backdrop-blur-sm border border-white/30" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (surveys.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 px-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
          {t("noResponses") || "No Surveys Found"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          {mode === "management"
            ? "Start by creating a new survey."
            : "Once you have active surveys, their data will appear here."}
        </p>
      </motion.div>
    );
  }

  const managementMode = mode === "management";

  return (
    <>
      <Toast toast={toast} onClose={hideToast} />
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Survey"
        message="Are you sure you want to permanently delete this survey and all its responses? This action cannot be undone."
        onConfirm={() => confirmDialog.surveyId && deleteSurvey(confirmDialog.surveyId)}
        onCancel={() => setConfirmDialog({ open: false })}
      />
      {clearPrompt.open && clearPrompt.survey && (
        <ClearPrompt
          open={clearPrompt.open}
          surveyTitle={getTranslatedContent(clearPrompt.survey).title}
          onConfirm={() => clearResponses(clearPrompt.survey!)}
          onCancel={() => setClearPrompt({ open: false })}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        {surveys.map((survey, idx) => {
          const content = getTranslatedContent(survey);
          const responseCount = responseCounts[survey.id] || 0;
          const gradientClass = getCardGradient(idx);

          return (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              className="relative group"
            >
              <Card
                className={`relative flex flex-col h-full bg-gradient-to-br ${gradientClass} backdrop-blur-sm border border-white/40 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-400/30`}
              >
                {/* Top accent bar – stays subtle */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />

                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {managementMode ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                            Survey #{idx + 1}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            {responseCount} {responseCount === 1 ? "response" : "responses"}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {content.title}
                      </CardTitle>
                      <CardDescription className="mt-1 text-slate-600 dark:text-slate-300 line-clamp-2 text-xs">
                        {content.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-2 px-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(survey.createdAt).toLocaleDateString()}</span>
                    </div>
                    {managementMode && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{survey.questions.length} questions</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="bg-white/40 dark:bg-slate-900/30 backdrop-blur-sm border-t border-white/30 dark:border-slate-700/30 p-3 flex flex-wrap gap-2 mt-auto">
                  {managementMode ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-xl h-9 text-xs font-medium shadow-sm transition-all"
                        onClick={() => onEditSurvey && onEditSurvey(survey)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 text-red-600 dark:text-red-400 hover:text-red-700 rounded-xl h-9 text-xs font-medium shadow-sm transition-all"
                        onClick={() => setConfirmDialog({ open: true, surveyId: survey.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-xl h-9 w-9 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all"
                        onClick={() => onTakeSurvey && onTakeSurvey(survey.id)}
                        title="Preview"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl h-9 w-9 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all"
                        onClick={() => copyShareLink(survey.id)}
                      >
                        {copiedId === survey.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-xl h-9 text-xs font-medium shadow-sm text-emerald-600 dark:text-emerald-400 transition-all"
                        onClick={() => exportXLSX(survey)}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                        Excel
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-xl h-9 text-xs font-medium shadow-sm text-amber-600 dark:text-amber-400 transition-all"
                        onClick={() => exportJSON(survey)}
                      >
                        <FileJson className="w-3.5 h-3.5 mr-1" />
                        JSON
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-xl h-9 w-9 bg-white/60 dark:bg-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all"
                        onClick={() => onViewResults && onViewResults(survey.id)}
                        title="Visual Results"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl h-9 w-9 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 hover:text-red-700 transition-all"
                        onClick={() => setClearPrompt({ open: true, survey })}
                        title="Clear Responses"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}