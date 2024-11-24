# Verwende ein Node.js-Image
FROM node:18

# Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package-Dateien und installiere Abhängigkeiten
COPY package*.json ./
RUN npm install

# Kopiere den gesamten Backend-Code in den Container
COPY . .

# Exponiere den Port, auf dem der Server läuft
EXPOSE 3000

# Starte den Server
# hier
CMD ["node", "index.js"]
