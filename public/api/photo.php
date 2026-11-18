<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_PHOTO_BYTES = 1500000;

function sport_param(mixed $v): string
{
    if (!is_string($v) || !in_array($v, SPORTS, true)) {
        respond(400, ['error' => 'Unknown sport']);
    }
    return $v;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sport = sport_param($_GET['sport'] ?? null);
    $q = db()->prepare('SELECT mime, data FROM site_images WHERE name = ?');
    $q->execute([$sport]);
    $row = $q->fetch();
    if (!$row) {
        http_response_code(404);
        exit;
    }
    $bytes = base64_decode((string) $row['data'], true);
    if ($bytes === false) {
        http_response_code(404);
        exit;
    }
    header('Content-Type: ' . $row['mime']);
    header('Content-Length: ' . strlen($bytes));
    header('Cache-Control: public, max-age=604800');
    header('X-Content-Type-Options: nosniff');
    echo $bytes;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

require_role('admin');
$pdo = db();
$in = json_body();
$sport = sport_param($in['sport'] ?? null);

switch ($in['action'] ?? '') {
    case 'upload':
        $data = $in['image'] ?? null;
        if (!is_string($data) || !preg_match('#^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$#', $data, $m)) {
            respond(400, ['error' => 'Use a JPEG, PNG or WebP image']);
        }
        $bytes = base64_decode($m[2], true);
        if ($bytes === false || strlen($bytes) > MAX_PHOTO_BYTES) {
            respond(400, ['error' => 'That picture is too large. Choose a smaller one.']);
        }
        $info = @getimagesizefromstring($bytes);
        if ($info === false || !in_array($info['mime'], ['image/jpeg', 'image/png', 'image/webp'], true)) {
            respond(400, ['error' => 'That file is not a valid image']);
        }
        $u = $pdo->prepare('UPDATE site_images SET mime = ?, data = ?, updated_at = ? WHERE name = ?');
        $u->execute([$info['mime'], base64_encode($bytes), now(), $sport]);
        $has = $pdo->prepare('SELECT COUNT(*) FROM site_images WHERE name = ?');
        $has->execute([$sport]);
        if ((int) $has->fetchColumn() === 0) {
            $pdo->prepare('INSERT INTO site_images (name, mime, data, updated_at) VALUES (?, ?, ?, ?)')
                ->execute([$sport, $info['mime'], base64_encode($bytes), now()]);
        }
        respond(200, ['url' => '/api/photo.php?sport=' . $sport . '&v=' . time()]);

    case 'delete':
        $pdo->prepare('DELETE FROM site_images WHERE name = ?')->execute([$sport]);
        respond(200, ['ok' => true]);

    default:
        respond(400, ['error' => 'Unknown action']);
}
