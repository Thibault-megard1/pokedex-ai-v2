"use client";

import { useState, useEffect } from 'react';
import { encodeTeam, generateShareURL, type SharedTeam } from '@/lib/teamSharing';
import { generateQRCode, copyQRToClipboard, downloadQRCode } from '@/lib/qrcode';

type TeamSlot = { slot: number; pokemonId: number; pokemonName: string };

interface TeamShareModalProps {
  team: TeamSlot[];
  teamName?: string;
  onClose: () => void;
}

export default function TeamShareModal({ team, teamName, onClose }: TeamShareModalProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Create shared team object
      const sharedTeam: SharedTeam = {
        name: teamName || 'Mon Équipe',
        pokemon: team.map(t => ({
          id: t.pokemonId,
          name: t.pokemonName,
          evolutionLevel: 0 // Default, can be enhanced later
        })),
        evolutionPoints: 0, // Default
        createdAt: Date.now()
      };

      // Generate share URL
      const baseUrl = window.location.origin;
      const url = generateShareURL(sharedTeam, baseUrl);
      setShareUrl(url);

      // Generate QR code
      generateQRCode(url, 300).then(qrUrl => {
        setQrCodeUrl(qrUrl);
      }).catch(err => {
        console.error('QR generation failed:', err);
        setError('Erreur lors de la génération du QR code');
      });
    } catch (err) {
      console.error('Share generation failed:', err);
      setError('Erreur lors de la génération du lien de partage');
    }
  }, [team, teamName]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setError('Erreur lors de la copie');
    }
  }

  async function copyQR() {
    if (!qrCodeUrl) return;
    try {
      await copyQRToClipboard(qrCodeUrl);
      alert('QR code copié dans le presse-papiers !');
    } catch (err) {
      console.error('QR copy failed:', err);
      alert('Erreur lors de la copie du QR code');
    }
  }

  function downloadQR() {
    if (!qrCodeUrl) return;
    downloadQRCode(qrCodeUrl, `team-${teamName || 'export'}.png`);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">🔗 Partager l'équipe</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-100 mt-2">{teamName || 'Mon Équipe'} • {team.length} Pokémon</p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              ⚠️ {error}
            </div>
          )}

          {/* Share URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              🔗 Lien de partage
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyUrl}
                className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? '✓ Copié' : '📋 Copier'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Partagez ce lien avec vos amis pour qu'ils puissent importer votre équipe.
            </p>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                📱 QR Code
              </label>
              <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-64 h-64 border-4 border-white shadow-lg rounded-lg"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={downloadQR}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    ⬇️ Télécharger
                  </button>
                  <button
                    onClick={copyQR}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    📋 Copier
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Scannez ce QR code avec un téléphone pour ouvrir le lien directement.
              </p>
            </div>
          )}

          {/* Social Share Buttons */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              🌐 Partager sur les réseaux
            </label>
            <div className="flex gap-3 flex-wrap">
              <a
                href={`https://twitter.com/intent/tweet?text=Découvre mon équipe Pokémon !&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors"
              >
                🐦 Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors"
              >
                📘 Facebook
              </a>
              <a
                href={`https://wa.me/?text=Découvre mon équipe Pokémon ! ${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Astuce :</strong> Le lien de partage contient toutes les informations de votre équipe 
              de manière compacte et sécurisée. Aucune donnée n'est stockée sur un serveur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
