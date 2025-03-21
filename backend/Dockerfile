# Usar a imagem base do Node.js
FROM node:18 AS build

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie o arquivo package.json e package-lock.json para o contêiner
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o código-fonte do backend
COPY . .

# Exponha a porta do servidor
EXPOSE 5000

# Execute o servidor TypeScript com ts-node e ESM
CMD ["npm", "run", "dev"]
