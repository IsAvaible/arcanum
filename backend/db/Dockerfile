FROM postgres:15

COPY . .

RUN apt-get update && apt-get install -y postgresql-contrib && rm -rf /var/lib/apt/lists/*

