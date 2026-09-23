import React, { useEffect, useMemo, useState } from "react";
import { FaEnvelope, FaPaperclip, FaTimes } from "react-icons/fa";
import Button from "../../../../../components/ui/button/Button";
import Select from "../../../../../components/form/Select";
import { showErrorToast, showSuccessToast } from "../../../../../components/toast";
import {
  fasManagementService,
  parseFasApiError,
} from "../services/FasManagementService";
import {
  fasEmailService,
  parseFasEmailError,
} from "../services/FasEmailService";
import type { FasUser } from "../types";

type EmailOption = { value: string; label: string };
export type FasEmailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  amoName: string;
  reportDate: string;
  reportDateLabel: string;
  spbCount: number;
  /** Generate Excel attachment (File) sebelum kirim */
  buildAttachment: () => Promise<File | null> | File | null;
};

const buildDefaultSubject = (amoName: string, reportDateLabel: string) =>
  `Rekap SPB Final ${amoName} — ${reportDateLabel}`;

const buildDefaultText = (
  amoName: string,
  reportDateLabel: string,
  spbCount: number,
) =>
  [
    "Yth. Tim FAS,",
    "",
    `Terlampir Rekap SPB Final untuk cabang ${amoName}.`,
    `Tanggal callplan: ${reportDateLabel}`,
    `Jumlah SPB FINAL: ${spbCount}`,
    "",
    "Mohon ditindaklanjuti.",
    "",
    "Terima kasih.",
  ].join("\n");

const buildDefaultHtml = (
  amoName: string,
  reportDateLabel: string,
  spbCount: number,
) =>
  `<p>Yth. Tim FAS,</p>
<p>Terlampir <b>Rekap SPB Final</b> untuk cabang <b>${amoName}</b>.</p>
<ul>
  <li>Tanggal callplan: <b>${reportDateLabel}</b></li>
  <li>Jumlah SPB FINAL: <b>${spbCount}</b></li>
</ul>
<p>Mohon ditindaklanjuti.</p>
<p>Terima kasih.</p>`;

