<?php
declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

final class Database
{
    private static ?PDO $conn = null;

    private static function env(string $key, ?string $default = null): ?string
    {
        if (array_key_exists($key, $_ENV))   return $_ENV[$key];
        if (array_key_exists($key, $_SERVER)) return $_SERVER[$key];
        $val = getenv($key);
        return $val === false ? $default : $val;
    }

    public static function connection(): PDO
    {
        if (self::$conn instanceof PDO) {
            return self::$conn;
        }

        $driver    = self::env('DB_DRIVER', 'mysql');
        $host      = self::env('DB_HOST', '127.0.0.1');
        $port      = self::env('DB_PORT', '3307');
        $db        = self::env('DB_DATABASE', 'faculdade');
        $user      = self::env('DB_USERNAME', 'root');
        $pass      = self::env('DB_PASSWORD', '');
        $charset   = self::env('DB_CHARSET', 'utf8mb4');
        $collation = self::env('DB_COLLATION', 'utf8mb4_unicode_ci');

        $dsn = "{$driver}:host={$host};port={$port};dbname={$db};charset={$charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        try {
            self::$conn = new PDO($dsn, $user, $pass, $options);
            return self::$conn;
        } catch (PDOException $e) {
            throw new PDOException('Erro ao conectar ao banco: ' . $e->getMessage(), (int)$e->getCode());
        }
    }
}
