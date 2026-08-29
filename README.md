# LocalDrop Drive 🚀

**LocalDrop Drive** es una plataforma ligera, privada y modular de almacenamiento local (estilo Google Drive / Nextcloud ligero). Está diseñada para convertir hardware modesto (como TV Boxes X96Q, Raspberry Pi o servidores Armbian/Debian) en un servidor de archivos personal ultrarrápido sin dependencias en la nube ni cargos de suscripción.

---

## 🎯 ¿Qué Problema Resuelve?
- **Privacidad Absoluta**: Tus datos e información permanecen 100% dentro de tu red local sin depender de servidores de terceros ni almacenamiento en la nube.
- **Velocidad LAN Nativa**: Transfiere archivos gigantes a la velocidad máxima de tu router local (1 Gbps / Wi-Fi local) sin las limitaciones de subida de internet.
- **Reutilización de Hardware**: Funciona con mínimo consumo de CPU y RAM en dispositivos de bajos recursos sin saturar el sistema.

---

## ✨ Características Principales
- 📁 **Gestor de Archivos (Google Drive-like UI)**: Explora carpetas reales, alterna entre vista Cuadrícula y Lista al 100% del ancho del monitor.
- 💾 **Detección Dinámica de Discos**: Reconoce automáticamente discos externos (ej. unidades HDD/SSD de 500 GB) y memorias eMMC/SD físicas con `df` filtrando particiones virtuales.
- 🗑️ **Papelera de Reciclaje con Retención de 30 Días**:
  - Eliminación temporal a carpeta `.trash/` oculta.
  - Purga automática de archivos antiguos.
  - **Borrado Definitivo Seguro**: Requiere ingresar la contraseña del administrador.
- 📱 **Multiplataforma & Responsivo**: Menú contextual mediante **toque largo** en dispositivos móviles y clic en escritorio.
- 💬 **Notas & Chat Integrados**: Transfiere notas y textos rápidamente en vivo en tu red local con Server-Sent Events (SSE).
- 🔒 **Sesión Persistente y Cierre por Inactividad**: Cierre de sesión automático tras 5 minutos de inactividad.

---

## 🛠️ Arquitectura y Tecnologías
- **Frontend**: React (Vite) + Lucide Icons + CSS Modular (`src/modules/*`)
- **Backend**: Node.js + Express (Desacoplado en `/server`)
- **Almacenamiento**: Lectura y escritura directa en sistema de archivos de Linux

---

## 🚀 Cómo Usar y Desplegar

### 1. Desarrollo Local

#### Iniciar Backend:
```bash
cd server
npm run dev
```

#### Iniciar Frontend (React con Vite):
```bash
cd frontend
npm run dev
```

---

### 2. Despliegue en Servidor Linux (Armbian / Debian / Ubuntu)

Dado que el bundle compilado se incluye en `frontend/dist` y las dependencias en `server/node_modules`, **no se requiere npm en el servidor de producción**:

```bash
# 1. Clonar el repositorio en el servidor
git clone https://github.com/jona943/LocalDrop.git
cd LocalDrop

# 2. Configurar el servicio systemd de inicio automático
sudo cp server/localdrop.service.example /etc/systemd/system/localdrop.service
# Ajustar rutas en /etc/systemd/system/localdrop.service si es necesario

sudo systemctl daemon-reload
sudo systemctl enable localdrop
sudo systemctl start localdrop
```

Acceso en tu red local desde cualquier navegador: `http://<IP-DE-TU-SERVIDOR>:3000` (Ejemplo: `http://192.168.1.69:3000`).
