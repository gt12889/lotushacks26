'use client';

interface DiscordPreviewProps {
  drugName: string;
  bestPrice?: number;
  bestSource?: string;
}

export default function DiscordPreview({ drugName, bestPrice, bestSource }: DiscordPreviewProps) {
  const now = new Date();
  const timestamp = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const priceStr = bestPrice ? `${bestPrice.toLocaleString()} VND` : 'N/A';

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#2F3136' }}>
      {/* Discord header bar */}
      <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: '#202225' }}>
        <svg width="20" height="15" viewBox="0 0 71 55" fill="#5865F2">
          <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A39.2 39.2 0 0025.4.3a.2.2 0 00-.2-.1 58.4 58.4 0 00-14.7 4.6.2.2 0 00-.1.1C1.5 18.7-.9 32 .3 45.1v.1a58.7 58.7 0 0017.9 9.1.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.6 38.6 0 01-5.5-2.7.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 41.9 41.9 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .3 36.3 36.3 0 01-5.5 2.7.2.2 0 00-.1.3 47.2 47.2 0 003.6 6 .2.2 0 00.2 0A58.5 58.5 0 0070.7 45.3v-.2C72.1 30.1 68.1 16.9 60.2 5a.2.2 0 00-.1 0zM23.7 37c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1 6.4 3.2 6.3 7.1c0 3.9-2.8 7.1-6.3 7.1zm23.3 0c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1 6.4 3.2 6.3 7.1c0 3.9-2.8 7.1-6.3 7.1z" />
        </svg>
        <span className="text-xs font-semibold" style={{ color: '#DCDDDE' }}># price-alerts</span>
      </div>

      {/* Message area */}
      <div className="px-4 py-3">
        {/* Bot message */}
        <div className="flex gap-3">
          {/* Bot avatar */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: '#00DBE7', color: '#0A1628' }}
          >
            M
          </div>

          <div className="flex-1 min-w-0">
            {/* Bot name + timestamp */}
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm" style={{ color: '#00DBE7' }}>
                MegalodonMD Bot
              </span>
              <span className="text-[10px]" style={{ color: '#72767D' }}>
                BOT
              </span>
              <span className="text-[10px]" style={{ color: '#72767D' }}>
                {timestamp}
              </span>
            </div>

            {/* Embed */}
            <div className="mt-1.5 rounded overflow-hidden flex" style={{ backgroundColor: '#2F3136', border: '1px solid #202225' }}>
              {/* Cyan left border */}
              <div className="w-1 flex-shrink-0" style={{ backgroundColor: '#00DBE7' }} />

              <div className="p-3 flex-1">
                {/* Embed title */}
                <p className="font-semibold text-sm mb-2" style={{ color: '#00DBE7' }}>
                  Price Alert: {drugName}
                </p>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: '#72767D' }}>Best Price</p>
                    <p className="text-sm" style={{ color: '#DCDDDE' }}>{priceStr}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: '#72767D' }}>Source</p>
                    <p className="text-sm" style={{ color: '#DCDDDE' }}>{bestSource || 'Scanning...'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: '#72767D' }}>Pharmacies Scanned</p>
                    <p className="text-sm" style={{ color: '#DCDDDE' }}>5 / 5</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: '#72767D' }}>Status</p>
                    <p className="text-sm" style={{ color: '#43B581' }}>Delivered</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: '1px solid #202225' }}>
                  <span className="text-[10px]" style={{ color: '#72767D' }}>
                    via ElevenLabs TTS + Discord Webhook
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
