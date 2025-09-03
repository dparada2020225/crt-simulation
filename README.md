Simulación del Comportamiento de un Tubo de Rayos Catódicos (CRT)

Este proyecto implementa una simulación interactiva de un tubo de rayos catódicos (CRT), con fines didácticos en el curso de Física 3 de la Universidad del Valle de Guatemala.
La aplicación permite visualizar el movimiento de electrones dentro del tubo, observar las vistas lateral y superior del haz, y reproducir las Figuras de Lissajous al aplicar señales sinusoidales a las placas deflectoras.

Características principales

Vista lateral del CRT mostrando la deflexión vertical.

Vista superior mostrando la deflexión horizontal.

Pantalla frontal donde se observa el impacto del haz de electrones con efecto de persistencia.

Control de voltaje de aceleración, voltajes de placas y persistencia.

Dos modos de operación:

Manual: el usuario ajusta los voltajes de placas directamente.

Automático (Lissajous): se aplican señales sinusoidales con frecuencia y fase ajustables.

Presets de figuras de Lissajous para reproducir combinaciones clásicas de frecuencias y fases.

Botones de inicio, pausa, reinicio y limpieza de pantalla.

Requisitos previos

Node.js
 versión 16 o superior.

npm (incluido con Node.js).

Instalación y ejecución

Clonar o descargar este repositorio.

Abrir una terminal en la carpeta del proyecto.

Instalar dependencias con:

npm install


Iniciar la aplicación en modo desarrollo:

npm start


Abrir http://localhost:3000
 en el navegador para visualizar la simulación.

Scripts disponibles

En la carpeta del proyecto se pueden ejecutar los siguientes comandos:

npm start
Inicia la aplicación en modo desarrollo.

npm run build
Genera la aplicación lista para producción en la carpeta build.

npm test
Ejecuta las pruebas en modo interactivo.

Organización del código

src/App.js: componente principal que carga la simulación.

src/components/CRTSimulation.js: lógica central de la simulación y controles de usuario.

src/index.js: punto de entrada de la aplicación.

src/index.css: estilos principales (Tailwind CSS).

Créditos

Proyecto desarrollado como parte del curso Física 3 en la Universidad del Valle de Guatemala.
