<?php
declare(strict_types=1);

const SPORTS = ['softball', 'basketball'];
const SESSION_DAYS = 30;
const SHORT_SESSION_HOURS = 12;
const REMEMBER_COOKIE = 'ev_rem';

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
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $env = fn(string $k) => getenv($k) !== false ? getenv($k) : null;
    $file = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
    $dsn  = $env('EVERHARRIS_DB_DSN')  ?? $file['dsn']  ?? '';
    $user = $env('EVERHARRIS_DB_USER') ?? $file['user'] ?? '';
    $pass = $env('EVERHARRIS_DB_PASS') ?? $file['pass'] ?? '';

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

    ensure_schema($pdo);
    return $pdo;
}

function ensure_schema(PDO $pdo): void
{
    $pk = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite'
        ? 'INTEGER PRIMARY KEY AUTOINCREMENT'
        : 'INT AUTO_INCREMENT PRIMARY KEY';

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS users (
            id $pk,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(16) NOT NULL,
            active INT NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL,
            last_login_at DATETIME NULL,
            must_change_password INT NOT NULL DEFAULT 0
        )"
    );
    add_column_if_missing($pdo, 'users', 'must_change_password', 'INT NOT NULL DEFAULT 0');
    $big = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? 'TEXT' : 'MEDIUMTEXT';
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS profiles (
            user_id INT NOT NULL PRIMARY KEY,
            display_name VARCHAR(60) NULL,
            phone VARCHAR(30) NULL,
            avatar_mime VARCHAR(16) NULL,
            avatar_data $big NULL,
            updated_at DATETIME NOT NULL
        )"
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS password_resets (
            token_hash CHAR(64) NOT NULL PRIMARY KEY,
            user_id INT NOT NULL,
            ip VARCHAR(45) NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL
        )'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS activity_log (
            user_id INT NOT NULL,
            sport VARCHAR(16) NOT NULL,
            work_date CHAR(10) NOT NULL,
            day_id VARCHAR(24) NOT NULL,
            exercise_id VARCHAR(64) NOT NULL,
            sets_done INT NOT NULL,
            weight_lb DECIMAL(6,1) NULL,
            completed_at DATETIME NULL,
            updated_at DATETIME NOT NULL,
            PRIMARY KEY (user_id, sport, work_date, day_id, exercise_id)
        )'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(128) NOT NULL PRIMARY KEY,
            data TEXT NOT NULL,
            expires_at INT NOT NULL
        )'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS login_attempts (
            ip VARCHAR(45) NOT NULL,
            email VARCHAR(255) NOT NULL,
            attempted_at DATETIME NOT NULL
        )'
    );
}

function add_column_if_missing(PDO $pdo, string $table, string $column, string $definition): void
{
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $cols = array_column($pdo->query("PRAGMA table_info($table)")->fetchAll(), 'name');
        $has = in_array($column, $cols, true);
    } else {
        $has = $pdo->query("SHOW COLUMNS FROM $table LIKE '$column'")->fetch() !== false;
    }
    if (!$has) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
    }
}

final class DbSessionHandler implements SessionHandlerInterface
{
    public function __construct(private PDO $pdo) {}

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $q = $this->pdo->prepare('SELECT data FROM sessions WHERE id = ? AND expires_at > ?');
        $q->execute([$id, time()]);
        $v = $q->fetchColumn();
        return $v === false ? '' : (string) $v;
    }

    public function write(string $id, string $data): bool
    {
        $exp = time() + (str_contains($data, 'rem|b:1;') ? SESSION_DAYS * 86400 : SHORT_SESSION_HOURS * 3600);
        $u = $this->pdo->prepare('UPDATE sessions SET data = ?, expires_at = ? WHERE id = ?');
        $u->execute([$data, $exp, $id]);
        if ($u->rowCount() === 0) {
            $exists = $this->pdo->prepare('SELECT COUNT(*) FROM sessions WHERE id = ?');
            $exists->execute([$id]);
            if ((int) $exists->fetchColumn() === 0) {
                $this->pdo->prepare('INSERT INTO sessions (id, data, expires_at) VALUES (?, ?, ?)')->execute([$id, $data, $exp]);
            }
        }
        return true;
    }

    public function destroy(string $id): bool
    {
        $this->pdo->prepare('DELETE FROM sessions WHERE id = ?')->execute([$id]);
        return true;
    }

    public function gc(int $max_lifetime): int|false
    {
        return $this->pdo->prepare('DELETE FROM sessions WHERE expires_at < ?')->execute([time()]) ? 1 : false;
    }
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    session_set_save_handler(new DbSessionHandler(db()), true);
    session_name('ev_session');
    session_set_cookie_params([
        'lifetime' => isset($_COOKIE[REMEMBER_COOKIE]) ? SESSION_DAYS * 86400 : 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    session_start();
}

function require_same_origin_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        return;
    }
    if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'fetch') {
        respond(403, ['error' => 'Forbidden']);
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
        if (strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $host) {
            respond(403, ['error' => 'Forbidden']);
        }
    }
}

