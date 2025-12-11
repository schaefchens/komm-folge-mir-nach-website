import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronRight, BookOpen, Trophy, Target, PartyPopper, ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Generate cryptographic identifier hash from name and questionnaire id
const generateIdentifier = async (name: string, questionnaireId: string): Promise<string> => {
  const input = `${name.trim()}_${questionnaireId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
};

// Timer constants (in milliseconds)
const QUESTION_SHOW_TIME = 3000;
const ANSWER_TIME = 7000;

// Helper function to format time in minutes and seconds
const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} Sekunden`;
  } else if (seconds === 0) {
    return `${minutes} Minute${minutes > 1 ? 'n' : ''}`;
  } else {
    return `${minutes} Minute${minutes > 1 ? 'n' : ''} und ${seconds} Sekunde${seconds > 1 ? 'n' : ''}`;
  }
};

interface QuestionnaireListItem {
  id: string;
  title: string;
  description: string;
}

interface QuestionOption {
  value: string;
  label: string;
}

interface Scale {
  min: number;
  max: number;
  labels: Record<string, string>;
}

interface Question {
  id: string;
  section_id: string;
  dimension: string;
  type: 'single_choice' | 'likert';
  text: string;
  required: boolean;
  options?: QuestionOption[];
  scale?: Scale;
}

interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface QuestionnaireData {
  id: string;
  title: string;
  description: string;
  dimensions: Array<{ id: string; label: string }>;
}

interface QuestionResult {
  questionId: string;
  question: string;
  section_id: string;
  dimension: string;
  userAnswer: string | null;
  score: number;
  maxScore: number;
  answered: boolean;
  required: boolean;
}

interface DimensionScore {
  label: string;
  score: number;
  percentage: number;
  questions_answered: number;
}

interface ResultsData {
  overall_score: number;
  overall_percentage: number;
  dimension_scores: Record<string, DimensionScore>;
  assessment: string;
  results: QuestionResult[];
}

interface QuestionnaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewState = 'list' | 'intro' | 'questions' | 'results';

