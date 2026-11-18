<?php
declare(strict_types=1);

function cs_clean(mixed $v): string
{
    if (!is_string($v)) {
        return is_scalar($v) ? (string) $v : '';
    }
    $v = trim($v);
    if ($v === '' || str_contains($v, '[') || str_contains($v, '(000) 000-0000') || str_contains($v, '@example.com') || $v === 'Month/Year') {
        return '';
    }
    return $v;
}

function cs_join(array $parts, string $sep = ' | '): string
{
    return implode($sep, array_filter(array_map('cs_clean', $parts), fn($p) => $p !== ''));
}

function cs_when(array $e): string
{
    $date = cs_clean($e['date'] ?? '');
    $t = (string) ($e['time'] ?? '');
    $time = preg_match('/^(\d\d):(\d\d)$/', $t, $m) ? ((int) $m[1] % 12 ?: 12) . ':' . $m[2] . ((int) $m[1] < 12 ? ' AM' : ' PM') : '';
    return trim($date . ($time !== '' ? ' ' . $time : ''));
}

function cs_map(array $e): string
{
    $loc = cs_clean($e['location'] ?? '');
    $map = cs_clean($e['mapUrl'] ?? '');
    return $map !== '' ? 'Map: ' . $map : ($loc !== '' ? 'Map: https://www.google.com/maps/search/?api=1&query=' . rawurlencode($loc) : '');
}

