<?php
declare(strict_types=1);

namespace App\Helpers;

/**
 * Helper para validação e formatação de CPF
 */
final class CPFHelper
{
    /**
     * Valida um CPF brasileiro
     *
     * @param string $cpf
     * @return bool
     */
    public static function validaCPF(string $cpf): bool
    {
        // Extrai somente os números
        $cpf = preg_replace('/[^0-9]/is', '', $cpf);
         
        // Verifica se foi informado todos os digitos corretamente
        if (strlen($cpf) != 11) {
            return false;
        }

        // Verifica se foi informada uma sequência de digitos repetidos. Ex: 111.111.111-11
        if (preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }

        // Faz o calculo para validar o CPF
        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }
        return true;
    }

    /**
     * Normaliza um CPF removendo caracteres especiais
     *
     * @param string $cpf
     * @return string
     */
    public static function normalize(string $cpf): string
    {
        return preg_replace('/[^0-9]/is', '', $cpf);
    }

    /**
     * Formata um CPF para exibição (XXX.XXX.XXX-XX)
     *
     * @param string $cpf
     * @return string|null
     */
    public static function format(string $cpf): ?string
    {
        $cpf = self::normalize($cpf);
        
        if (strlen($cpf) !== 11) {
            return null;
        }
        
        return substr($cpf, 0, 3) . '.' . 
               substr($cpf, 3, 3) . '.' . 
               substr($cpf, 6, 3) . '-' . 
               substr($cpf, 9, 2);
    }

    /**
     * Valida e formata um CPF
     *
     * @param string $cpf
     * @return array ['valid' => bool, 'formatted' => string|null, 'normalized' => string]
     */
    public static function validateAndFormat(string $cpf): array
    {
        $normalized = self::normalize($cpf);
        $isValid = self::validaCPF($cpf);
        $formatted = $isValid ? self::format($cpf) : null;

        return [
            'valid' => $isValid,
            'formatted' => $formatted,
            'normalized' => $normalized,
            'original' => $cpf
        ];
    }

    /**
     * Gera um CPF válido para testes
     *
     * @return string
     */
    public static function generate(): string
    {
        // Gera os 9 primeiros dígitos
        $cpf = '';
        for ($i = 0; $i < 9; $i++) {
            $cpf .= mt_rand(0, 9);
        }

        // Calcula o primeiro dígito verificador
        for ($d = 0, $c = 0; $c < 9; $c++) {
            $d += $cpf[$c] * ((9 + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        $cpf .= $d;

        // Calcula o segundo dígito verificador
        for ($d = 0, $c = 0; $c < 10; $c++) {
            $d += $cpf[$c] * ((10 + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        $cpf .= $d;

        return $cpf;
    }

    /**
     * Mascara um CPF para exibição parcial (XXX.XXX.XXX-XX -> XXX.XXX.***-XX)
     *
     * @param string $cpf
     * @return string|null
     */
    public static function mask(string $cpf): ?string
    {
        $formatted = self::format($cpf);
        
        if ($formatted === null) {
            return null;
        }
        
        return substr($formatted, 0, 7) . '***-' . substr($formatted, -2);
    }

    /**
     * Verifica se uma string contém um CPF válido
     *
     * @param string $text
     * @return array Lista de CPFs válidos encontrados
     */
    public static function extractValidCPFs(string $text): array
    {
        // Regex para encontrar possíveis CPFs
        preg_match_all('/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/', $text, $matches);
        
        $validCPFs = [];
        foreach ($matches[0] as $possibleCPF) {
            if (self::validaCPF($possibleCPF)) {
                $validCPFs[] = [
                    'original' => $possibleCPF,
                    'formatted' => self::format($possibleCPF),
                    'normalized' => self::normalize($possibleCPF)
                ];
            }
        }
        
        return $validCPFs;
    }
}