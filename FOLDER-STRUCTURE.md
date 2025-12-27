##### FOLDER-STRUCTURE.md

ecommerce-nextjs/
├── src/app/
│       ├── (shop)/                                 ### storefront routes
│       │   ├── layout.tsx                          ### shop layout with header/footer
│       │   ├── page.tsx                            ### home page
│       │   ├── products/
│       │   │   ├── page.tsx                        ### product gallery
│       │   │   └── [id]/
│       │   │       └── page.tsx                    ### product detail page
│       │   ├── categories/
│       │   │   └── [slug]/
│       │   │       └── page.tsx                    ### category page
│       │   └── search/
│       │       └── page.tsx                        ### search results
│       │
│       ├── (checkout)/                             ### checkout flow
│       │   ├── layout.tsx                          ### minimal checkout layout
│       │   ├── cart/
│       │   │   └── page.tsx                        ### shopping cart
│       │   └── checkout/
│       │       ├── page.tsx                        ### checkout home (redirect)
│       │       ├── address/
│       │       │   └── page.tsx                    ### step 1: Address selection
│       │       ├── shipping/
│       │       │   └── page.tsx                    ### step 2: Shipping method
│       │       ├── payment/
│       │       │   └── page.tsx                    ### step 3: Payment
│       │       └── confirmation/
│       │           └── page.tsx                    ### order confirmation
│       │
│       ├── (auth)/                                 ### authentication routes
│       │   ├── layout.tsx                          ### auth layout (centered form)
│       │   ├── login/
│       │   │   └── page.tsx                        ### login page
│       │   ├── register/
│       │   │   └── page.tsx                        ### registration page
│       │   └── forgot-password/
│       │       └── page.tsx                        ### password reset
│       │
│       ├── (admin)/                                ### admin dashboard
│       │   ├── layout.tsx                          ### admin layout with sidebar
│       │   └── admin/
│       │       ├── page.tsx                        ###  Dashboard home
│       │       ├── products/
│       │       │   ├── page.tsx                    ### product list
│       │       │   ├── new/
│       │       │   │   └── page.tsx                ### create product
│       │       │   └── [id]/
│       │       │       └── edit/
│       │       │           └── page.tsx            ###  Edit product
│       │       ├── orders/
│       │       │   ├── page.tsx                    ### order list
│       │       │   └── [id]/
│       │       │       └── page.tsx                ### order detail
│       │       ├── customers/
│       │       │   └── page.tsx                    ### customer list
│       │       └── analytics/
│       │           └── page.tsx                    ### sales analytics
│       │
│       ├── account/                                ###  User account (protected)
│       │   ├── layout.tsx                          ### account layout
│       │   ├── page.tsx                            ### account dashboard
│       │   ├── orders/
│       │   │   ├── page.tsx                        ### order history
│       │   │   └── [id]/
│       │   │       └── page.tsx                    ### order detail
│       │   ├── addresses/
│       │   │   └── page.tsx                        ### manage addresses
│       │   └── profile/
│       │       └── page.tsx                        ### edit profile
│       │
│       ├── actions/                                ### server Actions
│       │   ├── auth.ts                             ### auth actions
│       │   ├── products.ts                         ### product CRUD actions
│       │   ├── cart.ts                             ### cart management
│       │   ├── orders.ts                           ### order actions
│       │   └── reviews.ts                          ### review actions
│       │
│       ├── api/                                    ### API routes (if needed)
│       │   ├── webhook/
│       │   │   └── paypal/
│       │   │       └── route.ts                    ### payPal webhook
│       │   └── upload/
│       │       └── route.ts                        ### cloudinary upload
│       │
│       ├── layout.tsx                              ### root layout
│       ├── globals.css                             ###  global styles
│       └── not-found.tsx                           ###  404 page
│
├── src/components/
│       ├── shop/                                   ### storefront components
│       │   ├── Header.tsx
│       │   ├── Footer.tsx
│       │   ├── ProductCard.tsx
│       │   ├── ProductGrid.tsx
│       │   ├── CategoryNav.tsx
│       │   ├── SearchBar.tsx
│       │   └── ReviewSection.tsx
│       │
│       ├── admin/                                  ### admin components
│       │   ├── Sidebar.tsx
│       │   ├── DashboardCard.tsx
│       │   ├── RevenueChart.tsx
│       │   ├── OrderTable.tsx
│       │   └── ProductForm.tsx
│       │
│       ├── checkout/                               ### checkout components
│       │   ├── CartItem.tsx
│       │   ├── AddressForm.tsx
│       │   ├── PaymentForm.tsx
│       │   └── OrderSummary.tsx
│       │
│       └── ui/                                     ### reusable UI components
│           ├── Button.tsx
│           ├── Input.tsx
│           ├── Modal.tsx
│           ├── Dropdown.tsx
│           └── Badge.tsx
│
├── src/lib/
│       ├── db.ts                                   ### mongoDB connection
│       ├── auth.ts                                 ### JWT utilities
│       ├── cloudinary.ts                           ### cloudinary config
│       ├── paypal.ts                               ### payPal SDK
│       └── utils.ts                                ### helper functions
│
├── src/models/
│       ├── User.ts                                 ###  User schema
│       ├── Product.ts                              ### Next: Product schema
│       ├── Order.ts                                ### Next: Order schema
│       ├── Review.ts                               ### Next: Review schema
│       └── Category.ts                             ### Next: Category schema
│
├── src/store/                                      ###  Zustand state management
│       ├── cartStore.ts                            ### shopping cart state
│       └── uiStore.ts                              ### UI state(modals, etc)
│
├── src/types/
│       ├── index.ts                                ### shared TypeScript types
│       └── product.ts                              ### product-specific types
│
├── middleware.ts                                   ### route protection
├── .env.example                                    ### environment template
├── .env.local                                      ### local environment (git-ignored)
├── .gitignore                                      ###  Git ignore rules
├── tailwind.config.ts                              ### tailwind configuration
├── tsconfig.json                                   ### typeScript config
├── next.config.js                                  ### Next.js config
├── package.json                                    ### dependencies
└── README.md                                       ### project documentation