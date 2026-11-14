<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

$me = require_role('admin');
$pdo = db();

function user_rows(PDO $pdo): array
{
    return array_map(fn($r) => [
        'id' => (int) $r['id'],
        'email' => $r['email'],
        'role' => $r['role'],
        'active' => (int) $r['active'] === 1,
        'createdAt' => $r['created_at'],
        'lastLoginAt' => $r['last_login_at'],
    ], $pdo->query('SELECT id, email, role, active, created_at, last_login_at FROM users ORDER BY email')->fetchAll());
}

function other_active_admins(PDO $pdo, int $excludeId): int
{
    $q = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = 'admin' AND active = 1 AND id <> ?");
    $q->execute([$excludeId]);
    return (int) $q->fetchColumn();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(200, ['users' => user_rows($pdo)]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$in = json_body();

switch ($in['action'] ?? '') {
    case 'create':
        $email = valid_email($in['email'] ?? null);
        $password = valid_password($in['password'] ?? null);
        $role = valid_role($in['role'] ?? null);
        $dup = $pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
        $dup->execute([$email]);
        if ((int) $dup->fetchColumn() > 0) {
            respond(409, ['error' => 'An account with that email already exists']);
        }
        $pdo->prepare('INSERT INTO users (email, password_hash, role, active, created_at, must_change_password) VALUES (?, ?, ?, 1, ?, 1)')
            ->execute([$email, hash_password($password), $role, now()]);
        respond(200, ['users' => user_rows($pdo)]);

    case 'update':
        $id = $in['id'] ?? null;
        if (!is_int($id)) {
            respond(400, ['error' => 'Invalid id']);
        }
        $q = $pdo->prepare('SELECT id, role, active FROM users WHERE id = ?');
        $q->execute([$id]);
        $target = $q->fetch();
        if (!$target) {
            respond(404, ['error' => 'User not found']);
        }
        $role = array_key_exists('role', $in) ? valid_role($in['role']) : $target['role'];
        $active = array_key_exists('active', $in) ? ($in['active'] === true ? 1 : 0) : (int) $target['active'];

        if ($id === $me['id'] && ($role !== 'admin' || $active !== 1)) {
            respond(400, ['error' => 'You cannot demote or deactivate your own account']);
        }
        if (($role !== 'admin' || $active !== 1) && $target['role'] === 'admin' && other_active_admins($pdo, $id) === 0) {
            respond(400, ['error' => 'There must be at least one active admin']);
        }

        $pdo->prepare('UPDATE users SET role = ?, active = ? WHERE id = ?')->execute([$role, $active, $id]);
        $reset = array_key_exists('password', $in);
        if ($reset) {
            $pdo->prepare('UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?')
                ->execute([hash_password(valid_password($in['password'])), $id === $me['id'] ? 0 : 1, $id]);
        }
        if ($active === 0 || $reset) {
            // A deactivated user or a reset password must not keep an older sign-in alive.
            drop_user_sessions($id);
        }
        respond(200, ['users' => user_rows($pdo)]);

    default:
        respond(400, ['error' => 'Unknown action']);
}