function cs_facts(array $c): array
{
    $f = [];
    $add = function (string $sport, string $kw, string $text) use (&$f): void {
        if ($text !== '') {
            $f[] = ['sport' => $sport, 'kw' => $kw, 'text' => $text];
        }
    };
    if ($c['site']) {
        $a = $c['site']['athlete'] ?? [];
        $add('', 'athlete name class school location height weight jersey', cs_join([
            cs_clean($a['name'] ?? '') . (cs_clean($a['classYear'] ?? '') !== '' ? ', Class of ' . $a['classYear'] : ''),
            cs_clean($a['school'] ?? ''),
            cs_clean($a['location'] ?? ''),
            cs_clean($a['height'] ?? '') !== '' ? 'Height ' . $a['height'] : '',
            cs_clean($a['weight'] ?? '') !== '' ? 'Weight ' . $a['weight'] : '',
            cs_clean($a['jersey'] ?? '') !== '' ? 'Jersey #' . $a['jersey'] : '',
        ]));
        $ac = $c['site']['academics'] ?? [];
        $add('', 'academics academic gpa grades grade courses classes honors class rank ncaa eligibility sat act school', cs_join([
            cs_clean($ac['gpa'] ?? '') !== '' ? 'GPA ' . $ac['gpa'] : '',
            cs_clean($ac['courses'] ?? ''),
            cs_clean($ac['classRank'] ?? '') !== '' ? 'Class rank ' . $ac['classRank'] : '',
            cs_clean($ac['ncaaId'] ?? '') !== '' ? 'NCAA ID ' . $ac['ncaaId'] : '',
            cs_clean($ac['sat'] ?? '') !== '' ? 'SAT ' . $ac['sat'] : '',
            cs_clean($ac['act'] ?? '') !== '' ? 'ACT ' . $ac['act'] : '',
        ]));
        $co = $c['site']['contact'] ?? [];
        $add('', 'contact recruiting email phone reach call', cs_join([
            'Recruiting contact',
            cs_clean($co['email'] ?? ''),
            cs_clean($co['phone'] ?? ''),
        ]));
        $pa = $co['parent'] ?? [];
        $add('', 'contact parent guardian mother father email phone call', cs_join([
            'Parent / guardian ' . cs_clean($pa['name'] ?? ''),
            cs_clean($pa['email'] ?? ''),
            cs_clean($pa['phone'] ?? ''),
        ]));
        $so = $co['social'] ?? [];
        $add('', 'social instagram twitter x handle media follow', cs_join([
            cs_clean($so['x']['handle'] ?? '') !== '' ? 'X ' . $so['x']['handle'] : '',
            cs_clean($so['instagram']['handle'] ?? '') !== '' ? 'Instagram ' . $so['instagram']['handle'] : '',
        ]));
    }
    foreach (array_keys($c['_sports'] ?? []) as $s) {
        $d = $c[$s] ?? null;
        if (!$d) {
            continue;
        }
        $add($s, 'position positions plays bats throws hand handedness ' . strtolower((string) ($c['_posLabels'][$s] ?? '')) . ' ' . rtrim(strtolower((string) ($c['_posLabels'][$s] ?? '')), 's'), cs_join([cs_clean($d['positions'] ?? ''), cs_clean($d['handedness'] ?? '')]));
        foreach ($d['metrics'] ?? [] as $m) {
            $val = cs_clean($m['value'] ?? '');
            if ($val === '') {
                continue;
            }
            $v = $val . (cs_clean($m['unit'] ?? '') !== '' ? ' ' . $m['unit'] : '');
            $ver = cs_clean($m['verified'] ?? '');
            $add($s, 'metric metrics measurable measurables verified ' . strtolower($m['label'] ?? ''), ($m['label'] ?? '') . ': ' . $v . ($ver !== '' ? " (verified $ver)" : ''));
        }
        $pop = '';
        foreach ($d['metrics'] ?? [] as $m) {
            if (($m['key'] ?? '') === 'popTime') {
                $pop = cs_clean($m['value'] ?? '');
            }
        }
        $sum = trim(str_replace('{popTime}', $pop !== '' ? $pop : 'a', (string) ($d['summary'] ?? '')));
        if ($sum !== '' && !str_contains($sum, '[')) {
            $add($s, 'summary scouting profile strengths player about describe style', $sum);
        }
        foreach ($d['teams'] ?? [] as $t) {
            $name = cs_clean($t['name'] ?? '');
            if ($name === '') {
                continue;
            }
            $stats = [];
            foreach ($t['stats'] ?? [] as $x) {
                if (cs_clean($x['value'] ?? '') !== '') {
                    $stats[] = ($x['label'] ?? '') . ' ' . $x['value'];
                }
            }
            $add($s, 'team teams year coach coaches owner phone email social stats ' . strtolower((string) ($t['type'] ?? '')), cs_join([
                cs_clean($t['year'] ?? ''),
                $name,
                cs_clean($t['type'] ?? ''),
                cs_clean($t['coach'] ?? '') !== '' ? 'Coach ' . $t['coach'] : '',
                cs_clean($t['owner'] ?? '') !== '' ? 'Owner ' . $t['owner'] : '',
                cs_clean($t['phone'] ?? ''),
                cs_clean($t['email'] ?? ''),
                cs_clean($t['social'] ?? ''),
                $stats ? 'Stats: ' . implode(', ', $stats) : '',
            ]));
        }
        foreach ($d['trainers'] ?? [] as $t) {
            if (cs_clean($t['name'] ?? '') === '') {
                continue;
            }
            $add($s, 'trainer trainers training instructor personal coach phone email', cs_join([
                'Personal training instructor ' . cs_clean($t['name'] ?? ''),
                cs_clean($t['phone'] ?? ''),
                cs_clean($t['email'] ?? ''),
            ]));
        }
        foreach ($d['schedule'] ?? [] as $e) {
            if (cs_clean($e['date'] ?? '') === '' && cs_clean($e['event'] ?? '') === '') {
                continue;
            }
            $add($s, 'schedule upcoming event events tournament showcase game games date time when where location address map directions', cs_join([
                cs_when($e),
                cs_clean($e['event'] ?? ''),
                cs_clean($e['location'] ?? ''),
                cs_map($e),
                cs_clean($e['team'] ?? ''),
                cs_clean($e['info'] ?? ''),
            ]));
        }
        foreach ($d['awards'] ?? [] as $x) {
            $add($s, 'award awards honor honors recognition', cs_join([cs_clean($x['title'] ?? ''), cs_clean($x['year'] ?? '')]));
        }
        $videos = array_merge([$d['featured'] ?? []], $d['clips'] ?? []);
        foreach ($videos as $v) {
            $add($s, 'video videos film highlight highlights clip clips watch footage', cs_join([cs_clean($v['title'] ?? ''), cs_clean($v['blurb'] ?? '')]));
        }
    }
    return $f;
}

function cs_syn(): array
{
    return [
        'call' => ['phone'], 'number' => ['phone'], 'text' => ['phone'], 'mobile' => ['phone'],
        'mail' => ['email'], 'contact' => ['contact'],
        'coach' => ['coach', 'team'], 'coaches' => ['coach', 'team'], 'team' => ['team'], 'club' => ['team'], 'aau' => ['team'], 'travel' => ['team'],
        'training' => ['trainer'], 'trainer' => ['trainer'], 'instructor' => ['trainer'], 'lessons' => ['trainer'],
        'when' => ['schedule'], 'where' => ['schedule'], 'upcoming' => ['schedule'], 'tournament' => ['schedule'], 'showcase' => ['schedule'], 'game' => ['schedule'], 
        'grade' => ['gpa'], 'grades' => ['gpa'], 'academic' => ['academics'], 'student' => ['academics'], 'smart' => ['academics'],
        'tall' => ['height'], 'big' => ['height'], 'size' => ['height'],
        'hit' => ['bats', 'exit'], 'hitter' => ['bats', 'exit'], 'bat' => ['bats'], 'throw' => ['throws'], 'lefty' => ['bats'], 'righty' => ['bats'],
        'fast' => ['sprint', 'home'], 'speed' => ['sprint', 'home'], 'run' => ['sprint', 'home'], 'arm' => ['velo', 'pop'], 'velocity' => ['velo'],
        'highlights' => ['video'], 'film' => ['video'], 'watch' => ['video'], 'footage' => ['video'], 'clips' => ['video'],
        'honors' => ['award'], 'awards' => ['award'], 'honor' => ['award'],
        'twitter' => ['x'], 'insta' => ['instagram'],
        'jump' => ['vertical'], 'vertical' => ['vertical'], 'reach' => ['reach', 'contact'],
    ];
}

