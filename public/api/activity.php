<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_ROWS_PER_USER = 20000;

$me = require_role('sports', 'admin');
$pdo = db();
$uid = $me['id'];

function entry_row(array $r): array
{
    return [
        'dayId' => $r['day_id'],
        'exerciseId' => $r['exercise_id'],
        'sets' => (int) $r['sets_done'],
        'weight' => $r['weight_lb'] === null ? null : (float) $r['weight_lb'],
        'completedAt' => $r['completed_at'],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (($_GET['summary'] ?? '') === '1') {
        $weekAgo = gmdate('Y-m-d H:i:s', time() - 7 * 86400);
        $out = [];
        foreach (SPORTS as $sport) {
            $s = $pdo->prepare(
                'SELECT COUNT(*) AS completed,
                        COUNT(DISTINCT work_date) AS days,
                        MAX(completed_at) AS last_at,
                        SUM(CASE WHEN completed_at >= ? THEN 1 ELSE 0 END) AS week
                 FROM activity_log WHERE user_id = ? AND sport = ? AND completed_at IS NOT NULL'
            );
            $s->execute([$weekAgo, $uid, $sport]);
            $row = $s->fetch();

            $best = $pdo->prepare(
                'SELECT exercise_id, MAX(weight_lb) AS best FROM activity_log
                 WHERE user_id = ? AND sport = ? AND weight_lb IS NOT NULL AND weight_lb > 0 AND day_id <> ?
                 GROUP BY exercise_id ORDER BY best DESC LIMIT 5'
            );
            $best->execute([$uid, $sport, 'mobility']);

            $recent = $pdo->prepare(
                'SELECT day_id, exercise_id, sets_done, weight_lb, completed_at FROM activity_log
                 WHERE user_id = ? AND sport = ? AND completed_at IS NOT NULL
                 ORDER BY completed_at DESC LIMIT 5'
            );
            $recent->execute([$uid, $sport]);

            $out[$sport] = [
                'completed' => (int) $row['completed'],
                'days' => (int) $row['days'],
                'week' => (int) ($row['week'] ?? 0),
                'lastAt' => $row['last_at'],
                'bests' => array_map(fn($r) => ['exerciseId' => $r['exercise_id'], 'weight' => (float) $r['best']], $best->fetchAll()),
                'recent' => array_map('entry_row', $recent->fetchAll()),
            ];
        }
        respond(200, ['sports' => $out]);
    }

    $sport = valid_sport($_GET['sport'] ?? null);

    if (($_GET['dates'] ?? '') === '1') {
        $q = $pdo->prepare(
            'SELECT work_date, COUNT(*) AS n FROM activity_log
             WHERE user_id = ? AND sport = ? AND completed_at IS NOT NULL
             GROUP BY work_date ORDER BY work_date DESC LIMIT 400'
        );
        $q->execute([$uid, $sport]);
        respond(200, ['dates' => array_map(
            fn($r) => ['date' => $r['work_date'], 'completed' => (int) $r['n']],
            $q->fetchAll()
        )]);
    }

    $date = valid_date($_GET['date'] ?? null);
    $q = $pdo->prepare(
        'SELECT day_id, exercise_id, sets_done, weight_lb, completed_at FROM activity_log
         WHERE user_id = ? AND sport = ? AND work_date = ? ORDER BY completed_at, updated_at'
    );
    $q->execute([$uid, $sport, $date]);
    respond(200, ['entries' => array_map('entry_row', $q->fetchAll())]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$in = json_body();
$sport = valid_sport($in['sport'] ?? null);

switch ($in['action'] ?? '') {
    case 'log':
        $date = valid_date($in['date'] ?? null);
        $day = valid_id($in['dayId'] ?? null, 'dayId');
        $ex = valid_id($in['exerciseId'] ?? null, 'exerciseId');
        $sets = $in['sets'] ?? null;
        if (!is_int($sets) || $sets < 0 || $sets > 20) {
            respond(400, ['error' => 'Invalid sets']);
        }
        $weight = valid_weight($in['weight'] ?? null);
        $done = valid_completed_at($in['completedAt'] ?? null);

        $pdo->beginTransaction();
        $u = $pdo->prepare('UPDATE activity_log SET sets_done = ?, weight_lb = ?, completed_at = ?, updated_at = ? WHERE user_id = ? AND sport = ? AND work_date = ? AND day_id = ? AND exercise_id = ?');
        $u->execute([$sets, $weight, $done, now(), $uid, $sport, $date, $day, $ex]);
        if ($u->rowCount() === 0) {
            $c = $pdo->prepare('SELECT COUNT(*) FROM activity_log WHERE user_id = ?');
            $c->execute([$uid]);
            if ((int) $c->fetchColumn() >= MAX_ROWS_PER_USER) {
                $pdo->rollBack();
                respond(429, ['error' => 'Storage limit reached']);
            }
            $pdo->prepare('INSERT INTO activity_log (user_id, sport, work_date, day_id, exercise_id, sets_done, weight_lb, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([$uid, $sport, $date, $day, $ex, $sets, $weight, $done, now()]);
        }
        $pdo->commit();
        respond(200, ['ok' => true]);

    case 'reset':
        $date = valid_date($in['date'] ?? null);
        $day = valid_id($in['dayId'] ?? null, 'dayId');
        $pdo->prepare('DELETE FROM activity_log WHERE user_id = ? AND sport = ? AND work_date = ? AND day_id = ?')
            ->execute([$uid, $sport, $date, $day]);
        respond(200, ['ok' => true]);

    default:
        respond(400, ['error' => 'Unknown action']);
}