export const FasEmailModal = ({
  isOpen,
  onClose,
  organizationId,
  amoName,
  reportDateLabel,
  spbCount,
  buildAttachment,
}: FasEmailModalProps) => {
  const [fasUsers, setFasUsers] = useState<FasUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const [useHtml, setUseHtml] = useState(false);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setSubject(buildDefaultSubject(amoName, reportDateLabel));
    setText(buildDefaultText(amoName, reportDateLabel, spbCount));
    setHtml(buildDefaultHtml(amoName, reportDateLabel, spbCount));
    setToEmails([]);
    setCcEmails([]);
    setUseHtml(false);
    setAttachmentName(`Rekap_SPB_Final_${amoName}_${reportDateLabel}.xlsx`);

    if (!organizationId) {
      setFasUsers([]);
      return;
    }

    let cancelled = false;
    setIsLoadingUsers(true);
    void fasManagementService
      .getList({
        page: 1,
        limit: 100,
        sortOrder: "DESC",
        organization_id: organizationId,
      })
      .then((result) => {
        if (cancelled) return;
        setFasUsers(result.data.filter((u) => Boolean(u.email?.trim())));
      })
      .catch((error) => {
        if (cancelled) return;
        setFasUsers([]);
        showErrorToast(
          parseFasApiError(error, "Gagal memuat daftar user FAS cabang"),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, organizationId, amoName, reportDateLabel, spbCount]);

  const allEmailOptions = useMemo((): EmailOption[] => {
    const map = new Map<string, EmailOption>();
    fasUsers.forEach((u) => {
      const email = String(u.email || "").trim().toLowerCase();
      if (!email || map.has(email)) return;
      const name = String(u.name || "").trim() || email;
      map.set(email, {
        value: email,
        label: `${name} — ${u.email.trim()}`,
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "id"),
    );
  }, [fasUsers]);

  /** To: sembunyikan yang sudah di CC (selected To di-hide oleh react-select) */
  const toSelectOptions = useMemo(
    () => allEmailOptions.filter((opt) => !ccEmails.includes(opt.value)),
    [allEmailOptions, ccEmails],
  );

  /** CC: sembunyikan yang sudah di To */
  const ccSelectOptions = useMemo(
    () => allEmailOptions.filter((opt) => !toEmails.includes(opt.value)),
    [allEmailOptions, toEmails],
  );

  const handleToChange = (values: string[]) => {
    const next = (values || []).map((e) => e.trim().toLowerCase()).filter(Boolean);
    setToEmails(next);
    // lepas dari CC jika dipindah ke To
    setCcEmails((cc) => cc.filter((e) => !next.includes(e)));
  };

  const handleCcChange = (values: string[]) => {
    const next = (values || []).map((e) => e.trim().toLowerCase()).filter(Boolean);
    setCcEmails(next);
    setToEmails((to) => to.filter((e) => !next.includes(e)));
  };

  const handleSend = async () => {
    if (!toEmails.length) {
      showErrorToast("Pilih minimal 1 penerima di kolom To");
      return;
    }
    if (!subject.trim()) {
      showErrorToast("Subject wajib diisi");
      return;
    }

    setIsSending(true);
    try {
      const file = await buildAttachment();
      if (!file) {
        showErrorToast("Gagal membuat lampiran Excel Rekap SPB Final");
        return;
      }
      setAttachmentName(file.name);

      await fasEmailService.sendUpload({
        to: toEmails,
        cc: ccEmails,
        subject: subject.trim(),
        text: text.trim() || undefined,
        html: useHtml ? html.trim() || undefined : undefined,
        files: [file],
      });

      showSuccessToast("Email Rekap SPB Final berhasil dikirim ke FAS");
      onClose();
    } catch (error) {
      showErrorToast(parseFasEmailError(error));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[15000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-2 text-amber-600">
              <FaEnvelope size={16} />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Email to FAS
              </p>
              <h3 className="text-lg font-bold text-slate-800">
                Kirim Rekap SPB Final
              </h3>
              <p className="text-xs text-slate-500">
                {amoName} · {reportDateLabel} · {spbCount} SPB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <FaPaperclip />
              Lampiran otomatis
            </div>
            <p className="mt-1">
              {attachmentName || "Rekap SPB Final (.xlsx) akan digenerate saat kirim"}
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">
                To <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {toEmails.length} dipilih
              </span>
            </div>
            {isLoadingUsers ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                Memuat user FAS cabang...
              </p>
            ) : allEmailOptions.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
                Belum ada user FAS untuk cabang ini. Tambahkan di menu FAS
                Management.
              </p>
            ) : (
              <Select
                isMulti
                options={toSelectOptions}
                value={toEmails}
                onChange={handleToChange}
                placeholder="Cari & pilih penerima To..."
                width="100%"
                disabled={isSending}
                className="w-full text-sm"
              />
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">CC</label>
              <span className="text-[10px] text-slate-400">
                {ccEmails.length} dipilih
              </span>
            </div>
            {allEmailOptions.length > 0 && (
              <Select
                isMulti
                options={ccSelectOptions}
                value={ccEmails}
                onChange={handleCcChange}
                placeholder="Cari & pilih CC (opsional)..."
                width="100%"
                disabled={isSending}
                className="w-full text-sm"
              />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600">
                Body ({useHtml ? "HTML" : "Text"})
              </label>
              <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <input
                  type="checkbox"
                  checked={useHtml}
                  onChange={(e) => setUseHtml(e.target.checked)}
                  disabled={isSending}
                  className="rounded border-slate-300"
                />
                Kirim sebagai HTML
              </label>
            </div>
            {useHtml ? (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                disabled={isSending}
                rows={7}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
              />
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSending}
                rows={7}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSending}
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSend()}
            disabled={isSending || isLoadingUsers || !allEmailOptions.length}
          >
            {isSending ? "Mengirim..." : "Kirim Email"}
          </Button>
        </div>
      </div>
    </div>
  );
};
