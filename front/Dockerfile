# Базовый образ (можно использовать nginx для статики или node для SSR)
FROM node:22

# Рабочая директория
WORKDIR /usr/src/app

# Копируем ТОЛЬКО папку dist и файлы, нужные для запуска
COPY dist/ ./dist/
COPY package*.json ./

# Устанавливаем ТОЛЬКО production-зависимости
RUN npm install --production

# Переменные окружения
ENV HOST 0.0.0.0
ENV NODE_ENV production
ENV PORT 3000

# Открываем порт
EXPOSE 3000

# Команда запуска (измените на свою, если нужно)
CMD ["npm", "run", "serve"]