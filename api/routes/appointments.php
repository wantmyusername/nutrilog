<?php

require_once __DIR__ . '/../lib/http.php';

const APPOINTMENT_FIELDS = [
    'appointment_date' => 'string',
    'weight_kg' => 'float',
    'body_fat_pct' => 'float',
    'muscle_kg' => 'float',
    'waist_cm' => 'float',
    'hip_cm' => 'float',
    'chest_cm' => 'float',
    'arm_cm' => 'float',
    'thigh_cm' => 'float',
    'blood_pressure' => 'string',
    'glucose' => 'float',
    'notes' => 'string',
    'meal_plan' => 'string',
];

function appointment_from_body(array $body, bool $partial): array
{
    $data = [];
    foreach (APPOINTMENT_FIELDS as $field => $type) {
        if ($partial && !array_key_exists($field, $body)) {
            continue;
        }
        $value = $body[$field] ?? null;
        $data[$field] = match ($type) {
            'float' => to_float($value),
            default => to_string($value),
        };
    }
    return $data;
}

function appointment_cast(array $row): array
{
    $row['id'] = (int) $row['id'];
    $row['patient_id'] = (int) $row['patient_id'];
    foreach ([
        'weight_kg', 'body_fat_pct', 'muscle_kg', 'waist_cm', 'hip_cm',
        'chest_cm', 'arm_cm', 'thigh_cm', 'glucose',
    ] as $field) {
        if (isset($row[$field]) && $row[$field] !== null) {
            $row[$field] = (float) $row[$field];
        }
    }
    return $row;
}

function appointment_list(PDO $pdo, int $patientId): array
{
    $stmt = $pdo->prepare(
        'SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date ASC, id ASC'
    );
    $stmt->execute([$patientId]);
    return array_map('appointment_cast', $stmt->fetchAll());
}

function appointment_find(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM appointments WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? appointment_cast($row) : null;
}

function appointment_create(PDO $pdo, int $patientId, array $body): void
{
    $data = appointment_from_body($body, false);
    if (empty($data['appointment_date'])) {
        json_error('La fecha de la cita es obligatoria', 422);
    }

    $columns = array_merge(['patient_id'], array_keys($data));
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));

    $stmt = $pdo->prepare(sprintf(
        'INSERT INTO appointments (%s) VALUES (%s)',
        implode(', ', $columns),
        $placeholders
    ));
    $stmt->execute(array_merge([$patientId], array_values($data)));

    json_response(appointment_find($pdo, (int) $pdo->lastInsertId()), 201);
}

function appointment_update(PDO $pdo, int $id, array $body): void
{
    if (!appointment_find($pdo, $id)) {
        json_error('Cita no encontrada', 404);
    }

    $data = appointment_from_body($body, true);
    if (array_key_exists('appointment_date', $data) && empty($data['appointment_date'])) {
        json_error('La fecha de la cita es obligatoria', 422);
    }
    if (!$data) {
        json_response(appointment_find($pdo, $id));
    }

    $assignments = implode(', ', array_map(fn ($c) => "$c = ?", array_keys($data)));
    $values = array_values($data);
    $values[] = $id;

    $stmt = $pdo->prepare("UPDATE appointments SET $assignments WHERE id = ?");
    $stmt->execute($values);

    json_response(appointment_find($pdo, $id));
}

function appointment_delete(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('DELETE FROM appointments WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['ok' => true]);
}

/**
 * Enrutador de /appointments.
 *
 * PUT    /appointments/{id}
 * DELETE /appointments/{id}
 */
function appointments_handle(PDO $pdo, string $method, array $segments): void
{
    $id = isset($segments[1]) && $segments[1] !== '' ? (int) $segments[1] : null;
    if ($id === null) {
        json_error('Método no permitido', 405);
    }

    match ($method) {
        'PUT' => appointment_update($pdo, $id, json_body()),
        'DELETE' => appointment_delete($pdo, $id),
        default => json_error('Método no permitido', 405),
    };
}
