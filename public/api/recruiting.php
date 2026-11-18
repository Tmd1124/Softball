<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const SECTIONS = ['site', 'softball', 'basketball'];

function obj(mixed $v): array
{
    if (!is_array($v) || ($v !== [] && array_is_list($v))) {
        respond(400, ['error' => 'Invalid data']);
    }
    return $v;
}

function str(array $a, string $k, int $max = 300): string
{
    $v = $a[$k] ?? '';
    if (!is_string($v)) {
        respond(400, ['error' => "Invalid $k"]);
    }
    $v = trim($v);
    if (strlen($v) > $max) {
        respond(400, ['error' => "$k is too long (max $max characters)"]);
    }
    return $v;
}

function phone(array $a, string $k): string
{
    $v = str($a, $k, 30);
    if ($v === '') {
        return '';
    }
    $d = preg_replace('/\D/', '', $v);
    if (strlen($d) === 11 && $d[0] === '1') {
        $d = substr($d, 1);
    }
    if (strlen($d) !== 10) {
        respond(400, ['error' => 'Enter phone numbers as 10 digits, like (770) 555-0123']);
    }
    return sprintf('(%s) %s-%s', substr($d, 0, 3), substr($d, 3, 3), substr($d, 6));
}

function email(array $a, string $k): string
{
    $v = strtolower(str($a, $k, 254));
    if ($v !== '' && filter_var($v, FILTER_VALIDATE_EMAIL) === false) {
        respond(400, ['error' => 'Enter a valid email address, like name@example.com']);
    }
    return $v;
}

function url(array $a, string $k, bool $httpsOnly = false): string
{
    $v = str($a, $k, 500);
    if ($v === '') {
        return '';
    }
    $ok = $httpsOnly
        ? preg_match('#^https://\S+$#i', $v)
        : preg_match('#^(https?://\S+|/(?!/)\S*)$#i', $v);
    if (!$ok) {
        respond(400, ['error' => $httpsOnly ? "$k must start with https://" : "$k must be a web address starting with https:// or /"]);
    }
    return $v;
}

function rows(mixed $v, int $max, callable $clean): array
{
    if (!is_array($v) || count($v) > $max || ($v !== [] && !array_is_list($v))) {
        respond(400, ['error' => "Too many rows (max $max)"]);
    }
    return array_map(fn($r) => $clean(obj($r)), $v);
}

function clean_video(array $a): array
{
    return [
        'title' => str($a, 'title', 120),
        'blurb' => str($a, 'blurb', 200),
        'length' => str($a, 'length', 60),
        'embedUrl' => url($a, 'embedUrl', true),
    ];
}

function clean_site(array $in): array
{
    $at = obj($in['athlete'] ?? null);
    $ac = obj($in['academics'] ?? null);
    $co = obj($in['contact'] ?? null);
    $pa = obj($co['parent'] ?? null);
    $social = obj($co['social'] ?? null);
    $x = obj($social['x'] ?? null);
    $ig = obj($social['instagram'] ?? null);
    $year = $at['classYear'] ?? null;
    if (!is_int($year) || $year < 2000 || $year > 2100) {
        respond(400, ['error' => 'Class year must be a year']);
    }
    return [
        'siteUrl' => url($in, 'siteUrl', true),
        'athlete' => [
            'name' => str($at, 'name', 80),
            'classYear' => $year,
            'school' => str($at, 'school', 120),
            'location' => str($at, 'location', 80),
            'height' => str($at, 'height', 20),
            'jersey' => str($at, 'jersey', 10),
            'weight' => str($at, 'weight', 20),
        ],
        'academics' => [
            'gpa' => str($ac, 'gpa', 20),
            'courses' => str($ac, 'courses', 200),
            'classRank' => str($ac, 'classRank', 30),
            'sat' => str($ac, 'sat', 20),
            'act' => str($ac, 'act', 20),
            'ncaaId' => str($ac, 'ncaaId', 30),
        ],
        'contact' => [
            'email' => email($co, 'email'),
            'phone' => phone($co, 'phone'),
            'parent' => ['name' => str($pa, 'name', 80), 'email' => email($pa, 'email'), 'phone' => phone($pa, 'phone')],
            'social' => [
                'x' => ['handle' => str($x, 'handle', 60), 'url' => url($x, 'url')],
                'instagram' => ['handle' => str($ig, 'handle', 60), 'url' => url($ig, 'url')],
            ],
        ],
    ];
}