function public_user(array $u): array
{
    return [
        'id' => (int) $u['id'],
        'email' => $u['email'],
        'role' => $u['role'],
        'displayName' => $u['display_name'] ?? null,
        'hasAvatar' => ($u['avatar_mime'] ?? null) !== null,
        'avatarV' => $u['profile_updated_at'] ? (int) strtotime($u['profile_updated_at'] . ' UTC') : 0,
        'mustChangePassword' => (int) ($u['must_change_password'] ?? 0) === 1,
    ];
}

function current_user(): ?array
{
    start_session();
    $id = $_SESSION['uid'] ?? null;
    if (!is_int($id)) {
        return null;
    }
    $q = db()->prepare(
        'SELECT u.id, u.email, u.role, u.active, u.must_change_password, p.display_name, p.avatar_mime, p.updated_at AS profile_updated_at
         FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?'
    );
    $q->execute([$id]);
    $u = $q->fetch();
    if (!$u || (int) $u['active'] !== 1) {
        $_SESSION = [];
        return null;
    }
    return public_user($u);
}

function require_role(string ...$roles): array
{
    require_same_origin_post();
    $u = current_user();
    if ($u === null) {
        respond(401, ['error' => 'Sign in required']);
    }
    if (!in_array($u['role'], $roles, true)) {
        respond(403, ['error' => 'Your account does not have access to this']);
    }
    return $u;
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

function valid_sport(mixed $v): string
{
    if (!is_string($v) || !in_array($v, SPORTS, true)) {
        respond(400, ['error' => 'Invalid sport']);
    }
    return $v;
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

function valid_email(mixed $v): string
{
    $e = is_string($v) ? strtolower(trim($v)) : '';
    if (strlen($e) > 254 || filter_var($e, FILTER_VALIDATE_EMAIL) === false) {
        respond(400, ['error' => 'Enter a valid email address']);
    }
    return $e;
}

function valid_password(mixed $v): string
{
    if (!is_string($v) || strlen($v) < 8 || strlen($v) > 200) {
        respond(400, ['error' => 'Password must be at least 8 characters']);
    }
    return $v;
}

function valid_role(mixed $v): string
{
    if (!is_string($v) || !in_array($v, ['admin', 'sports'], true)) {
        respond(400, ['error' => 'Invalid role']);
    }
    return $v;
}

function json_body(): array
{
    $in = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($in)) {
        respond(400, ['error' => 'Invalid JSON']);
    }
    return $in;
}

function now(): string
{
    return gmdate('Y-m-d H:i:s');
}

function site_url(): string
{
    $u = getenv('EVERHARRIS_SITE_URL');
    return rtrim($u !== false && $u !== '' ? $u : 'https://everharris.com', '/');
}

function send_mail(string $to, string $subject, string $text): bool
{
    $log = getenv('EVERHARRIS_MAIL_LOG');
    if ($log !== false && $log !== '') {
        return file_put_contents($log, "To: $to
Subject: $subject

$text
---
", FILE_APPEND) !== false;
    }
    $from = 'no-reply@everharris.com';
    $headers = "From: Everharris <$from>
Reply-To: $from
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8";
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $text, $headers, "-f$from");
}

function respond_then_continue(int $status, array $body): void
{
    ignore_user_abort(true);
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    $json = json_encode($body);
    header('Content-Length: ' . strlen($json));
    header('Connection: close');
    echo $json;
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        @ob_end_flush();
        flush();
    }
}

function set_login_cookies(bool $remember): void
{
    $https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    $base = ['path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax'];
    setcookie(session_name(), session_id(), $base + ['expires' => $remember ? time() + SESSION_DAYS * 86400 : 0]);
    setcookie(REMEMBER_COOKIE, $remember ? '1' : '', $base + ['expires' => $remember ? time() + SESSION_DAYS * 86400 : time() - 3600]);
}

function drop_user_sessions(int $userId): void
{
    db()->prepare('DELETE FROM sessions WHERE data LIKE ?')->execute(['%uid|i:' . $userId . ';%']);
}

function hash_password(string $pw): string
{
    return password_hash($pw, PASSWORD_BCRYPT, ['cost' => 12]);
}
