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
> Recomenda-se que em SO Windows o ambiente de desenvolvimento seja executado em WSL (Windows Subsystem Linux). Caso precise de ajudar para entender ou instalar o WSL veja o conteúdo oficial da Microsoft [aqui](https://learn.microsoft.com/pt-br/windows/wsl/install) ou também o video-tutorial no [youtube](https://www.youtube.com/watch?v=oEdIf6mB_p4). 

1. Clone o repositório:
```bash
git clone https://github.com/PsiFacilita/sistema-web.git
```

2. Certifique-se de ter as dependências instaladas conforme a documentação do projeto.

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Personalize os valores no arquivo .env conforme necessário:

```markdown
# Credenciais para o banco de dados
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=mydatabase
MYSQL_USER=myuser
MYSQL_PASSWORD=mypassword

# URL do banco de dados no backend
DATABASE_URL=mysql://myuser:mypassword@db:3306/mydatabase
```

4. Inicie os Para parar os containers

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
