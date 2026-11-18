<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const RESERVED_SLUGS = ['api', 'admin', 'reset', 'schedule', 'teams', 'profile', 'assets', 'img', 'uploads', 'sport', 'sports', 'login', 'logout', 'workouts', 'sitemap', 'robots', 'icon', 'manifest', 'dist', 'src', 'public', 'help', 'index', 'node_modules'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}
require_role('admin');
$pdo = db();
$in = json_body();

function text(array $a, string $k, int $max, string $what, bool $required = true): string
{
    $v = $a[$k] ?? '';
    if (!is_string($v)) {
        respond(400, ['error' => "Invalid $what"]);
    }
    $v = trim($v);
    if ($required && $v === '') {
        respond(400, ['error' => "Enter the $what"]);
    }
    if (strlen($v) > $max) {
        respond(400, ['error' => "The $what is too long (max $max characters)"]);
    }
    return $v;
}

function camel(string $label, int $i): string
{
    $words = preg_split('/[^a-z0-9]+/', strtolower($label), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $key = '';
    foreach ($words as $n => $w) {
        $key .= $n === 0 ? $w : ucfirst($w);
    }
    return $key !== '' ? substr($key, 0, 24) : 'm' . $i;
}

function settings(array $in): array
{
    $accent = strtolower(text($in, 'accent', 7, 'color'));
    if (!preg_match('/^#[0-9a-f]{6}$/', $accent)) {
        respond(400, ['error' => 'Choose a color']);
    }
    $style = $in['positionStyle'] ?? '';
    if (!in_array($style, ['multi', 'pair'], true)) {
        respond(400, ['error' => 'Choose how positions are picked']);
    }
    $rawPositions = $in['positions'] ?? [];
    if (!is_array($rawPositions) || !array_is_list($rawPositions) || count($rawPositions) > 40) {
        respond(400, ['error' => 'Use up to 40 choices']);
    }
    $positions = [];
    foreach ($rawPositions as $p) {
        if (!is_string($p) || strlen(trim($p)) > 40) {
            respond(400, ['error' => 'Each choice can be up to 40 characters']);
        }
        if (trim($p) !== '' && !in_array(trim($p), $positions, true)) {
            $positions[] = trim($p);
        }
    }
    $rawMetrics = $in['metrics'] ?? [];
    if (!is_array($rawMetrics) || !array_is_list($rawMetrics) || count($rawMetrics) > 8) {
        respond(400, ['error' => 'Use up to 8 starter measurables']);
    }
    $metrics = [];
    $used = [];
    foreach ($rawMetrics as $i => $m) {
        if (!is_array($m)) {
            respond(400, ['error' => 'Invalid measurable']);
        }
        $label = text($m, 'label', 40, 'measurable name', false);
        if ($label === '') {
            continue;
        }
        $key = camel($label, $i);
        while (in_array($key, $used, true)) {
            $key .= $i;
        }
        $used[] = $key;
        $metrics[] = ['key' => $key, 'label' => $label, 'unit' => text($m, 'unit', 10, 'unit', false)];
    }
    return [
        'accent' => $accent,
        'position_style' => $style,
        'position_label' => text($in, 'positionLabel', 20, 'name for the choices'),
        'handedness' => ($in['handedness'] ?? false) === true ? 1 : 0,
        'positions' => json_encode($positions, JSON_UNESCAPED_UNICODE),
        'metrics' => json_encode($metrics, JSON_UNESCAPED_UNICODE),
        'label' => text($in, 'label', 40, 'sport name'),
    ];
}

function exists(PDO $pdo, string $id): array
{
    $q = $pdo->prepare('SELECT * FROM sports WHERE id = ?');
    $q->execute([$id]);
    $row = $q->fetch();
    if (!$row) {
        respond(404, ['error' => 'Unknown sport']);
    }
    return $row;
}

function video_files(string $id, ?string $contentJson): array
{
    $root = dirname(__DIR__) . '/uploads/videos';
    $files = [];
    if (is_dir("$root/$id")) {
        foreach (scandir("$root/$id") ?: [] as $f) {
            if ($f !== '.' && $f !== '..' && is_file("$root/$id/$f")) {
                $files[] = "$root/$id/$f";
            }
        }
    }
    if ($contentJson !== null && preg_match_all('#/uploads/videos/((?:[a-z0-9-]+/)?[a-f0-9]{32}\.(?:mp4|webm|mov))#', $contentJson, $m)) {
        foreach ($m[1] as $rel) {
            if (is_file("$root/$rel")) {
                $files[] = "$root/$rel";
            }
        }
    }
    return array_values(array_unique($files));
}

function impact(PDO $pdo, string $id): array
{
    $content = $pdo->prepare('SELECT data FROM site_content WHERE section = ?');
    $content->execute([$id]);
    $json = $content->fetchColumn();
    $logs = $pdo->prepare('SELECT COUNT(*) FROM activity_log WHERE sport = ?');
    $logs->execute([$id]);
    return ['videos' => count(video_files($id, $json === false ? null : (string) $json)), 'workoutEntries' => (int) $logs->fetchColumn(), 'hasContent' => $json !== false];
}

switch ($in['action'] ?? '') {
    case 'impact':
        $id = (string) ($in['id'] ?? '');
        exists($pdo, $id);
        respond(200, ['impact' => impact($pdo, $id)]);

    case 'delete':
        $id = (string) ($in['id'] ?? '');
        exists($pdo, $id);
        if (($in['confirm'] ?? false) !== true) {
            respond(400, ['error' => 'Confirm that you want to erase this sport']);
        }
        if (count(site_sports($pdo)) <= 1) {
            respond(400, ['error' => 'Keep at least one sport on the site. Hide it instead.']);
        }
        $content = $pdo->prepare('SELECT data FROM site_content WHERE section = ?');
        $content->execute([$id]);
        $json = $content->fetchColumn();
        $files = video_files($id, $json === false ? null : (string) $json);
        $pdo->beginTransaction();
        try {
            foreach (['DELETE FROM site_content WHERE section = ?', 'DELETE FROM site_images WHERE name = ?', 'DELETE FROM activity_log WHERE sport = ?', 'DELETE FROM sports WHERE id = ?'] as $sql) {
                $pdo->prepare($sql)->execute([$id]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            respond(500, ['error' => 'Could not erase the sport. Nothing was changed.']);
        }
        foreach ($files as $f) {
            @unlink($f);
        }
        $dir = dirname(__DIR__) . '/uploads/videos/' . $id;
        if (is_dir($dir)) {
            @rmdir($dir);
        }
        break;

    case 'create':
        $id = strtolower(text($in, 'id', 30, 'web address'));
        if (!preg_match('/^[a-z0-9][a-z0-9-]{1,29}$/', $id) || in_array($id, RESERVED_SLUGS, true)) {
            respond(400, ['error' => 'That web address is not allowed. Use 2 to 30 lowercase letters, numbers or dashes, like track-and-field.']);
        }
        $dup = $pdo->prepare('SELECT COUNT(*) FROM sports WHERE id = ?');
        $dup->execute([$id]);
        if ((int) $dup->fetchColumn() > 0) {
            respond(400, ['error' => 'A sport with that web address already exists']);
        }
        $s = settings($in);
        $order = (int) $pdo->query('SELECT COALESCE(MAX(sort_order), 0) FROM sports')->fetchColumn() + 1;
        $pdo->prepare('INSERT INTO sports (id, label, accent, position_style, position_label, handedness, positions, metrics, visible, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)')
            ->execute([$id, $s['label'], $s['accent'], $s['position_style'], $s['position_label'], $s['handedness'], $s['positions'], $s['metrics'], $order, now()]);
        break;

    case 'update':
        $id = (string) ($in['id'] ?? '');
        exists($pdo, $id);
        $s = settings($in);
        $pdo->prepare('UPDATE sports SET label = ?, accent = ?, position_style = ?, position_label = ?, handedness = ?, positions = ?, metrics = ? WHERE id = ?')
            ->execute([$s['label'], $s['accent'], $s['position_style'], $s['position_label'], $s['handedness'], $s['positions'], $s['metrics'], $id]);
        break;

    case 'visibility':
        $id = (string) ($in['id'] ?? '');
        exists($pdo, $id);
        $pdo->prepare('UPDATE sports SET visible = ? WHERE id = ?')->execute([($in['visible'] ?? false) === true ? 1 : 0, $id]);
        break;

    case 'move':
        $id = (string) ($in['id'] ?? '');
        exists($pdo, $id);
        $ids = array_column(site_sports($pdo), 'id');
        $i = array_search($id, $ids, true);
        $j = $i + (($in['dir'] ?? 0) === -1 ? -1 : 1);
        if (isset($ids[$j])) {
            [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
            $set = $pdo->prepare('UPDATE sports SET sort_order = ? WHERE id = ?');
            foreach ($ids as $n => $sid) {
                $set->execute([$n + 1, $sid]);
            }
        }
        break;

    default:
        respond(400, ['error' => 'Unknown action']);
}
respond(200, ['sports' => site_sports($pdo)]);
