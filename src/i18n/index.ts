import type { Locale } from '../config';
export type { Locale };

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.about': 'About Us',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'hero.title': 'Premium Industrial Solutions for Global Markets',
    'hero.subtitle': 'ISO 9001 Certified | Custom OEM/ODM | 15+ Years Experience',
    'hero.cta': 'Request a Quote',
    'hero.cta_secondary': 'View Products',
    'products.title': 'Our Products',
    'products.view_all': 'View All Products',
    'news.title': 'Latest News',
    'news.read_more': 'Read More',
    'contact.title': 'Get in Touch',
    'contact.name': 'Your Name',
    'contact.email': 'Email Address',
    'contact.company': 'Company Name',
    'contact.message': 'Message',
    'contact.submit': 'Send Inquiry',
    'contact.success': 'Thank you! We will reply within 24 hours.',
    'footer.rights': 'All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
  },
  zh: {
    'nav.home': '首页',
    'nav.products': '产品中心',
    'nav.about': '关于我们',
    'nav.news': '新闻动态',
    'nav.contact': '联系我们',
    'hero.title': '面向全球市场的优质工业解决方案',
    'hero.subtitle': 'ISO 9001 认证 | 定制 OEM/ODM | 15年以上经验',
    'hero.cta': '获取报价',
    'hero.cta_secondary': '查看产品',
    'products.title': '产品中心',
    'products.view_all': '查看全部产品',
    'news.title': '最新动态',
    'news.read_more': '阅读更多',
    'contact.title': '联系我们',
    'contact.name': '您的姓名',
    'contact.email': '电子邮箱',
    'contact.company': '公司名称',
    'contact.message': '留言内容',
    'contact.submit': '发送询盘',
    'contact.success': '感谢您的咨询！我们将在24小时内回复。',
    'footer.rights': '版权所有',
    'footer.privacy': '隐私政策',
    'footer.terms': '服务条款',
  },
  es: {
    'nav.home': 'Inicio',
    'nav.products': 'Productos',
    'nav.about': 'Sobre Nosotros',
    'nav.news': 'Noticias',
    'nav.contact': 'Contacto',
    'hero.title': 'Soluciones Industriales Premium para Mercados Globales',
    'hero.subtitle': 'Certificado ISO 9001 | OEM/ODM Personalizado | 15+ Años de Experiencia',
    'hero.cta': 'Solicitar Cotización',
    'hero.cta_secondary': 'Ver Productos',
    'products.title': 'Nuestros Productos',
    'products.view_all': 'Ver Todos los Productos',
    'news.title': 'Últimas Noticias',
    'news.read_more': 'Leer Más',
    'contact.title': 'Contáctenos',
    'contact.name': 'Su Nombre',
    'contact.email': 'Correo Electrónico',
    'contact.company': 'Nombre de la Empresa',
    'contact.message': 'Mensaje',
    'contact.submit': 'Enviar Consulta',
    'contact.success': '¡Gracias! Responderemos en 24 horas.',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos de Servicio',
  },
};

export function t(key: string, locale: Locale = 'en'): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang === 'zh' || lang === 'es') return lang;
  return 'en';
}
