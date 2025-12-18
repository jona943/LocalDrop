# LocalDrop

## La Idea
LocalDrop es un proyecto personal para crear una herramienta simple y súper ligera que permita compartir texto y archivos en una red local. La meta es construir algo que consuma la menor cantidad de recursos posible, ideal para hardware antiguo o de bajo rendimiento.

Este es un proyecto en desarrollo, construido poco a poco.

## Estado Actual del Prototipo

La primera versión funcional incluye:

*   **Backend (Node.js + Express):**
    *   Un servidor que acepta texto y archivos (hasta 50MB).
    *   Los textos se guardan en memoria para no desgastar el disco.
    *   Los archivos se guardan en una carpeta `/uploads`.
    *   El servidor es visible en toda la red local (`0.0.0.0:3000`).

*   **Frontend (HTML + Vanilla JS):**
    *   Una interfaz de página única (SPA) sin frameworks.
    *   Se actualiza con polling para mantener bajo el uso de CPU.
    *   Permite copiar texto y descargar archivos.

## Cómo Probarlo

1.  **Instalar dependencias:**
    ```bash
    npm install express multer
    ```
2.  **Iniciar el servidor:**
    ```bash
    node server.js
    ```
3.  **Acceder:**
    Abre un navegador en la IP de tu servidor, puerto 3000 (ej: `http://192.168.1.10:3000`).
