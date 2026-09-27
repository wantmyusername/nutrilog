<?php

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/auth.php';

/**
 * Enrutador de /auth.
 *
 * POST /auth/login
 * POST /auth/logout
 * GET  /auth/me
 */
function auth_handle(PDO $pdo, string $method, array $segments): void
{
    $action = $segments[1] ?? '';

    if ($action === 'login' && $method === 'POST') {
        auth_login($pdo, json_body());
    }
    if ($action === 'logout' && $method === 'POST') {
        $_SESSION = [];
        session_destroy();
        json_response(['ok' => true]);
    }
    if ($action === 'me' && $method === 'GET') {
        $user = current_user();
        if (!$user) {
            json_error('No autenticado', 401);
        }
        json_response(['user' => $user]);
    }

    json_error('Método no permitido', 405);
}

function auth_login(PDO $pdo, array $body): void
{
    $username = to_string($body['username'] ?? null);
    $password = (string) ($body['password'] ?? '');

    if ($username === null || $password === '') {
        json_error('Usuario y contraseña son obligatorios', 422);
    }

    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_error('Credenciales inválidas', 401);
    }

    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id' => (int) $user['id'],
        'username' => $user['username'],
    ];

    json_response(['user' => $_SESSION['user']]);
}
