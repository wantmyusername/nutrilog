<?php

/**
 * Punto de entrada de la API.
 *
 * En local:      php -S 127.0.0.1:8000 api/index.php
 * En hosting:    /api/* se reescribe a /api/index.php (ver api/.htaccess)
 *
 * Rutas (todas bajo /api):
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *   GET    /api/auth/me
 *   GET    /api/patients
 *   POST   /api/patients
 *   GET    /api/patients/{id}
 *   PUT    /api/patients/{id}
 *   DELETE /api/patients/{id}
 *   POST   /api/patients/{id}/appointments
 *   PUT    /api/appointments/{id}
 *   DELETE /api/appointments/{id}
 */

$config = require __DIR__ . '/config.php';

require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/appointments.php';
require_once __DIR__ . '/routes/patients.php';
require_once __DIR__ . '/routes/stats.php';

start_session($config);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Quita el prefijo /api si existe (funciona tanto en local como en hosting).
$pos = strpos($uri, '/api');
if ($pos !== false) {
    $uri = substr($uri, $pos + 4);
}
$route = '/' . trim($uri, '/');
$segments = $route === '/' ? [] : explode('/', ltrim($route, '/'));
$resource = $segments[0] ?? '';

try {
    $pdo = db($config);

    // auth y patients son públicos de enrutado; la protección se aplica abajo.
    if ($resource === 'auth') {
        auth_handle($pdo, $method, $segments);
    }

    // A partir de aquí todo requiere sesión activa.
    require_auth();

    switch ($resource) {
        case 'patients':
            patients_handle($pdo, $method, $segments);
            break;
        case 'appointments':
            appointments_handle($pdo, $method, $segments);
            break;
        case 'stats':
            if ($method !== 'GET') {
                json_error('Método no permitido', 405);
            }
            stats_handle($pdo, $config);
            break;
        default:
            json_error('Ruta no encontrada', 404);
    }
} catch (PDOException $e) {
    json_error('Error de base de datos: ' . $e->getMessage(), 500);
}
