<?php

namespace App\Http\Controllers;

use App\Config\Controller;
use App\Models\CustomField;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class CustomFieldsController extends Controller
{
    private CustomField $field;

    public function __construct()
    {
        $this->field = new CustomField();
    }

    public function index(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        $fields = $this->field->getByUserId($userId);

        $result = array_map(function (array $field): array {
            return [
                'id' => (int)$field['id'],
                'name' => $field['nome'],
                'type' => $field['tipo'],
                'is_required' => (bool)$field['obrigatorio'],
                'status' => $field['status'],
                'created_at' => $field['criado_em'] ?? null,
            ];
        }, $fields);

        return $this->json($response, [
            'sucesso' => true,
            'fields' => $result,
        ]);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $fieldId = (int)$args['id'];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        $field = $this->field->getOneById($fieldId, $userId);

        if (!$field) {
            return $this->json($response, ['erro' => 'Campo personalizado não encontrado'], 404);
        }

        $data = [
            'id' => (int)$field['id'],
            'name' => $field['nome'],
            'type' => $field['tipo'],
            'is_required' => (bool)$field['obrigatorio'],
            'status' => $field['status'],
            'created_at' => $field['criado_em'] ?? null,
        ];

        return $this->json($response, $data);
    }

    public function store(Request $request, Response $response): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $body = $request->getParsedBody() ?? [];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        $name = trim((string)($body['name'] ?? ''));
        $type = trim((string)($body['type'] ?? ''));
        $isRequired = (bool)($body['is_required'] ?? false);
        $status = $body['status'] ?? 'active';

        if ($name === '' || $type === '') {
            return $this->json($response, ['erro' => 'Nome e tipo são obrigatórios'], 400);
        }

        $id = $this->field->createField([
            'usuario_id' => $userId,
            'nome' => $name,
            'tipo' => $type,
            'obrigatorio' => $isRequired ? 1 : 0,
            'status' => $status,
        ]);

        $created = $this->field->getOneById($id, $userId);

        return $this->json($response, [
            'sucesso' => true,
            'mensagem' => 'Campo personalizado criado com sucesso!',
            'field' => [
                'id' => (int)$created['id'],
                'name' => $created['nome'],
                'type' => $created['tipo'],
                'is_required' => (bool)$created['obrigatorio'],
                'status' => $created['status'],
                'created_at' => $created['criado_em'] ?? null,
            ],
        ], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $fieldId = (int)$args['id'];
        $body = $request->getParsedBody() ?? [];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        if (!$this->field->belongsToUser($fieldId, $userId)) {
            return $this->json($response, ['erro' => 'Campo personalizado não encontrado'], 404);
        }

        $dataToUpdate = [];

        if (array_key_exists('name', $body)) {
            $dataToUpdate['nome'] = trim((string)$body['name']);
        }

        if (array_key_exists('type', $body)) {
            $dataToUpdate['tipo'] = trim((string)$body['type']);
        }

        if (array_key_exists('is_required', $body)) {
            $dataToUpdate['obrigatorio'] = (bool)$body['is_required'] ? 1 : 0;
        }

        if (array_key_exists('status', $body)) {
            $statusValue = $body['status'] === 'active' ? 1 : 0;
            $dataToUpdate['ativo'] = $statusValue;
        }

        if (!$dataToUpdate) {
            return $this->json($response, ['erro' => 'Nenhum dado para atualizar'], 400);
        }

        $this->field->updateField($fieldId, $dataToUpdate);

        $updated = $this->field->getOneById($fieldId, $userId);

        return $this->json($response, [
            'sucesso' => true,
            'mensagem' => 'Campo personalizado atualizado com sucesso!',
            'field' => [
                'id' => (int)$updated['id'],
                'name' => $updated['nome'],
                'type' => $updated['tipo'],
                'is_required' => (bool)$updated['obrigatorio'],
                'status' => $updated['status'],
                'created_at' => $updated['criado_em'] ?? null,
            ],
        ]);
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        $userId = $this->resolveAuthenticatedUserId($request);
        $fieldId = (int)$args['id'];

        if (!$userId) {
            return $this->json($response, ['erro' => 'Usuário não logado'], 401);
        }

        if (!$this->field->belongsToUser($fieldId, $userId)) {
            return $this->json($response, ['erro' => 'Campo personalizado não encontrado'], 404);
        }

        $this->field->deleteField($fieldId);

        return $this->json($response, [
            'sucesso' => true,
            'mensagem' => 'Campo personalizado removido com sucesso!',
        ]);
    }
}
