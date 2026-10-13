import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { StructuredData } from '../components/seo/StructuredData';
import {
  buildTitle,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  BUSINESS_EMAIL,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  SITE_NAME,
  SITE_URL,
} from '../utils/seoConfig';

export const PrivacyPolicyPage: React.FC = () => {
  usePageMeta({
    title: buildTitle('Privacy Policy'),
    description: "Padma's Floral privacy policy — how we handle your personal information when you contact us or place an order.",
    canonicalPath: '/privacy-policy',
  });

  const breadcrumbSchema = useMemo(() => buildBreadcrumbJsonLd([
    { name: 'Home', url: canonicalUrl('/') },
    { name: 'Privacy Policy', url: canonicalUrl('/privacy-policy') },
  ]), []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <StructuredData data={breadcrumbSchema} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-stone-500">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-[#143D2B] transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-stone-700 font-medium">Privacy Policy</li>
        </ol>
      </nav>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#143D2B] mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-stone-500 mb-10">Last updated: October 2026</p>

      <div className="space-y-8 text-sm sm:text-base text-stone-700 leading-relaxed">

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Who we are</h2>
          <p>
            This website is operated by <strong>{SITE_NAME}</strong>, a flower decoration business
            located in Ramanagara Town, Karnataka, India. Our website address is{' '}
            <a href={SITE_URL} className="text-[#143D2B] underline hover:text-[#C84B5B]">{SITE_URL}</a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">What information we collect</h2>
          <p>We collect personal information only when you voluntarily provide it:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li>
              <strong>Contact and order details</strong> — name, phone number, delivery address,
              and order requirements you share with us over WhatsApp, phone call, or through
              the order form on this website.
            </li>
            <li>
              <strong>Order reference number</strong> — used solely for order tracking.
            </li>
          </ul>
          <p className="mt-3">
            We do not use cookies for advertising, we do not run remarketing campaigns, and
            we do not build profiles for targeted marketing.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">How we use your information</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To fulfil and deliver your order.</li>
            <li>To contact you about the status of your order.</li>
            <li>To respond to enquiries you send us.</li>
          </ul>
          <p className="mt-3">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">WhatsApp and phone communications</h2>
          <p>
            When you contact us via WhatsApp or phone, that conversation is subject to
            WhatsApp's and your telecom provider's own privacy policies. We use these
            channels only to communicate with you about your order or enquiry.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Data storage and security</h2>
          <p>
            Order information is stored securely in our backend database (Supabase), which
            uses industry-standard encryption at rest and in transit. Access is restricted
            to authorised business personnel only.
          </p>
          <p className="mt-3">
            We retain order records for a reasonable period to handle refunds, disputes,
            and legal obligations, then delete them.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Your rights</h2>
          <p>You may contact us at any time to:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3">
            <li>Ask what personal information we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data (subject to legal obligations).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Changes to this policy</h2>
          <p>
            We may update this policy from time to time. The "Last updated" date at the top
            of this page reflects the most recent revision. Continued use of the website
            after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Contact us</h2>
          <p>If you have any questions about this Privacy Policy, reach us at:</p>
          <ul className="mt-3 space-y-1.5">
            <li>
              Email:{' '}
              <a href={`mailto:${BUSINESS_EMAIL}`} className="text-[#143D2B] underline hover:text-[#C84B5B]">
                {BUSINESS_EMAIL}
              </a>
            </li>
            <li>Phone: <a href={`tel:${BUSINESS_PHONE}`} className="text-[#143D2B] underline hover:text-[#C84B5B]">{BUSINESS_PHONE}</a></li>
            <li>WhatsApp: <a href={`https://wa.me/${BUSINESS_WHATSAPP.replace(/\D/g, '')}`} className="text-[#143D2B] underline hover:text-[#C84B5B]">{BUSINESS_WHATSAPP}</a></li>
            <li>Address: Ramanagara Town, Karnataka 562159, India</li>
          </ul>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-stone-200 flex gap-4 text-sm">
        <Link to="/" className="text-[#143D2B] font-semibold hover:underline">
          Back to Home
        </Link>
        <Link to="/terms" className="text-stone-500 hover:text-[#143D2B] hover:underline">
          Terms &amp; Conditions
        </Link>
      </div>
    </div>
  );
};
