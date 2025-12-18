# LocalDrop

## La Idea
LocalDrop es un proyecto personal para crear una herramienta simple y súper ligera que permita compartir texto y archivos en una red local. La meta es construir algo que consuma la menor cantidad de recursos posible, ideal para hardware antiguo o de bajo rendimiento.

Este es un proyecto en desarrollo, construido poco a poco.

## Estado Actual del Prototipo

### Características Principales:

*   **Modos de Usuario:** Implementación de dos roles para la experiencia de usuario:
    *   **Administrador:** Acceso a un dashboard especial (vía `http://localhost:3000` en la máquina del servidor) que permite subir, ver, y **eliminar** mensajes o archivos.
    *   **Usuario Común:** Acceso a la vista de usuario estándar (vía `http://<IP_LOCAL>:3000` desde cualquier dispositivo en la red) para ver y subir contenido.
*   **Sincronización en Tiempo Real:** Todos los dispositivos conectados se actualizan instantáneamente (sin necesidad de recargar) gracias al uso de Server-Sent Events (SSE), mostrando el contenido más reciente.

### Detalles Técnicos:

*   **Backend (Node.js + Express):**
    *   Un servidor que acepta texto y archivos (hasta 50MB).
    *   Los textos se guardan en memoria para no desgastar el disco.
    *   Los archivos se guardan en una carpeta `/uploads`.
    *   Gestiona las conexiones SSE para las actualizaciones en tiempo real.
*   **Frontend (HTML + Vanilla JS):**
    *   Dos interfaces de página única (SPA) distintas (`index.html` para usuarios, `admin.html` para administradores) sin frameworks.
    *   Permite copiar texto y descargar archivos.

## Cómo Probarlo

1.  **Instalar dependencias:**
    ```bash
    npm install express multer sse-express
    ```
2.  **Iniciar el servidor:**
    ```bash
    node js/server.js
    ```
    *(El servidor mostrará las URLs para el modo usuario y el modo administrador en la consola.)*
3.  **Acceder como Administrador:**
    Abre tu navegador en la máquina del servidor y navega a: `http://localhost:3000`
4.  **Acceder como Usuario Común:**
    Abre tu navegador en cualquier otro dispositivo de la red local y navega a: `http://<TU_IP_LOCAL>:3000`


