export type Language = 'en' | 'si' | 'tanglish';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'header.newChat': 'New Chat',
    'header.darkMode': 'Toggle dark mode',

    // Chat input
    'input.placeholder': 'What are you looking for?',
    'input.gift': 'Gift',
    'input.track': 'Track',
    'input.browse': 'Browse',
    'input.cart': 'Cart',
    'input.giftOn': 'Gift ON',

    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.startShopping': 'Start shopping to add items!',
    'cart.checkout': 'Checkout',
    'cart.continue': 'Continue Shopping',
    'cart.total': 'Total',
    'cart.quantity': 'Qty',
    'cart.remove': 'Remove',

    // Welcome screen
    'welcome.greeting': 'Hi! I\'m KASA',
    'welcome.subtitle': 'Your personal shopping companion on Kapruka',

    // Quick replies
    'quick.browseCategories': 'Browse categories',
    'quick.trackOrder': 'Track my order',
    'quick.showSale': 'Show me sale items',
    'quick.giftIdeas': 'Gift ideas under Rs. 3,000',

    // Delivery
    'delivery.availableDate': 'Available on',
    'delivery.fee': 'Delivery fee',
    'delivery.sameDayBy': 'Same-day by',
    'delivery.notAvailable': 'Not available for delivery',

    // Checkout
    'checkout.recipient': 'Recipient Details',
    'checkout.sender': 'Sender Details',
    'checkout.name': 'Full Name',
    'checkout.phone': 'Phone Number',
    'checkout.address': 'Delivery Address',
    'checkout.email': 'Email',
    'checkout.giftMessage': 'Gift Message (Optional)',
    'checkout.submit': 'Place Order',
    'checkout.cancel': 'Cancel',

    // Order
    'order.orderNumber': 'Order #',
    'order.status': 'Status',
    'order.deliveryDate': 'Delivery Date',
    'order.paymentUrl': 'Complete Payment',

    // Errors
    'error.somethingWrong': 'Aiyo! Something went wrong on my end. Make sure an API key is set in .env.local, or just try again — I\'m resilient like that!',
    'error.tryAgain': 'Try again',
  },

  si: {
    // Header
    'header.newChat': 'නව කතාවලාپ',
    'header.darkMode': 'අඳුරු ප්‍රකාරය ටෝගල් කරන්න',

    // Chat input
    'input.placeholder': 'ඔබ සොයන්නේ කුමක්ද?',
    'input.gift': 'තෑගි',
    'input.track': 'ලුහුබදින්න',
    'input.browse': 'බ්‍රවුස් කරන්න',
    'input.cart': 'කරත්තය',
    'input.giftOn': 'තෑගි ඔන්',

    // Cart
    'cart.title': 'ඔබගේ කරත්තය',
    'cart.empty': 'ඔබගේ කරත්තය හිස් ය',
    'cart.startShopping': 'වස්තු එකතු කිරීමට සාප්පු එක්ස්තරට නොමිලේ යන්න!',
    'cart.checkout': 'ගිණුම් ස්ථිතිය පරීක්ෂා කරන්න',
    'cart.continue': 'සාප්පු එක්ස්තර ඉවත දරන්න',
    'cart.total': 'සම්පූර්ණ',
    'cart.quantity': 'ප්‍ර.',
    'cart.remove': 'ඉවත් කරන්න',

    // Welcome screen
    'welcome.greeting': 'ආයුබෝවන්! මම KASA ය',
    'welcome.subtitle': 'Kapruka වල ඔබගේ පෞද්ගලික සාප්පු සহකරු',

    // Quick replies
    'quick.browseCategories': 'ගිණුම් පිළිබඳ අවධානය වන්න',
    'quick.trackOrder': 'මගේ ඇණවුම ලුහුබදින්න',
    'quick.showSale': 'මට විකුණුම් වස්තු පෙන්වන්න',
    'quick.giftIdeas': 'රු. 3,000 ට අඩු තෑගි අදහස්',

    // Delivery
    'delivery.availableDate': 'ඉන්‍රිය පිට දිනට ලබා ගත හැකි ය',
    'delivery.fee': 'බෙදා දීමේ ගාස්තුව',
    'delivery.sameDayBy': 'එම දිනට',
    'delivery.notAvailable': 'බෙදා දීම් සඳහා ලබා ගත නොහැකි ය',

    // Checkout
    'checkout.recipient': 'ලාබිය තොරතුරු',
    'checkout.sender': 'එවන්නා තොරතුරු',
    'checkout.name': 'සම්පූර්ණ නම',
    'checkout.phone': 'දුරකතන අංකය',
    'checkout.address': 'බෙදා දීමේ ලිපිනය',
    'checkout.email': 'විද්‍යුත් තැපෑල',
    'checkout.giftMessage': 'තෑගි පණිවිඩය (තේරීසනීය)',
    'checkout.submit': 'ඇණවුම තබන්න',
    'checkout.cancel': 'අවලංගු කරන්න',

    // Order
    'order.orderNumber': 'ඇණවුම #',
    'order.status': 'තත්ත්වය',
    'order.deliveryDate': 'බෙදා දීමේ දිනය',
    'order.paymentUrl': 'ගිණුම් ඉටු කරන්න',

    // Errors
    'error.somethingWrong': 'අයියෝ! මගේ අසාර‍ය සිටින බව සිතෙනවා. .env.local හි API යතුරක් සකස් කර තිබේ දැයි වග ගන්න, නැතිනම් නැවතත් උත්සාහ කරන්න — මම ඒ සඳහා ඉතා ශක්තිමත්!',
    'error.tryAgain': 'නැවතත් උත්සාහ කරන්න',
  },

  tanglish: {
    // Header
    'header.newChat': 'Puthiya Kathai',
    'header.darkMode': 'Iram Mode Toggle Pannunga',

    // Chat input
    'input.placeholder': 'Enna looking for da?',
    'input.gift': 'Gift',
    'input.track': 'Track',
    'input.browse': 'Browse',
    'input.cart': 'Cart',
    'input.giftOn': 'Gift ON',

    // Cart
    'cart.title': 'Neeya Irukka Sarakku',
    'cart.empty': 'Neeya Irukka Sarakku Illai',
    'cart.startShopping': 'Vangi Kondu Varanum!',
    'cart.checkout': 'Vettu',
    'cart.continue': 'Venduta Shopping Pannu',
    'cart.total': 'Kootu',
    'cart.quantity': 'Ennam',
    'cart.remove': 'Thalai Pannunga',

    // Welcome screen
    'welcome.greeting': 'Vanakkam! Naan KASA!',
    'welcome.subtitle': 'Neeya Kapruka la soranai panna AI buddy!',

    // Quick replies
    'quick.browseCategories': 'Category Browse Pannu',
    'quick.trackOrder': 'Order Track Pannunga',
    'quick.showSale': 'Sale Items Show Pannunga',
    'quick.giftIdeas': 'Rs. 3,000 Kulla Gift Ideas',

    // Delivery
    'delivery.availableDate': 'Antha Natil Kittum',
    'delivery.fee': 'Delivery Charge',
    'delivery.sameDayBy': 'Same Day Kittum',
    'delivery.notAvailable': 'Delivery Illa Thaa',

    // Checkout
    'checkout.recipient': 'Vangi Parakka Padra Details',
    'checkout.sender': 'Vangi Panna Details',
    'checkout.name': 'Full Name Ezhuthuna',
    'checkout.phone': 'Phone Number',
    'checkout.address': 'Vangi Parakka Padam',
    'checkout.email': 'Email',
    'checkout.giftMessage': 'Gift Message (Venam Ezhuthathuma)',
    'checkout.submit': 'Order Ezhuppu',
    'checkout.cancel': 'Cancel Pannunga',

    // Order
    'order.orderNumber': 'Order #',
    'order.status': 'Status',
    'order.deliveryDate': 'Vangi Parakka Naal',
    'order.paymentUrl': 'Payment Complete Pannunga',

    // Errors
    'error.somethingWrong': 'Aiyo! Enaku bug jariga da. API key check pannunga .env.local la, illana retry pannunga — naan konjam tough!',
    'error.tryAgain': 'Retry Pannu',
  },
};

export function t(key: string, language: Language = 'en'): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}
