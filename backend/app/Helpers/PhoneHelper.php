<?php
declare(strict_types=1);

namespace App\Helpers;

/**
 * Helper para validação e formatação de telefones brasileiros
 */
final class PhoneHelper
{
    /**
     * Valida e parseia telefones brasileiros
     * Exemplos válidos: +55 (21) 98888-8888 / 9999-9999 / 21 98888-8888 / 5511988888888 / +55 (021) 98888-8888 / 021 99995-3333
     *
     * @param string $phoneString 
     * @param bool $forceOnlyNumber Passar false caso não queira remover o traço "-"
     * @return array|null ['ddi' => 'string', 'ddd' => string , 'number' => 'string']
     */
    public static function brazilianPhoneParser(string $phoneString, bool $forceOnlyNumber = true): ?array
    {
        // Remove espaços extras e caracteres não numéricos exceto +, -, (), espaços
        $cleanPhone = trim($phoneString);
        
        // Se vazio, retorna null
        if (empty($cleanPhone)) {
            return null;
        }
        
        // Remove parênteses para análise
        $phoneString = preg_replace('/[()]/', '', $cleanPhone);
        
        // Regex melhorada para telefones brasileiros
        // Celular: 9XXXX-XXXX (9 dígitos) ou Fixo: 2XXX-XXXX até 5XXX-XXXX (8 dígitos)
        $pattern = '/^(?:(?:\+|00)?(55)\s?)?(?:([0-9]{2})\s?)?(?:((?:9[0-9]|[2-5])\d{3})\-?(\d{4}))$/';
        
        if (!preg_match($pattern, $phoneString, $matches)) {
            return null;
        }

        $ddi = $matches[1] ?? '';
        $ddd = $matches[2] ?? '';
        $part1 = $matches[3] ?? '';
        $part2 = $matches[4] ?? '';
        
        // Remove zero à esquerda do DDD se presente
        $ddd = preg_replace('/^0/', '', $ddd);
        
        // Monta o número completo
        $number = $part1 . $part2;
        
        // Validações adicionais
        if (!empty($ddd)) {
            // DDD deve estar entre 11-99
            $dddNum = (int)$ddd;
            if ($dddNum < 11 || $dddNum > 99) {
                return null;
            }
        }
        
        // Número deve ter 8 ou 9 dígitos
        if (strlen($number) < 8 || strlen($number) > 9) {
            return null;
        }
        
        // Se não quiser apenas números, adiciona traço
        if (!$forceOnlyNumber && strlen($number) === 9) {
            $number = substr($number, 0, 5) . '-' . substr($number, 5);
        } elseif (!$forceOnlyNumber && strlen($number) === 8) {
            $number = substr($number, 0, 4) . '-' . substr($number, 4);
        }

        return ['ddi' => $ddi, 'ddd' => $ddd, 'number' => $number];
    }

    /**
     * Valida se um telefone brasileiro é válido
     *
     * @param string $phoneString
     * @return bool
     */
    public static function isValidBrazilianPhone(string $phoneString): bool
    {
        return self::brazilianPhoneParser($phoneString) !== null;
    }

    /**
     * Formata um telefone brasileiro para exibição
     *
     * @param string $phoneString
     * @param string $format 'display' para (11) 99999-9999, 'storage' para números apenas
     * @return string|null
     */
    public static function formatBrazilianPhone(string $phoneString, string $format = 'display'): ?string
    {
        $parsed = self::brazilianPhoneParser($phoneString);
        
        if ($parsed === null) {
            return null;
        }

        $ddi = $parsed['ddi'];
        $ddd = $parsed['ddd'];
        $number = $parsed['number'];

        // Remove traço se existir para reformatar
        $number = preg_replace('/-/', '', $number);

        switch ($format) {
            case 'display':
                // Formato: (11) 99999-9999
                if (strlen($number) === 9) {
                    // Celular (9 dígitos)
                    $formatted = substr($number, 0, 5) . '-' . substr($number, 5);
                } else {
                    // Fixo (8 dígitos)
                    $formatted = substr($number, 0, 4) . '-' . substr($number, 4);
                }
                
                if (!empty($ddd)) {
                    $formatted = "($ddd) $formatted";
                }
                
                if (!empty($ddi)) {
                    $formatted = "+$ddi $formatted";
                }
                
                return $formatted;

            case 'storage':
                // Formato: apenas números
                return $ddi . $ddd . $number;

            case 'international':
                // Formato: +55 11 99999-9999
                if (strlen($number) === 9) {
                    $formatted = substr($number, 0, 5) . '-' . substr($number, 5);
                } else {
                    $formatted = substr($number, 0, 4) . '-' . substr($number, 4);
                }
                
                $ddi = $ddi ?: '55'; // Assume Brasil se não informado
                return "+$ddi $ddd $formatted";

            default:
                return $phoneString;
        }
    }

    /**
     * Normaliza um telefone para armazenamento (apenas números)
     *
     * @param string $phoneString
     * @return string|null
     */
    public static function normalize(string $phoneString): ?string
    {
        return self::formatBrazilianPhone($phoneString, 'storage');
    }

    /**
     * Obtém informações sobre o telefone
     *
     * @param string $phoneString
     * @return array|null
     */
    public static function getPhoneInfo(string $phoneString): ?array
    {
        $parsed = self::brazilianPhoneParser($phoneString);
        
        if ($parsed === null) {
            return null;
        }

        $number = preg_replace('/-/', '', $parsed['number']);
        $type = strlen($number) === 9 ? 'celular' : 'fixo';
        
        return [
            'ddi' => $parsed['ddi'] ?: '55',
            'ddd' => $parsed['ddd'],
            'number' => $number,
            'type' => $type,
            'formatted' => self::formatBrazilianPhone($phoneString, 'display'),
            'international' => self::formatBrazilianPhone($phoneString, 'international'),
            'storage' => self::formatBrazilianPhone($phoneString, 'storage')
        ];
    }
}