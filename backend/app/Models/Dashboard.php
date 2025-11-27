<?php
declare(strict_types=1);

namespace App\Models;

use PDOException;

/**
 * Dashboard model responsible for retrieving aggregated data
 * for summary cards and monthly charts displayed on the dashboard.
 *
 * This model extends the base Model to reuse shared DB helpers
 * (fetchColumn, fetchAllRows, transactions, logging, etc.).
 */
final class Dashboard extends Model
{
    /**
     * Returns the counters for the dashboard summary cards:
     * - Active patients
     * - Inactive patients
     * - Scheduled appointments (today and future)
     * All filtered by the authenticated user (usuario_id).
     *
     * @param int $userId Authenticated user id from session/JWT.
     * @return array{ativos:int,inativos:int,agendadas:int} Associative array with integer counters.
     *
     * @throws PDOException If any database error occurs.
     */
    public function getCards(int $userId): array
    {
        $ownerSql = "COALESCE(
            (SELECT sp.psicologo_id FROM secretaria_pertence sp WHERE sp.secretaria_id = :uid LIMIT 1),
            :uid
        )";

        $ativos = (int) ($this->fetchColumn(
            "SELECT COUNT(*) FROM paciente WHERE ativo = 1 AND usuario_id = {$ownerSql}",
            [':uid' => $userId]
        ) ?? 0);

        $inativos = (int) ($this->fetchColumn(
            "SELECT COUNT(*) FROM paciente WHERE ativo = 0 AND usuario_id = {$ownerSql}",
            [':uid' => $userId]
        ) ?? 0);

        $agendadas = (int) ($this->fetchColumn(
            "SELECT COUNT(*) FROM agenda WHERE horario_inicio >= CURDATE() AND usuario_id = {$ownerSql}",
            [':uid' => $userId]
        ) ?? 0);

        return [
            'ativos'    => $ativos,
            'inativos'  => $inativos,
            'agendadas' => $agendadas,
        ];
    }

    /**
     * Returns the monthly chart data for the current year filtered by usuario_id:
     * Each row contains: month number (1-12), active and inactive counts.
     *
     * Example:
     * [
     *   ['mes' => 1, 'ativos' => 10, 'inativos' => 2],
     *   ['mes' => 2, 'ativos' => 12, 'inativos' => 1],
     *   ...
     * ]
     *
     * @param int $userId Authenticated user id from session/JWT.
     * @return list<array{mes:int,ativos:int,inativos:int}> List of monthly aggregates.
     *
     * @throws PDOException If any database error occurs.
     */
    public function getYearlyPatientChart(int $userId): array
    {
        $ownerSql = "COALESCE(
            (SELECT sp.psicologo_id FROM secretaria_pertence sp WHERE sp.secretaria_id = :uid LIMIT 1),
            :uid
        )";

        $sql = "
            SELECT
                MONTH(criado_em) AS mes,
                SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) AS ativos,
                SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) AS inativos
            FROM paciente
            WHERE YEAR(criado_em) = YEAR(CURDATE())
              AND usuario_id = {$ownerSql}
            GROUP BY MONTH(criado_em)
            ORDER BY mes
        ";

        $rows = $this->fetchAllRows($sql, [':uid' => $userId]);

        // Normalizar e preencher meses ausentes (1..12) com zeros.
        $full = [];
        for ($m = 1; $m <= 12; $m++) {
            $full[$m] = ['mes' => $m, 'ativos' => 0, 'inativos' => 0];
        }

        foreach ($rows as $r) {
            $mes = (int) ($r['mes'] ?? 0);
            if ($mes >= 1 && $mes <= 12) {
                $full[$mes]['ativos'] = (int) ($r['ativos'] ?? 0);
                $full[$mes]['inativos'] = (int) ($r['inativos'] ?? 0);
            }
        }

        // Garantir que a saída seja um array indexado em 0..11, ordenado por mês.
        return array_values($full);
    }
}
