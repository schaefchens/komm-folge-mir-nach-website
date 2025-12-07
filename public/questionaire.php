<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Define questions with correct answers
$questions = [
    [
        'id' => 'q1',
        'title' => 'Wer führte das Volk Israel aus Ägypten?',
        'choices' => ['Mose', 'Abraham', 'David'],
        'correct' => 'Mose'
    ],
    [
        'id' => 'q2',
        'title' => 'In welcher Stadt wurde Jesus geboren?',
        'choices' => ['Bethlehem', 'Nazareth', 'Jerusalem'],
        'correct' => 'Bethlehem'
    ],
    [
        'id' => 'q3',
        'title' => 'Wie viele Jünger hatte Jesus?',
        'choices' => ['12', '7', '10'],
        'correct' => '12'
    ],
    [
        'id' => 'q4',
        'title' => 'Wer verriet Jesus?',
        'choices' => ['Judas', 'Petrus', 'Thomas'],
        'correct' => 'Judas'
    ],
    [
        'id' => 'q5',
        'title' => 'Was bedeutet das Wort \'Evangelium\'?',
        'choices' => ['Gute Nachricht', 'Heilige Schrift', 'Gottes Wort'],
        'correct' => 'Gute Nachricht'
    ],
    [
        'id' => 'q6',
        'title' => 'Welches ist das erste Buch der Bibel?',
        'choices' => ['Genesis', 'Exodus', 'Matthäus'],
        'correct' => 'Genesis'
    ],
    [
        'id' => 'q7',
        'title' => 'Was ist das größte Gebot laut Jesus?',
        'choices' => ['Gott und den Nächsten lieben', 'Nicht töten', 'Nicht stehlen'],
        'correct' => 'Gott und den Nächsten lieben'
    ],
    [
        'id' => 'q8',
        'title' => 'Wer schrieb die meisten Briefe im Neuen Testament?',
        'choices' => ['Paulus', 'Petrus', 'Johannes'],
        'correct' => 'Paulus'
    ],
    [
        'id' => 'q9',
        'title' => 'Was bedeutet Nachfolge Jesu?',
        'choices' => ['Sein Leben nach Jesu Lehren ausrichten', 'In die Kirche gehen', 'Die Bibel besitzen'],
        'correct' => 'Sein Leben nach Jesu Lehren ausrichten'
    ],
    [
        'id' => 'q10',
        'title' => 'Was geschah am dritten Tag nach Jesu Kreuzigung?',
        'choices' => ['Seine Auferstehung', 'Seine Himmelfahrt', 'Pfingsten'],
        'correct' => 'Seine Auferstehung'
    ]
];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Return all questions (without correct answers for security)
        $publicQuestions = array_map(function($q) {
            return [
                'id' => $q['id'],
                'title' => $q['title'],
                'choices' => $q['choices']
            ];
        }, $questions);

        echo json_encode([
            'success' => true,
            'questions' => $publicQuestions
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
        $totalQuestions = count($questions);
        $correctAnswers = 0;
        $results = [];

        // Create lookup map for questions
        $questionMap = [];
        foreach ($questions as $q) {
            $questionMap[$q['id']] = $q;
        }

        // Evaluate each answer
        foreach ($userAnswers as $questionId => $userAnswer) {
            if (!isset($questionMap[$questionId])) {
                continue; // Skip invalid question IDs
            }

            $question = $questionMap[$questionId];
            $isCorrect = false;

            // Handle different answer types
            if ($userAnswer === null) {
                $isCorrect = false; // Timeout/no answer
            } elseif ($userAnswer === 'Keine Antwort passt') {
                $isCorrect = false; // "None of the answers fit" is considered incorrect
            } else {
                $isCorrect = ($userAnswer === $question['correct']);
            }

            if ($isCorrect) {
                $correctAnswers++;
            }

            $results[] = [
                'questionId' => $questionId,
                'question' => $question['title'],
                'userAnswer' => $userAnswer,
                'correctAnswer' => $question['correct'],
                'isCorrect' => $isCorrect
            ];
        }

        // Calculate score percentage
        $score = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 1) : 0;

        // Determine assessment level based on score
        $assessment = '';
        if ($score >= 90) {
            $assessment = 'Ausgezeichnetes Bibelwissen! Du hast ein tiefes Verständnis der biblischen Grundlagen.';
        } elseif ($score >= 80) {
            $assessment = 'Sehr gutes Bibelwissen! Du bist gut mit den biblischen Geschichten vertraut.';
        } elseif ($score >= 70) {
            $assessment = 'Gutes Bibelwissen! Du hast solide Grundkenntnisse der Bibel.';
        } elseif ($score >= 60) {
            $assessment = 'Grundlegendes Bibelwissen vorhanden. Es gibt Raum für mehr Entdeckung.';
        } elseif ($score >= 40) {
            $assessment = 'Einführendes Bibelwissen. Die Bibel bietet noch viele Schätze zu entdecken.';
        } else {
            $assessment = 'Du stehst am Anfang deiner biblischen Entdeckungsreise. Jeder Anfang ist wertvoll!';
        }

        echo json_encode([
            'success' => true,
            'score' => $score,
            'correctAnswers' => $correctAnswers,
            'totalQuestions' => $totalQuestions,
            'assessment' => $assessment,
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
