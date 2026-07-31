import { useEffect, useState } from "react";
import { t } from "../i18n/strings";
import { exportBackup, saveJson } from "../storage/backup";
import { connectRecoveryAccount, createRecoveryCredentials, hasMeaningfulLocalData, refreshRecoveryStatus, renameRecoveryId, resetRecoveryPassword } from "../sync/recovery";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

type Mode = "create" | "connect" | "id" | "password" | null;

export function RecoverySettings() {
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [idInput, setIdInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplacement, setConfirmReplacement] = useState(false);

  useEffect(() => {
    refreshRecoveryStatus().then((status) => setRecoveryId(status.recoveryId)).catch(() => {});
  }, []);

  function resetForm(next: Mode) {
    setMode(next);
    setIdInput(next === "id" ? recoveryId ?? "" : "");
    setPassword("");
    setConfirmation("");
    setError(null);
  }

  async function submit(replaceLocalData = false) {
    if (mode !== "id" && password.length < 8 || password.length > 128) return setError(t.prefs.recovery.passwordLength);
    if ((mode === "create" || mode === "password") && password !== confirmation) return setError(t.prefs.recovery.passwordMismatch);
    setBusy(true);
    setError(null);
    try {
      if (mode === "create") setRecoveryId((await createRecoveryCredentials(idInput, password)).recoveryId);
      if (mode === "id") setRecoveryId((await renameRecoveryId(idInput)).recoveryId);
      if (mode === "password") await resetRecoveryPassword(password);
      if (mode === "connect") {
        if (!replaceLocalData && await hasMeaningfulLocalData()) {
          setConfirmReplacement(true);
          return;
        }
        setRecoveryId((await connectRecoveryAccount(idInput, password, replaceLocalData)).recoveryId);
      }
      setMode(null);
    } catch (cause) {
      const message = String((cause as Error).message);
      setError(mode === "connect" ? t.prefs.recovery.invalidLogin : message.includes("409") ? t.prefs.recovery.unavailable : t.prefs.recovery.invalidId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label={t.prefs.recovery.title}>
      <h2>{t.prefs.recovery.title}</h2>
      {recoveryId ? (
        <div>
          <Button onClick={() => navigator.clipboard.writeText(recoveryId)} ariaLabel={t.prefs.recovery.copy}>{recoveryId}</Button>{" "}
          <Button onClick={() => resetForm("id")}>{t.prefs.recovery.changeId}</Button>{" "}
          <Button onClick={() => resetForm("password")}>{t.prefs.recovery.changePassword}</Button>
        </div>
      ) : (
        <div>
          <Button onClick={() => resetForm("create")}>{t.prefs.recovery.create}</Button>{" "}
          <Button onClick={() => resetForm("connect")}>{t.prefs.recovery.connect}</Button>
        </div>
      )}

      {mode ? (
        <Modal title={mode === "connect" ? t.prefs.recovery.connect : mode === "password" ? t.prefs.recovery.changePassword : mode === "id" ? t.prefs.recovery.changeId : t.prefs.recovery.create} onClose={() => setMode(null)} ariaLabel={t.prefs.recovery.title} closeLabel={t.common.close}>
          {mode !== "password" ? <label>{t.prefs.recovery.recoveryId}<input value={idInput} onChange={(event) => setIdInput(event.target.value.toLowerCase())} autoCapitalize="none" autoComplete="username" /></label> : null}
          {mode !== "id" ? <label>{t.prefs.recovery.password}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "connect" ? "current-password" : "new-password"} /></label> : null}
          {mode === "create" || mode === "password" ? <label>{t.prefs.recovery.confirmPassword}<input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /></label> : null}
          {error ? <p role="alert">{error}</p> : null}
          <Button onClick={() => submit()} disabled={busy} aria-busy={busy}>{busy ? t.prefs.recovery.busy : t.prefs.recovery.save}</Button>
        </Modal>
      ) : null}

      {confirmReplacement ? (
        <Modal title={t.prefs.recovery.replacementTitle} onClose={() => setConfirmReplacement(false)} ariaLabel={t.prefs.recovery.replacementTitle} closeLabel={t.common.close}>
          <p>{t.prefs.recovery.replacementWarning}</p>
          <Button onClick={async () => { const backup = await exportBackup(); await saveJson(`pr-calc-backup-${backup.exportedAt.slice(0, 10)}.json`, backup); }}>{t.prefs.recovery.exportFirst}</Button>{" "}
          <Button variant="danger" onClick={() => { setConfirmReplacement(false); submit(true); }}>{t.prefs.recovery.replace}</Button>{" "}
          <Button onClick={() => { setConfirmReplacement(false); setMode(null); }}>{t.prefs.recovery.cancel}</Button>
        </Modal>
      ) : null}
    </section>
  );
}