function clean_sport(array $in, string $name): array
{
    $featured = obj($in['featured'] ?? null);
    $cols = obj($in['scheduleColumns'] ?? null);
    $out = [
        'label' => ucfirst($name),
        'photo' => url($in, 'photo'),
        'photoFocus' => is_int($in['photoFocus'] ?? null) ? max(0, min(100, $in['photoFocus'])) : 20,
        'positions' => str($in, 'positions', 160),
        'teams' => rows($in['teams'] ?? [], 20, function (array $t) {
            $type = str($t, 'type', 20);
            if ($type !== '' && !in_array($type, ['High School', 'Travel / AAU'], true)) {
                respond(400, ['error' => 'Invalid team type']);
            }
            return [
                'year' => str($t, 'year', 20),
                'name' => str($t, 'name', 160),
                'type' => $type,
                'coach' => str($t, 'coach', 80),
                'owner' => str($t, 'owner', 80),
                'phone' => phone($t, 'phone'),
                'email' => email($t, 'email'),
                'social' => url($t, 'social'),
                'stats' => rows($t['stats'] ?? [], 12, fn(array $x) => ['label' => str($x, 'label', 60), 'value' => str($x, 'value', 30), 'note' => str($x, 'note', 60)]),
            ];
        }),
        'trainers' => rows($in['trainers'] ?? [], 10, fn(array $t) => ['name' => str($t, 'name', 80), 'phone' => phone($t, 'phone'), 'email' => email($t, 'email')]),
        'metrics' => rows($in['metrics'] ?? [], 8, function (array $m) {
            $key = str($m, 'key', 32);
            if (!preg_match('/^[a-zA-Z0-9]{1,32}$/', $key)) {
                respond(400, ['error' => 'Invalid metric key']);
            }
            $o = ['key' => $key, 'label' => str($m, 'label', 60), 'value' => str($m, 'value', 30), 'verified' => str($m, 'verified', 30)];
            if (str($m, 'unit', 10) !== '') {
                $o['unit'] = str($m, 'unit', 10);
            }
            return $o;
        }),
        'featured' => clean_video($featured),
        'clipsTitle' => str($in, 'clipsTitle', 120),
        'clips' => rows($in['clips'] ?? [], 6, 'clean_video'),
        'summary' => str($in, 'summary', 2000),
        'scheduleTitle' => str($in, 'scheduleTitle', 120),
        'scheduleColumns' => ['event' => str($cols, 'event', 80), 'info' => str($cols, 'info', 80)],
        'schedule' => rows($in['schedule'] ?? [], 40, fn(array $e) => [
            'date' => str($e, 'date', 40),
            'event' => str($e, 'event', 160),
            'location' => str($e, 'location', 120),
            'team' => str($e, 'team', 120),
            'info' => str($e, 'info', 160),
            'infoUrl' => url($e, 'infoUrl'),
        ]),
        'links' => rows($in['links'] ?? [], 8, fn(array $l) => ['label' => str($l, 'label', 60), 'url' => url($l, 'url')]),
        'awards' => rows($in['awards'] ?? [], 16, fn(array $x) => ['title' => str($x, 'title', 120), 'year' => str($x, 'year', 20)]),
    ];
    if (str($in, 'handedness', 60) !== '') {
        $out['handedness'] = str($in, 'handedness', 60);
    }
    return $out;
}

function load_sections(PDO $pdo): array
{
    $out = array_fill_keys(SECTIONS, null);
    foreach ($pdo->query('SELECT section, data FROM site_content')->fetchAll() as $r) {
        if (array_key_exists($r['section'], $out)) {
            $out[$r['section']] = json_decode($r['data'], true);
        }
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(200, ['content' => load_sections(db())]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$me = require_role('admin');
$pdo = db();
$in = json_body();
$section = $in['section'] ?? null;
if (!is_string($section) || !in_array($section, SECTIONS, true)) {
    respond(400, ['error' => 'Unknown section']);
}

switch ($in['action'] ?? '') {
    case 'save':
        $data = $section === 'site' ? clean_site(obj($in['data'] ?? null)) : clean_sport(obj($in['data'] ?? null), $section);
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $u = $pdo->prepare('UPDATE site_content SET data = ?, updated_at = ?, updated_by = ? WHERE section = ?');
        $u->execute([$json, now(), $me['id'], $section]);
        $exists = $pdo->prepare('SELECT COUNT(*) FROM site_content WHERE section = ?');
        $exists->execute([$section]);
        if ((int) $exists->fetchColumn() === 0) {
            $pdo->prepare('INSERT INTO site_content (section, data, updated_at, updated_by) VALUES (?, ?, ?, ?)')
                ->execute([$section, $json, now(), $me['id']]);
        }
        respond(200, ['content' => load_sections($pdo)]);

    case 'reset':
        $pdo->prepare('DELETE FROM site_content WHERE section = ?')->execute([$section]);
        respond(200, ['content' => load_sections($pdo)]);

    default:
        respond(400, ['error' => 'Unknown action']);
}
