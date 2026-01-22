import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'km';

interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Header
    'header.cart': 'Cart',
    'header.orders': 'Order History',
    'header.admin': 'Admin Panel',
    'header.login': 'Login',
    'header.signOut': 'Sign Out',
    
    // Homepage
    'home.featuredGames': 'Featured Games',
    'home.featuredGamesSubtitle': 'Most popular top-up choices',
    'home.allGames': 'All Games',
    'home.allGamesSubtitle': 'Browse our complete collection',
    'home.searchGames': 'Search games...',
    'home.foundGames': 'Found {count} game(s)',
    'home.noGamesFound': 'No games found matching',
    
    // Topup Page
    'topup.enterGameId': 'Enter Game ID',
    'topup.verify': 'Verify',
    'topup.verifying': 'Verifying...',
    'topup.verified': 'Verified',
    'topup.selectPackage': 'Select Package',
    'topup.paymentMethod': 'Payment Method',
    'topup.wallet': 'Wallet Balance',
    'topup.khqr': 'KHQR Payment',
    'topup.payNow': 'Pay Now',
    'topup.addToCart': 'Add to Cart',
    'topup.processing': 'Processing...',
    'topup.termsAgreement': 'I agree to the terms and conditions',
    'topup.back': 'Back',
    'topup.playerId': 'Player ID',
    'topup.serverId': 'Server ID',
    'topup.playerIdPlaceholder': 'Enter your Player ID',
    'topup.serverIdPlaceholder': 'Enter your Server ID',
    'topup.verifyFirst': 'Please verify your game ID first',
    'topup.selectPackageFirst': 'Please select a package',
    'topup.agreeTerms': 'Please agree to the terms',
    'topup.insufficientBalance': 'Insufficient wallet balance',
    'topup.loginRequired': 'Please login to use wallet payment',
    
    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyMessage': 'Add some games to get started!',
    'cart.backHome': 'Back to Home',
    'cart.orderSummary': 'Order Summary',
    'cart.total': 'Total',
    'cart.proceedCheckout': 'Proceed to Checkout',
    'cart.items': 'items',
    'cart.remove': 'Remove',
    
    // Checkout
    'checkout.title': 'Checkout',
    'checkout.paymentMethod': 'Payment Method',
    'checkout.processing': 'Processing your order...',
    'checkout.scanQR': 'Scan QR to Pay',
    'checkout.orderComplete': 'Order Complete!',
    'checkout.thankYou': 'Thank you for your purchase',
    'checkout.viewInvoice': 'View Invoice',
    
    // Orders
    'orders.title': 'Order History',
    'orders.noOrders': 'No orders yet',
    'orders.noOrdersMessage': 'Your order history will appear here',
    'orders.viewDetails': 'View Details',
    'orders.status.pending': 'Pending',
    'orders.status.paid': 'Paid',
    'orders.status.failed': 'Failed',
    'orders.status.processing': 'Processing',
    'orders.status.completed': 'Completed',
    
    // Invoice
    'invoice.title': 'Invoice',
    'invoice.orderId': 'Order ID',
    'invoice.date': 'Date',
    'invoice.status': 'Status',
    'invoice.game': 'Game',
    'invoice.package': 'Package',
    'invoice.playerId': 'Player ID',
    'invoice.amount': 'Amount',
    'invoice.print': 'Print',
    'invoice.backHome': 'Back to Home',
    
    // Wallet
    'wallet.title': 'My Wallet',
    'wallet.balance': 'Current Balance',
    'wallet.topup': 'Top Up',
    'wallet.quickAmounts': 'Quick Amounts',
    'wallet.customAmount': 'Custom Amount',
    'wallet.enterAmount': 'Enter amount',
    'wallet.transactions': 'Transaction History',
    'wallet.noTransactions': 'No transactions yet',
    'wallet.type.topup': 'Top Up',
    'wallet.type.purchase': 'Purchase',
    'wallet.type.refund': 'Refund',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.displayName': 'Display Name',
    'profile.email': 'Email',
    'profile.memberSince': 'Member Since',
    'profile.edit': 'Edit',
    'profile.save': 'Save',
    'profile.cancel': 'Cancel',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.signInWith': 'Sign in with',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.refresh': 'Refresh',
    
    // Footer
    'footer.copyright': 'All rights reserved',
    'footer.poweredBy': 'Powered by',
  },
  km: {
    // Header
    'header.cart': 'កន្ត្រក',
    'header.orders': 'ប្រវត្តិការបញ្ជាទិញ',
    'header.admin': 'គ្រប់គ្រង',
    'header.login': 'ចូលគណនី',
    'header.signOut': 'ចាកចេញ',
    
    // Homepage
    'home.featuredGames': 'ហ្គេមពេញនិយម',
    'home.featuredGamesSubtitle': 'ជម្រើសបញ្ចូលទឹកប្រាក់ពេញនិយមបំផុត',
    'home.allGames': 'ហ្គេមទាំងអស់',
    'home.allGamesSubtitle': 'រកមើលបណ្តុំពេញលេញរបស់យើង',
    'home.searchGames': 'ស្វែងរកហ្គេម...',
    'home.foundGames': 'រកឃើញ {count} ហ្គេម',
    'home.noGamesFound': 'រកមិនឃើញហ្គេមដែលត្រូវគ្នា',
    
    // Topup Page
    'topup.enterGameId': 'បញ្ចូល Game ID',
    'topup.verify': 'ផ្ទៀងផ្ទាត់',
    'topup.verifying': 'កំពុងផ្ទៀងផ្ទាត់...',
    'topup.verified': 'បានផ្ទៀងផ្ទាត់',
    'topup.selectPackage': 'ជ្រើសរើសកញ្ចប់',
    'topup.paymentMethod': 'វិធីបង់ប្រាក់',
    'topup.wallet': 'សមតុល្យកាបូប',
    'topup.khqr': 'ការទូទាត់ KHQR',
    'topup.payNow': 'បង់ប្រាក់ឥឡូវ',
    'topup.addToCart': 'បន្ថែមទៅកន្ត្រក',
    'topup.processing': 'កំពុងដំណើរការ...',
    'topup.termsAgreement': 'ខ្ញុំយល់ព្រមលើលក្ខខណ្ឌ',
    'topup.back': 'ត្រឡប់ក្រោយ',
    'topup.playerId': 'លេខសម្គាល់អ្នកលេង',
    'topup.serverId': 'លេខសម្គាល់ម៉ាស៊ីនមេ',
    'topup.playerIdPlaceholder': 'បញ្ចូលលេខសម្គាល់អ្នកលេង',
    'topup.serverIdPlaceholder': 'បញ្ចូលលេខសម្គាល់ម៉ាស៊ីនមេ',
    'topup.verifyFirst': 'សូមផ្ទៀងផ្ទាត់ Game ID របស់អ្នកជាមុន',
    'topup.selectPackageFirst': 'សូមជ្រើសរើសកញ្ចប់',
    'topup.agreeTerms': 'សូមយល់ព្រមលើលក្ខខណ្ឌ',
    'topup.insufficientBalance': 'សមតុល្យកាបូបមិនគ្រប់គ្រាន់',
    'topup.loginRequired': 'សូមចូលគណនីដើម្បីប្រើការទូទាត់តាមកាបូប',
    
    // Cart
    'cart.title': 'កន្ត្រករបស់អ្នក',
    'cart.empty': 'កន្ត្រករបស់អ្នកទទេ',
    'cart.emptyMessage': 'បន្ថែមហ្គេមខ្លះដើម្បីចាប់ផ្តើម!',
    'cart.backHome': 'ត្រឡប់ទៅទំព័រដើម',
    'cart.orderSummary': 'សង្ខេបការបញ្ជាទិញ',
    'cart.total': 'សរុប',
    'cart.proceedCheckout': 'បន្តទៅការទូទាត់',
    'cart.items': 'ធាតុ',
    'cart.remove': 'លុប',
    
    // Checkout
    'checkout.title': 'ការទូទាត់',
    'checkout.paymentMethod': 'វិធីបង់ប្រាក់',
    'checkout.processing': 'កំពុងដំណើរការការបញ្ជាទិញរបស់អ្នក...',
    'checkout.scanQR': 'ស្កេន QR ដើម្បីបង់ប្រាក់',
    'checkout.orderComplete': 'ការបញ្ជាទិញបានបញ្ចប់!',
    'checkout.thankYou': 'សូមអរគុណសម្រាប់ការទិញរបស់អ្នក',
    'checkout.viewInvoice': 'មើលវិក្កយបត្រ',
    
    // Orders
    'orders.title': 'ប្រវត្តិការបញ្ជាទិញ',
    'orders.noOrders': 'មិនមានការបញ្ជាទិញនៅឡើយ',
    'orders.noOrdersMessage': 'ប្រវត្តិការបញ្ជាទិញរបស់អ្នកនឹងបង្ហាញនៅទីនេះ',
    'orders.viewDetails': 'មើលព័ត៌មានលម្អិត',
    'orders.status.pending': 'រង់ចាំ',
    'orders.status.paid': 'បានបង់ប្រាក់',
    'orders.status.failed': 'បរាជ័យ',
    'orders.status.processing': 'កំពុងដំណើរការ',
    'orders.status.completed': 'បានបញ្ចប់',
    
    // Invoice
    'invoice.title': 'វិក្កយបត្រ',
    'invoice.orderId': 'លេខបញ្ជាទិញ',
    'invoice.date': 'កាលបរិច្ឆេទ',
    'invoice.status': 'ស្ថានភាព',
    'invoice.game': 'ហ្គេម',
    'invoice.package': 'កញ្ចប់',
    'invoice.playerId': 'លេខសម្គាល់អ្នកលេង',
    'invoice.amount': 'ចំនួនទឹកប្រាក់',
    'invoice.print': 'បោះពុម្ព',
    'invoice.backHome': 'ត្រឡប់ទៅទំព័រដើម',
    
    // Wallet
    'wallet.title': 'កាបូបរបស់ខ្ញុំ',
    'wallet.balance': 'សមតុល្យបច្ចុប្បន្ន',
    'wallet.topup': 'បញ្ចូលទឹកប្រាក់',
    'wallet.quickAmounts': 'ចំនួនរហ័ស',
    'wallet.customAmount': 'ចំនួនផ្សេងទៀត',
    'wallet.enterAmount': 'បញ្ចូលចំនួន',
    'wallet.transactions': 'ប្រវត្តិប្រតិបត្តិការ',
    'wallet.noTransactions': 'មិនមានប្រតិបត្តិការនៅឡើយ',
    'wallet.type.topup': 'បញ្ចូលទឹកប្រាក់',
    'wallet.type.purchase': 'ការទិញ',
    'wallet.type.refund': 'សងប្រាក់វិញ',
    
    // Profile
    'profile.title': 'គណនីរបស់ខ្ញុំ',
    'profile.displayName': 'ឈ្មោះបង្ហាញ',
    'profile.email': 'អ៊ីមែល',
    'profile.memberSince': 'សមាជិកតាំងពី',
    'profile.edit': 'កែសម្រួល',
    'profile.save': 'រក្សាទុក',
    'profile.cancel': 'បោះបង់',
    
    // Auth
    'auth.login': 'ចូលគណនី',
    'auth.signup': 'ចុះឈ្មោះ',
    'auth.email': 'អ៊ីមែល',
    'auth.password': 'ពាក្យសម្ងាត់',
    'auth.confirmPassword': 'បញ្ជាក់ពាក្យសម្ងាត់',
    'auth.forgotPassword': 'ភ្លេចពាក្យសម្ងាត់?',
    'auth.noAccount': 'មិនមានគណនី?',
    'auth.haveAccount': 'មានគណនីរួចហើយ?',
    'auth.signInWith': 'ចូលដោយប្រើ',
    
    // Common
    'common.loading': 'កំពុងផ្ទុក...',
    'common.error': 'កំហុស',
    'common.success': 'ជោគជ័យ',
    'common.cancel': 'បោះបង់',
    'common.confirm': 'បញ្ជាក់',
    'common.save': 'រក្សាទុក',
    'common.delete': 'លុប',
    'common.edit': 'កែសម្រួល',
    'common.back': 'ត្រឡប់ក្រោយ',
    'common.next': 'បន្ទាប់',
    'common.submit': 'ដាក់ស្នើ',
    'common.refresh': 'ផ្ទុកឡើងវិញ',
    
    // Footer
    'footer.copyright': 'រក្សាសិទ្ធិគ្រប់យ៉ាង',
    'footer.poweredBy': 'ដំណើរការដោយ',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'km';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