const QuestionnaireModal = ({ open, onOpenChange }: QuestionnaireModalProps) => {
  const [view, setView] = useState<ViewState>('list');
  const [questionnaireList, setQuestionnaireList] = useState<QuestionnaireListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  
  // Questionnaire state
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME / 1000);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [isAnswered, setIsAnswered] = useState(false);
  
  // Results state
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch questionnaire list on open
  useEffect(() => {
    if (open) {
      setView('list');
      setUserName(""); // Reset name when dialog opens
      setLoading(true);
      fetch('/questionaire.php?list=true')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.questionnaires) {
            setQuestionnaireList(data.questionnaires);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open]);

  // Fetch specific questionnaire when selected
  const selectQuestionnaire = async (id: string) => {
    setSelectedQuestionnaireId(id);
    setLoading(true);
    try {
      // Only generate identifier if user provided a name
      let url = `/questionaire.php?questionnaire=${encodeURIComponent(id)}&fresh=true`;
      if (userName.trim()) {
        const identifier = await generateIdentifier(userName, id);
        url += `&identifier=${encodeURIComponent(identifier)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.sections) {
        setQuestionnaire(data.questionnaire);
        setSections(data.sections);
        resetQuestionnaireState();
        setView('intro');
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionnaireState = () => {
    setCurrentSectionIndex(0);
    setCurrentQuestionIndex(0);
    setShowChoices(false);
    setTimeLeft(ANSWER_TIME / 1000);
    setAnswers({});
    setIsAnswered(false);
    setResultsData(null);
    setShowDetails(false);
  };

  // Auto-reveal choices after 3 seconds
  useEffect(() => {
    if (view !== 'questions' || showChoices || isAnswered || sections.length === 0) return;

    const currentSection = sections[currentSectionIndex];
    if (!currentSection || currentQuestionIndex >= currentSection.questions.length) return;

    const autoRevealTimer = setTimeout(() => {
      setShowChoices(true);
      setTimeLeft(ANSWER_TIME / 1000);
    }, QUESTION_SHOW_TIME);

    return () => clearTimeout(autoRevealTimer);
  }, [view, showChoices, isAnswered, currentSectionIndex, currentQuestionIndex, sections]);

  // Timer logic
  useEffect(() => {
    if (view !== 'questions' || !showChoices || isAnswered || sections.length === 0) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, view, showChoices, isAnswered, sections]);

  const handleTimeout = () => {
    if (sections.length === 0) return;

    const currentSection = sections[currentSectionIndex];
    const currentQuestion = currentSection.questions[currentQuestionIndex];
    const updatedAnswers = { ...answers, [currentQuestion.id]: null };
    setAnswers(updatedAnswers);
    setIsAnswered(true);

    setTimeout(() => {
      moveToNextQuestion(updatedAnswers);
    }, 1500);
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered || sections.length === 0) return;

    const currentSection = sections[currentSectionIndex];
    const currentQuestion = currentSection.questions[currentQuestionIndex];
    const updatedAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(updatedAnswers);
    setIsAnswered(true);

    setTimeout(() => {
      moveToNextQuestion(updatedAnswers);
    }, 800);
  };

  const moveToNextQuestion = async (latestAnswers?: Record<string, string | null>) => {
    if (sections.length === 0) return;

    const finalAnswers = latestAnswers || answers;
    const currentSection = sections[currentSectionIndex];

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowChoices(false);
      setTimeLeft(ANSWER_TIME / 1000);
      setIsAnswered(false);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setShowChoices(false);
      setTimeLeft(ANSWER_TIME / 1000);
      setIsAnswered(false);
    } else {
      // All questions completed - submit answers
      try {
        const requestBody: any = { answers: finalAnswers };
        if (userName.trim()) {
          const identifier = await generateIdentifier(userName, selectedQuestionnaireId!);
          requestBody.identifier = identifier;
        }

        const response = await fetch(`/questionaire.php?questionnaire=${encodeURIComponent(selectedQuestionnaireId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const data = await response.json();
        if (data.success) {
          setResultsData({
            overall_score: data.overall_score,
            overall_percentage: data.overall_percentage,
            dimension_scores: data.dimension_scores,
            assessment: data.assessment,
            results: data.results,
          });
          setView('results');
        }
      } catch (error) {
        console.error('Error submitting answers:', error);
      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setView('list');
    resetQuestionnaireState();
    setUserName("");
  };

  const goBackToList = () => {
    setView('list');
    resetQuestionnaireState();
  };

  // Calculate progress
  let totalQuestions = 0;
  let completedQuestions = 0;
  sections.forEach((section, sectionIdx) => {
    totalQuestions += section.questions.length;
    if (sectionIdx < currentSectionIndex) {
      completedQuestions += section.questions.length;
    } else if (sectionIdx === currentSectionIndex) {
      completedQuestions += currentQuestionIndex;
    }
  });
  const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
  const timeProgress = (timeLeft / (ANSWER_TIME / 1000)) * 100;

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* LIST VIEW */}
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  Glaubensprüfung
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <p className="text-muted-foreground text-center">
                  Wähle einen Fragebogen aus, um dein Glaubenswissen zu testen.
                </p>

                <div className="space-y-2">
                  <label htmlFor="userName" className="text-sm font-medium text-muted-foreground">
                    Dein Name (optional)
                  </label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Gib deinen Namen ein..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wenn angegeben, wird Dein Test gespeichert.
                  </p>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questionnaireList.map((q) => (
                      <motion.button
                        key={q.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectQuestionnaire(q.id)}
                        className="w-full p-4 text-left rounded-xl border-2 border-border bg-background hover:border-primary/50 hover:bg-accent transition-all duration-200"
                      >
                        <h4 className="font-semibold text-foreground">{q.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* INTRO VIEW */}
          {view === 'intro' && questionnaire && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl">{questionnaire.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <p className="text-lg text-center text-muted-foreground">
                  {questionnaire.description}
                </p>
                <p className="text-center text-muted-foreground">
                  Du hast pro Frage {ANSWER_TIME / 1000} Sekunden Zeit zum Antworten.
                  Antworte spontan und ehrlich!
                </p>
                {(() => {
                  const totalQuestions = sections.reduce((total, section) => total + section.questions.length, 0);
                  const estimatedTime = (QUESTION_SHOW_TIME + ANSWER_TIME) * totalQuestions;
                  return (
                    <p className="text-center text-muted-foreground font-medium">
                      Geschätzte Dauer: {formatDuration(estimatedTime)} ({totalQuestions} Fragen)
                    </p>
                  );
                })()}
                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={goBackToList}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zurück
                  </Button>
                  <Button
                    onClick={() => setView('questions')}
                    size="lg"
                    className="bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
                  >
                    Fragebogen starten
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* QUESTIONS VIEW */}
          {view === 'questions' && currentQuestion && (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {currentSection.title} - Frage {currentQuestionIndex + 1} von {currentSection.questions.length}
                </DialogTitle>
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Abschnitt {currentSectionIndex + 1} von {sections.length}</span>
                    <span>{Math.round(progress)}% abgeschlossen</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-8 py-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentSectionIndex}-${currentQuestionIndex}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                        {currentQuestion.text}
                      </h3>
                    </div>

                    {!showChoices ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex justify-center"
                      >
                        <Button
                          onClick={() => {
                            setShowChoices(true);
                            setTimeLeft(ANSWER_TIME / 1000);
                          }}
                          size="lg"
                          className="bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
                        >
                          Antworten anzeigen
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </motion.div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Zeit verbleibend
                            </span>
                            <span className="font-semibold">{timeLeft}s</span>
                          </div>
                          <Progress
                            value={timeProgress}
                            className="h-2"
                            style={{
                              background: timeLeft <= 2 ? 'hsl(var(--destructive) / 0.2)' : undefined
                            }}
                          />
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          {currentQuestion.type === 'single_choice' && currentQuestion.options?.map((option, index) => (
                            <motion.button
                              key={option.value}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleAnswer(option.value)}
                              disabled={isAnswered}
                              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                                isAnswered && answers[currentQuestion.id] === option.value
                                  ? 'border-primary bg-primary/10 font-semibold'
                                  : 'border-border bg-background hover:border-primary/50 hover:bg-accent'
                              } disabled:opacity-60`}
                            >
                              {option.label}
                            </motion.button>
                          ))}
                          {currentQuestion.type === 'likert' && currentQuestion.scale && (
                            <div className="grid grid-cols-5 gap-2">
                              {Array.from({ length: currentQuestion.scale.max - currentQuestion.scale.min + 1 }, (_, i) => {
                                const value = currentQuestion.scale!.min + i;
                                const label = currentQuestion.scale!.labels[value.toString()] || value.toString();
                                return (
                                  <motion.button
                                    key={value}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => handleAnswer(value.toString())}
                                    disabled={isAnswered}
                                    className={`p-3 text-center rounded-lg border-2 transition-all duration-200 text-sm ${
                                      isAnswered && answers[currentQuestion.id] === value.toString()
                                        ? 'border-primary bg-primary/10 font-semibold'
                                        : 'border-border bg-background hover:border-primary/50 hover:bg-accent'
                                    } disabled:opacity-60`}
                                  >
                                    <div className="font-semibold">{value}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* RESULTS VIEW */}
          {view === 'results' && resultsData && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-warm flex items-center justify-center shadow-elegant"
                >
                  <PartyPopper className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-foreground">
                  Deine Ergebnisse
                </h3>
              </div>

              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Deine Glaubenseinschätzung</span>
                </div>

                <div className="w-28 h-28 mx-auto rounded-full border-8 border-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{Math.round(resultsData.overall_percentage)}%</div>
                    <div className="text-xs text-muted-foreground">Gesamtscore</div>
                  </div>
                </div>

                <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {resultsData.assessment.split('\n\n')[0]}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-center">Detaillierte Einschätzung</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(resultsData.dimension_scores).map(([key, dimScore]) => (
                    <div key={key} className="bg-muted/30 rounded-lg p-3 text-center">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        {dimScore.label}
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {Math.round(dimScore.percentage)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <BookOpen className="w-4 h-4" />
                  {showDetails ? 'Details ausblenden' : 'Details anzeigen'}
                </Button>
              </div>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 max-h-60 overflow-y-auto"
                  >
                    {resultsData.results.map((result, index) => {
                      const scorePercentage = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
                      const isGoodScore = scorePercentage >= 60;

                      return (
                        <div
                          key={result.questionId}
                          className={`p-4 rounded-lg border-2 ${
                            result.answered && isGoodScore
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                              : result.answered
                              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                              : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                          }`}
                        >
                          <h4 className="font-medium text-sm">
                            Frage {index + 1}: {result.question}
                          </h4>
                          <div className="text-sm mt-2">
                            <span className="font-medium">Deine Antwort:</span>{' '}
                            <span className={result.answered ? 'text-foreground' : 'text-muted-foreground'}>
                              {result.answered ? result.userAnswer || 'Übersprungen' : 'Nicht beantwortet'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={goBackToList} className="flex-1">
                  Anderen Fragebogen wählen
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
                >
                  Fertig
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionnaireModal;
