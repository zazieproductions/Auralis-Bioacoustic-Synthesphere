import React, { useEffect, useRef } from 'react';
import { globalAudioEngine } from '../audio/AudioEngine';

interface AudioVisualizerProps {
  mode?: 'spectrum' | 'oscilloscope';
  accentColor?: string;
  width?: number;
  height?: number;
  isSpecimen?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode = 'spectrum',
  accentColor = '#38bdf8',
  width = 240,
  height = 54,
  isSpecimen = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128);

    const draw = () => {
      animId = requestAnimationFrame(draw);

      if (isSpecimen) {
        globalAudioEngine.getSpecimenTimeDomainData(dataArray);
      } else {
        if (mode === 'spectrum') {
          globalAudioEngine.getMasterFrequencyData(dataArray);
        } else {
          globalAudioEngine.getMasterTimeDomainData(dataArray);
        }
      }

      ctx.clearRect(0, 0, width, height);

      if (mode === 'spectrum') {
        const barWidth = (width / 48) - 1;
        for (let i = 0; i < 48; i++) {
          const val = dataArray[i * 2] || 0;
          const barHeight = (val / 255) * height;
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.2 + (val / 255) * 0.8;
          ctx.fillRect(i * (barWidth + 1), height - barHeight, barWidth, barHeight);
        }
        ctx.globalAlpha = 1.0;
      } else {
        // Oscilloscope wave
        ctx.beginPath();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        const sliceWidth = width / 128;
        let x = 0;

        for (let i = 0; i < 128; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, accentColor, width, height, isSpecimen]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded bg-black/40 border border-sky-500/20 shadow-inner"
    />
  );
};
