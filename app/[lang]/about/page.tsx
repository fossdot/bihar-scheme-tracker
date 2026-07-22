import type { Metadata } from "next";
import { EvidenceArt } from "@/components/EvidenceArt";
import { Card } from "@/components/ui";
import { altLinks } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: locale === "hi" ? "डेटा के बारे में" : "About the data",
    description:
      locale === "hi"
        ? "बिहार एजुकेशन मनी कैसे प्रमाण से व्यय का पीछा करता है, हर आँकड़े का स्रोत देता है, और जो सत्यापित नहीं वह कभी दावा नहीं करता।"
        : "How Bihar Education Money traces spending from evidence, sources every figure, and never asserts what it can’t verify.",
    alternates: altLinks(locale, "/about"),
  };
}

export default function AboutPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);
  const L = (en: string, hi: string) => (locale === "hi" ? hi : en);

  return (
    <div className="space-y-6">
      <section className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center md:gap-5">
        <EvidenceArt className="h-auto w-[132px] shrink-0 text-ink" />
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {L("About the data", "डेटा के बारे में")}
          </h1>
          <p className="text-sm text-muted">
            {L(
              "How this project decides what's true — and what it won't claim.",
              "यह परियोजना कैसे तय करती है कि क्या सत्य है — और क्या यह दावा नहीं करेगी।"
            )}
          </p>
        </div>
      </section>

      <Card icon="info" title={L("What this is", "यह क्या है")}>
        <p className="text-sm text-ink">
          {L(
            "An accountability tracker for Bihar’s education money — following every rupee from what the state released, to what it can be shown to have actually spent, with the evidence behind each figure. It also carries a citizen scheme finder: tell it who you are and see the education support you likely qualify for.",
            "बिहार के शिक्षा-धन का जवाबदेही ट्रैकर — हर रुपये का पीछा, जो राज्य ने जारी किया से लेकर जो वह वास्तव में ख़र्च करना सिद्ध कर सके तक, हर आँकड़े के प्रमाण सहित। साथ ही एक नागरिक योजना-खोज: बताइए आप कौन हैं और देखिए किस शिक्षा-सहायता के आप पात्र हैं।"
          )}
        </p>
      </Card>

      <Card icon="check" title={L("How we decide status", "हम स्थिति कैसे तय करते हैं")}>
        <p className="text-sm text-ink">
          {L(
            "Governments rarely announce that a scheme has ended — it just loses its budget line or is folded into a successor. So status is DERIVED from evidence (budget allocations, notifications, live portals), never asserted from memory. Each scheme records exactly what was checked.",
            "सरकारें शायद ही घोषणा करती हैं कि कोई योजना समाप्त हो गई — वह बस अपनी बजट-पंक्ति खो देती है या किसी उत्तराधिकारी में समाहित हो जाती है। इसलिए स्थिति प्रमाण से निकाली जाती है (बजट आवंटन, अधिसूचनाएँ, सक्रिय पोर्टल), स्मृति से दावा नहीं की जाती। हर योजना दर्ज करती है कि क्या जाँचा गया।"
          )}
        </p>
        <ul className="mt-3 space-y-2 text-sm text-ink">
          <Bucket dot="bg-brand" label={L("Active / Likely active", "सक्रिय / संभवतः सक्रिय")}>
            {L(
              "Current budget line or a live application portal.",
              "वर्तमान बजट-पंक्ति या सक्रिय आवेदन पोर्टल।"
            )}
          </Bucket>
          <Bucket dot="bg-warn" label={L("Possibly active", "संभवतः सक्रिय")}>
            {L(
              "Dormant or unverified — shown by default. Incomplete data must never deny someone live help.",
              "निष्क्रिय या असत्यापित — डिफ़ॉल्ट रूप से दिखाया गया। अधूरा डेटा किसी को सक्रिय सहायता से वंचित न करे।"
            )}
          </Bucket>
          <Bucket dot="bg-muted" label={L("Inactive", "निष्क्रिय")}>
            {L(
              "Lapsed, superseded or subsumed — hidden by default; opt in to see them.",
              "समाप्त, अधिक्रमित या समाहित — डिफ़ॉल्ट रूप से छिपा; देखने हेतु चुनें।"
            )}
          </Bucket>
        </ul>
      </Card>

      <Card icon="doc" title={L("Provenance & RTI", "स्रोत व सूचना का अधिकार")}>
        <p className="text-sm text-ink">
          {L(
            "Every figure carries its source. Budget and beneficiary headlines for major schemes are often public. Granular data — district-wise distribution, demographics — usually isn't, and is obtained via Right to Information (RTI). Where nothing is published we show the data request itself (\"RTI needed\") rather than a guess. No figure is ever fabricated.",
            "हर आँकड़ा अपना स्रोत रखता है। प्रमुख योजनाओं के बजट व लाभार्थी आँकड़े अक्सर सार्वजनिक होते हैं। सूक्ष्म डेटा — ज़िलेवार वितरण, जनसांख्यिकी — सामान्यतः नहीं, और सूचना के अधिकार (RTI) से प्राप्त होता है। जहाँ कुछ प्रकाशित नहीं, वहाँ हम अनुमान के बजाय डेटा-अनुरोध ही दिखाते हैं (\"RTI आवश्यक\")। कोई आँकड़ा कभी गढ़ा नहीं जाता।"
          )}
        </p>
      </Card>

      <Card icon="building" title={L("Primary sources", "मुख्य स्रोत")}>
        <ul className="space-y-1.5 text-sm">
          {[
            ["CAG — Bihar State Finances & audit reports", "https://cag.gov.in/ag/bihar/en/audit-report"],
            ["UDISE+ — school statistics dashboard", "https://dashboard.udiseplus.gov.in"],
            ["budget.bihar.gov.in — scheme-wise allocations", "https://budget.bihar.gov.in"],
            ["prsindia.org — Bihar budget analyses", "https://prsindia.org/budgets/states"],
            ["myscheme.gov.in (Bihar) — scheme finder", "https://www.myscheme.gov.in/search/state/Bihar"],
            ["medhasoft.bihar.gov.in — scholarships", "https://medhasoft.bihar.gov.in"],
          ].map(([label, url]) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-strong underline underline-offset-2"
              >
                {label} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          {L(
            "Reported figures (e.g. from news) are flagged for cross-check against the official budget/notification before being treated as confirmed.",
            "रिपोर्टेड आँकड़े (जैसे समाचार से) पुष्टि से पूर्व आधिकारिक बजट/अधिसूचना से मिलान हेतु चिह्नित किए जाते हैं।"
          )}
        </p>
      </Card>
    </div>
  );
}

function Bucket({
  dot,
  label,
  children,
}: {
  dot: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      <span>
        <span className="font-medium text-ink">{label}</span>
        <span className="text-muted"> — {children}</span>
      </span>
    </li>
  );
}
