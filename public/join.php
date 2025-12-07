<?php
// ===================================================================
// 1. KONFIGURATION
// ===================================================================
//const INVITATION_URL = 'https://wolke.der-weg-des-herrn.de/call/4pgjurtc';
const INVITATION_URL = 'https://wolke.der-weg-des-herrn.de/apps/collectives/p/mp424wr7cXHNdC5/Gemeinschaft-2';
const INVITATION_MSG = "Komm, Folge Mir Nach!\n\nHier ist Dein Einladungslink für Deine Nachfolge:\n\n";

const TWILIO_SID           = 'TWILIO_ACCOUNT_SID_PURGED';
const TWILIO_AUTH_TOKEN    = 'TWILIO_AUTH_TOKEN_PURGED';
const TWILIO_MESSAGING_SID = 'TWILIO_MESSAGING_SID_PURGED';

// Set SMS provider: 'twilio' or 'hetzner'
const SMS_PROVIDER = 'hetzner';

// SMTP Konfiguration für Email Versand
$SMTP_CONFIG = [
    'host' => 'mail.your-server.de', // SMTP Server
    'port' => 587,                // SMTP Port
    'username' => 'info@komm-folge-mir-nach.de', // SMTP Benutzername
    'password' => 'SMTP_PASSWORD_PURGED',    // SMTP Passwort
    'from' => 'info@komm-folge-mir-nach.de', // Absenderadresse
    'from_name' => 'Komm, Folge Mir Nach!'
];

const ADMIN_EMAIL="info@komm-folge-mir-nach.de";

// ===================================================================
// 2. CORS – NUR DEINE DOMAINS ERLAUBT (maximale Sicherheit)
// ===================================================================
$allowedOrigins = [
    'https://komm-folge-mir-nach.de',
    'https://www.komm-folge-mir-nach.de'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Kein gültiger Origin → CORS blockieren (Browser sieht keinen ACAO-Header)
    // Wir geben trotzdem JSON zurück, aber ohne CORS → Browser blockiert den Zugriff
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');
header('Vary: Origin');

// OPTIONS-Preflight sofort beantworten und beenden
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Falls kein gültiger Origin → ab hier trotzdem weiterlaufen, aber Browser kann Antwort nicht lesen
// (zusätzliche Absicherung gegen Missbrauch von außerhalb)

// ===================================================================

// 3. Parameter prüfen
// ===================================================================
// Service und Empfänger prüfen
$service = strtolower($_GET['to'] ?? '');
$mobile  = trim($_GET['mobile'] ?? '');
$email   = trim($_GET['email'] ?? '');

// Neue Parameter: message, code und questionnaire_results
$userMessage = isset($_GET['message']) ? trim($_GET['message']) : '';
$userCode    = isset($_GET['code']) ? trim($_GET['code']) : '';
$questionnaireResults = isset($_GET['questionnaire_results']) ? $_GET['questionnaire_results'] : null;

if (!in_array($service, ['sms', 'whatsapp', 'email'], true)) {
    echo json_encode(['success' => false, 'message' => 'Parameter "to" muss "sms", "whatsapp" oder "email" sein']);
    exit;
}

if ($service === 'email') {
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Ungültige Email-Adresse']);
        exit;
    }
} else {
    if (empty($mobile) || strlen($mobile) < 8 || strlen($mobile) > 20) {
        echo json_encode(['success' => false, 'message' => 'Ungültige Mobilnummer']);
        exit;
    }
}

// ===================================================================
// 4. Nummer normalisieren → +49...
// ===================================================================
if ($service !== 'email') {
    if (substr($mobile, 0, 2) === '00') {
        $mobile = '+' . substr($mobile, 2);
    } elseif ($mobile[0] === '0') {
        $mobile = '+49' . substr($mobile, 1);
    } elseif ($mobile[0] !== '+') {
        $mobile = '+49' . $mobile;
    }
}

// ===================================================================
// 5. Nachricht zusammenbauen
// ===================================================================
$text = INVITATION_MSG . INVITATION_URL;

// WhatsApp braucht das "whatsapp:" Prefix
$to = ($service === 'whatsapp') ? "whatsapp:{$mobile}" : $mobile;

// ===================================================================
// 6. Versand über Twilio Messaging Service
// ===================================================================
// 6. Versand über Twilio oder Hetzner SMS
// ===================================================================
// ===================================================================
// 6. Versand
// ===================================================================
$provider = SMS_PROVIDER;
$result = null;

