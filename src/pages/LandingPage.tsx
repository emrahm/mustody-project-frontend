import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield, Zap, Lock, TrendingUp, Users, Key } from "lucide-react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    } else {
      setLocation('/register');
    }
  };

  const handleSignIn = () => {
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">Mustody</div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Button onClick={() => setLocation('/dashboard')}>Dashboard</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSignIn}>Giriş Yap</Button>
                <Button onClick={handleGetStarted}>Başlayın</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Kurumsal Seviye Kripto Saklama
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Güvenli, ölçeklenebilir ve zarif çoklu kiracılı platform. 
              Kurumlar, finans kuruluşları ve kripto platformları için mükemmel.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="btn-primary" onClick={handleGetStarted}>
                Ücretsiz Deneyin
              </Button>
              <Button variant="outline">Demo İzleyin</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Güçlü Özellikler
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Çoklu Kiracı Mimarisi",
                description: "Her kiracı için tam veri izolasyonu ve kurumsal seviye şifreleme.",
              },
              {
                icon: Lock,
                title: "Çift Kimlik Doğrulama",
                description: "Frontend kullanıcıları için JWT ve backend API tüketicileri için HMAC-SHA256.",
              },
              {
                icon: Zap,
                title: "Yıldırım Hızı",
                description: "Önbellekleme, indeksleme ve verimli veritabanı sorguları ile optimize edilmiş performans.",
              },
              {
                icon: TrendingUp,
                title: "Gerçek Zamanlı Analitik",
                description: "Cüzdanları, işlemleri ve performans metriklerini gerçek zamanlı takip edin.",
              },
              {
                icon: Users,
                title: "Rol Tabanlı Erişim",
                description: "Hassas izinler: Admin, Kiracı Admin, Kullanıcı ve API Kullanıcı rolleri.",
              },
              {
                icon: Key,
                title: "API Yönetimi",
                description: "Entegrasyonlar için HMAC kimlik doğrulaması ile API anahtarları oluşturun ve yönetin.",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="p-8 text-center hover:shadow-lg transition-shadow">
                <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Başlamaya Hazır mısınız?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Güvenli kripto saklama için Mustody kullanan yüzlerce şirkete katılın.
          </p>
          <Button
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={handleGetStarted}
          >
            Ücretsiz Denemenizi Bugün Başlatın
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Mustody. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
