import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronRight } from "lucide-react";

interface Question {
  id: string;
  title: string;
  choices: string[];
}

interface QuestionnaireProps {
  open: boolean;
  onComplete: (answers: Record<string, string | null>) => void;
  onOpenChange: (open: boolean) => void;
}

const Questionnaire = ({ open, onComplete, onOpenChange }: QuestionnaireProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [isAnswered, setIsAnswered] = useState(false);

  // Fetch questions (mocked for now)
  useEffect(() => {
    if (open) {
      // TODO: Replace with actual API call to /questions.php
      const mockQuestions: Question[] = [
        {
          id: "q1",
          title: "Hast du schon einmal in der Bibel gelesen?",
          choices: ["Ja, regelmäßig", "Ja, gelegentlich", "Nein, noch nie"]
        },
        {
          id: "q2",
          title: "Glaubst du an Gott?",
          choices: ["Ja, fest", "Ich bin unsicher", "Nein"]
        },
        {
          id: "q3",
          title: "Was bedeutet Nachfolge Jesu für dich?",
          choices: [
            "Jesus als Vorbild im Leben folgen",
            "Teil einer Gemeinschaft sein",
            "Ich weiß es nicht genau"
          ]
        }
      ];

      setQuestions(mockQuestions);
      setCurrentQuestionIndex(0);
      setShowChoices(false);
      setTimeLeft(5);
      setAnswers({});
      setIsAnswered(false);
    }
  }, [open]);

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

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowChoices(false);
      setTimeLeft(5);
      setIsAnswered(false);
    } else {
      onComplete(answers);
    }
  };

  const revealChoices = () => {
    setShowChoices(true);
    setTimeLeft(5);
  };

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const timeProgress = (timeLeft / 5) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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
      </DialogContent>
    </Dialog>
  );
};

export default Questionnaire;
