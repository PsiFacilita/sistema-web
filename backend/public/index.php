<?php
declare(strict_types=1);

use App\Http\Middleware\RateLimitMiddleware;
use Slim\Factory\AppFactory;
use Symfony\Component\Dotenv\Dotenv;
use App\Http\Middleware\CorsMiddleware;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/routes.php';

$envPath = dirname(__DIR__) . '/.env';
if (is_file($envPath)) {
    (new Dotenv())->load($envPath);
}

$app = AppFactory::create();
$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();
$app->addErrorMiddleware(
    filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOL),
    true,
    true
);

// Removendo rate limiting global
// $app->add(new RateLimitMiddleware(
//     maxAttempts: 5,
//     decaySeconds: 60,
//     storagePath: __DIR__ . '/../storage/rate_limit'
// ));

$app->add(new CorsMiddleware());
Routes::register($app);

$app->run();
