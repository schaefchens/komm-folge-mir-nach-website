import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Trophy, Target, BookOpen, PartyPopper } from "lucide-react";

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

interface QuestionnaireResultsProps {
  overall_score: number;
  overall_percentage: number;
  dimension_scores: Record<string, DimensionScore>;
  assessment: string;
  results: QuestionResult[];
  onClose: () => void;
}

const QuestionnaireResults = ({
  overall_score,
  overall_percentage,
  dimension_scores,
  assessment,
  results,
  onClose
}: QuestionnaireResultsProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const answeredQuestions = results.filter(r => r.answered).length;
  const totalQuestions = results.length;
  const requiredQuestions = results.filter(r => r.required).length;
  const answeredRequired = results.filter(r => r.required && r.answered).length;

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
              <div className="text-2xl font-bold text-primary">{Math.round(overall_percentage)}%</div>
              <div className="text-xs text-muted-foreground">Gesamtscore</div>
            </div>
          </div>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
          {assessment.split('\n\n')[0]}
        </p>

        <div className="flex justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            {answeredRequired} von {requiredQuestions} Pflichtfragen beantwortet
          </Badge>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-center">Detaillierte Einschätzung</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(dimension_scores).map(([key, dimScore]) => (
            <div key={key} className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                {dimScore.label}
              </div>
              <div className="text-lg font-bold text-primary">
                {Math.round(dimScore.percentage)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {dimScore.questions_answered} Fragen
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {answeredQuestions}
          </div>
          <div className="text-xs text-muted-foreground">Beantwortet</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">
            {results.filter(r => r.userAnswer === null).length}
          </div>
          <div className="text-xs text-muted-foreground">Timeout</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {overall_score.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Durchschnitt</div>
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
            {results.map((result, index) => {
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
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {result.answered ? (
                        isGoodScore ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Target className="w-5 h-5 text-blue-600" />
                        )
                      ) : (
                        <Clock className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">
                          Frage {index + 1}: {result.question}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {dimension_scores[result.dimension]?.label || result.dimension}
                        </Badge>
                      </div>

                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">Deine Antwort:</span>{' '}
                          <span className={result.answered ? 'text-foreground' : 'text-muted-foreground'}>
                            {result.answered ? result.userAnswer || 'Übersprungen' : 'Nicht beantwortet'}
                          </span>
                        </div>
                        {result.answered && (
                          <div>
                            <span className="font-medium">Bewertung:</span>{' '}
                            <span className={isGoodScore ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}>
                              {result.score}/{result.maxScore} ({Math.round(scorePercentage)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
