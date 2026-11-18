<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_VIDEO_BYTES = 150000000;
function ini_bytes(string $name): int
{
    $v = trim((string) ini_get($name));
    $n = (int) $v;
    return match (strtolower(substr($v, -1))) {
        'g' => $n * 1073741824,
        'm' => $n * 1048576,
        'k' => $n * 1024,
        default => $n,
    };
}

function sniff_ext(string $path): ?string
{
    $head = (string) file_get_contents($path, false, null, 0, 12);
    if (strlen($head) >= 12 && substr($head, 4, 4) === 'ftyp') {
        return substr($head, 8, 4) === 'qt  ' ? 'mov' : 'mp4';
    }
    return str_starts_with($head, "\x1A\x45\xDF\xA3") ? 'webm' : null;
}

function limit_mb(): int
{
    $caps = array_filter([MAX_VIDEO_BYTES, ini_bytes('upload_max_filesize'), ini_bytes('post_max_size')]);
    return (int) floor(min($caps) / 1048576);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_role('admin');
    respond(200, ['limitMb' => limit_mb()]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

require_role('admin');

$file = $_FILES['video'] ?? null;
if ($file === null) {
    respond(400, ['error' => 'That video is too large for this server (limit ' . limit_mb() . ' MB). Use a smaller file or paste a YouTube link instead.']);
}
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $tooBig = in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
    respond(400, ['error' => $tooBig ? 'That video is too large for this server (limit ' . limit_mb() . ' MB). Use a smaller file or paste a YouTube link instead.' : 'The upload did not finish. Please try again.']);
}
if ($file['size'] > MAX_VIDEO_BYTES) {
    respond(400, ['error' => 'That video is too large (limit ' . limit_mb() . ' MB).']);
}

$ext = sniff_ext($file['tmp_name']);
if ($ext === null) {
    respond(400, ['error' => 'Use an MP4, WebM or MOV video.']);
}

$sport = $_POST['sport'] ?? '';
if (!is_string($sport) || !in_array($sport, SPORTS, true)) {
    respond(400, ['error' => 'Unknown sport']);
}
$root = dirname(__DIR__) . '/uploads/videos';
$dir = "$root/$sport";
if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
    respond(500, ['error' => 'Could not save the video on the server']);
}
$guard = $root . '/.htaccess';
if (!is_file($guard)) {
    file_put_contents($guard, "Options -ExecCGI -Indexes\nRemoveHandler .php .phtml .php3 .php5\n<IfModule mod_php.c>\n  php_flag engine off\n</IfModule>\nAddType video/mp4 .mp4\nAddType video/webm .webm\nAddType video/quicktime .mov\n");
}

$name = bin2hex(random_bytes(16)) . '.' . $ext;
if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
    respond(500, ['error' => 'Could not save the video on the server']);
}
respond(200, ['url' => "/uploads/videos/$sport/$name"]);
