import React, { useState } from "react";
import { Question, QuestionType, Survey } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, GripVertical, X, HelpCircle, Copy, ChevronDown, ChevronUp, FileUp } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { motion, Reorder, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";

interface SurveyCreatorProps {
  initialData?: Survey;
  onCancel: () => void;
  onCreated: () => void;
}

// Helper to get question type icon and label
const getQuestionTypeInfo = (type: QuestionType) => {
  const types = {
    text: { icon: "📝", label: "Text Response" },
    "multiple-choice": { icon: "🔘", label: "Multiple Choice" },
    checkbox: { icon: "✅", label: "Checkboxes" },
    rating: { icon: "⭐", label: "Rating (1-5)" },
    boolean: { icon: "👍", label: "Yes / No" },
    location: { icon: "📍", label: "Location (GPS)" },
  };
  return types[type] || { icon: "📋", label: "Unknown" };
};

export default function SurveyCreator({ initialData, onCancel, onCreated }: SurveyCreatorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { token } = useAuth();

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json.title || !Array.isArray(json.questions)) {
          throw new Error("Invalid format: Title and Questions array are required.");
        }

        setTitle(json.title);
        setDescription(json.description || "");
        
        const importedQuestions = json.questions.map((q: any) => ({
          id: q.id || uuidv4(),
          text: q.text || "Untitled Question",
          type: q.type || "text",
          required: q.required ?? true,
          options: q.options || (q.type === "multiple-choice" || q.type === "checkbox" ? ["Option 1"] : undefined)
        }));

        setQuestions(importedQuestions);
        // Expand all imported questions for review
        setExpandedQuestions(new Set(importedQuestions.map((q: any) => q.id)));
      } catch (err: any) {
        alert("Failed to import JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      text: "",
      type: "text",
      required: true,
    };
    setQuestions([...questions, newQuestion]);
    // Auto-expand the new question
    setExpandedQuestions(prev => new Set(prev).add(newQuestion.id));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    const options = question.options || [];
    updateQuestion(questionId, { options: [...options, ""] });
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;
    const newOptions = [...question.options];
    newOptions[index] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;
    const newOptions = question.options.filter((_, i) => i !== index);
    updateQuestion(questionId, { options: newOptions });
  };

  const duplicateQuestion = (id: string) => {
    const original = questions.find(q => q.id === id);
    if (!original) return;
    const newQuestion: Question = {
      ...original,
      id: uuidv4(),
      text: original.text + " (Copy)",
      options: original.options ? [...original.options] : undefined,
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestions(prev => new Set(prev).add(newQuestion.id));
  };

  const toggleExpand = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveSurvey = async () => {
    if (!title.trim()) return alert("Please enter a title");
    if (questions.length === 0) return alert("Please add at least one question");
    // Validate questions
    for (const q of questions) {
      if (!q.text.trim()) return alert("Please fill in all question texts");
      if ((q.type === "multiple-choice" || q.type === "checkbox") && q.options) {
        if (q.options.length === 0 || q.options.some(opt => !opt.trim())) {
          return alert(`Please fill in all options for question: ${q.text || "Untitled"}`);
        }
      }
    }

    setIsSaving(true);
    try {
      const method = initialData ? "PUT" : "POST";
      const endpoint = initialData ? `/api/surveys/${initialData.id}` : "/api/surveys";
      const url = `${import.meta.env.VITE_API_BASE_URL || ""}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, description, questions }),
      });
      if (response.ok) {
        onCreated();
      } else {
        alert(`Failed to save survey`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10 md:pb-20">
      {/* Header with back and publish buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-white/30 dark:hover:bg-slate-700/50 rounded-full text-xs md:text-sm backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden xs:inline">{t("backToDashboard")}</span>
              <span className="xs:hidden">{t("back")}</span>
            </Button>
          </motion.div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              className="border-blue-500/30 dark:border-blue-400/30 hover:bg-blue-500/10 rounded-full text-xs md:text-sm backdrop-blur-sm"
            >
              <FileUp className="w-4 h-4 mr-1 md:mr-2 text-blue-500" />
              <span>Import JSON</span>
            </Button>
          </motion.div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={saveSurvey} size="sm" disabled={isSaving} className="rounded-xl shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1 md:mr-2" />
                {t("publish")}
              </>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Survey Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-card border-white/40 dark:border-slate-700/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
          <CardHeader className="pb-3 pt-4 md:pt-6 px-5 md:px-8 border-b border-white/30 dark:border-slate-700/30">
            <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {t("surveyDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-5 md:p-8">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{t("surveyTitle")}</span>
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Academic Research on Social Media Usage"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base md:text-lg font-medium bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/50 rounded-xl h-12 focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("description")}
              </Label>
              <Textarea
                id="description"
                placeholder="Explain the purpose of this survey..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/50 rounded-xl text-sm md:text-base resize-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t("questions")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Add and arrange your survey questions</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="secondary" onClick={addQuestion} className="bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              {t("add")}
            </Button>
          </motion.div>
        </div>

        <AnimatePresence mode="popLayout">
          {questions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No questions added yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Click "Add Question" to begin building your survey</p>
            </motion.div>
          ) : (
            <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
              {questions.map((q, index) => {
                const isExpanded = expandedQuestions.has(q.id);
                const typeInfo = getQuestionTypeInfo(q.type);
                return (
                  <Reorder.Item key={q.id} value={q}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="glass-card border-white/40 dark:border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl group">
                        {/* Question header with drag handle, title, expand/collapse, duplicate, delete */}
                        <div className="flex items-center gap-2 p-4 bg-white/30 dark:bg-slate-800/30 border-b border-white/20 dark:border-slate-700/30">
                          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="flex-1 flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
                              Q{index + 1}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <span>{typeInfo.icon}</span>
                              <span className="hidden sm:inline">{typeInfo.label}</span>
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${q.required ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                              {q.required ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-white/50 dark:hover:bg-slate-700"
                              onClick={() => duplicateQuestion(q.id)}
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                              onClick={() => removeQuestion(q.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => toggleExpand(q.id)}
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <CardContent className="p-5 md:p-6 space-y-5">
                                {/* Question text */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Question Text <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    placeholder="Enter your question here..."
                                    value={q.text}
                                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                    className="bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/50 rounded-xl h-11 text-base"
                                  />
                                </div>

                                {/* Question type selector */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Question Type
                                  </Label>
                                  <Select
                                    value={q.type}
                                    onValueChange={(val: QuestionType) => {
                                      const updates: Partial<Question> = { type: val };
                                      if (val === "multiple-choice" || val === "checkbox") {
                                        updates.options = q.options?.length ? q.options : [""];
                                      } else {
                                        updates.options = undefined;
                                      }
                                      updateQuestion(q.id, updates);
                                    }}
                                  >
                                    <SelectTrigger className="bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/50 rounded-xl h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass-panel border-white/40 dark:border-slate-700 rounded-xl">
                                      <SelectItem value="text">📝 Text Response</SelectItem>
                                      <SelectItem value="multiple-choice">🔘 Multiple Choice (Single)</SelectItem>
                                      <SelectItem value="checkbox">✅ Checkbox (Multiple)</SelectItem>
                                      <SelectItem value="rating">⭐ Rating (1-5)</SelectItem>
                                      <SelectItem value="boolean">👍 Yes / No</SelectItem>
                                      <SelectItem value="location">📍 Location Tracking (GPS)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Required toggle */}
                                <div className="flex items-center justify-between pt-2">
                                  <Label className="text-sm font-medium cursor-pointer" htmlFor={`required-${q.id}`}>
                                    Make this question required
                                  </Label>
                                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                    <input
                                      type="checkbox"
                                      id={`required-${q.id}`}
                                      checked={q.required}
                                      onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                                      className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-2 appearance-none cursor-pointer transition-colors duration-200"
                                    />
                                    <label
                                      htmlFor={`required-${q.id}`}
                                      className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-200 ${q.required ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'
                                        }`}
                                    />
                                  </div>
                                </div>

                                {/* Options for multiple choice / checkbox */}
                                {(q.type === "multiple-choice" || q.type === "checkbox") && (
                                  <div className="space-y-3 pl-2 border-l-2 border-blue-300/50 dark:border-blue-700/50">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                      <span>Answer Options</span>
                                      <span className="text-red-500">*</span>
                                    </Label>
                                    <AnimatePresence>
                                      {q.options?.map((opt, optIndex) => (
                                        <motion.div
                                          key={optIndex}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 10 }}
                                          className="flex gap-2 items-center"
                                        >
                                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                                            {String.fromCharCode(65 + optIndex)}
                                          </div>
                                          <Input
                                            placeholder={`Option ${optIndex + 1}`}
                                            value={opt}
                                            onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                                            className="flex-1 bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/50 rounded-xl h-10"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(q.id, optIndex)}
                                            className="h-9 w-9 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </motion.div>
                                      ))}
                                    </AnimatePresence>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl mt-2"
                                      onClick={() => addOption(q.id)}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Option
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}
        </AnimatePresence>
      </div>

      {/* Floating publish button for convenience (optional) */}
      {questions.length > 0 && (
        <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <Button
              onClick={saveSurvey}
              disabled={isSaving}
              className="rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-6"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Publish Survey
                </>
              )}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}