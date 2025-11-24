<?php

namespace App\Helpers;

final class Crypto
{
    private static function key(): string
    {
        $k = getenv('CRYPTO_MASTER_KEY') ?: '';
        if (str_starts_with($k, 'base64:')) $k = base64_decode(substr($k, 7));
        return $k;
    }

    private static function unpackKey(): string
    {
        $k = self::key();
        if (!$k || strlen($k) < SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_KEYBYTES) {
            throw new \RuntimeException('crypto key invalid');
        }
        return substr($k, 0, SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_KEYBYTES);
    }

    public static function encrypt(?string $plaintext, string $aad = ''): ?string
    {
        if ($plaintext === null) return null;
        $key = self::unpackKey();
        $nonce = random_bytes(SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
        $ct = sodium_crypto_aead_xchacha20poly1305_ietf_encrypt($plaintext, $aad, $nonce, $key);
        $v = "\x01";
        return base64_encode($v.$nonce.$ct);
    }

    public static function decrypt(?string $token, string $aad = ''): ?string
    {
        if ($token === null) return null;
        $bin = base64_decode($token, true);
        if ($bin === false || strlen($bin) < 1 + SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES + 17) return null;
        $v = $bin[0];
        $nonce = substr($bin, 1, SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
        $ct = substr($bin, 1 + SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
        if ($v !== "\x01") return null;
        $key = self::unpackKey();
        $pt = sodium_crypto_aead_xchacha20poly1305_ietf_decrypt($ct, $aad, $nonce, $key);
        return $pt === false ? null : $pt;
    }
}
