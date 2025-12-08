import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronRight } from "lucide-react";

// Timer constants (in milliseconds)
const QUESTION_SHOW_TIME = 3000; // Time to show question before auto-revealing choices (3 seconds)
const ANSWER_TIME = 7000; // Time to answer question once choices are revealed (7 seconds)

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

interface Scale {
  min: number;
  max: number;
  labels: Record<string, string>;
}

interface QuestionOption {
  value: string;
  label: string;
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

interface QuestionnaireProps {
  open: boolean;
  onComplete: (answers: Record<string, string | null>, score?: number, assessment?: string, results?: any[]) => void;
  onOpenChange: (open: boolean) => void;
}

const Questionnaire = ({ open, onComplete, onOpenChange, identifier }: QuestionnaireProps & { identifier: string }) => {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME / 1000);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questionnaireScore, setQuestionnaireScore] = useState<number>(0);
  const [questionnaireAssessment, setQuestionnaireAssessment] = useState<string>('');
  const [questionnaireResults, setQuestionnaireResults] = useState<any[]>([]);

  // Fetch questionnaire from PHP API
  useEffect(() => {
    if (open) {
      const fetchQuestionnaire = async () => {
        try {
          const url = identifier ? `/questionaire.php?identifier=${encodeURIComponent(identifier)}&questionnaire=glaubensfragebogen_v1` : '/questionaire.php?questionnaire=glaubensfragebogen_v1';
          const response = await fetch(url);
          const data = await response.json();

          if (data.success && data.sections) {
            setQuestionnaire(data.questionnaire);
            setSections(data.sections);
            setShowIntro(true);
            setCurrentSectionIndex(0);
            setCurrentQuestionIndex(0);
            setShowChoices(false);
            setTimeLeft(ANSWER_TIME / 1000);
            setAnswers({});
            setIsAnswered(false);
            setShowResults(false);
            setQuestionnaireScore(0);
            setQuestionnaireAssessment('');
            setQuestionnaireResults([]);
          } else {
            console.error('Failed to fetch questionnaire:', data.error);
            setSections([]);
          }
        } catch (error) {
          console.error('Error fetching questionnaire:', error);
          setSections([]);
        }
      };

      fetchQuestionnaire();
    }
  }, [open, identifier]);

  // Auto-reveal choices after 3 seconds
  useEffect(() => {
    if (!open || showChoices || isAnswered || showIntro || sections.length === 0) return;

    const currentSection = sections[currentSectionIndex];
    if (!currentSection || currentQuestionIndex >= currentSection.questions.length) return;

    const autoRevealTimer = setTimeout(() => {
      revealChoices();
    }, QUESTION_SHOW_TIME);

    return () => clearTimeout(autoRevealTimer);
  }, [open, showChoices, isAnswered, showIntro, currentSectionIndex, currentQuestionIndex, sections]);

  // Timer logic
  useEffect(() => {
    if (!open || !showChoices || isAnswered || sections.length === 0) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, open, showChoices, isAnswered, sections]);

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

    // Use latest answers if provided (to include the current answer due to React's async state)
    const finalAnswers = latestAnswers || answers;

    const currentSection = sections[currentSectionIndex];

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      // Next question in current section
      setCurrentQuestionIndex(prev => prev + 1);
      setShowChoices(false);
      setTimeLeft(ANSWER_TIME / 1000);
      setIsAnswered(false);
    } else if (currentSectionIndex < sections.length - 1) {
      // Next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setShowChoices(false);
      setTimeLeft(ANSWER_TIME / 1000);
      setIsAnswered(false);
    } else {
      // All questions completed - submit answers
      try {
        const response = await fetch('/questionaire.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: finalAnswers, identifier, questionnaire: 'glaubensfragebogen_v1' }),
        });

        const data = await response.json();

        if (data.success) {
          // Store results but don't show dialog yet - let parent component decide
          setQuestionnaireScore(data.overall_percentage);
          setQuestionnaireAssessment(data.assessment);
          setQuestionnaireResults(data.results);
          onComplete(finalAnswers, data.overall_percentage, data.assessment, data.results);
        } else {
          console.error('Failed to submit answers:', data.error);
          onComplete(finalAnswers); // Fallback without score
        }
      } catch (error) {
        console.error('Error submitting answers:', error);
        onComplete(finalAnswers); // Fallback without score
      }
    }
  };

  const revealChoices = () => {
    setShowChoices(true);
    setTimeLeft(ANSWER_TIME / 1000);
  };


  if (sections.length === 0) return null;

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection.questions[currentQuestionIndex];

  // Calculate overall progress
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
  const progress = (completedQuestions / totalQuestions) * 100;
  const timeProgress = (timeLeft / (ANSWER_TIME / 1000)) * 100;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {showIntro ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {questionnaire?.title || 'Glaubenseinschätzung'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <p className="text-lg text-center text-muted-foreground">
                {questionnaire?.description || 'Um dich besser einschätzen zu können, stellen wir dir Fragen zu verschiedenen Bereichen deines christlichen Glaubens.'}
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
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setShowIntro(false)}
                  size="lg"
                  className="bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
                >
                  Fragebogen starten
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
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
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
              {/* Question Title */}
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                  {currentQuestion.text}
                </h3>
                {!currentQuestion.required && (
                  <p className="text-sm text-muted-foreground">(Diese Frage ist optional)</p>
                )}
              </div>

              {!showChoices ? (
                /* Reveal Button */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={revealChoices}
                    size="lg"
                    className="bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
                  >
                    Antworten anzeigen
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <>
                  {/* Timer Bar */}
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

                  {/* Answer Choices */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {currentQuestion.type === 'single_choice' && currentQuestion.options ? (
                      <>
                        {currentQuestion.options.map((option, index) => (
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
                        {!currentQuestion.required && (
                          <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: currentQuestion.options.length * 0.1 }}
                            onClick={() => handleAnswer("")}
                            disabled={isAnswered}
                            className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                              isAnswered && answers[currentQuestion.id] === ""
                                ? 'border-primary bg-primary/10 font-semibold'
                                : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-accent'
                            } disabled:opacity-60`}
                          >
                            Überspringen
                          </motion.button>
                        )}
                      </>
                    ) : currentQuestion.type === 'likert' && currentQuestion.scale ? (
                      <div className="space-y-4">
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
                        {!currentQuestion.required && (
                          <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            onClick={() => handleAnswer("")}
                            disabled={isAnswered}
                            className={`w-full p-3 text-center rounded-lg border-2 transition-all duration-200 ${
                              isAnswered && answers[currentQuestion.id] === ""
                                ? 'border-primary bg-primary/10 font-semibold'
                                : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-accent'
                            } disabled:opacity-60`}
                          >
                            Überspringen
                          </motion.button>
                        )}
                      </div>
                    ) : null}
                  </motion.div>

                  {/* Timeout State */}
                  {isAnswered && answers[currentQuestion.id] === null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-4"
                    >
                      <p className="text-destructive font-semibold">
                        Zeit abgelaufen - Keine Antwort
                      </p>
                    </motion.div>
                  )}

                </>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    </>
  );
};

export default Questionnaire;
