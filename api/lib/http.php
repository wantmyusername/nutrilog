<?php

function json_response(mixed $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $code = 400, array $extra = []): void
{
    json_response(array_merge(['error' => $message], $extra), $code);
}

/**
 * Lee el cuerpo de la petición como JSON.
 */
function json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_error('JSON inválido en el cuerpo de la petición', 400);
    }
    return $data;
}

/**
 * Devuelve null si el valor viene vacío; si no, lo convierte a float.
 */
function to_float(mixed $value): ?float
{
    if ($value === null || $value === '' || $value === false) {
        return null;
    }
    return (float) $value;
}

function to_int(mixed $value): ?int
{
    if ($value === null || $value === '' || $value === false) {
        return null;
    }
    return (int) $value;
}

function to_string(mixed $value): ?string
{
    if ($value === null) {
        return null;
    }
    $value = trim((string) $value);
    return $value === '' ? null : $value;
}
