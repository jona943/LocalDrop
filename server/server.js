import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LocalDrop Servidor ejecutándose en el puerto ${PORT}`);
    console.log(`🌐 Acceso local: http://localhost:${PORT}`);
});
