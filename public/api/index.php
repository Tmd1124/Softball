<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

const MAX_ROWS_PER_ATHLETE = 5000;

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST'], true)) {
    respond(405, ['error' => 'Method not allowed']);
}

$key = athlete_hash();
$pdo = db();

if ($method === 'GET') {
    if (($_GET['dates'] ?? '') === '1') {
        $q = $pdo->prepare(
            'SELECT work_date, COUNT(*) AS n FROM workout_log
             WHERE key_hash = ? AND completed_at IS NOT NULL
             GROUP BY work_date ORDER BY work_date DESC LIMIT 400'
        );
        $q->execute([$key]);
        respond(200, ['dates' => array_map(
            fn($r) => ['date' => $r['work_date'], 'completed' => (int) $r['n']],
            $q->fetchAll()
        )]);
    }

    $date = valid_date($_GET['date'] ?? null);
    $q = $pdo->prepare(
        'SELECT day_id, exercise_id, sets_done, weight_lb, completed_at FROM workout_log
         WHERE key_hash = ? AND work_date = ? ORDER BY completed_at, updated_at'
    );
    $q->execute([$key, $date]);
    respond(200, ['entries' => array_map(fn($r) => [
        'dayId' => $r['day_id'],
        'exerciseId' => $r['exercise_id'],
        'sets' => (int) $r['sets_done'],
        'weight' => $r['weight_lb'] === null ? null : (float) $r['weight_lb'],
        'completedAt' => $r['completed_at'],
    ], $q->fetchAll())]);
}

$in = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($in)) {
    respond(400, ['error' => 'Invalid JSON']);
}

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
        $u = $pdo->prepare('UPDATE workout_log SET sets_done = ?, weight_lb = ?, completed_at = ?, updated_at = ? WHERE key_hash = ? AND work_date = ? AND day_id = ? AND exercise_id = ?');
        $u->execute([$sets, $weight, $done, now(), $key, $date, $day, $ex]);
        if ($u->rowCount() === 0) {
            $c = $pdo->prepare('SELECT COUNT(*) FROM workout_log WHERE key_hash = ?');
            $c->execute([$key]);
            if ((int) $c->fetchColumn() >= MAX_ROWS_PER_ATHLETE) {
                $pdo->rollBack();
                respond(429, ['error' => 'Storage limit reached']);
            }
            $pdo->prepare('INSERT INTO workout_log (key_hash, work_date, day_id, exercise_id, sets_done, weight_lb, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute([$key, $date, $day, $ex, $sets, $weight, $done, now()]);
        }
        $pdo->commit();
        respond(200, ['ok' => true]);

    case 'reset':
        $date = valid_date($in['date'] ?? null);
        $day = valid_id($in['dayId'] ?? null, 'dayId');
        $pdo->prepare('DELETE FROM workout_log WHERE key_hash = ? AND work_date = ? AND day_id = ?')
            ->execute([$key, $date, $day]);
        respond(200, ['ok' => true]);

    default:
        respond(400, ['error' => 'Unknown action']);
}
