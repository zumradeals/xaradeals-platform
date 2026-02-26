import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { useSitePage } from "@/hooks/use-site-page";

export default function Contact() {
  const { page } = useSitePage("contact");
  const title = page?.seo_title || page?.title || "Contact — XaraDeals";
  const description = page?.seo_description || "Contactez XaraDeals par email, WhatsApp ou rendez-vous à Abidjan. Support disponible 7j/7.";

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://xaradeals.com/contact" />
      </Helmet>
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">{page?.title || "Contactez-nous"}</h1>
          {page?.content && (
            <p className="mb-6 text-muted-foreground">{page.content}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="card-shadow text-center">
              <CardContent className="pt-6">
                <Mail className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">support@xaradeals.com</p>
              </CardContent>
            </Card>
            <Card className="card-shadow text-center">
              <CardContent className="pt-6">
                <Phone className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">+225 0718713781</p>
              </CardContent>
            </Card>
            <Card className="card-shadow text-center">
              <CardContent className="pt-6">
                <MapPin className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">Adresse</p>
                <p className="text-sm text-muted-foreground">Abidjan, Côte d'Ivoire</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
