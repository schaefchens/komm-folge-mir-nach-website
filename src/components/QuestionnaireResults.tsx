import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Trophy, Target, BookOpen } from "lucide-react";

interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuestionnaireResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  assessment: string;
  results: QuestionResult[];
  onProceedToSignup?: () => void;
}

const QuestionnaireResults = ({
  open,
  onOpenChange,
  score,
  assessment,
  results,
  onProceedToSignup
}: QuestionnaireResultsProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const correctAnswers = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;

  // Generate formatted results for URL parameter
  const generateResultsSummary = () => {
    let summary = `Punktzahl: ${score}%\n`;
    summary += `Richtige Antworten: ${correctAnswers}/${totalQuestions}\n`;
    summary += `Bewertung: ${assessment}\n\n`;
    summary += `Detailierte Ergebnisse:\n`;

    results.forEach((result, index) => {
      const status = result.isCorrect ? '✓' : (result.userAnswer === null ? '⏰' : '✗');
      summary += `${index + 1}. ${result.question.substring(0, 50)}...\n`;
      summary += `   Antwort: ${result.userAnswer || 'Zeit abgelaufen'}\n`;
      summary += `   Korrekt: ${result.correctAnswer} ${status}\n\n`;
    });

    return encodeURIComponent(summary);
  };

  const handleProceedToSignup = () => {
    if (onProceedToSignup) {
      onProceedToSignup();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            Glaubenseinschätzung Abgeschlossen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Score Display */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 mx-auto rounded-full border-8 border-primary/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{score}%</div>
                  <div className="text-sm text-muted-foreground">Punktzahl</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Dein Ergebnis</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {assessment}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {correctAnswers} von {totalQuestions} richtig
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.isCorrect).length}
              </div>
              <div className="text-sm text-muted-foreground">Richtig</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {results.filter(r => !r.isCorrect && r.userAnswer !== null).length}
              </div>
              <div className="text-sm text-muted-foreground">Falsch</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {results.filter(r => r.userAnswer === null).length}
              </div>
              <div className="text-sm text-muted-foreground">Timeout</div>
            </div>
          </div>

          {/* Detailed Results Toggle */}
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

          {/* Detailed Results */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {results.map((result, index) => (
                  <div
                    key={result.questionId}
                    className={`p-4 rounded-lg border-2 ${
                      result.isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {result.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : result.userAnswer === null ? (
                          <Clock className="w-5 h-5 text-orange-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-sm">
                          Frage {index + 1}: {result.question}
                        </h4>

                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Deine Antwort:</span>{' '}
                            <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {result.userAnswer || 'Zeit abgelaufen'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Richtige Antwort:</span>{' '}
                            <span className="text-green-700">{result.correctAnswer}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proceed Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleProceedToSignup}
              size="lg"
              className="w-full bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
            >
              Schließen
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Deine Ergebnisse werden automatisch in deine Anmeldung übernommen
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionnaireResults;
