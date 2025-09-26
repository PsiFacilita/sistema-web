<?php
declare(strict_types=1);

namespace App\Helpers;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

final class MailHelper
{
    /**
     * Cria um PHPMailer configurado a partir das variáveis .env que você definiu.
     *
     * Usa apenas:
     * - SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_ENCRYPTION
     * - MAIL_FROM_ADDRESS, MAIL_FROM_NAME (opcionais)
     * - SMTP_ALLOW_SELFSIGNED (opcional, 1/0)
     */
    private static function makeMailer(?string $secureOverride = null): PHPMailer
    {
        $mailer = new PHPMailer(true);
        $mailer->isSMTP();

        $host = $_ENV['SMTP_HOST'] ?? $_SERVER['SMTP_HOST'] ?? 'localhost';
        $port = (int)($_ENV['SMTP_PORT'] ?? $_SERVER['SMTP_PORT'] ?? 25);

        $username = (string)($_ENV['SMTP_USERNAME'] ?? $_SERVER['SMTP_USERNAME'] ?? '');
        $password = (string)($_ENV['SMTP_PASSWORD'] ?? $_SERVER['SMTP_PASSWORD'] ?? '');
        $auth = $username !== '';

        $encEnv = $secureOverride ?? ($_ENV['SMTP_ENCRYPTION'] ?? $_SERVER['SMTP_ENCRYPTION'] ?? '');
        $enc = strtolower(trim((string)$encEnv));

        if ($enc === 'ssl' || $enc === 'smtps' || $port === 465) {
            // TLS implícito (465)
            $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mailer->SMTPAutoTLS = true;
        } elseif ($enc === 'tls' || $enc === 'starttls') {
            // STARTTLS (587)
            $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mailer->SMTPAutoTLS = true;
        } else {
            // Sem TLS
            $mailer->SMTPSecure = false;
            $mailer->SMTPAutoTLS = false;
        }

        $mailer->Host     = $host;
        $mailer->Port     = $port;
        $mailer->SMTPAuth = $auth;

        if ($auth) {
            $mailer->Username = $username;
            $mailer->Password = $password;
        }

        // From padrão (opcional no .env)
        $fromEmail = $_ENV['MAIL_FROM_ADDRESS'] ?? $_SERVER['MAIL_FROM_ADDRESS'] ?? 'no-reply@example.com';
        $fromName  = $_ENV['MAIL_FROM_NAME']    ?? $_SERVER['MAIL_FROM_NAME']    ?? 'App';
        $mailer->setFrom($fromEmail, $fromName);

        // Permitir certificado self-signed (apenas se você quiser em dev)
        if (filter_var($_ENV['SMTP_ALLOW_SELFSIGNED'] ?? '0', FILTER_VALIDATE_BOOLEAN)) {
            $mailer->SMTPOptions = [
                'ssl' => [
                    'verify_peer'       => false,
                    'verify_peer_name'  => false,
                    'allow_self_signed' => true,
                ],
            ];
        }

        $mailer->CharSet = 'UTF-8';
        // $mailer->SMTPDebug = 2; // habilite para depurar
        return $mailer;
    }

    /**
     * Envia um e-mail simples e faz fallback automático sem TLS
     * se a falha estiver relacionada a STARTTLS.
     */
    public static function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        ?string $altBody = null
    ): void {
        $mailer = self::makeMailer();

        try {
            self::deliver($mailer, $toEmail, $toName, $subject, $htmlBody, $altBody);
        } catch (Exception $e) {
            $msg = $e->getMessage() ?? '';
            // Se o servidor não suportar STARTTLS, tenta sem TLS
            if (stripos($msg, 'STARTTLS') !== false || stripos($msg, 'Could not connect to SMTP host') !== false) {
                $fallback = self::makeMailer(''); // override para "none"
                self::deliver($fallback, $toEmail, $toName, $subject, $htmlBody, $altBody);
                return;
            }
            throw $e;
        }
    }

    private static function deliver(
        PHPMailer $mailer,
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        ?string $altBody
    ): void {
        $mailer->clearAllRecipients();
        $mailer->addAddress($toEmail, $toName);
        $mailer->Subject = $subject;
        $mailer->isHTML(true);
        $mailer->Body    = $htmlBody;
        $mailer->AltBody = $altBody ?? strip_tags($htmlBody);
        $mailer->send();
    }
}
