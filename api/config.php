<?php

$config = [
    // 'sqlite' para pruebas locales, 'mysql' en hosting compartido.
    'db_driver' => getenv('DB_DRIVER') ?: 'sqlite',

    // SQLite
    'sqlite_path' => getenv('DB_SQLITE_PATH') ?: __DIR__ . '/data/nutriolog.sqlite',

    // MySQL / MariaDB (hosting compartido)
    'mysql' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_NAME') ?: 'nutriolog',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') ?: '',
        'charset' => 'utf8mb4',
    ],

    // Usuario administrador que se crea la primera vez.
    'admin_user' => getenv('ADMIN_USER') ?: 'admin',
    'admin_pass' => getenv('ADMIN_PASS') ?: 'admin123',

    'session_name' => 'nutriolog_sid',
];

// Overrides locales del servidor (no se sube a git ni se sobreescribe en cada deploy).
$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
    $config = array_merge($config, require $localConfig);
}

return $config;
