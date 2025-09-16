<?php

namespace App\Helpers;

use Monolog\Level;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class BaseLogger
{
    private Logger $logger;

    public function __construct(string $channel)
    {
        $projectRoot = dirname(__DIR__);
        $base = dirname($projectRoot);

        $logDir  = $base . '/storage/logs';
        $logFile = $logDir . '/system.log';

        $env   = $_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? 'local';
        $level = $_ENV['LOG_LEVEL'] ?? $_SERVER['LOG_LEVEL'] ?? ($env === 'production' ? 'warning' : 'debug');

        $logLevel = match (strtolower($level)) {
            'info'      => Level::Info,
            'notice'    => Level::Notice,
            'warning'   => Level::Warning,
            'error'     => Level::Error,
            'critical'  => Level::Critical,
            'alert'     => Level::Alert,
            'emergency' => Level::Emergency,
            default     => Level::Debug,
        };

        $this->logger = new Logger($channel);

        if (!is_dir($logDir)) {
            @mkdir($logDir, 0775, true);
        }

        if (is_dir($logDir) && is_writable($logDir)) {
            $this->logger->pushHandler(new StreamHandler($logFile, $logLevel, true, 0644));
        } else {
            $this->logger->pushHandler(new StreamHandler('php://stderr', $logLevel));
        }
    }

    public function warning(string $message, array $context = []): void { $this->logger->warning($message, $context); }
    public function info(string $message, array $context = []): void    { $this->logger->info($message, $context); }
    public function notice(string $message, array $context = []): void  { $this->logger->notice($message, $context); }
    public function error(string $message, array $context = []): void   { $this->logger->error($message, $context); }
    public function critical(string $message, array $context = []): void{ $this->logger->critical($message, $context); }
    public function alert(string $message, array $context = []): void   { $this->logger->alert($message, $context); }
    public function emergency(string $message, array $context = []): void { $this->logger->emergency($message, $context); }
}
