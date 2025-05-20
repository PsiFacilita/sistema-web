# Docker

Os comandos listados a seguir são baseados em "docker compose", para funcionarem nesse projeto, devem ser executados na raiz do projeto.

## Executando todos os containers

```bash
docker-compose up -d
```

## Executando apenas um container desejado

```bash
docker-compose up sistema-web-frontend-1 -d
```

## Parado execução de containers

```bash
docker-compose stop
```

## Destruindo containers e seus volumes

```bash
docker-compose down -v
```

## Executando todos os containers reconstruindo as imagens necessárias

```bash
docker-compose up -d --build
```

---

Caso tenha alguma dúvida, as documentações oficiais podem ser consultadas tanto para o Docker, quanto para o docker-compose.

- [Docker 4.39.0](https://docs.docker.com/desktop/)
- [docker-compose 2.33.1](https://docs.docker.com/compose/)
