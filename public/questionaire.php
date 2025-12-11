<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Create questionnaires directory if it doesn't exist
$questionnairesDir = __DIR__ . '/questionnaires';
if (!is_dir($questionnairesDir)) {
    mkdir($questionnairesDir, 0755, true);
}

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load questionnaire from JSON file
function loadQuestionnaire($questionnaireId) {
    global $questionnairesDir;

    $filename = $questionnaireId . '.json';
    $filepath = $questionnairesDir . '/' . $filename;

    if (!file_exists($filepath)) {
        return null;
    }

    $json = file_get_contents($filepath);
    $questionnaire = json_decode($json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }

    return $questionnaire;
}

// Validate questionnaire structure
function validateQuestionnaire($questionnaire) {
    if (!isset($questionnaire['id'], $questionnaire['questions'], $questionnaire['dimensions'])) {
        return false;
    }

    foreach ($questionnaire['questions'] as $question) {
        if (!isset($question['id'], $question['type'], $question['text'])) {
            return false;
        }
    }

    return true;
}

// Get questionnaire ID from request
$questionnaireId = isset($_GET['questionnaire']) ? trim($_GET['questionnaire']) : null;

// Check if listing questionnaires is requested
$listQuestionnaires = isset($_GET['list']) && $_GET['list'] === 'true';

// Check if checking for existing questionnaire results
$checkExists = isset($_GET['check_exists']) && $_GET['check_exists'] === 'true';
$checkIdentifier = isset($_GET['identifier']) ? trim($_GET['identifier']) : null;

if ($checkExists && $checkIdentifier) {
    // Check if questionnaire results exist for the given identifier
    $resultsFile = $questionnairesDir . '/' . $checkIdentifier . '.json';
    $exists = file_exists($resultsFile);

    echo json_encode([
        'success' => true,
        'exists' => $exists
    ]);
    exit();
}

if ($listQuestionnaires) {
    // Hardcoded array of available questionnaire files
    $availableQuestionnaires = [
        'glaubensfragebogen_v1',
        'simple_beliefs_v1'
    ];

    $questionnaireList = [];

    foreach ($availableQuestionnaires as $qId) {
        $questionnaireData = loadQuestionnaire($qId);
        if ($questionnaireData && validateQuestionnaire($questionnaireData)) {
            $questionnaireList[] = [
                'id' => $questionnaireData['id'],
                'title' => $questionnaireData['title'],
                'description' => $questionnaireData['description']
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'questionnaires' => $questionnaireList
    ]);
    exit();
}

// Default questionnaire if none specified
if (!$questionnaireId) {
    $questionnaireId = 'glaubensfragebogen_v1';
}

// Load questionnaire
$questionnaire = loadQuestionnaire($questionnaireId);
if (!$questionnaire || !validateQuestionnaire($questionnaire)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Questionnaire not found or invalid: ' . $questionnaireId
    ]);
    exit();
}

