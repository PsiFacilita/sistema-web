<?php

namespace App\Helpers;

class RateLimiter
{
    private $maxAttempts;
    private $decaySeconds;
    private $storagePath;

    public function __construct($maxAttempts = 5, $decaySeconds = 600, $storagePath = null)
    {
        $this->maxAttempts = $maxAttempts;
        $this->decaySeconds = $decaySeconds;
        $this->storagePath = $storagePath ?? __DIR__ . '/../../../storage/rate_limit';

        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0777, true);
        }
    }

    private function getFilePath($key)
    {
        $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
        return $this->storagePath . DIRECTORY_SEPARATOR . $safeKey . '.json';
    }

    public function tooManyAttempts($key)
    {
        $data = $this->getData($key);
        if ($data['attempts'] >= $this->maxAttempts) {
            $now = time();
            if (($now - $data['last_attempt']) < $this->decaySeconds) {
                return true;
            }
        }
        return false;
    }

    public function hit($key)
    {
        $file = $this->getFilePath($key);
        $data = $this->getData($key);
        $now = time();
        if (($now - $data['last_attempt']) >= $this->decaySeconds) {
            $data['attempts'] = 1;
        } else {
            $data['attempts']++;
        }
        $data['last_attempt'] = $now;
        file_put_contents($file, json_encode($data));
    }

    public function clear($key)
    {
        $file = $this->getFilePath($key);
        if (file_exists($file)) {
            unlink($file);
        }
    }

    private function getData($key)
    {
        $file = $this->getFilePath($key);
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if (is_array($data) && isset($data['attempts'], $data['last_attempt'])) {
                return $data;
            }
        }
        return ['attempts' => 0, 'last_attempt' => 0];
    }
}
