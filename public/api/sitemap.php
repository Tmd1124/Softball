<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

$base = 'https://everharris.com';
$urls = [$base . '/', $base . '/schedule/', $base . '/teams/'];
foreach (site_sports(db(), true) as $s) {
    $urls[] = $base . '/' . $s['id'] . '/';
    $urls[] = $base . '/profile/' . $s['id'] . '/';
}
header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');
echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
foreach ($urls as $u) {
    echo '  <url><loc>' . htmlspecialchars($u, ENT_XML1) . "</loc></url>\n";
}
echo "</urlset>\n";
