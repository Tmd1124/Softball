<?php
declare(strict_types=1);

function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

function db(): PDO
{
    $env = fn(string $k) => getenv($k) !== false ? getenv($k) : null;
    $file = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
    $dsn  = $env('SOFTBALL_DB_DSN')  ?? $file['dsn']  ?? '';
    $user = $env('SOFTBALL_DB_USER') ?? $file['user'] ?? '';
    $pass = $env('SOFTBALL_DB_PASS') ?? $file['pass'] ?? '';

    if ($dsn === '' || str_contains($dsn . $user . $pass, 'REPLACE_ME')) {
        respond(500, ['error' => 'Database is not configured']);
    }

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException) {
        respond(503, ['error' => 'Database unavailable']);
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS workout_log (
            key_hash CHAR(64) NOT NULL,
            work_date CHAR(10) NOT NULL,
            day_id VARCHAR(24) NOT NULL,
            exercise_id VARCHAR(64) NOT NULL,
            sets_done INT NOT NULL,
            weight_lb DECIMAL(6,1) NULL,
            completed_at DATETIME NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (key_hash, work_date, day_id, exercise_id)
        )'
    );
    return $pdo;
}

function athlete_hash(): string
{
    $key = $_SERVER['HTTP_X_ATHLETE_KEY'] ?? '';
    if (!preg_match('/^[a-f0-9]{32,64}$/', $key)) {
        respond(401, ['error' => 'Missing or invalid athlete key']);
    }
    return hash('sha256', $key);
}

function valid_date(mixed $d): string
{
    if (!is_string($d) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) || !checkdate((int) substr($d, 5, 2), (int) substr($d, 8, 2), (int) substr($d, 0, 4))) {
        respond(400, ['error' => 'Invalid date']);
    }
    return $d;
}

function valid_id(mixed $v, string $what): string
{
    if (!is_string($v) || !preg_match('/^[a-z0-9-]{1,64}$/', $v)) {
        respond(400, ['error' => "Invalid $what"]);
    }
    return $v;
}

function now(): string
{
    return gmdate('Y-m-d H:i:s');
}

function valid_completed_at(mixed $v): ?string
{
    if ($v === null) {
        return null;
    }
    if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $v) || strtotime($v . ' UTC') === false) {
        respond(400, ['error' => 'Invalid completedAt']);
    }
    return $v;
}

function valid_weight(mixed $v): ?float
{
    if ($v === null) {
        return null;
    }
    if (!(is_int($v) || is_float($v)) || $v < 0 || $v > 2000) {
        respond(400, ['error' => 'Invalid weight']);
    }
    return round((float) $v, 1);
}