if ($service === 'email') {
    // $result = sendInvitationEmail($email, $text, $SMTP_CONFIG);
    $result = sendInvitationEmailNative($email, $text, $SMTP_CONFIG);

} elseif ($service === 'sms' && $provider === 'hetzner') {
    $domain   = 'komm-folge-mir-nach.de';        // Hetzner SMS Konsole Domain
    $passwort = 'HETZNER_SMS_PASSWORD_PURGED';          // Hetzner SMS Konsole
    // $mobile ist jetzt garantiert im Format +49176... (durch deine Normalisierung oben)
    if (substr($mobile, 0, 3) !== '+49') {
        echo json_encode(['success' => false, 'message' => 'Hetzner unterstützt nur deutsche Nummern']);
        exit;
    }
    $land   = '+49';                                      // immer +49
    $nummer = '0' . substr($mobile, 3);                   // +49176... → 0176...
    $nummer = ltrim($nummer, '0');                        // führende Nullen weg außer eine
    $nummer = '0' . $nummer;                              // wieder eine 0 vorne → garantiert 01...
    if (!preg_match('/^0[1-9]\d{8,10}$/', $nummer)) {
        echo json_encode(['success' => false, 'message' => 'Ungültige deutsche Mobilnummer für Hetzner']);
        exit;
    }
    $absender = 'DerWeg';
    require_once 'sms.php';
    $sms = new SMS('https://konsoleh.your-server.de/');
    $resultArr = $sms->send($domain, $passwort, $land, $nummer, $text, $absender);
    $result = [
        'success' => $resultArr[0] == 1,
        'message' => $resultArr[1]
    ];
} else {
    $result = sendViaTwilioMessagingService($to, $text);
}

echo json_encode([
    'success'  => $result['success'],
    'message'  => $result['message'],
    'sent_to'  => $service,
    'mobile'   => $mobile,
    'email'    => $email
]);

// Send info email to admin in all cases
$adminEmail = ADMIN_EMAIL;
if (!empty($email)) {
    $userIdent = "Email: \"$email\"";
} elseif (!empty($mobile)) {
    $userIdent = "Mobilnummer: \"$mobile\"";
} else {
    $userIdent = "(keine Kontaktdaten)";
}
$adminText = "Ein Interessent mit $userIdent und Code ($userCode) will Komm, Folge Mir Nach! beitreten. Eine Einladung wurde versendet. Er schrieb folgende Nachricht:\n\n\"$userMessage\"";

// Add questionnaire results to admin email if available
if ($questionnaireResults) {
    $adminText .= "\n\n=== GLAUBENSEINSCHÄTZUNG ===\n" . $questionnaireResults;
}

sendInvitationEmailNative($adminEmail, $adminText, $SMTP_CONFIG);

exit;

// ===================================================================
function sendInvitationEmail(string $toEmail, string $body, array $config): array
{
    // PHPMailer laden (muss installiert sein, z.B. via Composer)
    require_once __DIR__ . '/PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/PHPMailer/SMTP.php';
    require_once __DIR__ . '/PHPMailer/Exception.php';

    $mail = new PHPMailer\PHPMailer\PHPMailer();
    $mail->isSMTP();
    $mail->Host = $config['host'];
    $mail->Port = $config['port'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];
    $mail->setFrom($config['from'], $config['from_name']);
    $mail->addAddress($toEmail);
    $mail->Subject = 'Dein Einladungslink: Komm, Folge Mir Nach!';
    $mail->Body = $body;

    if ($mail->send()) {
        return [
            'success' => true,
            'message' => 'Email gesendet'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Email Versand fehlgeschlagen: ' . $mail->ErrorInfo
        ];
    }
}

// ===================================================================
// 7. Email-Versand-Funktion mit mail()
// ===================================================================
function sendInvitationEmailNative(string $toEmail, string $body, array $config): array
{
    $subject = 'Dein Einladungslink: Komm, Folge Mir Nach!';
    $headers = "From: \"" . $config['from_name'] . "\" <" . $config['from'] . ">\r\n" .
               "Reply-To: " . $config['from'] . "\r\n" .
               "Content-Type: text/plain; charset=UTF-8\r\n";

    if (mail($toEmail, $subject, $body, $headers)) {
        return [
            'success' => true,
            'message' => 'Email gesendet (mail())'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Email Versand fehlgeschlagen (mail())'
        ];
    }
}

// ===================================================================
// 7. Twilio-Versand-Funktion
// ===================================================================
function sendViaTwilioMessagingService(string $to, string $body): array
{
    $sid    = TWILIO_SID;
    $token  = TWILIO_AUTH_TOKEN;
    $msgSid = TWILIO_MESSAGING_SID;

    $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";

    $data = [
        'To'                  => $to,
        'MessagingServiceSid' => $msgSid,
        'Body'                => $body
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($data),
        CURLOPT_USERPWD        => $sid . ':' . $token,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT        => 15
    ]);

    $response  = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 201) {
        return [
            'success' => true,
            'message' => $to && strpos($to, 'whatsapp:') === 0 ? 'WhatsApp gesendet' : 'SMS gesendet'
        ];
    }

    $errorMsg = 'Unbekannter Fehler';
    if ($curlError) {
        $errorMsg = 'cURL Fehler: ' . $curlError;
    } else {
        $decoded = json_decode($response, true);
        $errorMsg = $decoded['message'] ?? $decoded['error_message'] ?? "Twilio Fehler (HTTP $httpCode)";
    }

    return [
        'success' => false,
        'message' => 'Versand fehlgeschlagen: ' . $errorMsg
    ];
}
