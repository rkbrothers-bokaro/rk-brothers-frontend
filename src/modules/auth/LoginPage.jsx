import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, Truck } from "lucide-react";
import { useAuth } from "../../core/hooks/useAuth";
import Input from "../../core/components/Input";
import Button from "../../core/components/Button";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === "en" ? "hi" : "en");
  }

  function validate() {
    const nextErrors = {};
    if (!phone.trim()) nextErrors.phone = t("common.required");
    if (!password.trim()) nextErrors.password = t("common.required");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(phone, password);
      navigate("/dashboard", { replace: true });
    } catch {
      // axios interceptor already surfaces a global error toast
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          aria-label={t("common.changeLanguage")}
        >
          <Globe className="h-4 w-4" />
          {i18n.language === "en" ? "हिं" : "EN"}
        </button>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
            <Truck className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900">{t("auth.appName")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("auth.loginSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label={t("auth.phoneNumber")}
            type="tel"
            autoComplete="tel"
            placeholder={t("auth.phoneNumberPlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            disabled={isSubmitting}
          />
          <Input
            label={t("auth.password")}
            type="password"
            autoComplete="current-password"
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={isSubmitting}
          />

          <Button type="submit" className="mt-2 w-full" loading={isSubmitting}>
            {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
          </Button>
        </form>
      </div>
    </div>
  );
}