function cs_tokens(string $q): array
{
    $stop = array_flip(['the', 'a', 'an', 'is', 'are', 'was', 'what', 'whats', 'who', 'which', 'does', 'do', 'did', 'ever', 'she', 'her', 'hers', 'he', 'his', 'how', 'can', 'could', 'i', 'me', 'my', 'we', 'you', 'your', 'of', 'for', 'to', 'in', 'on', 'at', 'and', 'or', 'with', 'about', 'tell', 'show', 'please', 'any', 'there', 'this', 'that', 'it', 'its', 'has', 'have', 'get', 'give', 'know', 'need', 'want', 'like', 'much', 'many']);
    $syn = cs_syn();
    $out = [];
    foreach (preg_split('/[^a-z0-9\-\']+/', strtolower($q)) ?: [] as $w) {
        $w = trim($w, "-'");
        if ($w === '' || isset($stop[$w])) {
            continue;
        }
        $out[$w] = true;
        if (strlen($w) > 3 && str_ends_with($w, 's')) {
            $out[substr($w, 0, -1)] = true;
        }
        foreach ($syn[$w] ?? [] as $x) {
            $out[$x] = true;
        }
    }
    return array_keys($out);
}

function cs_overview_asked(string $q): bool
{
    return (bool) preg_match('/\b(summary|summarize|overview|report|profile|everything|snapshot|introduce|evaluate|evaluation|tell me about)\b/i', $q);
}

function cs_contact_line(array $c): string
{
    $co = $c['site']['contact'] ?? [];
    return cs_join([cs_clean($co['email'] ?? ''), cs_clean($co['phone'] ?? '')]);
}

function cs_overview(array $facts, string $contact, array $labels): string
{
    $lines = ['Ever Harris at a glance, as published on this site:'];
    $groups = ['' => ''];
    foreach ($labels as $id => $label) {
        $groups[$id] = strtoupper($label);
    }
    foreach ($groups as $key => $title) {
        $group = array_filter($facts, fn($f) => $f['sport'] === $key);
        if ($group === []) {
            continue;
        }
        $lines[] = '';
        if ($title !== '') {
            $lines[] = $title;
        }
        foreach ($group as $f) {
            $lines[] = '- ' . $f['text'];
        }
    }
    $lines[] = '';
    $lines[] = "Please confirm details with Ever's recruiting contact" . ($contact !== '' ? ': ' . $contact : '.');
    return implode("\n", $lines);
}

function cs_next_intent(string $q): bool
{
    return (bool) preg_match('/\b(next|upcoming|soon)\b|\b(where|when) (will|is|are|can)\b.*\b(play|playing|compete|game|games|see)\b/i', $q);
}

function cs_next_events(array $c, array $sports, string $contact): string
{
    $today = strtotime(gmdate('Y-m-d'));
    $dated = [];
    $undated = [];
    foreach (array_keys($c['_sports'] ?? []) as $s) {
        if ($sports !== [] && !in_array($s, $sports, true)) {
            continue;
        }
        foreach ($c[$s]['schedule'] ?? [] as $e) {
            $date = cs_clean($e['date'] ?? '');
            if ($date === '' && cs_clean($e['event'] ?? '') === '') {
                continue;
            }
            $text = cs_join([cs_when($e), cs_clean($e['event'] ?? ''), cs_clean($e['location'] ?? ''), cs_map($e), cs_clean($e['team'] ?? ''), cs_clean($e['info'] ?? '')]);
            $ts = $date !== '' ? strtotime($date . ' ' . (string) ($e['time'] ?? '')) : false;
            $line = '- ' . ($c['_sports'][$s] ?? $s) . ': ' . $text;
            if ($ts === false) {
                $undated[] = $line;
            } elseif ($ts >= $today) {
                $dated[] = ['ts' => $ts, 'line' => $line];
            }
        }
    }
    usort($dated, fn($a, $b) => $a['ts'] <=> $b['ts']);
    $follow = "Please confirm times and locations with Ever's recruiting contact" . ($contact !== '' ? ': ' . $contact : '.');
    if ($dated === [] && $undated === []) {
        return "No upcoming games or events are listed on the site right now. Please check back soon.\n\n" . $follow;
    }
    $lines = [];
    if ($dated !== []) {
        $lines[] = 'Ever plays next:';
        foreach (array_slice($dated, 0, 3) as $d) {
            $lines[] = $d['line'];
        }
        if (count($dated) > 3) {
            $lines[] = '(' . (count($dated) - 3) . ' more on the Schedule page.)';
        }
    }
    if ($undated !== []) {
        $lines[] = $dated === [] ? 'These events are on the schedule (their dates are not in a format I can sort):' : 'Also listed:';
        foreach (array_slice($undated, 0, 4) as $u) {
            $lines[] = $u;
        }
    }
    return implode("\n", $lines) . "\n\n" . $follow;
}

