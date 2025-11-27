# sistema-web

Esse repositório faz parte de uma das entregas para a parceira do grupo PsiFacilita, onde contém todo o código do sistema web, que será
utilizado apenas pela parceira, sem a possibilidade de interações de outros atores.

As instruções a seguir permitirão que você obtenha uma cópia do projeto em operação na sua máquina local para fins de desenvolvimento e teste.

## Pré-requisitos

- [Node.js 23](https://nodejs.org/pt/download)
- [Docker 4.39.0](https://docs.docker.com/desktop/)
- [docker-compose 2.33.1](https://docs.docker.com/compose/)

## Construído com

- [React 19.0.0](https://react.dev/learn)
- [Node.js 23](https://nodejs.org/pt/download)
- [TypeScript 5.7.2](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html)

- [Docker 4.39.0](https://docs.docker.com/desktop/)
- [docker-compose 2.33.1](https://docs.docker.com/compose/)
- [MySQL 8](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/)

## Instalação

> [!IMPORTANT]
> Recomenda-se que em SO Windows o ambiente de desenvolvimento seja executado em WSL (Windows Subsystem Linux). Caso precise de ajuda para entender ou instalar o WSL veja o conteúdo oficial da Microsoft [aqui](https://learn.microsoft.com/pt-br/windows/wsl/install) ou também o video-tutorial no [youtube](https://www.youtube.com/watch?v=oEdIf6mB_p4). 

1. Clone o repositório:
```bash
git clone https://github.com/PsiFacilita/sistema-web.git
```

2. Acesse o projeto e instale as dependencias

```bash
cd sistema-web
npm install
composer install
```

3. Gere duas chaves de criptografia e guarde-as para preencher no .env

```bash
php -r 'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'
```
4. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Personalize os valores no arquivo .env conforme necessário:

```markdown
APP_ENV=local
APP_DEBUG=true
TZ=America/Sao_Paulo

DB_DRIVER=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=sistema-web
DB_USERNAME=myuser
DB_PASSWORD=mypassword
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci

MYSQL_ROOT_PASSWORD=rootpassword

JWT_SECRET=chave_jwt
JWT_ISSUER=sistema-web
JWT_EXPIRE_MINUTES=60

FRONTEND_PORT=3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_ENCRYPTION=

MAILPIT_WEB_PORT=8025

CRYPTO_MASTER_KEY=base64:sua_key_aqui
BLIND_INDEX_KEY=base64:sua_key_aqui
```

5. Acesse o frontend e aplique as credenciais

```bash
cd frontend
cp .env.example
```

Acesse https://www.tiny.cloud/ e gere sua chave de API, e por fim preencha no /frontend/.env

```markdown
VITE_TINYMCE_API_KEY=
```

6. Inicie os containers

```bash
docker-compose up -d
```

Caso tenha dúvidas sobre os comandos mais utilizados para o Docker, consulte [Docker.md](https://github.com/PsiFacilita/sistema-web/blob/main/Docker.md) para mais informações.

Isso iniciará três serviços:

- Frontend: disponível em http://localhost:3000
- Backend: disponível em http://localhost:5000
- MySQL: disponível na porta 3306

## Colaborando

Por favor, leia o [CONTRIBUTING.md](https://github.com/PsiFacilita/sistema-web/blob/main/CONTRIBUTING.md) para obter detalhes de como submeter pull requests ou issues.
