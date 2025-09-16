<?php
declare(strict_types=1);

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

$app->add(new CorsMiddleware(
    maxAttempts: 5,
    decaySeconds: 60,
    storagePath: __DIR__ . '/../storage/rate_limit'
));
$app->add(new RateLimiterMiddleware());

Routes::register($app);

$app->run();
