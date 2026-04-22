/**
 * QR Code Scanner Component
 * Uses device camera to scan QR codes from receipts
 */

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, AlertCircle } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsScanning(true);
          scanQRCode();
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to access camera";
        setError(`Camera access denied: ${message}`);
      }
    };

    startCamera();

    return () => {
      // Stop camera on unmount
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code) {
      // Extract token from URL if it's a receipt URL
      let token = code.data;
      const urlMatch = code.data.match(/\/receipt\/([^/\s?]+)/);
      if (urlMatch && urlMatch[1]) {
        token = urlMatch[1];
      }
      onScan(token);
      return;
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="relative bg-black aspect-square">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-green-500 rounded-lg opacity-75 shadow-lg">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />
            </div>
          </div>

          {/* Scanning animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-1 bg-gradient-to-b from-transparent via-green-500 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-white">
          {error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Point your camera at the QR code on your receipt
              </p>
            </div>
          )}

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
            disabled={!isScanning}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
