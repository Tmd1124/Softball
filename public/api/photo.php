<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_PHOTO_BYTES = 1500000;
const MAX_FETCH_BYTES = 12000000;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

function sport_param(mixed $v): string
{
    return valid_site_sport($v);
}

function image_table(mixed $kind): string
{
    return $kind === 'card' ? 'sport_card_images' : 'site_images';
}

function image_url(string $sport, mixed $kind): string
{
    return '/api/photo.php?sport=' . $sport . ($kind === 'card' ? '&kind=card' : '') . '&v=' . time();
}

function store_photo(PDO $pdo, string $sport, string $bytes, string $mime, mixed $kind): void
{
    $t = image_table($kind);
    $b64 = base64_encode($bytes);
    $u = $pdo->prepare("UPDATE $t SET mime = ?, data = ?, updated_at = ? WHERE name = ?");
    $u->execute([$mime, $b64, now(), $sport]);
    $has = $pdo->prepare("SELECT COUNT(*) FROM $t WHERE name = ?");
    $has->execute([$sport]);
    if ((int) $has->fetchColumn() === 0) {
        $pdo->prepare("INSERT INTO $t (name, mime, data, updated_at) VALUES (?, ?, ?, ?)")->execute([$sport, $mime, $b64, now()]);
    }
}

function shrink_to_jpeg(string $bytes): ?string
{
    if (!function_exists('imagecreatefromstring')) {
        return null;
    }
    $im = @imagecreatefromstring($bytes);
    if ($im === false) {
        return null;
    }
    $w = imagesx($im);
    $h = imagesy($im);
    $k = min(1, 1400 / max($w, $h));
    $out = imagecreatetruecolor((int) round($w * $k), (int) round($h * $k));
    imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
    imagecopyresampled($out, $im, 0, 0, 0, 0, imagesx($out), imagesy($out), $w, $h);
    ob_start();
    imagejpeg($out, null, 85);
    return (string) ob_get_clean();
}

function fetch_remote_image(string $url): string
{
    if (!preg_match('#^https://([A-Za-z0-9.-]+)(:443)?/\S*$#', $url, $m) || strlen($url) > 500) {
        respond(400, ['error' => 'Enter a full image address starting with https://']);
    }
    $host = $m[1];
    $ip = gethostbyname($host);
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        respond(400, ['error' => 'That address could not be reached']);
    }
    $raw = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $buf = '';
        curl_setopt_array($ch, [
            CURLOPT_RESOLVE => ["$host:443:$ip"],
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_USERAGENT => 'EverHarrisSite/1.0',
            CURLOPT_HTTPHEADER => ['Accept: image/*'],
            CURLOPT_WRITEFUNCTION => function ($c, $d) use (&$buf) {
                $buf .= $d;
                return strlen($buf) > MAX_FETCH_BYTES ? 0 : strlen($d);
            },
        ]);
        $ok = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        $raw = $ok !== false && $code === 200 ? $buf : false;
    } else {
        $ctx = stream_context_create(['http' => ['timeout' => 15, 'follow_location' => 0, 'user_agent' => 'EverHarrisSite/1.0', 'header' => "Accept: image/*\r\n"]]);
        $raw = @file_get_contents($url, false, $ctx, 0, MAX_FETCH_BYTES + 1);
    }
    if ($raw === false || $raw === '' || strlen($raw) > MAX_FETCH_BYTES) {
        respond(400, ['error' => 'Could not download that image. Check the address, or save it to your computer and upload it.']);
    }
    return $raw;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sport = sport_param($_GET['sport'] ?? null);
    $shown = array_column(site_sports(db(), true), 'id');
    if (!in_array($sport, $shown, true) && !((current_user()['role'] ?? '') === 'admin')) {
        http_response_code(404);
        exit;
    }
    $q = db()->prepare('SELECT mime, data FROM ' . image_table($_GET['kind'] ?? '') . ' WHERE name = ?');
    $q->execute([$sport]);
    $row = $q->fetch();
    $bytes = $row ? base64_decode((string) $row['data'], true) : false;
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
        if ($info === false || !in_array($info['mime'], ALLOWED_MIMES, true)) {
            respond(400, ['error' => 'That file is not a valid image']);
        }
        store_photo($pdo, $sport, $bytes, $info['mime'], $in['kind'] ?? '');
        respond(200, ['url' => image_url($sport, $in['kind'] ?? '')]);

    case 'fetch':
        $url = $in['url'] ?? null;
        if (!is_string($url)) {
            respond(400, ['error' => 'Enter an image address']);
        }
        $bytes = fetch_remote_image(trim($url));
        $info = @getimagesizefromstring($bytes);
        if ($info === false || !in_array($info['mime'], ALLOWED_MIMES, true)) {
            respond(400, ['error' => 'That address is not a JPEG, PNG or WebP image']);
        }
        if (strlen($bytes) > MAX_PHOTO_BYTES || max($info[0], $info[1]) > 1600) {
            $small = shrink_to_jpeg($bytes);
            if ($small === null || strlen($small) > MAX_PHOTO_BYTES) {
                respond(400, ['error' => 'That image is too large. Save it to your computer and upload it instead.']);
            }
            $bytes = $small;
            $info['mime'] = 'image/jpeg';
        }
        store_photo($pdo, $sport, $bytes, $info['mime'], $in['kind'] ?? '');
        respond(200, ['url' => image_url($sport, $in['kind'] ?? '')]);

    case 'delete':
        $pdo->prepare('DELETE FROM ' . image_table($in['kind'] ?? '') . ' WHERE name = ?')->execute([$sport]);
        respond(200, ['ok' => true]);

    default:
        respond(400, ['error' => 'Unknown action']);
}
