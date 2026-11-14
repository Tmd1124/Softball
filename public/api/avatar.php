<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

$me = current_user();
if ($me === null) {
    respond(401, ['error' => 'Sign in required']);
}

$q = db()->prepare('SELECT avatar_mime, avatar_data FROM profiles WHERE user_id = ?');
$q->execute([$me['id']]);
$r = $q->fetch();
$bytes = $r && $r['avatar_data'] !== null ? base64_decode((string) $r['avatar_data'], true) : false;
if ($bytes === false || !in_array($r['avatar_mime'], ['image/jpeg', 'image/png', 'image/webp'], true)) {
    respond(404, ['error' => 'No picture']);
}

header('Content-Type: ' . $r['avatar_mime']);
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'");
header('Cache-Control: private, max-age=604800');
header('Content-Length: ' . strlen($bytes));
echo $bytes;
