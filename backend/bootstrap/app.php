<?php
declare(strict_types=1);

use App\Http\Routing\Router;
use App\Http\Controllers\HomeController;

return static function (Router $router): void {
    // Health check
    $router->get('/hello-world', [HomeController::class, 'index']);
};
