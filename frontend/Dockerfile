# Imagem base com Node.js
FROM node:23-slim AS build

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie o arquivo package.json e o package-lock.json para o contêiner
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código-fonte para o contêiner
COPY . .

# Execute o comando para rodar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]

# Exponha a porta que o servidor de desenvolvimento irá usar
EXPOSE 3000
