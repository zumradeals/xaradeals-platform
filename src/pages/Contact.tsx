import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold">Contactez-nous</h1>
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
                <p className="text-sm text-muted-foreground">+228 XX XX XX XX</p>
              </CardContent>
            </Card>
            <Card className="card-shadow text-center">
              <CardContent className="pt-6">
                <MapPin className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">Adresse</p>
                <p className="text-sm text-muted-foreground">Lomé, Togo</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
