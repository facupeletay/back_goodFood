## Descripción

API para Good Food App

## Requisitos

 NodeJS (Version minima 22.5)

## Installation

```bash
$ pnpm install
```

##

## Configuración

Crear archivo .env.development en la raiz del proyecto para desarrollo
Crear archivo .env.production  en la raiz del proyecto para entorno de producción

Completar con las variables declaradas en .env.example:

  DB_NAME= nombre de la base de datos de mysql
  DB_USERNAME= usuario de mysql
  DB_PASSWORD= contraseña de mysql
  DB_HOST= ip host de mysql // en este caso es la direccion del contenedor de docker
  DB_PORT= puerto de conexión de mysql
  PORT= puerto en el que se ejecuta la api

  JWT_SECRET= clave para generar token de sesión
  JWT_EXPIRATION_TIME= timepo de expiración del token


```bash

# watch mode
$ pnpm run start:dev

# build de producción
$ pnpm run build

# correr build de producción
$ pnpm run start:prod
```

## Contacto

- Autor - [Federico Robledo](federob7@gmail.com)
