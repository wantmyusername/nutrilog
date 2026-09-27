<?php

// Copia este archivo como config.local.php en el servidor y ajusta tus datos.
// No se sube a git ni se sobreescribe en cada deploy.
return [
    'db_driver' => 'mysql',
    'mysql' => [
        'host' => 'localhost',
        'port' => '3306',
        'name' => 'TU_BASE_DE_DATOS',
        'user' => 'TU_USUARIO',
        'pass' => 'TU_CONTRASEÑA',
        'charset' => 'utf8mb4',
    ],
    'admin_user' => 'admin',
    'admin_pass' => 'CambiaEstaClave',
];
