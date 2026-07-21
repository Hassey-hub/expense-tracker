export default function TelegramLinkCard({
  telegramChatId,
  linkCode,
}: {
  telegramChatId: string | null;
  linkCode: string | null;
}) {
  if (telegramChatId) {
    return (
      <div className="card p-4 flex items-center gap-3 bg-emerald-50 border-emerald-100">
        <span className="text-emerald-700">✓</span>
        <p className="text-sm text-emerald-900">
          Votre compte Telegram est lié. Envoyez un message à votre bot pour
          ajouter une dépense automatiquement.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 bg-gold-100/40 border-gold-100">
      <p className="text-sm font-medium text-ink-900 mb-1">
        Liez votre compte Telegram
      </p>
      <p className="text-sm text-ink-700">
        Ouvrez votre bot Telegram et envoyez :{" "}
        <code className="bg-white px-2 py-0.5 rounded border border-ink-100 font-mono text-emerald-800">
          /link {linkCode}
        </code>
      </p>
    </div>
  );
}
