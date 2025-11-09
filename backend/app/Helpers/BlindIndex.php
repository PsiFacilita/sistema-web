<?php

namespace App\Security;

final class BlindIndex
{
    private static function key(): string
    {
        $k = getenv('BLIND_INDEX_KEY') ?: '';
        if (str_starts_with($k, 'base64:')) $k = base64_decode(substr($k, 7));
        return $k;
    }

    private static function norm(?string $v): string
    {
        return mb_strtolower(trim((string) $v), 'UTF-8');
    }

    public static function make(?string $value): ?string
    {
        if ($value === null) return null;
        $k = self::key();
        return hash_hmac('sha256', self::norm($value), $k);
    }
}
