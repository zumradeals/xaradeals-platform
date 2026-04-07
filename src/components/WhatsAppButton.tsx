import { MessageCircle, Users } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function WhatsAppButton() {
  const { data: settings } = useSiteSettings();

  const number = settings?.whatsapp_direct_number || "2250718713781";
  const groupUrl = settings?.whatsapp_group_url || "";
  const chatUrl = `https://wa.me/${number}?text=${encodeURIComponent("Bonjour, j'ai une question sur XaraDeals !")}`;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3 md:bottom-6 md:right-6">
      {groupUrl && (
        <a
          href={groupUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Rejoindre le groupe WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-primary-foreground shadow-lg transition-transform hover:scale-110"
        >
          <Users className="h-6 w-6" />
        </a>
      )}
      <a
        href={chatUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter sur WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-primary-foreground shadow-lg transition-transform hover:scale-110"
      >
        <MessageCircle className="h-7 w-7" fill="white" strokeWidth={0} />
      </a>
    </div>
  );
}
