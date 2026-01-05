# Tenant Request Approval Workflow - Frontend Ekranları

Bu dokümanda, backend'de implement edilen tenant request approval workflow için oluşturulan frontend ekranları açıklanmaktadır.

## Mevcut Ekranlar

### 1. TenantRequest.tsx
- **Konum**: `src/pages/TenantRequest.tsx`
- **Amaç**: Kullanıcıların tenant başvurusu yapabilmesi
- **Özellikler**:
  - KYC ve 2FA gereksinim kontrolü
  - Form validasyonu
  - Mevcut başvuru kontrolü
  - Türkçe arayüz

### 2. TenantRequestManagement.tsx
- **Konum**: `src/pages/TenantRequestManagement.tsx`
- **Amaç**: Admin kullanıcıların tenant başvurularını yönetmesi
- **Özellikler**:
  - Başvuru listesi görüntüleme
  - Başvuru detaylarını inceleme
  - Onay/red işlemleri
  - Başvuru düzenleme

## Yeni Eklenen Ekranlar

### 3. TeamInvitationModal.tsx
- **Konum**: `src/components/TeamInvitationModal.tsx`
- **Amaç**: Tenant admin'lerin takım üyesi davet etmesi
- **Özellikler**:
  - E-posta ile davet gönderme
  - Hata yönetimi
  - Türkçe arayüz

### 4. TeamManagement.tsx
- **Konum**: `src/pages/TeamManagement.tsx`
- **Amaç**: Tenant admin'lerin takım üyelerini yönetmesi
- **Özellikler**:
  - Mevcut takım üyelerini listeleme
  - Davet durumlarını görüntüleme
  - Yeni üye davet etme
  - Türkçe arayüz

### 5. TenantWelcome.tsx
- **Konum**: `src/pages/TenantWelcome.tsx`
- **Amaç**: Tenant onaylandıktan sonra hoş geldin sayfası
- **Özellikler**:
  - Organizasyon bilgilerini gösterme
  - Hızlı eylem kartları
  - Sonraki adımlar rehberi
  - Türkçe arayüz

### 6. Badge.tsx
- **Konum**: `src/components/ui/badge.tsx`
- **Amaç**: Durum gösterimi için UI bileşeni
- **Özellikler**:
  - Özelleştirilebilir stil
  - Minimal kod

## Güncellenen Dosyalar

### App.tsx
- TeamManagement ve TenantWelcome route'ları eklendi
- Import'lar güncellendi

### TenantAdminDashboard.tsx
- Team sekmesi eklendi
- Team yönetimine yönlendirme

## Routing Yapısı

```
/tenant-request          -> TenantRequest.tsx
/admin/tenant-requests   -> TenantRequestManagement.tsx
/team                    -> TeamManagement.tsx
/tenant-welcome          -> TenantWelcome.tsx
/invitation/:token       -> InvitationRegister.tsx (mevcut)
```

## Workflow Akışı

1. **Kullanıcı Başvurusu**: `/tenant-request` - Kullanıcı tenant başvurusu yapar
2. **Admin Onayı**: `/admin/tenant-requests` - Admin başvuruyu onaylar
3. **Hoş Geldin**: `/tenant-welcome` - Onaylanan kullanıcı hoş geldin sayfasını görür
4. **Takım Yönetimi**: `/team` - Tenant admin takım üyelerini yönetir
5. **Davet Kabul**: `/invitation/:token` - Davet edilen kullanıcı hesap oluşturur

## Özellikler

- **Türkçe Arayüz**: Tüm yeni ekranlar Türkçe
- **Responsive Tasarım**: Mobil uyumlu
- **Hata Yönetimi**: Kapsamlı hata mesajları
- **Loading States**: Yükleme durumları
- **Form Validasyonu**: Client-side validasyon
- **Minimal Kod**: Sadece gerekli özellikler implement edildi

## Kullanılan Teknolojiler

- React + TypeScript
- Wouter (routing)
- Tailwind CSS
- Lucide React (iconlar)
- Custom UI components

## Backend Entegrasyonu

Tüm ekranlar backend API'leri ile entegre edilmiştir:
- `/tenant-request` - Tenant başvurusu
- `/admin/tenant-requests` - Admin yönetimi
- `/tenant/team-invitation` - Takım daveti
- `/tenant/team-members` - Takım üyeleri
- `/invitation/accept` - Davet kabul
