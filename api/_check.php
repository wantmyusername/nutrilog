<?php

header('Content-Type: application/json');
echo json_encode([
    'php' => PHP_VERSION,
    'pdo' => class_exists('PDO'),
    'drivers' => class_exists('PDO') ? PDO::getAvailableDrivers() : [],
    'data_dir_exists' => is_dir(__DIR__ . '/data'),
    'data_dir_writable' => is_writable(__DIR__ . '/data'),
], JSON_PRETTY_PRINT);
