
import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer } from 'lucide-react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  title?: string;
  onClose?: () => void;
}

export default function QRCodeGenerator({
  value,
  size = 200,
  title,
  onClose
}: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // State to hold the image URL for the printable area
  const [printSrc, setPrintSrc] = React.useState<string>('');

  // Update print source when value changes
  React.useEffect(() => {
    const updatePrintSrc = () => {
      const canvas = qrRef.current?.querySelector('canvas');
      if (canvas) {
        setPrintSrc(canvas.toDataURL('image/png'));
      }
    };
    // Small delay to ensure canvas is rendered
    const timer = setTimeout(updatePrintSrc, 100);
    return () => clearTimeout(timer);
  }, [value, size]);

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `karekod-${value}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const printQRCode = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-container, #printable-qr-container * {
            visibility: visible;
          }
          #printable-qr-container {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            z-index: 9999;
            padding: 20px;
          }
          /* Hide the modal overlay background in print */
          .fixed.inset-0 {
             position: static;
             background: none !important;
          }
        }
      `}</style>

      {/* Hidden Print Container (Visible only in print) */}
      <div id="printable-qr-container" style={{ display: 'none' }}>
        {title && <h1 className="text-2xl font-bold mb-4">{title}</h1>}
        {printSrc && <img src={printSrc} width={size} height={size} style={{ maxWidth: '100%' }} />}
        <p className="mt-4 font-mono text-lg text-gray-700">{value}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 print:hidden">

        <div className="text-center">
          {title && (
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
          )}

          <div ref={qrRef} className="flex justify-center bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-100 dark:border-gray-600 mb-4">
            <QRCodeCanvas
              value={value}
              size={size}
              level={"H"}
              includeMargin={true}
            />
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Link:</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono bg-gray-50 dark:bg-gray-700 py-2 px-3 rounded block break-all text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              {value}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={downloadQRCode}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>İndir</span>
            </button>
            <button
              onClick={printQRCode}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Yazdır</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium text-sm transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
