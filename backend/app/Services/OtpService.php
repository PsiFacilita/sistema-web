<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\Otp;
use App\Models\TrustedDevice;
use App\Models\User;
use App\Helpers\MailHelper;
use Ramsey\Uuid\Uuid;

final class OtpService
{
    public function __construct(
        protected string $appName = 'PsiFacilita',
        protected ?Otp $otp = null,
        protected ?TrustedDevice $td = null,
        protected ?User $user = null
    ) {
        $this->otp  = $this->otp ?? new Otp();
        $this->td   = $this->td  ?? new TrustedDevice();
        $this->user = $this->user ?? new User();
    }

    public function emitir(int $usuarioId, int $ttlMinutos = 10): array
    {
        $codigo    = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $hash      = password_hash($codigo, PASSWORD_ARGON2ID);
        $desafioId = Uuid::uuid4()->toString();
        $expiraEm  = (new \DateTimeImmutable("+{$ttlMinutos} minutes"))->format('Y-m-d H:i:s');

        $this->otp->criar($usuarioId, $desafioId, $hash, $expiraEm);

        return ['desafio_id' => $desafioId, 'codigo' => $codigo, 'expira_em' => $expiraEm];
    }

    public function enviarCodigo(int $usuarioId, int $ttlMinutos = 10): string
    {
        $user = $this->user->findById($usuarioId);
        if (!$user) {
            throw new \RuntimeException("Usuário não encontrado");
        }

        $emitido = $this->emitir($usuarioId, $ttlMinutos);

        MailHelper::send(
            toEmail:  $user->email,
            toName:   $user->name ?? $user->email,
            subject:  $this->appName . ' - Código de verificação',
            htmlBody:
            '<p>Olá, ' . htmlspecialchars($user->name ?? '', ENT_QUOTES, 'UTF-8') . '</p>'
            . '<p>Seu código de verificação é:</p>'
            . '<h2 style="font-size:24px;letter-spacing:4px;">' . htmlspecialchars($emitido['codigo'], ENT_QUOTES, 'UTF-8') . '</h2>'
            . '<p>Esse código expira em ' . (int)$ttlMinutos . ' minutos.</p>',
            altBody:  "Seu código de verificação é: {$emitido['codigo']} (expira em {$ttlMinutos} minutos)."
        );

        return $emitido['desafio_id'];
    }

    public function verificar(string $desafioId, string $codigo, int $maxTentativas = 5): ?int
    {
        $row = $this->otp->buscarPorDesafio($desafioId);
        if (!$row) return null;
        if ((int)$row['usado'] === 1) return null;
        if ((int)$row['tentativas'] >= $maxTentativas) return null;
        if (new \DateTimeImmutable() > new \DateTimeImmutable($row['expira_em'])) return null;

        $ok = password_verify($codigo, $row['codigo_hash']);
        $this->otp->incrementarTentativas((int)$row['id']);
        if (!$ok) return null;

        $this->otp->marcarUsado((int)$row['id']);
        return (int)$row['usuario_id'];
    }

    public function gerarToken(int $usuarioId, string $agenteUsuario, ?string $ip, int $dias = 30): string
    {
        $raw      = bin2hex(random_bytes(32));
        $hash     = hash('sha256', $raw);
        $expiraEm = (new \DateTimeImmutable("+{$dias} days"))->format('Y-m-d H:i:s');

        $this->td->criar($usuarioId, $hash, $agenteUsuario, $ip, $expiraEm);
        return $raw;
    }

    public function valido(int $usuarioId, ?string $token): bool
    {
        if (!$token) return false;
        $hash = hash('sha256', $token);
        return $this->td->existeValido($usuarioId, $hash);
    }
}