// Generate assessment text based on scores
function generateAssessment($overallScore, $dimensionResults, $questionnaire) {
    $score = round($overallScore, 1);

    // Overall assessment based on score
    $overallText = '';
    if ($score >= 4.5) {
        $overallText = 'Hervorragende christliche Reife! Du zeigst ein tiefes Verständnis und eine starke Praxis des christlichen Glaubens.';
    } elseif ($score >= 4.0) {
        $overallText = 'Sehr gute christliche Grundlagen! Du hast eine solide Basis in Glauben, Praxis und Reife entwickelt.';
    } elseif ($score >= 3.5) {
        $overallText = 'Gute christliche Entwicklung! Du bist auf einem guten Weg mit Raum für Wachstum in verschiedenen Bereichen.';
    } elseif ($score >= 3.0) {
        $overallText = 'Solide christliche Grundlagen! Es gibt Bereiche, in denen du wachsen kannst, aber du hast eine gute Basis.';
    } elseif ($score >= 2.5) {
        $overallText = 'Entwickelnde christliche Identität! Du bist auf der Suche und hast bereits einige wichtige Schritte gemacht.';
    } elseif ($score >= 2.0) {
        $overallText = 'Anfängliche christliche Entdeckung! Du stehst am Beginn deiner Glaubensreise.';
    } else {
        $overallText = 'Beginn der christlichen Entdeckungsreise! Jeder Anfang ist wertvoll und Gott freut sich über jeden Schritt.';
    }

    // Dimension-specific feedback
    $dimensionFeedback = [];
    $dimensionsMap = [];

    // Create lookup map for dimensions
    foreach ($questionnaire['dimensions'] as $dimension) {
        $dimensionsMap[$dimension['id']] = $dimension;
    }

    foreach ($dimensionResults as $id => $result) {
        $dimScore = $result['score'];
        $feedback = '';

        // Get feedback from questionnaire definition
        if (isset($dimensionsMap[$id]) && isset($dimensionsMap[$id]['feedback_levels'])) {
            $feedbackLevels = $dimensionsMap[$id]['feedback_levels'];

            // Check feedback levels in order (highest first)
            if ($dimScore >= 4 && isset($feedbackLevels['4+'])) {
                $feedback = $feedbackLevels['4+'];
            } elseif ($dimScore >= 3 && isset($feedbackLevels['3+'])) {
                $feedback = $feedbackLevels['3+'];
            } elseif ($dimScore >= 2 && isset($feedbackLevels['2+'])) {
                $feedback = $feedbackLevels['2+'];
            } elseif (isset($feedbackLevels['default'])) {
                $feedback = $feedbackLevels['default'];
            } else {
                $feedback = 'Entwicklungspotenzial vorhanden.';
            }
        } else {
            // Fallback if no feedback levels defined
            $feedback = 'Entwicklungspotenzial vorhanden.';
        }

        $dimensionFeedback[] = $result['label'] . ': ' . $feedback;
    }

    return $overallText . "\n\n" . 'Detailierte Einschätzung:' . "\n" . implode("\n", $dimensionFeedback);
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get identifier from query parameter
        $identifier = isset($_GET['identifier']) ? trim($_GET['identifier']) : null;

        // Check for fresh parameter - delete existing questionnaire if requested
        $fresh = isset($_GET['fresh']) && $_GET['fresh'] === 'true';
        if ($fresh && $identifier) {
            $resultsFile = $questionnairesDir . '/' . $identifier . '.json';
            if (file_exists($resultsFile)) {
                unlink($resultsFile);
            }
        }

        // Return questionnaire data
        $publicQuestions = [];
        foreach ($questionnaire['questions'] as $question) {
            $publicQuestion = [
                'id' => $question['id'],
                'section_id' => $question['section_id'],
                'dimension' => $question['dimension'],
                'type' => $question['type'],
                'text' => $question['text'],
                'required' => $question['required'] ?? true
            ];

            // Add type-specific data
            if ($question['type'] === 'single_choice') {
                $publicQuestion['options'] = array_map(function($option) {
                    return [
                        'value' => $option['value'],
                        'label' => $option['label']
                    ];
                }, $question['options']);
            } elseif ($question['type'] === 'likert') {
                $scale = $questionnaire['scales'][$question['scale_ref']];
                $publicQuestion['scale'] = $scale;
            }

            $publicQuestions[] = $publicQuestion;
        }

        // Group questions by section
        $sections = [];
        foreach ($questionnaire['sections'] as $section) {
            $sectionQuestions = array_filter($publicQuestions, function($q) use ($section) {
                return $q['section_id'] === $section['id'];
            });
            $sections[] = [
                'id' => $section['id'],
                'title' => $section['title'],
                'description' => $section['description'],
                'questions' => array_values($sectionQuestions)
            ];
        }

        echo json_encode([
            'success' => true,
            'questionnaire' => [
                'id' => $questionnaire['id'],
                'title' => $questionnaire['title'],
                'description' => $questionnaire['description'],
                'dimensions' => $questionnaire['dimensions']
            ],
            'sections' => $sections,
            'identifier' => $identifier
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Process user answers and calculate score
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['answers'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid request format. Expected JSON with answers object.'
            ]);
            exit();
        }

        $userAnswers = $input['answers'];
        $identifier = isset($input['identifier']) ? trim($input['identifier']) : null;

        // Create lookup map for questions
        $questionMap = [];
        foreach ($questionnaire['questions'] as $q) {
            $questionMap[$q['id']] = $q;
        }

        // Initialize scoring data
        $dimensionScores = [];
        $dimensionCounts = [];
        foreach ($questionnaire['dimensions'] as $dimension) {
            $dimensionScores[$dimension['id']] = 0;
            $dimensionCounts[$dimension['id']] = 0;
        }

        $results = [];
        $totalAnswered = 0;
        $totalRequired = 0;

        // Evaluate each answer
        foreach ($userAnswers as $questionId => $userAnswer) {
            if (!isset($questionMap[$questionId])) {
                continue; // Skip invalid question IDs
            }

            $question = $questionMap[$questionId];
            $score = 0;
            $maxScore = 5; // Default max score
            $answered = false;

            // Handle different question types
            if ($userAnswer === null || $userAnswer === '') {
                // No answer
                $answered = false;
            } else {
                $answered = true;
                $totalAnswered++;

                if ($question['type'] === 'single_choice') {
                    // Check if question has custom scoring
                    if (isset($question['scoring'][$userAnswer])) {
                        $score = $question['scoring'][$userAnswer];
                    } elseif (isset($question['scale_ref'])) {
                        // Use scale values if defined
                        $scale = $questionnaire['scales'][$question['scale_ref']];
                        if (isset($scale['values'][$userAnswer])) {
                            $score = $scale['values'][$userAnswer];
                            $maxScore = max($scale['values']);
                        } else {
                            // Default to treating answer as numeric
                            $score = is_numeric($userAnswer) ? (int)$userAnswer : 0;
                        }
                    }
                } elseif ($question['type'] === 'likert') {
                    // Likert scale - answer should be numeric
                    $score = is_numeric($userAnswer) ? (int)$userAnswer : 0;
                    $scale = $questionnaire['scales'][$question['scale_ref']];
                    $maxScore = $scale['max'];
                }
            }

            if ($question['required']) {
                $totalRequired++;
            }

            // Add to dimension score
            $dimension = $question['dimension'];
            if ($answered) {
                $dimensionScores[$dimension] += $score;
                $dimensionCounts[$dimension]++;
            }

            $results[] = [
                'questionId' => $questionId,
                'question' => $question['text'],
                'section_id' => $question['section_id'],
                'dimension' => $question['dimension'],
                'userAnswer' => $userAnswer,
                'score' => $score,
                'maxScore' => $maxScore,
                'answered' => $answered,
                'required' => $question['required']
            ];
        }

        // Calculate dimension scores
        $dimensionResults = [];
        foreach ($questionnaire['dimensions'] as $dimension) {
            $id = $dimension['id'];
            $count = $dimensionCounts[$id];
            $rawScore = $dimensionScores[$id];

            if ($count > 0) {
                // Average score for this dimension
                $avgScore = $rawScore / $count;
                $dimensionResults[$id] = [
                    'label' => $dimension['label'],
                    'score' => round($avgScore, 2),
                    'percentage' => round(($avgScore / 5) * 100, 1),
                    'questions_answered' => $count
                ];
            } else {
                $dimensionResults[$id] = [
                    'label' => $dimension['label'],
                    'score' => 0,
                    'percentage' => 0,
                    'questions_answered' => 0
                ];
            }
        }

        // Calculate overall score using weighted average
        $scoringRules = $questionnaire['scoring_rules'];
        $overallScore = 0;
        $totalWeight = 0;

        foreach ($scoringRules['overall']['weights'] as $dimensionId => $weight) {
            if (isset($dimensionResults[$dimensionId])) {
                $overallScore += $dimensionResults[$dimensionId]['score'] * $weight;
                $totalWeight += $weight;
            }
        }

        if ($totalWeight > 0) {
            $overallScore = $overallScore / $totalWeight;
        }

        $overallPercentage = round(($overallScore / 5) * 100, 1);

        // Generate assessment based on overall score
        $assessment = generateAssessment($overallScore, $dimensionResults, $questionnaire);

        // Save results to disk if identifier is provided
        if ($identifier) {
            $resultData = [
                'identifier' => $identifier,
                'questionnaire_id' => $questionnaire['id'],
                'timestamp' => date('Y-m-d H:i:s'),
                'overall_score' => $overallScore,
                'overall_percentage' => $overallPercentage,
                'dimension_scores' => $dimensionResults,
                'assessment' => $assessment,
                'total_answered' => $totalAnswered,
                'total_required' => $totalRequired,
                'results' => $results,
                'userAnswers' => $userAnswers
            ];

            $filename = $questionnairesDir . '/' . $identifier . '.json';
            file_put_contents($filename, json_encode($resultData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        echo json_encode([
            'success' => true,
            'overall_score' => $overallScore,
            'overall_percentage' => $overallPercentage,
            'dimension_scores' => $dimensionResults,
            'assessment' => $assessment,
            'total_answered' => $totalAnswered,
            'total_required' => $totalRequired,
            'results' => $results
        ]);

    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'error' => 'Method not allowed. Use GET to retrieve questions or POST to submit answers.'
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
