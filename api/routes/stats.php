<?php

require_once __DIR__ . '/../lib/http.php';

/**
 * GET /stats
 * Métricas para el panel principal.
 */
function stats_handle(PDO $pdo, array $config): void
{
    $monthStart = date('Y-m-01');
    $prevStart = date('Y-m-01', strtotime('first day of last month'));

    $totals = [
        'patients' => (int) $pdo->query('SELECT COUNT(*) FROM patients')->fetchColumn(),
        'appointments' => (int) $pdo->query('SELECT COUNT(*) FROM appointments')->fetchColumn(),
    ];

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM patients WHERE created_at >= ?');
    $stmt->execute([$monthStart]);
    $totals['patients_this_month'] = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM appointments WHERE appointment_date >= ?');
    $stmt->execute([$monthStart]);
    $totals['appointments_this_month'] = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM appointments WHERE appointment_date >= ? AND appointment_date < ?');
    $stmt->execute([$prevStart, $monthStart]);
    $totals['appointments_prev_month'] = (int) $stmt->fetchColumn();

    // Serie de citas por mes (últimos 6 meses, incluyendo meses sin datos).
    $monthExpr = $config['db_driver'] === 'mysql'
        ? "DATE_FORMAT(appointment_date, '%Y-%m')"
        : "strftime('%Y-%m', appointment_date)";

    $counts = [];
    $rows = $pdo->query("SELECT $monthExpr AS ym, COUNT(*) AS total FROM appointments GROUP BY ym")->fetchAll();
    foreach ($rows as $row) {
        $counts[$row['ym']] = (int) $row['total'];
    }

    $series = [];
    for ($i = 5; $i >= 0; $i--) {
        $key = date('Y-m', strtotime("first day of -$i month"));
        $series[] = ['month' => $key, 'count' => $counts[$key] ?? 0];
    }
    $totals['appointments_last_6m'] = array_sum(array_column($series, 'count'));

    // Últimas citas registradas con el peso de la cita anterior del mismo paciente.
    $recent = $pdo->query(
        'SELECT a.id, a.patient_id, a.appointment_date, a.weight_kg, a.waist_cm, p.full_name AS patient_name,
            (SELECT b.weight_kg FROM appointments b
                WHERE b.patient_id = a.patient_id
                  AND (b.appointment_date < a.appointment_date
                       OR (b.appointment_date = a.appointment_date AND b.id < a.id))
                ORDER BY b.appointment_date DESC, b.id DESC
                LIMIT 1) AS previous_weight_kg
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         ORDER BY a.appointment_date DESC, a.id DESC
         LIMIT 6'
    )->fetchAll();

    $recent = array_map(static function (array $row): array {
        $row['id'] = (int) $row['id'];
        $row['patient_id'] = (int) $row['patient_id'];
        $row['weight_kg'] = $row['weight_kg'] !== null ? (float) $row['weight_kg'] : null;
        $row['waist_cm'] = $row['waist_cm'] !== null ? (float) $row['waist_cm'] : null;
        $row['previous_weight_kg'] = $row['previous_weight_kg'] !== null ? (float) $row['previous_weight_kg'] : null;
        $row['weight_delta'] = ($row['weight_kg'] !== null && $row['previous_weight_kg'] !== null)
            ? round($row['weight_kg'] - $row['previous_weight_kg'], 1)
            : null;
        return $row;
    }, $recent);

    json_response([
        'totals' => $totals,
        'appointments_by_month' => $series,
        'recent_appointments' => $recent,
    ]);
}
