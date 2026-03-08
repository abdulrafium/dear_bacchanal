# Dear Bacchanal

Dear Bacchanal is a premium web platform designed for creating and customizing commemorative digital and physical books. It provides a unique, interactive experience for users to capture and preserve memories with high-quality design and seamless integration of multimedia elements.

## 🚀 Key Features

### 🎨 Creative Customization
- **Interactive Editor**: A powerful drag-and-drop editor built with **React-Konva** for designing book layouts.
- **Dynamic Templates**: Pre-designed templates to help users get started quickly.
- **Rich Assets**: A library of stickers and design elements to personalize creations.
- **Custom Templates**: Capability for admins to create and manage professional templates.

### 💼 Admin Management
- **Robust Dashboard**: Manage users, orders, and site analytics from a central hub.
- **Template Builder**: Tools for administrators to design and deploy new book templates.
- **Sticker Management**: Easy upload and categorization of decorative assets.
- **Promo System**: Create and manage discount codes for marketing campaigns.

### 💳 Order & Payment Integration
- **Flexible Order Types**: Support for both digital copies and physical high-quality prints.
- **Stripe Integration**: Secure payment processing for global transactions.
- **Order Tracking**: Comprehensive management system to track order status from placement to fulfillment.

### 📸 Content Management
- **Media Uploads**: Powered by **UploadThing** for fast and reliable image handling.
- **Document Generation**: Export designs to PDF or high-resolution images using **jsPDF** and **html2canvas**.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [GSAP](https://greensock.com/gsap/), [Lenis](https://lenis.darkroom.engineering/) (Smooth Scrolling)
- **Canvas Engine**: [Konva.js](https://konva.js.org/) / [React-Konva](https://github.com/konvajs/react-konva)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Payments**: [Stripe](https://stripe.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Stripe Account
- UploadThing API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aamir-786/Dear-bacchanal.git
   cd Dear-bacchanal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your credentials (refer to `.env` if available for keys).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License

This project is private and proprietary. All rights reserved.
