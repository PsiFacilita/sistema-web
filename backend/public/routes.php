<?php
declare(strict_types=1);

use Slim\App;
use App\Http\Controllers\HomeController;

final class Routes
{
    public static function register(App $app): void
    {
        $app->get('/hello-world', [HomeController::class, 'index']);
    }
}
