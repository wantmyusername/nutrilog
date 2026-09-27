<?php

require_once __DIR__ . '/../lib/http.php';

const PATIENT_FIELDS = [
    'full_name' => 'string',
    'birth_date' => 'string',
    'sex' => 'string',
    'height_cm' => 'float',
    'phone' => 'string',
    'email' => 'string',
    'objective' => 'string',
    'activity_level' => 'string',
    'activity_type' => 'string',
    'daily_calories' => 'int',
    'protein_g' => 'float',
    'carbs_g' => 'float',
    'fats_g' => 'float',
    'water_l' => 'float',
    'allergies' => 'string',
    'supplements' => 'string',
    'notes' => 'string',
    'next_visit_date' => 'string',
];

function patient_from_body(array $body, bool $partial): array
{
    $data = [];
    foreach (PATIENT_FIELDS as $field => $type) {
        if ($partial && !array_key_exists($field, $body)) {
            continue;
        }
        $value = $body[$field] ?? null;
        $data[$field] = match ($type) {
            'float' => to_float($value),
            'int' => to_int($value),
            default => to_string($value),
        };
    }
    return $data;
}

function patient_list(PDO $pdo): array
{
    $sql = <<<SQL
        SELECT p.*,
            (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) AS appointments_count,
            (SELECT a.appointment_date FROM appointments a
                WHERE a.patient_id = p.id
                ORDER BY a.appointment_date DESC, a.id DESC LIMIT 1) AS last_appointment_date,
            (SELECT a.weight_kg FROM appointments a
                WHERE a.patient_id = p.id
                ORDER BY a.appointment_date DESC, a.id DESC LIMIT 1) AS last_weight_kg
        FROM patients p
        ORDER BY p.full_name
    SQL;

    $rows = $pdo->query($sql)->fetchAll();

    return array_map('patient_cast', $rows);
}

function patient_find(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM patients WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? patient_cast($row) : null;
}

function patient_cast(array $row): array
{
    $row['id'] = (int) $row['id'];
    foreach ([
        'height_cm', 'protein_g', 'carbs_g', 'fats_g', 'water_l',
        'last_weight_kg',
    ] as $field) {
        if (isset($row[$field]) && $row[$field] !== null) {
            $row[$field] = (float) $row[$field];
        }
    }
    foreach (['daily_calories', 'appointments_count'] as $field) {
        if (isset($row[$field]) && $row[$field] !== null) {
            $row[$field] = (int) $row[$field];
        }
    }
    return $row;
}

function patient_create(PDO $pdo, array $body): void
{
    $data = patient_from_body($body, false);
    if (empty($data['full_name'])) {
        json_error('El nombre del paciente es obligatorio', 422);
    }

    $columns = array_keys($data);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = sprintf(
        'INSERT INTO patients (%s) VALUES (%s)',
        implode(', ', $columns),
        $placeholders
    );

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($data));

    $id = (int) $pdo->lastInsertId();
    json_response(patient_find($pdo, $id), 201);
}

function patient_update(PDO $pdo, int $id, array $body): void
{
    if (!patient_find($pdo, $id)) {
        json_error('Paciente no encontrado', 404);
    }

    $data = patient_from_body($body, true);
    if (array_key_exists('full_name', $data) && empty($data['full_name'])) {
        json_error('El nombre del paciente es obligatorio', 422);
    }
    if (!$data) {
        json_response(patient_find($pdo, $id));
    }

    $assignments = implode(', ', array_map(fn ($c) => "$c = ?", array_keys($data)));
    $values = array_values($data);
    $values[] = $id;

    $stmt = $pdo->prepare("UPDATE patients SET $assignments, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute($values);

    json_response(patient_find($pdo, $id));
}

function patient_delete(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('DELETE FROM patients WHERE id = ?');
    $stmt->execute([$id]);
    json_response(['ok' => true]);
}

/**
 * Enrutador de /patients.
 *
 * GET    /patients                 listar
 * POST   /patients                 crear
 * GET    /patients/{id}            ver + citas
 * PUT    /patients/{id}            actualizar
 * DELETE /patients/{id}            eliminar
 * POST   /patients/{id}/appointments   crear cita
 */
function patients_handle(PDO $pdo, string $method, array $segments): void
{
    $id = isset($segments[1]) && $segments[1] !== '' ? (int) $segments[1] : null;
    $sub = $segments[2] ?? null;

    if ($id === null) {
        match ($method) {
            'GET' => json_response(patient_list($pdo)),
            'POST' => patient_create($pdo, json_body()),
            default => json_error('Método no permitido', 405),
        };
    }

    $patient = patient_find($pdo, $id);
    if (!$patient) {
        json_error('Paciente no encontrado', 404);
    }

    if ($sub === 'appointments') {
        if ($method === 'POST') {
            appointment_create($pdo, $id, json_body());
        }
        json_error('Método no permitido', 405);
    }

    match ($method) {
        'GET' => json_response([
            'patient' => $patient,
            'appointments' => appointment_list($pdo, $id),
        ]),
        'PUT' => patient_update($pdo, $id, json_body()),
        'DELETE' => patient_delete($pdo, $id),
        default => json_error('Método no permitido', 405),
    };
}
