<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/lib.php';

$wanted = [
    ['role' => 'admin', 'email' => 'SEED_ADMIN_EMAIL', 'password' => 'SEED_ADMIN_PASSWORD'],
    ['role' => 'sports', 'email' => 'SEED_SPORTS_EMAIL', 'password' => 'SEED_SPORTS_PASSWORD'],
];

$pdo = db();
foreach ($wanted as $cfg) {
    $email = strtolower(trim((string) getenv($cfg['email'])));
    $pw = getenv($cfg['password']);
    if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false || $pw === false || strlen($pw) < 8) {
        fwrite(STDERR, "need a valid {$cfg['email']} and a {$cfg['password']} of 8+ characters\n");
        exit(1);
    }
    $exists = $pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
    $exists->execute([$email]);
    if ((int) $exists->fetchColumn() > 0) {
        echo "skip   $email (already exists)\n";
        continue;
    }
    $pdo->prepare('INSERT INTO users (email, password_hash, role, active, created_at) VALUES (?, ?, ?, 1, ?)')
        ->execute([$email, password_hash($pw, PASSWORD_BCRYPT, ['cost' => 12]), $cfg['role'], now()]);
    echo "create $email ({$cfg['role']})\n";
}
