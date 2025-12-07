import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronRight } from "lucide-react";
import QuestionnaireResults from "./QuestionnaireResults";

// Timer constants (in milliseconds)
const QUESTION_SHOW_TIME = 3000; // Time to show question before auto-revealing choices (3 seconds)
const ANSWER_TIME = 7000; // Time to answer question once choices are revealed (7 seconds)

interface Question {
  id: string;
  title: string;
  choices: string[];
}

interface QuestionnaireProps {
  open: boolean;
  onComplete: (answers: Record<string, string | null>, score?: number, assessment?: string, results?: any[]) => void;
  onOpenChange: (open: boolean) => void;
  onProceedToSignup?: (resultsSummary: string) => void;
}

const Questionnaire = ({ open, onComplete, onOpenChange, onProceedToSignup, identifier }: QuestionnaireProps & { identifier: string }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME / 1000);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questionnaireScore, setQuestionnaireScore] = useState<number>(0);
  const [questionnaireAssessment, setQuestionnaireAssessment] = useState<string>('');
  const [questionnaireResults, setQuestionnaireResults] = useState<any[]>([]);

  // Fetch questions from PHP API
  useEffect(() => {
    if (open) {
      const fetchQuestions = async () => {
        try {
          const url = identifier ? `/questionaire.php?identifier=${encodeURIComponent(identifier)}` : '/questionaire.php';
          const response = await fetch(url);
          const data = await response.json();

          if (data.success && data.questions) {
            setQuestions(data.questions);
            setShowIntro(true);
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
            console.error('Failed to fetch questions:', data.error);
            // Fallback to empty questions array
            setQuestions([]);
          }
        } catch (error) {
          console.error('Error fetching questions:', error);
          setQuestions([]);
        }
      };

      fetchQuestions();
    }
  }, [open]);

  // Auto-reveal choices after 3 seconds
  useEffect(() => {
    if (!open || showChoices || isAnswered || showIntro) return;

    const autoRevealTimer = setTimeout(() => {
      revealChoices();
    }, QUESTION_SHOW_TIME);

    return () => clearTimeout(autoRevealTimer);
  }, [open, showChoices, isAnswered, showIntro, currentQuestionIndex]);

  // Timer logic
  useEffect(() => {
    if (!open || !showChoices || isAnswered) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, open, showChoices, isAnswered]);

  const handleTimeout = () => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: null }));
    setIsAnswered(true);
    
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const handleAnswer = (choice: string) => {
    if (isAnswered) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: choice }));
    setIsAnswered(true);

    setTimeout(() => {
      moveToNextQuestion();
    }, 800);
  };

  const moveToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowChoices(false);
      setTimeLeft(ANSWER_TIME / 1000);
      setIsAnswered(false);
    } else {
      // Submit answers to get score and show results
      try {
        const response = await fetch('/questionaire.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers, identifier }),
        });

        const data = await response.json();

        if (data.success) {
          setQuestionnaireScore(data.score);
          setQuestionnaireAssessment(data.assessment);
          setQuestionnaireResults(data.results);
          setShowResults(true);
          onComplete(answers, data.score, data.assessment, data.results);
        } else {
          console.error('Failed to submit answers:', data.error);
          onComplete(answers); // Fallback without score
        }
      } catch (error) {
        console.error('Error submitting answers:', error);
        onComplete(answers); // Fallback without score
      }
    }
  };

  const revealChoices = () => {
    setShowChoices(true);
    setTimeLeft(ANSWER_TIME / 1000);
  };

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timeProgress = (timeLeft / (ANSWER_TIME / 1000)) * 100;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {showIntro ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Glaubenseinschätzung
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <p className="text-lg text-center text-muted-foreground">
                Um dich besser einschätzen zu können, stellen wir dir ein paar kurze Fragen 
                zu deinem Glauben und Bibelwissen.
              </p>
              <p className="text-center text-muted-foreground">
                Du hast pro Frage {ANSWER_TIME / 1000} Sekunden Zeit zum Antworten.
                Antworte spontan und ehrlich!
              </p>
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
              <DialogTitle className="text-2xl">
                Frage {currentQuestionIndex + 1} von {questions.length}
              </DialogTitle>
              <Progress value={progress} className="h-2" />
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
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {currentQuestion.title}
                </h3>
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
                    {currentQuestion.choices.map((choice, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleAnswer(choice)}
                        disabled={isAnswered}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                          isAnswered && answers[currentQuestion.id] === choice
                            ? 'border-primary bg-primary/10 font-semibold'
                            : 'border-border bg-background hover:border-primary/50 hover:bg-accent'
                        } disabled:opacity-60`}
                      >
                        {choice}
                      </motion.button>
                    ))}
                    
                    {/* None option */}
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: currentQuestion.choices.length * 0.1 }}
                      onClick={() => handleAnswer("Keine Antwort passt")}
                      disabled={isAnswered}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                        isAnswered && answers[currentQuestion.id] === "Keine Antwort passt"
                          ? 'border-primary bg-primary/10 font-semibold'
                          : 'border-border bg-muted/50 hover:border-primary/50 hover:bg-accent'
                      } disabled:opacity-60`}
                    >
                      Keine Antwort passt
                    </motion.button>
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

    {/* Results Dialog */}
    <QuestionnaireResults
      open={showResults}
      onOpenChange={(open) => {
        setShowResults(open);
        if (!open) {
          onOpenChange(false); // Close the whole questionnaire when results are closed
        }
      }}
      score={questionnaireScore}
      assessment={questionnaireAssessment}
      results={questionnaireResults}
      onProceedToSignup={() => {
        if (onProceedToSignup) {
          // Generate formatted results summary for URL parameter
          let summary = `Punktzahl: ${questionnaireScore}%\n`;
          summary += `Richtige Antworten: ${questionnaireResults.filter((r: any) => r.isCorrect).length}/${questionnaireResults.length}\n`;
          summary += `Bewertung: ${questionnaireAssessment}\n\n`;
          summary += `Detailierte Ergebnisse:\n`;

          questionnaireResults.forEach((result: any, index: number) => {
            const status = result.isCorrect ? '✓' : (result.userAnswer === null ? '⏰' : '✗');
            summary += `${index + 1}. ${result.question.substring(0, 50)}...\n`;
            summary += `   Antwort: ${result.userAnswer || 'Zeit abgelaufen'}\n`;
            summary += `   Korrekt: ${result.correctAnswer} ${status}\n\n`;
          });

          onProceedToSignup(encodeURIComponent(summary));
        }
      }}
    />
    </>
  );
};

export default Questionnaire;
