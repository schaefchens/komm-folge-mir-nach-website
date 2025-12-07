import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Trophy, Target, BookOpen, PartyPopper } from "lucide-react";

interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuestionnaireResultsProps {
  score: number;
  assessment: string;
  results: QuestionResult[];
  onClose: () => void;
}

const QuestionnaireResults = ({
  score,
  assessment,
  results,
  onClose
}: QuestionnaireResultsProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const correctAnswers = results.filter(r => r.isCorrect).length;
  const totalQuestions = results.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Success Message */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-warm flex items-center justify-center shadow-elegant"
        >
          <PartyPopper className="w-10 h-10 text-white" />
        </motion.div>
        
        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
          Willkommen in der Gemeinschaft!
        </h3>
        <p className="text-lg text-muted-foreground">
          Du hast soeben eine Nachricht mit dem Link zur Community erhalten.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Score Display */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium">Deine Glaubenseinschätzung</span>
        </div>
        
        <div className="relative">
          <div className="w-28 h-28 mx-auto rounded-full border-8 border-primary/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{score}%</div>
              <div className="text-xs text-muted-foreground">Punktzahl</div>
            </div>
          </div>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          {assessment}
        </p>

        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {correctAnswers} von {totalQuestions} richtig
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {results.filter(r => r.isCorrect).length}
          </div>
          <div className="text-xs text-muted-foreground">Richtig</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">
            {results.filter(r => !r.isCorrect && r.userAnswer !== null).length}
          </div>
          <div className="text-xs text-muted-foreground">Falsch</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">
            {results.filter(r => r.userAnswer === null).length}
          </div>
          <div className="text-xs text-muted-foreground">Timeout</div>
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
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
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
                        <span className={result.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                          {result.userAnswer || 'Zeit abgelaufen'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Richtige Antwort:</span>{' '}
                        <span className="text-green-700 dark:text-green-400">{result.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Button */}
      <div className="pt-4 border-t border-border/50">
        <Button
          onClick={onClose}
          size="lg"
          className="w-full bg-gradient-warm text-white hover:shadow-hover transition-all duration-300 rounded-2xl"
        >
          Fertig
        </Button>
      </div>
    </motion.div>
  );
};

export default QuestionnaireResults;
