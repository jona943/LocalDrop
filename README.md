# LocalDrop 🚀

## La Idea
LocalDrop es una herramienta ultra-ligera diseñada para compartir texto y archivos de forma instantánea en una red local. El enfoque principal es la simplicidad y el bajo consumo de recursos, ideal para revivir hardware antiguo o simplemente para transferencias rápidas sin depender de la nube.

## Dominio Local: localdrop.home
Para una experiencia premium en tu red local, puedes configurar el dominio **http://localdrop.home**.

### ¿Cómo configurarlo?
Debes añadir la IP de tu servidor a los archivos `hosts` de tus dispositivos:
*   **Windows:** `C:\Windows\System32\drivers\etc\hosts`
*   **Linux/Mac:** `/etc/hosts`

Añade esta línea al final:
`192.168.X.X  localdrop.home` (Sustituye la IP por la que muestra la consola al iniciar).

## Características Principales

### 🛡️ Seguridad y Acceso
*   **Pantalla de Bienvenida:** Landing page con presentación de la herramienta.
*   **Registro Obligatorio:** Modal de acceso que solicita nombre/apodo.
*   **Credenciales Automáticas:** Generación de contraseña de 8 caracteres (letras y números) y detección automática de dispositivo para mayor seguridad.

### 🔄 Sincronización en Tiempo Real
Gracias a los **Server-Sent Events (SSE)**, todos los dispositivos conectados reciben actualizaciones al instante sin necesidad de recargar la página.

### 🖼️ Galería de Archivos
Nueva sección de **Galería** donde puedes visualizar todos los archivos subidos, con iconos específicos por tipo de archivo, previsualización de imágenes y barra de estado de almacenamiento real.

### 🛡️ Roles Automáticos
*   **Modo Administrador:** Acceso total desde `localhost`.
*   **Modo Usuario:** Acceso estándar para el resto de la red.

## Cómo Empezar

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Iniciar el servidor:**
    ```bash
    node js/server.js
    ```

---
*Construido con dedicacion para ser rápido, accesible y seguro en tu hogar.*
