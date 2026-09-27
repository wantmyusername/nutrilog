<?php

/**
 * Conexión PDO única (singleton) y creación del esquema + usuario admin.
 */

function db(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    if ($config['db_driver'] === 'mysql') {
        $db = $config['mysql'];
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $db['host'],
            $db['port'],
            $db['name'],
            $db['charset']
        );
        $pdo = new PDO($dsn, $db['user'], $db['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } else {
        $dir = dirname($config['sqlite_path']);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $pdo = new PDO('sqlite:' . $config['sqlite_path'], null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
    }

    db_migrate($pdo, $config);
    db_seed($pdo, $config);

    return $pdo;
}

function db_migrate(PDO $pdo, array $config): void
{
    $driver = $config['db_driver'];

    $idColumn = $driver === 'mysql'
        ? 'INT AUTO_INCREMENT PRIMARY KEY'
        : 'INTEGER PRIMARY KEY AUTOINCREMENT';

    $patientsTable = <<<SQL
    CREATE TABLE IF NOT EXISTS patients (
        id {$idColumn},
        full_name VARCHAR(200) NOT NULL,
        birth_date DATE NULL,
        sex VARCHAR(20) NULL,
        height_cm DECIMAL(5,2) NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(150) NULL,
        objective VARCHAR(255) NULL,
        activity_level VARCHAR(100) NULL,
        activity_type VARCHAR(150) NULL,
        daily_calories INT NULL,
        protein_g DECIMAL(6,1) NULL,
        carbs_g DECIMAL(6,1) NULL,
        fats_g DECIMAL(6,1) NULL,
        water_l DECIMAL(4,1) NULL,
        allergies TEXT NULL,
        supplements TEXT NULL,
        notes TEXT NULL,
        next_visit_date DATE NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    SQL;

    $appointmentsTable = <<<SQL
    CREATE TABLE IF NOT EXISTS appointments (
        id {$idColumn},
        patient_id INT NOT NULL,
        appointment_date DATE NOT NULL,
        weight_kg DECIMAL(6,2) NULL,
        body_fat_pct DECIMAL(5,2) NULL,
        muscle_kg DECIMAL(6,2) NULL,
        waist_cm DECIMAL(6,2) NULL,
        hip_cm DECIMAL(6,2) NULL,
        chest_cm DECIMAL(6,2) NULL,
        arm_cm DECIMAL(6,2) NULL,
        thigh_cm DECIMAL(6,2) NULL,
        blood_pressure VARCHAR(20) NULL,
        glucose DECIMAL(6,2) NULL,
        notes TEXT NULL,
        meal_plan TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
    SQL;

    $usersTable = <<<SQL
    CREATE TABLE IF NOT EXISTS users (
        id {$idColumn},
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    SQL;

    $pdo->exec($patientsTable);
    $pdo->exec($appointmentsTable);
    $pdo->exec($usersTable);

    // Columnas agregadas después de la primera versión del esquema.
    db_ensure_column($pdo, $config, 'patients', 'activity_type', 'VARCHAR(150) NULL');
    db_ensure_column($pdo, $config, 'patients', 'next_visit_date', 'DATE NULL');
    db_ensure_column($pdo, $config, 'appointments', 'meal_plan', 'TEXT NULL');
}

/**
 * Agrega una columna si todavía no existe (migración ligera e idempotente).
 */
function db_ensure_column(PDO $pdo, array $config, string $table, string $column, string $definition): void
{
    if ($config['db_driver'] === 'mysql') {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
        $stmt->execute([$column]);
        $exists = (bool) $stmt->fetch();
    } else {
        $exists = false;
        foreach ($pdo->query("PRAGMA table_info($table)") as $info) {
            if (($info['name'] ?? null) === $column) {
                $exists = true;
                break;
            }
        }
    }

    if (!$exists) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
    }
}

function db_seed(PDO $pdo, array $config): void
{
    $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count > 0) {
        return;
    }

    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    $stmt->execute([
        $config['admin_user'],
        password_hash($config['admin_pass'], PASSWORD_DEFAULT),
    ]);
}
