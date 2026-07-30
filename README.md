# <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="35" height="35" valign="middle" /> LocalDrop — Transferencia de Archivos y Texto en Red Local

[![Runtime - Node.js](https://img.shields.io/badge/Runtime-Node.js_v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Framework - Express 5](https://img.shields.io/badge/Framework-Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](#)
[![Realtime - Server Sent Events](https://img.shields.io/badge/Realtime-SSE_(Server--Sent_Events)-FF6C37?style=for-the-badge&logo=postman&logoColor=white)](#)
[![Language - JavaScript ES6+](https://img.shields.io/badge/Language-JavaScript_ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)
[![Category - Home Lab / Network](https://img.shields.io/badge/Category-Home_Lab_%26_Network-0052CC?style=for-the-badge&logo=linux&logoColor=white)](#)

**LocalDrop** es una herramienta ultra-ligera y autónoma diseñada para compartir archivos y fragmentos de texto al instante dentro de una red local (LAN) sin depender de servidores en la nube ni conexión a internet exterior. Desarrollada para consumir el mínimo de recursos del sistema, es ideal para hardware limitado, servidores caseros (*Home Lab*) o dispositivos integrados como TV-Boxes con Linux.

---

## <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/chrome/chrome-original.svg" width="22" height="22" valign="middle" /> Características Principales

* **Sincronización en Tiempo Real (SSE)**: Utiliza **Server-Sent Events** (`sse-express`) para notificar y propagar archivos o textos a todos los clientes conectados de forma instantánea sin necesidad de recargar la página.
* **Cero Dependencia de la Nube**: Todas las transferencias ocurren directamente en la red local mediante HTTP directo y almacenamiento multipart con **Multer**.
* **Dominio Local (`localdrop.home`)**: Soporte para resolución de nombre local fácil de recordar en cualquier dispositivo (Android, iOS, Windows, Linux, macOS).
* **Galería y Almacenamiento**: Panel visual para previsualizar imágenes, descargar documentos y monitorear el espacio en disco utilizado.
* **Gestión de Roles**: Detección automática de sesión de administrador desde `localhost` y vista estándar para el resto de los dispositivos conectados a la red local.

---

## <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg" width="22" height="22" valign="middle" /> Estructura del Repositorio

```text
LocalDrop/
├── src/
│   └── server.js                                       # Servidor Express, rutas API y canal de eventos SSE
├── public / web interface
│   ├── index.html                                      # Interfaz principal de transferencia
│   ├── admin.html                                      # Panel de administración de red
│   ├── file.html                                       # Visor y descarga de archivos
│   ├── css/                                            # Estilos responsivos
│   └── js/                                             # Cliente de eventos SSE y gestión de subidas
├── package.json                                        # Configuración del proyecto y dependencias
└── README.md                                           # Documentación técnica
```

---

## <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vscode/vscode-original.svg" width="22" height="22" valign="middle" /> Configuración de Dominio Local (`localdrop.home`)

Para acceder utilizando una URL personalizada en lugar de recordar la dirección IP:

1. Añade la IP de tu servidor local al archivo `hosts` del dispositivo cliente:
   * **Windows**: `C:\Windows\System32\drivers\etc\hosts`
   * **Linux / macOS**: `/etc/hosts`
2. Agrega la siguiente línea al final del archivo:
   ```text
   192.168.X.X  localdrop.home
   ```

---

## <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/bash/bash-original.svg" width="22" height="22" valign="middle" /> Instalación y Ejecución

1. **Clonar e instalar dependencias**:
   ```bash
   git clone https://github.com/jona943/LocalDrop.git
   cd LocalDrop
   npm install
   ```

2. **Iniciar el servidor**:
   ```bash
   npm start
   ```

---

<p align="center">
  <sub>LocalDrop — Home Lab LAN Transfer | Desarrollado por Jonathan Medina</sub>
</p>
