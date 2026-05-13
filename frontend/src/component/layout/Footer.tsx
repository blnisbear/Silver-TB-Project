import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644z"/>
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1 border-b border-gray-800 pb-8 md:border-0 md:pb-0">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-silver italic">Silver</span>
                <span className="text-orange">Thief</span>
                <span className="text-white font-normal uppercase text-xs tracking-widest ml-1">Bug</span>
              </span>
            </Link>
            <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed mb-6">
              {t('footer_desc')}
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="p-2 bg-gray-800 rounded-full hover:bg-orange transition-colors duration-300">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" className="p-2 bg-gray-800 rounded-full hover:bg-orange transition-colors duration-300">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" className="p-2 bg-gray-800 rounded-full hover:bg-orange transition-colors duration-300">
                <XIcon className="w-5 h-5" />
              </a>
              <a href="https://github.com" className="p-2 bg-gray-800 rounded-full hover:bg-orange transition-colors duration-300">
                <GithubIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-6 text-white border-l-4 border-orange pl-3 uppercase tracking-wider text-sm">{t('quick_links')}</h3>
            <ul className="space-y-4 text-gray-400 dark:text-gray-500 text-sm font-medium">
              <li><Link to="/products" className="hover:text-orange transition-colors">{t('shop_all_beetle')}</Link></li>
              <li><Link to="/about" className="hover:text-orange transition-colors">{t('our_story')}</Link></li>
              <li><Link to="/favorites" className="hover:text-orange transition-colors">{t('favorites')}</Link></li>
              <li><Link to="/login" className="hover:text-orange transition-colors">{t('membership')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-6 text-white border-l-4 border-orange pl-3 uppercase tracking-wider text-sm">{t('support')}</h3>
            <ul className="space-y-4 text-gray-400 dark:text-gray-500 text-sm font-medium">
              <li><Link to="/shipping" className="hover:text-orange transition-colors">{t('shipping_policy')}</Link></li>
              <li><Link to="/terms" className="hover:text-orange transition-colors">{t('terms_of_service')}</Link></li>
              <li><Link to="/privacy" className="hover:text-orange transition-colors">{t('privacy_policy')}</Link></li>
              <li><Link to="/faq" className="hover:text-orange transition-colors">{t('faq')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-6 text-white border-l-4 border-orange pl-3 uppercase tracking-wider text-sm">{t('contact_us')}</h3>
            <ul className="space-y-4 text-gray-400 dark:text-gray-500 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange flex-shrink-0" />
                <span>{t('address_123')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-orange flex-shrink-0" />
                <span>+66 88 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-orange flex-shrink-0" />
                <span>hello@silvertbug.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 dark:text-gray-400 text-xs tracking-widest uppercase">
          <p>© {new Date().getFullYear()} {t('all_rights_reserved')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
