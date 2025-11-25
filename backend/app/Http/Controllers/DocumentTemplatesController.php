<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\DocumentTemplate;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class DocumentTemplatesController
{
    private DocumentTemplate $model;

    public function __construct()
    {
        $this->model = new DocumentTemplate();
    }

    public function index(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $templates = $this->model->findAll((int)$userId);
        $types = $this->model->getDocumentTypes();
        $response->getBody()->write(json_encode([
            'templates' => $templates,
            'documentTypes' => $types
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $id = (int)$args['id'];
        $template = $this->model->findById($id, (int)$userId);

        if (!$template) {
            $response->getBody()->write(json_encode(['error' => 'Modelo não encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['template' => $template]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $data = json_decode($request->getBody()->getContents(), true);

        if (!isset($data['tipo_documento_id']) || !isset($data['conteudo'])) {
            $response->getBody()->write(json_encode(['error' => 'Dados inválidos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $id = $this->model->create([
            'tipo_documento_id' => $data['tipo_documento_id'],
            'usuario_id' => $userId,
            'conteudo' => $data['conteudo']
        ]);

        $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Modelo criado com sucesso']));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $id = (int)$args['id'];
        $data = json_decode($request->getBody()->getContents(), true);

        if (!isset($data['tipo_documento_id']) || !isset($data['conteudo'])) {
            $response->getBody()->write(json_encode(['error' => 'Dados inválidos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $success = $this->model->update($id, (int)$userId, [
            'tipo_documento_id' => $data['tipo_documento_id'],
            'conteudo' => $data['conteudo']
        ]);

        if (!$success) {
            $response->getBody()->write(json_encode(['error' => 'Erro ao atualizar modelo']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['message' => 'Modelo atualizado com sucesso']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $id = (int)$args['id'];

        $success = $this->model->delete($id, (int)$userId);

        if (!$success) {
            $response->getBody()->write(json_encode(['error' => 'Erro ao excluir modelo']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['message' => 'Modelo excluído com sucesso']));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
