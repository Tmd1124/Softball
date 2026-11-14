<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_AVATAR_BYTES = 200000;
const MAX_AVATAR_PIXELS = 1024;

$me = require_role('admin', 'sports');
$pdo = db();

function profile_payload(PDO $pdo, int $id): array
{
    $q = $pdo->prepare(
        'SELECT u.id, u.email, u.role, u.created_at, u.last_login_at, u.must_change_password,
                p.display_name, p.phone, p.avatar_mime, p.updated_at AS profile_updated_at
         FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = ?'
    );
    $q->execute([$id]);
    $r = $q->fetch();
    return public_user($r) + [
        'phone' => $r['phone'],
        'createdAt' => $r['created_at'],
        'lastLoginAt' => $r['last_login_at'],
    ];
}

function save_profile(PDO $pdo, int $id, array $fields): void
{
    $exists = $pdo->prepare('SELECT COUNT(*) FROM profiles WHERE user_id = ?');
    $exists->execute([$id]);
    if ((int) $exists->fetchColumn() === 0) {
        $pdo->prepare('INSERT INTO profiles (user_id, updated_at) VALUES (?, ?)')->execute([$id, now()]);
    }
    $sets = [];
    $vals = [];
    foreach ($fields as $col => $val) {
        $sets[] = "$col = ?";
        $vals[] = $val;
    }
    $sets[] = 'updated_at = ?';
    $vals[] = now();
    $vals[] = $id;
    $pdo->prepare('UPDATE profiles SET ' . implode(', ', $sets) . ' WHERE user_id = ?')->execute($vals);
}

function clean_text(mixed $v, int $max, string $what): ?string
{
    if ($v === null) {
        return null;
    }
    if (!is_string($v)) {
        respond(400, ['error' => "Invalid $what"]);
    }
    $stripped = preg_replace('/[\x00-\x1F\x7F]/u', '', $v);
    if ($stripped === null) {
        respond(400, ['error' => "Invalid $what"]);
    }
    $v = trim($stripped);
    if (preg_match_all('/./us', $v) > $max) {
        respond(400, ['error' => "$what must be $max characters or fewer"]);
    }
    return $v === '' ? null : $v;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(200, ['profile' => profile_payload($pdo, $me['id'])]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$in = json_body();

switch ($in['action'] ?? '') {
    case 'update':
        $name = clean_text($in['displayName'] ?? null, 60, 'Name');
        $phone = clean_text($in['phone'] ?? null, 30, 'Phone');
        if ($phone !== null && !preg_match('/^[0-9+()\-. ]{3,30}$/', $phone)) {
            respond(400, ['error' => 'Phone can only contain digits, spaces and + ( ) - .']);
        }
        save_profile($pdo, $me['id'], ['display_name' => $name, 'phone' => $phone]);
        respond(200, ['profile' => profile_payload($pdo, $me['id'])]);

    case 'avatar':
        $data = $in['image'] ?? null;
        if ($data === null) {
            save_profile($pdo, $me['id'], ['avatar_mime' => null, 'avatar_data' => null]);
            respond(200, ['profile' => profile_payload($pdo, $me['id'])]);
        }
        if (!is_string($data) || !preg_match('#^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$#', $data, $m)) {
            respond(400, ['error' => 'Use a JPEG, PNG or WebP image']);
        }
        $bytes = base64_decode($m[2], true);
        if ($bytes === false || strlen($bytes) > MAX_AVATAR_BYTES) {
            respond(400, ['error' => 'That picture is too large']);
        }
        $info = @getimagesizefromstring($bytes);
        if ($info === false || $info['mime'] !== $m[1] || $info[0] > MAX_AVATAR_PIXELS || $info[1] > MAX_AVATAR_PIXELS) {
            respond(400, ['error' => 'That file is not a valid picture']);
        }
        save_profile($pdo, $me['id'], ['avatar_mime' => $m[1], 'avatar_data' => $m[2]]);
        respond(200, ['profile' => profile_payload($pdo, $me['id'])]);

    case 'password':
        $current = is_string($in['current'] ?? null) ? $in['current'] : '';
        $next = valid_password($in['next'] ?? null);

        $since = gmdate('Y-m-d H:i:s', time() - 15 * 60);
        $fails = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE email = ? AND attempted_at >= ?');
        $fails->execute([$me['email'], $since]);
        if ((int) $fails->fetchColumn() >= 5) {
            respond(429, ['error' => 'Too many failed attempts. Try again in 15 minutes.']);
        }

        $q = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
        $q->execute([$me['id']]);
        if (!password_verify($current, (string) $q->fetchColumn())) {
            $pdo->prepare('INSERT INTO login_attempts (ip, email, attempted_at) VALUES (?, ?, ?)')
                ->execute([substr($_SERVER['REMOTE_ADDR'] ?? '', 0, 45), $me['email'], now()]);
            respond(403, ['error' => 'Your current password is not correct']);
        }
        if ($next === $current) {
            respond(400, ['error' => 'Choose a password that is different from the current one']);
        }
        if (strtolower($next) === strtolower($me['email'])) {
            respond(400, ['error' => 'Choose a password that is different from your email']);
        }

        $pdo->prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?')
            ->execute([hash_password($next), $me['id']]);
        $pdo->prepare('DELETE FROM login_attempts WHERE email = ?')->execute([$me['email']]);
        // Sign out every other device, then keep this one signed in.
        $remember = ($_SESSION['rem'] ?? false) === true;
        drop_user_sessions($me['id']);
        session_regenerate_id(true);
        $_SESSION['uid'] = $me['id'];
        $_SESSION['rem'] = $remember;
        set_login_cookies($remember);
        respond(200, ['profile' => profile_payload($pdo, $me['id'])]);

    default:
        respond(400, ['error' => 'Unknown action']);
}