function cs_not_found(string $question, string $contact): string
{
    $q = trim((string) preg_replace('/\s+/', ' ', $question));
    if (strlen($q) > 80) {
        $q = rtrim(substr($q, 0, 80)) . '...';
    }
    return "Sorry, I could not find an answer to \"{$q}\" on this site. I can only answer from what is published here, so it may not be listed yet."
        . "\n\nTry asking about Ever's positions, measurables, teams and coaches, personal trainer, schedule, film, awards, academics, or contact details, or ask for a summary."
        . ($contact !== '' ? "\n\nFor anything else, please contact Ever's recruiting contact: " . $contact : '');
}

function cs_answer(array $c, string $question): string
{
    $facts = cs_facts($c);
    if ($facts === []) {
        return "Ever's recruiting profile has not been filled in yet, so there is nothing to report. Please check back soon.";
    }
    $contact = cs_contact_line($c);
    if (cs_overview_asked($question)) {
        return cs_overview($facts, $contact, $c['_sports'] ?? []);
    }
    $sports = [];
    $sportWords = [];
    foreach ($c['_sports'] ?? [] as $id => $label) {
        $names = array_unique([strtolower($label), str_replace('-', ' ', $id)]);
        foreach ($names as $name) {
            if (preg_match('/\b' . preg_quote($name, '/') . '\b/i', $question)) {
                $sports[] = $id;
                foreach (preg_split('/[^a-z0-9]+/', $name, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $w) {
                    $sportWords[] = $w;
                }
            }
        }
    }
    if (cs_next_intent($question)) {
        return cs_next_events($c, $sports, $contact);
    }
    $tokens = array_values(array_filter(cs_tokens($question), fn($t) => !in_array($t, $sportWords, true)));
    $syn = cs_syn();
    $original = array_values(array_filter(preg_split('/[^a-z0-9\-\']+/', strtolower($question)) ?: [], fn($w) => strlen($w) > 2));
    $scored = [];
    $recognized = false;
    foreach ($facts as $i => $fact) {
        if ($sports !== [] && $fact['sport'] !== '' && !in_array($fact['sport'], $sports, true)) {
            continue;
        }
        $hay = preg_replace('/[^a-z0-9\-\']+/', ' ', ' ' . strtolower($fact['kw'] . ' ' . $fact['text']) . ' ');
        $has = fn(string $t): bool => str_contains($hay, ' ' . $t . ' ') || (strlen($t) > 4 && str_contains($hay, ' ' . $t));
        $score = 0;
        foreach ($tokens as $t) {
            if ($has($t)) {
                $score++;
            }
        }
        foreach ($original as $w) {
            if ($has($w) || $has(rtrim($w, 's'))) {
                $recognized = true;
            }
        }
        if ($score > 0) {
            $scored[] = ['score' => $score, 'i' => $i, 'fact' => $fact];
        }
    }
    foreach ($original as $w) {
        if (isset($syn[$w])) {
            $recognized = true;
        }
    }
    usort($scored, fn($a, $b) => [$b['score'], $a['i']] <=> [$a['score'], $b['i']]);
    $top = $scored[0]['score'] ?? 0;
    $scored = array_slice(array_filter($scored, fn($r) => $r['score'] * 2 >= $top), 0, 8);

    if ($scored === [] || !$recognized) {
        return cs_not_found($question, $contact);
    }
    $lines = ['Here is what the site says:'];
    foreach ($scored as $r) {
        $label = $r['fact']['sport'] === '' ? '' : ($c['_sports'][$r['fact']['sport']] ?? $r['fact']['sport']) . ': ';
        $lines[] = '- ' . $label . $r['fact']['text'];
    }
    $lines[] = '';
    $lines[] = "Please confirm details with Ever's recruiting contact" . ($contact !== '' ? ': ' . $contact : '.');
    return implode("\n", $lines);
}
