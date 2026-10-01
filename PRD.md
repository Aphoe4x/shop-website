# Product Requirements Document (PRD)

## Product concept
Shopping is a small e-commerce storefront for a Nigerian boutique business. The shop sells everyday products with a local aesthetic and supports direct checkout for customers.

## Goals
- Showcase products clearly and attractively.
- Let customers add products to a cart and complete checkout.
- Support Google-based sign-in and persistent account sessions.
- Save orders in Supabase so customers can revisit and see their history.
- Send a confirmation email after checkout using Mailgun.

## User stories
1. A shopper can browse product cards and view details.
2. A shopper can add items to the cart and adjust quantities.
3. A shopper can check out with shipping details and complete an order.
4. A shopper can sign in with Google and remain signed in after a page refresh or browser restart.
5. A shopper can view prior orders tied to their email.
6. A shopper can log out and sign in again without losing previous order history.

## Functional requirements
- Product catalog served from Supabase.
- Cart persists in browser localStorage.
- Auth state persists in browser localStorage.
- Orders are stored in Supabase with order items.
- Customer receives a formatted confirmation email after order creation.
- Deployment environment variables are required for Supabase, Mailgun, and Google OAuth.

## Phases
1. Product and shop UI
2. Cart and checkout flow
3. Google authentication
4. Supabase database schema and order persistence
5. Mailgun email confirmation
6. Production config and deployment validation

## Non-goals for this phase
- Full payment integration is optional and not required for the lesson.
- Advanced admin dashboard is out of scope.
- Full multi-vendor marketplace functionality is not required.
