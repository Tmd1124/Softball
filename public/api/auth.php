<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_FAILS_PER_USER = 5;
const MAX_FAILS_PER_IP = 20;
const LOCK_MINUTES = 15;
const RESET_MINUTES = 30;

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

$action = $in['action'] ?? '';

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    $https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    setcookie(REMEMBER_COOKIE, '', ['expires' => time() - 3600, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
    respond(200, ['ok' => true]);
}

if ($action === 'forgot') {
    $email = is_string($in['email'] ?? null) ? strtolower(trim($in['email'])) : '';
    $ip = substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45);
    $pdo = db();
    $hourAgo = gmdate('Y-m-d H:i:s', time() - 3600);

    $byIp = $pdo->prepare('SELECT COUNT(*) FROM password_resets WHERE ip = ? AND created_at >= ?');
    $byIp->execute([$ip, $hourAgo]);
    if ((int) $byIp->fetchColumn() >= 10) {
        respond(429, ['error' => 'Too many requests. Try again later.']);
    }

    // The answer is identical whether or not the email has an account.
    respond_then_continue(200, ['ok' => true]);

    $q = $pdo->prepare('SELECT id, email FROM users WHERE email = ? AND active = 1');
    $q->execute([substr($email, 0, 254)]);
    $u = $q->fetch();
    if (!$u) {
        exit;
    }
    $recent = $pdo->prepare('SELECT COUNT(*) FROM password_resets WHERE user_id = ? AND created_at >= ?');
    $recent->execute([$u['id'], $hourAgo]);
    if ((int) $recent->fetchColumn() >= 3) {
        exit;
    }
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL')->execute([now(), $u['id']]);
    $pdo->prepare('INSERT INTO password_resets (token_hash, user_id, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
        ->execute([hash('sha256', $token), $u['id'], $ip, now(), gmdate('Y-m-d H:i:s', time() + RESET_MINUTES * 60)]);
    send_mail(
        $u['email'],
        'Reset your Everharris password',
        "Someone asked to reset the password for this Everharris account.

"
        . "Open this link within " . RESET_MINUTES . " minutes to choose a new password:
"
        . site_url() . '/reset/?token=' . $token . "

"
        . "If you did not ask for this, ignore this email. Your password has not changed.
"
    );
    exit;
}

if ($action === 'reset') {
    $token = is_string($in['token'] ?? null) ? $in['token'] : '';
    $password = valid_password($in['password'] ?? null);
    $pdo = db();
    $q = $pdo->prepare(
        'SELECT r.token_hash, r.user_id, u.email FROM password_resets r JOIN users u ON u.id = r.user_id
         WHERE r.token_hash = ? AND r.used_at IS NULL AND r.expires_at > ? AND u.active = 1'
    );
    $q->execute([hash('sha256', $token), now()]);
    $r = $q->fetch();
    if (!$r || !preg_match('/^[0-9a-f]{64}$/', $token)) {
        respond(400, ['error' => 'This reset link is invalid or has expired. Request a new one.']);
    }
    if (strtolower($password) === strtolower($r['email'])) {
        respond(400, ['error' => 'Choose a password that is different from your email']);
    }
    $pdo->prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?')
        ->execute([hash_password($password), $r['user_id']]);
    $pdo->prepare('UPDATE password_resets SET used_at = ? WHERE user_id = ? AND used_at IS NULL')->execute([now(), $r['user_id']]);
    $pdo->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$r['email']]);
    drop_user_sessions((int) $r['user_id']);
    respond(200, ['ok' => true]);
}

if ($action !== 'login') {
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
$remember = ($in['remember'] ?? false) === true;
session_regenerate_id(true);
$_SESSION['uid'] = (int) $u['id'];
$_SESSION['rem'] = $remember;
set_login_cookies($remember);
respond(200, ['user' => current_user()]);
