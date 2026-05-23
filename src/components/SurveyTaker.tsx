import React, { useState, useEffect } from "react";
import { Survey, Question, Language } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, CheckCircle2, MapPin, Navigation, Loader2, Star, Sparkles, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";

interface SurveyTakerProps {
  surveyId: string;
  onComplete: () => void;
  onBack: () => void;
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
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const bgColor = toast.type === "error" ? "from-red-500 to-rose-500" : toast.type === "success" ? "from-green-500 to-emerald-500" : "from-blue-500 to-indigo-500";
  const Icon = toast.type === "error" ? XCircle : toast.type === "success" ? CheckCircle2 : Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
    >
      <div className={`pointer-events-auto max-w-sm w-full bg-gradient-to-r ${bgColor} text-white rounded-xl shadow-2xl p-3 flex items-center gap-3`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function SurveyTaker({ surveyId, onComplete, onBack }: SurveyTakerProps) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage>({ show: false, message: "", type: "error" });
  const { t, language } = useLanguage();

  const showToast = (message: string, type: "error" | "success" | "info" = "error") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => setToast(prev => ({ ...prev, show: false }));

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/surveys/${surveyId}`)
      .then(res => res.json())
      .then(data => {
        setSurvey(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        showToast("Failed to load survey. Please try again.", "error");
      });
  }, [surveyId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, answers }),
      });
      if (response.ok) {
        setIsCompleted(true);
      } else {
        showToast("Submission failed. Please try again.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
          </div>
        </div>
        <p className="mt-5 text-slate-500 dark:text-slate-400 text-sm font-medium">Loading survey...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass-panel border-white/40 rounded-2xl p-6 text-center w-full max-w-sm">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-lg mb-1">Survey Not Found</CardTitle>
          <CardDescription className="text-sm">The survey you're looking for doesn't exist or has been removed.</CardDescription>
          <Button className="mt-5 w-full h-11 rounded-xl" onClick={onBack}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const getTranslatedContent = () => {
    if (language === "en" || !survey.translations?.[language]) {
      return { title: survey.title, description: survey.description };
    }
    return {
      title: survey.translations[language].title,
      description: survey.translations[language].description
    };
  };

  const getTranslatedQuestion = (q: Question) => {
    if (language === "en" || !survey.translations?.[language]?.questions?.[q.id]) {
      return q;
    }
    const tq = survey.translations[language].questions[q.id];
    return {
      ...q,
      text: tq.text,
      options: tq.options || q.options
    };
  };

  const content = getTranslatedContent();
  const currentQuestion = survey.questions[currentStep];
  const isLastStep = currentStep === survey.questions.length - 1;

  const nextStep = () => {
    if (currentQuestion.required) {
      const answer = answers[currentQuestion.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        showToast("Please answer this question before proceeding.", "error");
        return;
      }
      if (currentQuestion.type === "location" && !answer?.latitude) {
        showToast("Please capture your location before proceeding.", "error");
        return;
      }
    }
    if (currentStep < survey.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const captureLocation = () => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      const getPosition = (options: PositionOptions) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toISOString()
            };
            setAnswers({ ...answers, [currentQuestion.id]: loc });
            setLocationLoading(false);
          },
          (error) => {
            if (options.enableHighAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
              getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
              return;
            }
            let errorMessage = "Failed to capture location. ";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += "Please allow location access.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += "Please enable GPS.";
                break;
              case error.TIMEOUT:
                errorMessage += "Request timed out. Try again.";
                break;
              default:
                errorMessage += "Unknown error.";
                break;
            }
            showToast(errorMessage, "error");
            setLocationLoading(false);
          },
          options
        );
      };
      getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
      showToast("Geolocation not supported.", "error");
      setLocationLoading(false);
    }
  };

  // Completion screen
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-full max-w-sm"
        >
          <Card className="text-center py-8 glass-panel border-white/40 rounded-2xl shadow-2xl">
            <CardContent className="space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg"
              >
                <CheckCircle2 className="text-white w-8 h-8" />
              </motion.div>
              <CardTitle className="text-xl font-bold">{t("thankYou")}</CardTitle>
              <CardDescription className="text-sm">Your response has been recorded successfully.</CardDescription>
              <Button className="mt-2 w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500" onClick={onComplete}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} onClose={hideToast} />
      <div className="min-h-screen relative z-10 py-3 px-3">
        <div className="max-w-2xl mx-auto glass-panel rounded-2xl overflow-hidden flex flex-col min-h-[90vh] shadow-xl">
          {/* Header – compact, stacked */}
          <header className="px-4 pt-5 pb-3 border-b border-white/30">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 h-10 px-3 rounded-full -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("back")}
            </Button>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-block">
                {t("activeResearch")}
              </span>
              <h1 className="text-lg font-bold text-slate-800 leading-tight line-clamp-2">
                {content.title}
              </h1>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                  <span>Progress</span>
                  <span>{currentStep + 1} / {survey.questions.length}</span>
                </div>
                <div className="h-1.5 bg-white/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / survey.questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Question area – scrollable */}
          <main className="flex-1 px-4 py-5 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentQuestion && (() => {
                  const tq = getTranslatedQuestion(currentQuestion);
                  const currentAnswer = answers[currentQuestion.id];
                  const isAnswered = currentAnswer !== undefined && currentAnswer !== null && currentAnswer !== "" && (!Array.isArray(currentAnswer) || currentAnswer.length > 0);

                  return (
                    <Card className="glass-card border-white/40 rounded-xl shadow-md overflow-hidden">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all ${isAnswered
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-sm"
                            : "bg-gradient-to-br from-blue-500 to-indigo-500"
                            }`}>
                            {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : currentStep + 1}
                          </div>
                          <CardTitle className="text-base font-bold leading-tight text-slate-800 pt-0.5">
                            {tq.text}
                            {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 pb-4 px-4">
                        {/* TEXT INPUT */}
                        {currentQuestion.type === "text" && (
                          <div className="relative">
                            <Input
                              value={currentAnswer || ""}
                              onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                              placeholder="Type your answer..."
                              className="bg-white/60 border-white/40 rounded-lg h-11 px-4 text-sm focus:ring-2 focus:ring-blue-500/50"
                            />
                            {currentAnswer && (
                              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                            )}
                          </div>
                        )}

                        {/* MULTIPLE CHOICE */}
                        {currentQuestion.type === "multiple-choice" && (
                          <RadioGroup
                            value={currentAnswer || ""}
                            onValueChange={(val) => {
                              const idx = tq.options?.indexOf(val);
                              const englishVal = idx !== undefined && idx !== -1 ? currentQuestion.options![idx] : val;
                              setAnswers({ ...answers, [currentQuestion.id]: englishVal });
                            }}
                            className="space-y-2"
                          >
                            {tq.options?.map((opt, i) => {
                              const englishOpt = currentQuestion.options![i];
                              const isSelected = currentAnswer === englishOpt;
                              return (
                                <motion.div
                                  key={i}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: englishOpt })}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-white/40 bg-white/40 hover:bg-white/60"
                                    }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-500 bg-blue-500" : "border-slate-400"
                                    }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <Label className="flex-1 cursor-pointer text-sm font-medium text-slate-700">
                                    {opt}
                                  </Label>
                                </motion.div>
                              );
                            })}
                          </RadioGroup>
                        )}

                        {/* CHECKBOX */}
                        {currentQuestion.type === "checkbox" && (
                          <div className="space-y-2">
                            {tq.options?.map((opt, i) => {
                              const englishOpt = currentQuestion.options![i];
                              const selectedValues: string[] = currentAnswer || [];
                              const isSelected = selectedValues.includes(englishOpt);
                              return (
                                <motion.div
                                  key={i}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    const next = isSelected
                                      ? selectedValues.filter(v => v !== englishOpt)
                                      : [...selectedValues, englishOpt];
                                    setAnswers({ ...answers, [currentQuestion.id]: next });
                                  }}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-white/40 bg-white/40 hover:bg-white/60"
                                    }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "border-blue-500 bg-blue-500" : "border-slate-400"
                                    }`}>
                                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                  <Label className="flex-1 cursor-pointer text-sm font-medium text-slate-700">
                                    {opt}
                                  </Label>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                        {/* RATING */}
                        {currentQuestion.type === "rating" && (
                          <div className="flex justify-between gap-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <motion.button
                                key={num}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={() => setAnswers({ ...answers, [currentQuestion.id]: num })}
                                className={`flex-1 aspect-square rounded-lg border transition-all font-bold text-base flex flex-col items-center justify-center gap-0.5 ${currentAnswer === num
                                  ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-500 text-white shadow-md"
                                  : "bg-white/60 border-white/40 text-slate-500"
                                  }`}
                              >
                                <Star className={`w-4 h-4 ${currentAnswer === num ? "fill-white" : ""}`} />
                                <span>{num}</span>
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {/* BOOLEAN */}
                        {currentQuestion.type === "boolean" && (
                          <div className="flex gap-3">
                            {[
                              { value: "Yes", labelEn: "Yes", labelAm: "አዎ", labelTi: "እወ", gradient: "from-emerald-400 to-emerald-600" },
                              { value: "No", labelEn: "No", labelAm: "አይደለም", labelTi: "ኣይፋል", gradient: "from-rose-400 to-rose-600" }
                            ].map((opt) => {
                              const isSelected = currentAnswer === opt.value;
                              const label = language === "am" ? opt.labelAm : language === "ti" ? opt.labelTi : opt.labelEn;
                              return (
                                <motion.button
                                  key={opt.value}
                                  whileTap={{ scale: 0.95 }}
                                  type="button"
                                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: opt.value })}
                                  className={`flex-1 py-3 rounded-lg border transition-all font-bold text-base ${isSelected
                                    ? `bg-gradient-to-r ${opt.gradient} text-white shadow-md`
                                    : "bg-white/60 border-white/40 text-slate-600"
                                    }`}
                                >
                                  {label}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}

                        {/* LOCATION */}
                        {currentQuestion.type === "location" && (
                          <div className="space-y-3">
                            <div className={`p-4 rounded-xl border-2 border-dashed text-center ${currentAnswer?.latitude
                              ? "bg-emerald-500/10 border-emerald-500/40"
                              : "bg-white/40 border-white/40"
                              }`}>
                              <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center shadow ${currentAnswer?.latitude ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                                }`}>
                                {currentAnswer?.latitude ? <CheckCircle2 className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                              </div>
                              <h3 className={`text-base font-bold mt-2 ${currentAnswer?.latitude ? "text-emerald-700" : "text-slate-700"
                                }`}>
                                {currentAnswer?.latitude ? "Location Captured" : "Share Your Location"}
                              </h3>
                              {currentAnswer?.latitude && (
                                <p className="text-xs font-mono text-slate-600 mt-1">
                                  {currentAnswer.latitude.toFixed(5)}, {currentAnswer.longitude.toFixed(5)}
                                </p>
                              )}
                              <button
                                disabled={locationLoading}
                                onClick={captureLocation}
                                className={`mt-3 w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition ${currentAnswer?.latitude
                                  ? "bg-white border border-emerald-200 text-emerald-600"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow"
                                  }`}
                              >
                                {locationLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Navigation className="w-4 h-4" />
                                    {currentAnswer?.latitude ? "Recapture" : "Capture"}
                                  </>
                                )}
                              </button>
                            </div>
                            {currentAnswer?.accuracy && (
                              <div className="bg-white/50 rounded-lg p-2.5 text-xs text-slate-600 flex items-center gap-2">
                                <Navigation className="w-3.5 h-3.5 text-blue-500" />
                                Accuracy: ±{currentAnswer.accuracy.toFixed(1)}m
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer – fixed height buttons */}
          <footer className="px-4 py-4 border-t border-white/30 flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="secondary"
                className="flex-1 h-11 rounded-lg bg-white/60 hover:bg-white/80 text-slate-700 font-medium text-sm"
                onClick={prevStep}
              >
                {t("previous")}
              </Button>
            )}
            <Button
              className={`${currentStep > 0 ? "flex-[2]" : "w-full"} h-11 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-md`}
              onClick={isLastStep ? () => handleSubmit() : nextStep}
              disabled={isSubmitting}
            >
              {isLastStep ? (
                isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("submitting")}
                  </span>
                ) : (
                  <>
                    {t("submitSurvey")}
                    <Send className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )
              ) : (
                t("next")
              )}
            </Button>
          </footer>
        </div>
      </div>
    </>
  );
}

// Info icon for toast (if needed)
function Info(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}