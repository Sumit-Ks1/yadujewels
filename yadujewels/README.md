# YaduJewels - Next.js E-Commerce Platform

A luxury jewelry e-commerce platform built with Next.js 14, Supabase, and TailwindCSS.

## Features

- 🛒 **Full E-Commerce Functionality**
  - Product catalog with filtering and search
  - Shopping cart with local storage persistence
  - Wishlist functionality
  - Secure checkout process

- 🔐 **Authentication & Authorization**
  - Supabase Auth integration
  - Role-based access control (Admin/User)
  - Protected admin routes

- 📦 **Product Management**
  - CRUD operations for products, categories, and collections
  - Image optimization with Next.js Image component
  - Stock management with atomic operations (race condition prevention)

- 🎨 **Modern UI/UX**
  - Luxury dark theme with gold accents
  - Responsive design
  - Framer Motion animations
  - shadcn/ui components

- ⚡ **Performance Optimized**
  - Server-Side Rendering for SEO
  - Image optimization
  - Client-side caching with TanStack Query

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with SSR
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** React Context + TanStack Query
- **Animations:** Framer Motion
- **TypeScript:** Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/yadujewels.git
   cd yadujewels
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── auth/              # Authentication page
│   ├── checkout/          # Checkout page
│   ├── collections/       # Collections page
│   ├── product/[id]/      # Product detail (SSR)
│   ├── shop/              # Shop page with filters
│   └── ...
├── components/
│   ├── home/              # Homepage sections
│   ├── layout/            # Header, Footer, CartDrawer
│   ├── product/           # Product components
│   └── ui/                # shadcn/ui components
├── contexts/              # React Context providers
├── hooks/                 # Custom hooks (TanStack Query)
└── lib/
    ├── supabase/          # Supabase client configuration
    ├── stock-management.ts # Atomic stock operations
    └── utils.ts           # Utility functions
```

## Database Schema

The project uses the following main tables:
- `profiles` - User profiles
- `user_roles` - Role-based access control
- `products` - Product catalog
- `categories` - Product categories
- `collections` - Product collections
- `orders` - Customer orders
- `order_items` - Order line items
- `cart_items` - Shopping cart (optional)
- `wishlists` - User wishlists

### Atomic Stock Management

The project includes a PostgreSQL function `decrement_stock` that uses row-level locking to prevent race conditions during checkout:

```sql
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS boolean AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock INTO current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;
  
  IF current_stock >= p_quantity THEN
    UPDATE products
    SET stock = stock - p_quantity
    WHERE id = p_product_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## License

MIT License - See LICENSE file for details.
