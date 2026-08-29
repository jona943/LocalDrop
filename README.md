# LocalDrop 🚀

LocalDrop es una herramienta ultraligera para compartir archivos y texto en tiempo real dentro de una red local, ideal para mini-servidores y TV Boxes (como Armbian/Debian).

## 🛠️ Arquitectura y Tecnologías
- **Frontend**: React (Vite) + CSS Modular (`src/modules/*`)
- **Backend**: Node.js + Express (Desacoplado en `/server`)
- **Real-Time**: Server-Sent Events (SSE)
- **Persistencia**: JSON en disco local o almacenamiento externo (USB/HDD)

---

## 💻 Desarrollo Local

### 1. Iniciar Backend
```bash
cd server
npm install
npm run dev
```

### 2. Iniciar Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

---

## ⚡ Despliegue en Servidor Armbian / Debian

### 1. Compilar Frontend
```bash
cd frontend
npm run build
```

### 2. Configurar Almacenamiento Externo (Opcional)
Si deseas guardar los archivos subidos en una memoria USB o disco duro externo en tu servidor:
```bash
export STORAGE_PATH=/media/dev13/TuDiscoExterno/localdrop_data
```

### 3. Instalar Servicio systemd para Inicio Automático
```bash
sudo cp server/localdrop.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable localdrop
sudo systemctl start localdrop
```

El servidor estará corriendo en `http://192.168.1.69:3000` (o la IP local asignada).
