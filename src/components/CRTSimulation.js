import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const CRTSimulation = () => {
  // Estados para controles del usuario
  const [accelerationVoltage, setAccelerationVoltage] = useState(2000);
  const [verticalVoltage, setVerticalVoltage] = useState(0);
  const [horizontalVoltage, setHorizontalVoltage] = useState(0);
  const [persistenceTime, setPersistenceTime] = useState(100);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [verticalFreq, setVerticalFreq] = useState(1);
  const [horizontalFreq, setHorizontalFreq] = useState(1);
  const [verticalPhase, setVerticalPhase] = useState(0);
  const [horizontalPhase, setHorizontalPhase] = useState(0);

  // Referencias para canvas
  const lateralCanvasRef = useRef(null);
  const topCanvasRef = useRef(null);
  const screenCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const screenPointsRef = useRef([]);

  // Constantes físicas del CRT
  const CRT_CONFIG = {
    screenSize: 0.3, // 30 cm
    plateArea: 0.01, // 10 cm²
    plateSeparation: 0.02, // 2 cm
    gunToVerticalPlates: 0.1, // 10 cm
    verticalToHorizontalPlates: 0.05, // 5 cm
    platesToScreen: 0.15, // 15 cm
    electronCharge: -1.6e-19,
    electronMass: 9.11e-31,
    maxVoltage: 1000 // Voltaje máximo para las placas
  };

  // Función para calcular la trayectoria del electrón
  const calculateElectronPath = (vAcc, vVert, vHor) => {
    const e = Math.abs(CRT_CONFIG.electronCharge);
    const m = CRT_CONFIG.electronMass;
    
    // Velocidad inicial por aceleración
    const v0 = Math.sqrt(2 * e * vAcc / m);
    
    // Campo eléctrico en las placas
    const EVertical = vVert / CRT_CONFIG.plateSeparation;
    const EHorizontal = vHor / CRT_CONFIG.plateSeparation;
    
    // Aceleración en las placas
    const aVertical = e * EVertical / m;
    const aHorizontal = e * EHorizontal / m;
    
    // Tiempo en cada sección
    const tVerticalPlates = CRT_CONFIG.plateSeparation / v0;
    const tBetweenPlates = CRT_CONFIG.verticalToHorizontalPlates / v0;
    const tHorizontalPlates = CRT_CONFIG.plateSeparation / v0;
    const tToScreen = CRT_CONFIG.platesToScreen / v0;
    
    // Deflexión vertical en las placas verticales
    const vyAfterVertical = aVertical * tVerticalPlates;
    const yAfterVertical = 0.5 * aVertical * tVerticalPlates * tVerticalPlates;
    
    // Posición después de las placas verticales hasta las horizontales
    const yBeforeHorizontal = yAfterVertical + vyAfterVertical * tBetweenPlates;
    
    // Deflexión horizontal en las placas horizontales
    const vxAfterHorizontal = aHorizontal * tHorizontalPlates;
    const xAfterHorizontal = 0.5 * aHorizontal * tHorizontalPlates * tHorizontalPlates;
    
    // Posición final en la pantalla
    const finalX = xAfterHorizontal + vxAfterHorizontal * tToScreen;
    const finalY = yBeforeHorizontal + vyAfterVertical * (tHorizontalPlates + tToScreen);
    
    return { x: finalX, y: finalY, brightness: Math.min(vAcc / 5000, 1) };
  };

  // Función para dibujar la vista lateral
  const drawLateralView = (ctx, electronPos) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerY = height / 2;
    
    // Dibujar cañón de electrones
    ctx.fillStyle = '#888';
    ctx.fillRect(10, centerY - 8, 20, 16);
    
    // Dibujar placas verticales
    ctx.fillStyle = '#666';
    ctx.fillRect(50, centerY - 20, 6, 12);
    ctx.fillRect(50, centerY + 8, 6, 12);
    
    // Dibujar placas horizontales
    ctx.fillRect(80, centerY - 20, 12, 6);
    ctx.fillRect(80, centerY + 14, 12, 6);
    
    // Dibujar pantalla
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(width - 15, 15, 10, height - 30);
    
    // Dibujar trayectoria del electrón
    if (electronPos) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, centerY);
      
      // Trayectoria recta hasta placas verticales
      ctx.lineTo(50, centerY);
      
      // Escalado de posición Y física al canvas
      const scaleY = (height * 0.4) / CRT_CONFIG.screenSize; 
      const yDeflection = electronPos.y * scaleY;

      ctx.lineTo(80, centerY + yDeflection);
      ctx.lineTo(width - 15, centerY + yDeflection);

      ctx.stroke();

      // Punto del electrón (posición real en pantalla lateral)
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(width - 10, centerY + yDeflection, 2, 0, 2 * Math.PI);
      ctx.fill();

    }
  };

  // Función para dibujar la vista superior
  const drawTopView = (ctx, electronPos) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = height / 2;
    
    // Dibujar cañón de electrones
    ctx.fillStyle = '#888';
    ctx.fillRect(10, centerX - 8, 20, 16);
    
    // Dibujar placas horizontales
    ctx.fillStyle = '#666';
    ctx.fillRect(80, centerX - 20, 6, 12);
    ctx.fillRect(80, centerX + 8, 6, 12);
    
    // Dibujar pantalla
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(width - 15, 15, 10, height - 30);
    
    // Dibujar trayectoria del electrón
    if (electronPos) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, centerX);
      ctx.lineTo(80, centerX);
      
      // Escalado de posición X física al canvas
      const scaleX = (height * 0.4) / CRT_CONFIG.screenSize;
      const xDeflection = electronPos.x * scaleX;

      ctx.lineTo(width - 15, centerX + xDeflection);

      ctx.stroke();

      // Punto del electrón (posición real en pantalla superior)
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(width - 10, centerX + xDeflection, 2, 0, 2 * Math.PI);
      ctx.fill();

    }
  };

  // Función para dibujar la pantalla
  const drawScreen = (ctx, electronPos) => {
    if (!electronPos) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Limpiar pantalla gradualmente para efecto de persistencia
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - persistenceTime / 1000})`;
    ctx.fillRect(0, 0, width, height);
    
    // Calcular posición en pantalla (normalizada)
    const screenX = centerX + (electronPos.x / CRT_CONFIG.screenSize) * width * 0.8;
    const screenY = centerY - (electronPos.y / CRT_CONFIG.screenSize) * height * 0.8;
    
    // Agregar punto a la historia
    screenPointsRef.current.push({
      x: screenX,
      y: screenY,
      brightness: electronPos.brightness,
      time: Date.now()
    });
    
    // Eliminar puntos antiguos
    const now = Date.now();
    screenPointsRef.current = screenPointsRef.current.filter(
      point => now - point.time < persistenceTime
    );
    
    // Dibujar todos los puntos con desvanecimiento
    screenPointsRef.current.forEach(point => {
      const age = now - point.time;
      const alpha = Math.max(0, 1 - age / persistenceTime);
      const intensity = point.brightness * alpha;
      
      ctx.fillStyle = `rgba(0, 255, 0, ${intensity})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Efecto de brillo
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Función de animación principal
  const animate = () => {
    let currentVerticalV = verticalVoltage;
    let currentHorizontalV = horizontalVoltage;
    
    if (isAutoMode && isRunning) {
      timeRef.current += 0.05;
      currentVerticalV = CRT_CONFIG.maxVoltage * 0.8 * Math.sin(
        2 * Math.PI * verticalFreq * timeRef.current + verticalPhase
      );
      currentHorizontalV = CRT_CONFIG.maxVoltage * 0.8 * Math.sin(
        2 * Math.PI * horizontalFreq * timeRef.current + horizontalPhase
      );
    }
    
    const electronPos = calculateElectronPath(
      accelerationVoltage,
      currentVerticalV,
      currentHorizontalV
    );
    
    // Dibujar en todos los canvas
    const lateralCtx = lateralCanvasRef.current?.getContext('2d');
    const topCtx = topCanvasRef.current?.getContext('2d');
    const screenCtx = screenCanvasRef.current?.getContext('2d');
    
    if (lateralCtx) drawLateralView(lateralCtx, electronPos);
    if (topCtx) drawTopView(topCtx, electronPos);
    if (screenCtx) drawScreen(screenCtx, electronPos);
    
    if (isRunning) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning) {
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, verticalVoltage, horizontalVoltage, accelerationVoltage, isAutoMode, persistenceTime, verticalFreq, horizontalFreq, verticalPhase, horizontalPhase]);

  const clearScreen = () => {
    screenPointsRef.current = [];
    const screenCtx = screenCanvasRef.current?.getContext('2d');
    if (screenCtx) {
      screenCtx.fillStyle = '#000';
      screenCtx.fillRect(0, 0, screenCtx.canvas.width, screenCtx.canvas.height);
    }
  };

  const resetSimulation = () => {
    setIsRunning(false);
    timeRef.current = 0;
    clearScreen();
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex-shrink-0">
        <h1 className="text-xl font-bold text-center">Simulación CRT - Universidad del Valle de Guatemala</h1>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Vistas del CRT */}
        <div className="flex-1 flex flex-col p-2 space-y-2">
          {/* Vista Lateral */}
          <div className="flex-1 bg-gray-800 rounded p-2">
            <h2 className="text-sm font-semibold mb-1 text-center">Vista Lateral</h2>
            <canvas
              ref={lateralCanvasRef}
              width={200}
              height={120}
              className="w-full h-full border border-gray-600 rounded"
            />
          </div>
          
          {/* Vista Superior */}
          <div className="flex-1 bg-gray-800 rounded p-2">
            <h2 className="text-sm font-semibold mb-1 text-center">Vista Superior</h2>
            <canvas
              ref={topCanvasRef}
              width={200}
              height={120}
              className="w-full h-full border border-gray-600 rounded"
            />
          </div>
        </div>
        
        {/* Panel central - Pantalla del CRT */}
        <div className="flex-1 bg-gray-800 p-2 m-2 rounded">
          <h2 className="text-lg font-semibold mb-2 text-center">Pantalla del CRT</h2>
          <canvas
            ref={screenCanvasRef}
            width={300}
            height={300}
            className="w-full h-full border border-green-600 rounded bg-black"
          />
        </div>
        
        {/* Panel derecho - Controles */}
        <div className="w-80 bg-gray-800 p-3 overflow-y-auto flex-shrink-0">
          {/* Controles de simulación */}
          <div className="mb-4">
            <div className="flex space-x-1 mb-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm flex-1"
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
              </button>
              
              <button
                onClick={resetSimulation}
                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
              
              <button
                onClick={clearScreen}
                className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
          
          {/* Controles básicos */}
          <div className="mb-4 space-y-3">
            <h3 className="text-md font-semibold border-b border-gray-600 pb-1">Parámetros Básicos</h3>
            
            <div>
              <label className="block text-xs font-medium mb-1">
                Voltaje Aceleración: {accelerationVoltage}V
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={accelerationVoltage}
                onChange={(e) => setAccelerationVoltage(Number(e.target.value))}
                className="w-full h-1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">
                Persistencia: {persistenceTime}ms
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={persistenceTime}
                onChange={(e) => setPersistenceTime(Number(e.target.value))}
                className="w-full h-1"
              />
            </div>
          </div>
          
          {/* Modo de operación */}
          <div className="mb-4">
            <h3 className="text-md font-semibold border-b border-gray-600 pb-1 mb-2">Modo de Operación</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manual"
                  checked={!isAutoMode}
                  onChange={() => setIsAutoMode(false)}
                  className="w-3 h-3"
                />
                <label htmlFor="manual">Manual</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="auto"
                  checked={isAutoMode}
                  onChange={() => setIsAutoMode(true)}
                  className="w-3 h-3"
                />
                <label htmlFor="auto">Lissajous</label>
              </div>
            </div>
          </div>
          
          {/* Controles manuales */}
          {!isAutoMode && (
            <div className="mb-4 space-y-3">
              <h3 className="text-md font-semibold border-b border-gray-600 pb-1">Control Manual</h3>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Voltaje Vertical: {verticalVoltage}V
                </label>
                <input
                  type="range"
                  min={-CRT_CONFIG.maxVoltage}
                  max={CRT_CONFIG.maxVoltage}
                  step="10"
                  value={verticalVoltage}
                  onChange={(e) => setVerticalVoltage(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Voltaje Horizontal: {horizontalVoltage}V
                </label>
                <input
                  type="range"
                  min={-CRT_CONFIG.maxVoltage}
                  max={CRT_CONFIG.maxVoltage}
                  step="10"
                  value={horizontalVoltage}
                  onChange={(e) => setHorizontalVoltage(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
            </div>
          )}
          
          {/* Controles Lissajous */}
          {isAutoMode && (
            <div className="space-y-3">
              <h3 className="text-md font-semibold border-b border-gray-600 pb-1">Figuras de Lissajous</h3>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Freq. Vertical: {verticalFreq}Hz
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={verticalFreq}
                  onChange={(e) => setVerticalFreq(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Freq. Horizontal: {horizontalFreq}Hz
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={horizontalFreq}
                  onChange={(e) => setHorizontalFreq(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Fase Vertical: {(verticalPhase * 180 / Math.PI).toFixed(0)}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="6.28"
                  step="0.1"
                  value={verticalPhase}
                  onChange={(e) => setVerticalPhase(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Fase Horizontal: {(horizontalPhase * 180 / Math.PI).toFixed(0)}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="6.28"
                  step="0.1"
                  value={horizontalPhase}
                  onChange={(e) => setHorizontalPhase(Number(e.target.value))}
                  className="w-full h-1"
                />
              </div>

              {/* Presets Lissajous */}
              <div className="mt-4">
                <h3 className="text-md font-semibold border-b border-gray-600 pb-1 mb-2">Presets</h3>

                {/* Relación de frecuencias */}
                <div className="mb-2">
                  <label className="block text-xs font-medium mb-1">Relación ωx : ωy</label>
                  <select
                    className="w-full bg-gray-700 text-white p-1 rounded text-sm"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "1:1") {
                        setVerticalFreq(1);
                        setHorizontalFreq(1);
                      } else if (value === "1:2") {
                        setVerticalFreq(1);
                        setHorizontalFreq(2);
                      } else if (value === "1:3") {
                        setVerticalFreq(1);
                        setHorizontalFreq(3);
                      } else if (value === "2:3") {
                        setVerticalFreq(2);
                        setHorizontalFreq(3);
                      }
                    }}
                  >
                    <option value="1:1">1:1</option>
                    <option value="1:2">1:2</option>
                    <option value="1:3">1:3</option>
                    <option value="2:3">2:3</option>
                  </select>
                </div>

                {/* Fase */}
                <div>
                  <label className="block text-xs font-medium mb-1">Fase δ</label>
                  <select
                    className="w-full bg-gray-700 text-white p-1 rounded text-sm"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setHorizontalPhase(value);
                    }}
                  >
                    <option value="0">0</option>
                    <option value={Math.PI/4}>π/4</option>
                    <option value={Math.PI/2}>π/2</option>
                    <option value={3*Math.PI/4}>3π/4</option>
                    <option value={Math.PI}>π</option>
                  </select>
                </div>
              </div>

            </div>
          )}
          
          {/* Información física */}
          <div className="mt-4 p-2 bg-gray-700 rounded">
            <h4 className="text-xs font-semibold mb-2">Parámetros CRT</h4>
            <div className="text-xs space-y-1">
              <div>Pantalla: 30cm²</div>
              <div>Sep. placas: 2cm</div>
              <div>Área placas: 10cm²</div>
              <div>Dist. total: 30cm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRTSimulation;