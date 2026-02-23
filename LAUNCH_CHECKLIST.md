# Compra Junto Formosa - Launch Readiness Checklist

This checklist ensures the platform is ready for production use in Formosa, Brazil.

## 🚀 Priority 1: Core Functionality
- [ ] **Database Connection**: Ensure the production database is connected and schema is synced (`npm run db:push`).
- [ ] **Admin Account**: Verify admin access with `admin@comprajuntoformosa.com`. Change default password (`admin123`) immediately after first login.
- [ ] **Product Catalog**: Upload at least 10-15 initial products with high-quality images and clear descriptions.
- [ ] **Categories**: Set up the main categories (Supermercado, Eletrônicos, Casa, etc.) in the admin panel.
- [ ] **Pickup Points**: Configure at least one physical pickup point for the "Retirada" option.

## 📱 Priority 2: User Experience & Mobile
- [ ] **Responsive Test**: Verify the app on a physical mobile device (Android/iOS).
- [ ] **Cart Flow**: Complete a full test purchase as a guest and as a registered user.
- [ ] **Fulfillment Logic**: Test both "Entrega" (delivery) and "Retirada" (pickup) logic in the cart.
- [ ] **Image Loading**: Check if all images load quickly on 4G/mobile networks.

## 🇧🇷 Priority 3: Localization & Branding
- [ ] **Language**: Verify all UI strings are in Brazilian Portuguese (PT-BR).
- [ ] **Currency**: Ensure prices are formatted as `R$ 0,00`.
- [ ] **Visual Identity**: Confirm green/yellow branding is consistent across all pages.

## 🔒 Priority 4: Security & Compliance
- [ ] **Environment Variables**: Ensure `DATABASE_URL` and `SESSION_SECRET` are set in production.
- [ ] **SSL/HTTPS**: Ensure the site is served over HTTPS.
- [ ] **Privacy Policy**: (Optional but recommended) Add a basic privacy policy page regarding user data (GDPR/LGPD).

## 📈 Priority 5: Operations & Monitoring
- [ ] **Order Management**: Practice processing an order in the admin dashboard.
- [ ] **WhatsApp Integration**: Test if "Falar com Vendedor" links open correctly on mobile.
- [ ] **Logs**: Set up a process to check application logs for errors.

---
*Created by Replit Agent - Feb 2026*
