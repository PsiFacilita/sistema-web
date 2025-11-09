<?php

namespace App\Models;

use PDO;
use App\Config\Database;
use App\Helpers\BaseLogger;
use PDOException;

class Model
{
    protected PDO $pdo;
    protected BaseLogger $logger;

    public function __construct()
    {
        $this->pdo = Database::connection();
        $this->logger = new BaseLogger('Model');
    }

    protected function lastInsertId(): string
    {
        try {
            $lastInsertId = $this->pdo->lastInsertId();
            return $lastInsertId;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao obter último ID inserido: " . $e->getMessage());
            throw $e;
        }
    }

    protected function executeQuery(string $query, array $params): bool
    {
        try {
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $success = $stmt->execute();

            if (!$success) {
                $this->logger->error("Erro ao executar a query: " . $query);
            }

            return $success;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao executar query: " . $e->getMessage());
            throw $e;
        }
    }

    protected function fetchColumn(string $query, array $params): mixed
    {
        try {
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $result = $stmt->fetchColumn();
            return $result;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao buscar coluna: " . $e->getMessage());
            throw $e;
        }
    }

    protected function fetchRow(string $query, array $params = []): ?array
    {
        try {
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao buscar linha: " . $e->getMessage());
            throw $e;
        }
    }

    protected function fetchAllRows(string $query, array $params = []): array
    {
        try {
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $this->logger->error("Erro ao buscar todas as linhas: " . $e->getMessage());
            throw $e;
        }
    }

    protected function beginTransaction(): bool
    {
        try {
            return $this->pdo->beginTransaction();
        } catch (PDOException $e) {
            $this->logger->error("Erro ao iniciar transação: " . $e->getMessage());
            throw $e;
        }
    }

    protected function commit(): bool
    {
        try {
            $this->logger->info("Comitando transação.");
            return $this->pdo->commit();
        } catch (PDOException $e) {
            $this->logger->error("Erro ao comitar transação: " . $e->getMessage());
            throw $e;
        }
    }

    protected function rollback(): bool
    {
        try {
            $this->logger->warning("Rollback da transação devido a erro.");
            return $this->pdo->rollBack();
        } catch (PDOException $e) {
            $this->logger->error("Erro ao realizar rollback: " . $e->getMessage());
            throw $e;
        }
    }

    protected function key(): string
    {
        $k = getenv('CRYPTO_MASTER_KEY') ?: '';
        if (str_starts_with($k, 'base64:')) $k = base64_decode(substr($k, 7));
        $len = SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_KEYBYTES;
        if (strlen($k) < $len) $k = str_pad($k, $len, "\0");
        return substr($k, 0, $len);
    }

    protected function enc(?string $v, string $aad = ''): ?string
    {
        if ($v === null) return null;
        $nonce = random_bytes(SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES);
        $ct = sodium_crypto_aead_xchacha20poly1305_ietf_encrypt($v, $aad, $nonce, $this->key());
        return base64_encode($nonce . $ct);
    }

    protected function dec(?string $v, string $aad = ''): ?string
    {
        if ($v === null || $v === '') return $v;
        $raw = base64_decode($v, true);
        if ($raw === false) return $v;
        $nlen = SODIUM_CRYPTO_AEAD_XCHACHA20POLY1305_IETF_NPUBBYTES;
        if (strlen($raw) <= $nlen) return $v;
        $nonce = substr($raw, 0, $nlen);
        $ct = substr($raw, $nlen);
        $pt = sodium_crypto_aead_xchacha20poly1305_ietf_decrypt($ct, $aad, $nonce, $this->key());
        return $pt === false ? $v : $pt;
    }
}