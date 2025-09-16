<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response;

/**
 * Middleware de rate limiting simples baseado em arquivo.
 * Controla o nº de tentativas por chave dentro de uma janela (decaySeconds).
 */
class RateLimitMiddleware implements MiddlewareInterface
{
    /** @var int Máximo de tentativas permitidas na janela */
    private int $maxAttempts;

    /** @var int Duração da janela em segundos */
    private int $decaySeconds;

    /** @var string Diretório para armazenar contadores */
    private string $storagePath;

    /**
     * @param int $maxAttempts Máximo de tentativas por janela
     * @param int $decaySeconds Janela de tempo em segundos
     * @param string $storagePath Caminho do diretório de armazenamento
     */
    public function __construct(
        int $maxAttempts = 5,
        int $decaySeconds = 600,
        string $storagePath = __DIR__ . '/../../storage/rate_limit'
    ) {
        $this->maxAttempts = $maxAttempts;
        $this->decaySeconds = $decaySeconds;
        $this->storagePath = $storagePath;

        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0777, true);
        }
    }

    /**
     * PSR-15: aplica o limite por chave (IP + caminho da rota).
     *
     * @param Request $request
     * @param Handler $handler
     * @return ResponseInterface
     */
    public function process(Request $request, Handler $handler): ResponseInterface
    {
        $key = $this->makeKey($request);

        if ($this->tooManyAttempts($key)) {
            $retryAfter = $this->retryAfterSeconds($key);
            $resp = new Response(429);
            $resp->getBody()->write(json_encode(['message' => 'Too Many Requests'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            return $this->withRateHeaders($resp, $key, 0, $retryAfter)
                ->withHeader('Content-Type', 'application/json');
        }

        $this->hit($key);

        $response = $handler->handle($request);
        $remaining = max(0, $this->maxAttempts - $this->getData($key)['attempts']);
        $resetIn = $this->retryAfterSeconds($key);

        return $this->withRateHeaders($response, $key, $remaining, $resetIn);
    }

    /**
     * Verifica se a chave ultrapassou o limite dentro da janela.
     *
     * @param string $key
     * @return bool
     */
    public function tooManyAttempts(string $key): bool
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

    /**
     * Registra uma nova tentativa para a chave.
     *
     * @param string $key
     * @return void
     */
    public function hit(string $key): void
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

    /**
     * Limpa os dados da chave.
     *
     * @param string $key
     * @return void
     */
    public function clear(string $key): void
    {
        $file = $this->getFilePath($key);
        if (file_exists($file)) {
            unlink($file);
        }
    }

    /**
     * Obtém os dados atuais da chave.
     *
     * @param string $key
     * @return array{attempts:int,last_attempt:int}
     */
    private function getData(string $key): array
    {
        $file = $this->getFilePath($key);
        if (file_exists($file)) {
            $data = json_decode((string) file_get_contents($file), true);
            if (is_array($data) && isset($data['attempts'], $data['last_attempt'])) {
                return ['attempts' => (int) $data['attempts'], 'last_attempt' => (int) $data['last_attempt']];
            }
        }
        return ['attempts' => 0, 'last_attempt' => 0];
    }

    /**
     * Calcula o tempo restante para liberar novamente a chave.
     *
     * @param string $key
     * @return int
     */
    private function retryAfterSeconds(string $key): int
    {
        $data = $this->getData($key);
        $elapsed = time() - (int) $data['last_attempt'];
        $remaining = $this->decaySeconds - $elapsed;
        return $remaining > 0 ? $remaining : 0;
    }

    /**
     * Gera uma chave única por cliente/rota.
     *
     * @param Request $request
     * @return string
     */
    private function makeKey(Request $request): string
    {
        $server = $request->getServerParams();
        $ip = $server['HTTP_X_FORWARDED_FOR'] ?? $server['REMOTE_ADDR'] ?? 'unknown';
        $ip = is_string($ip) ? trim(explode(',', $ip)[0]) : 'unknown';
        $path = $request->getUri()->getPath() ?: '/';
        return $ip . '|' . $path;
    }

    /**
     * Retorna o caminho do arquivo para a chave.
     *
     * @param string $key
     * @return string
     */
    private function getFilePath(string $key): string
    {
        $safeKey = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
        return rtrim($this->storagePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $safeKey . '.json';
    }

    /**
     * Anexa cabeçalhos de rate limit na resposta.
     *
     * @param ResponseInterface $response
     * @param string $key
     * @param int $remaining
     * @param int $resetIn
     * @return ResponseInterface
     */
    private function withRateHeaders(ResponseInterface $response, string $key, int $remaining, int $resetIn): ResponseInterface
    {
        return $response
            ->withHeader('X-RateLimit-Limit', (string) $this->maxAttempts)
            ->withHeader('X-RateLimit-Remaining', (string) max(0, $remaining))
            ->withHeader('X-RateLimit-Reset', (string) max(0, $resetIn))
            ->withHeader('Retry-After', (string) max(0, $resetIn));
    }
}
