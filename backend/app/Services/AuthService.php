<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PDO;

final class AuthService
{
    public function __construct(
        private string $jwtSecret,
        private string $jwtIssuer,
        private int $jwtExpireMinutes = 60
    ) {}

    public function validateCredentials(string $email, string $password): ?User
    {
        $user = new User();
        $user = $user->findByEmail($email);
        if (!$user) return null;
        if (!$user->verifyPassword($password)) return null;
        return $user;
    }

    public function generateToken(User $user): string
    {
        $now = time();
        $exp = $now + ($this->jwtExpireMinutes * 60);

        $payload = [
            'iss'   => $this->jwtIssuer,
            'iat'   => $now,
            'nbf'   => $now,
            'exp'   => $exp,
            'sub'   => $user->id,
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    public function verifyToken(string $token): array
    {
        $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
        return json_decode(json_encode($decoded, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
    }

    public function getTtlSeconds(): int
    {
        return $this->jwtExpireMinutes * 60;
    }
}
