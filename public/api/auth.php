<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_FAILS_PER_USER = 5;
const MAX_FAILS_PER_IP = 20;
const LOCK_MINUTES = 15;

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST'], true)) {
    respond(405, ['error' => 'Method not allowed']);
}

if ($method === 'GET') {
    respond(200, ['user' => current_user()]);
}

require_same_origin_post();
$in = json_body();
start_session();

if (($in['action'] ?? '') === 'logout') {
    $_SESSION = [];
    session_destroy();
    respond(200, ['ok' => true]);
}

if (($in['action'] ?? '') !== 'login') {
    respond(400, ['error' => 'Unknown action']);
}

$email = is_string($in['email'] ?? null) ? strtolower(trim($in['email'])) : '';
$password = is_string($in['password'] ?? null) ? $in['password'] : '';
$ip = substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
$pdo = db();
$since = gmdate('Y-m-d H:i:s', time() - LOCK_MINUTES * 60);

$pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')->execute([$since]);
$byUser = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE email = ? AND attempted_at >= ?');
$byUser->execute([substr($email, 0, 254), $since]);
$byIp = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND attempted_at >= ?');
$byIp->execute([$ip, $since]);
if ((int) $byUser->fetchColumn() >= MAX_FAILS_PER_USER || (int) $byIp->fetchColumn() >= MAX_FAILS_PER_IP) {
    respond(429, ['error' => 'Too many failed attempts. Try again in 15 minutes.']);
}

$q = $pdo->prepare('SELECT id, email, password_hash, role, active FROM users WHERE email = ?');
$q->execute([$email]);
$u = $q->fetch();

// Always run a hash comparison so response time does not reveal whether the email exists.
$dummy = '$2y$12$fOVlamauo4RlOJKlsQNShOf.Op2QTNYsnnRGtKMWltV4T8QIem7i.';
$ok = password_verify($password, $u['password_hash'] ?? $dummy) && $u && (int) $u['active'] === 1;

if (!$ok) {
    $pdo->prepare('INSERT INTO login_attempts (ip, email, attempted_at) VALUES (?, ?, ?)')
        ->execute([$ip, substr($email, 0, 254), now()]);
    respond(401, ['error' => 'Incorrect email or password']);
}

$pdo->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$email]);
$pdo->prepare('UPDATE users SET last_login_at = ? WHERE id = ?')->execute([now(), $u['id']]);
session_regenerate_id(true);
$_SESSION['uid'] = (int) $u['id'];
respond(200, ['user' => ['id' => (int) $u['id'], 'email' => $u['email'], 'role' => $u['role']]]);
