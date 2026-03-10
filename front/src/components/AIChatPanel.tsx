import { useEffect, useMemo, useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;

  // Текст ответа ИИ (можешь прокидывать извне)
  aiAnswer?: string;
  // Если хочешь, чтобы панель сама обновляла сохранённый текст
  onClear?: () => void;
};

const LS_KEY = "ai_chat_panel_state_v1";

type Persisted = {
  collapsed: boolean;
  answer: string;
};

export default function AIChatPanel({ isOpen, onClose, aiAnswer, onClear }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [answer, setAnswer] = useState("");

  // загрузка сохранённого состояния
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Persisted;
      setCollapsed(!!parsed.collapsed);
      setAnswer(parsed.answer || "");
    } catch {
      // ignore
    }
  }, []);

  // если пришёл новый ответ ИИ — обновим и сохраним
  useEffect(() => {
    if (typeof aiAnswer === "string") {
      setAnswer(aiAnswer);
    }
  }, [aiAnswer]);

  // сохранение в localStorage
  useEffect(() => {
    try {
      const payload: Persisted = { collapsed, answer };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [collapsed, answer]);

  const panelSize = useMemo(() => {
    // collapsed: маленькое окошко снизу справа
    if (collapsed) return "w-[340px] h-[72px]";
    // expanded
    return "w-[420px] h-[70vh] max-h-[720px]";
  }, [collapsed]);

  if (!isOpen) return null;

  return (
    <>
      {/* затемнение фона (можно убрать, если не нужно) */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* панель */}
      <div
        className={`fixed z-50 right-4 top-20 ${panelSize} transition-all`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full bg-app-bg border border-app-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-app-border">
            <div className="text-app-text font-semibold">Ответ ИИ</div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-sm rounded-lg bg-app-surface text-app-text hover:bg-app-surface-strong"
                onClick={() => setCollapsed((v) => !v)}
                type="button"
              >
                {collapsed ? "Развернуть" : "Свернуть"}
              </button>

              <button
                className="px-2 py-1 text-sm rounded-lg bg-app-surface text-app-text hover:bg-app-surface-strong"
                onClick={() => {
                  setAnswer("");
                  onClear?.();
                }}
                type="button"
              >
                Очистить
              </button>

              <button
                className="px-2 py-1 text-sm rounded-lg bg-red-600/80 text-app-text hover:bg-red-600"
                onClick={onClose}
                type="button"
              >
                ✕
              </button>
            </div>
          </div>

          {/* body */}
          {!collapsed && (
            <div className="flex-1 p-4 overflow-auto">
              {answer?.trim() ? (
                <pre className="whitespace-pre-wrap text-app-text text-sm leading-relaxed">
                  {answer}
                </pre>
              ) : (
                <div className="text-app-muted text-sm">
                  Тут появится ответ модели. Закрытие/сворачивание его не удаляет — он сохраняется.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
