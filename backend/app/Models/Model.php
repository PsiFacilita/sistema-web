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
            $this->logger->info("Último ID inserido: " . $lastInsertId);
            return $lastInsertId;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao obter último ID inserido: " . $e->getMessage());
            throw $e;
        }
    }

    protected function executeQuery(string $query, array $params): bool
    {
        try {
            $this->logger->info("Executando query: " . $query);
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $success = $stmt->execute();

            if ($success) {
                $this->logger->info("Query executada com sucesso.");
            } else {
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
            $this->logger->info("Buscando coluna com query: " . $query);
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $result = $stmt->fetchColumn();
            $this->logger->info("Resultado da busca: " . $result);
            return $result;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao buscar coluna: " . $e->getMessage());
            throw $e;
        }
    }

    protected function fetchRow(string $query, array $params = []): ?array
    {
        try {
            $this->logger->info("Buscando linha com query: " . $query);
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $this->logger->info("Resultado da busca: " . json_encode($result));
            } else {
                $this->logger->warning("Nenhum resultado encontrado.");
            }
            return $result ?: null;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao buscar linha: " . $e->getMessage());
            throw $e;
        }
    }

    protected function fetchAllRows(string $query, array $params = []): array
    {
        try {
            $this->logger->info("Buscando todas as linhas com query: " . $query);
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->logger->info("Resultado da busca: " . json_encode($result));
            return $result;
        } catch (PDOException $e) {
            $this->logger->error("Erro ao buscar todas as linhas: " . $e->getMessage());
            throw $e;
        }
    }

    protected function beginTransaction(): bool
    {
        try {
            $this->logger->info("Iniciando transação.");
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
}