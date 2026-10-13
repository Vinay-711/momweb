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

export const TermsPage: React.FC = () => {
  usePageMeta({
    title: buildTitle('Terms & Conditions'),
    description: "Padma's Floral terms and conditions — understand the rules for placing orders and using our website.",
    canonicalPath: '/terms',
  });

  const breadcrumbSchema = useMemo(() => buildBreadcrumbJsonLd([
    { name: 'Home', url: canonicalUrl('/') },
    { name: 'Terms & Conditions', url: canonicalUrl('/terms') },
  ]), []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <StructuredData data={breadcrumbSchema} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-stone-500">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-[#143D2B] transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-stone-700 font-medium">Terms &amp; Conditions</li>
        </ol>
      </nav>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#143D2B] mb-2">
        Terms &amp; Conditions
      </h1>
      <p className="text-sm text-stone-500 mb-10">Last updated: October 2026</p>

      <div className="space-y-8 text-sm sm:text-base text-stone-700 leading-relaxed">

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">About this website</h2>
          <p>
            This website (<a href={SITE_URL} className="text-[#143D2B] underline hover:text-[#C84B5B]">{SITE_URL}</a>)
            is owned and operated by <strong>{SITE_NAME}</strong>, Ramanagara Town,
            Karnataka, India. By browsing this website or placing an order, you agree to
            these terms.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Placing an order</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Orders may be placed via the website, WhatsApp ({BUSINESS_WHATSAPP}),
              or phone ({BUSINESS_PHONE}).
            </li>
            <li>
              An order is confirmed only after we acknowledge it. We reserve the right to
              decline orders if items are unavailable or if the delivery location is outside
              our service area.
            </li>
            <li>
              Prices displayed are indicative. Final prices are confirmed at the time of
              order acknowledgement because flower prices depend on seasonal availability.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Delivery</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We deliver within Ramanagara and Bengaluru.</li>
            <li>
              Delivery times are agreed upon at the time of order. We make every reasonable
              effort to deliver on time; however, delays due to weather, traffic, or other
              factors beyond our control are not grounds for cancellation or refund.
            </li>
            <li>
              Delivery charges, if applicable, are communicated before order confirmation.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Payments</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Payment terms are agreed at the time of order.</li>
            <li>
              We do not store payment card information on our website. Any online payment
              is handled by a third-party payment provider.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Cancellations and refunds</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Cancellations must be communicated as early as possible. Orders already
              prepared or dispatched cannot be cancelled.
            </li>
            <li>
              If we are at fault (wrong item delivered, significant quality issue), we will
              arrange a replacement or refund at our discretion.
            </li>
            <li>
              Because flowers are perishable, we do not accept returns of delivered flowers
              except in cases of a genuine error on our part.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Product descriptions and images</h2>
          <p>
            Flower arrangements may vary slightly from product images due to seasonal
            availability. We will always endeavour to produce arrangements of equivalent
            quality and value.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Use of this website</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>This website is for personal, non-commercial use.</li>
            <li>
              You must not misuse the website or attempt to access systems or data you
              are not authorised to access.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Limitation of liability</h2>
          <p>
            To the extent permitted by law, {SITE_NAME} is not liable for any indirect,
            incidental, or consequential loss arising from use of this website or from
            an order. Our total liability for any claim is limited to the value of the
            order in question.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Governing law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes will be subject
            to the jurisdiction of courts in Ramanagara, Karnataka.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Changes to these terms</h2>
          <p>
            We may update these terms from time to time. The "Last updated" date at the
            top of this page reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-[#143D2B] mb-3">Contact us</h2>
          <p>For questions about these Terms, contact us:</p>
          <ul className="mt-3 space-y-1.5">
            <li>
              Email:{' '}
              <a href={`mailto:${BUSINESS_EMAIL}`} className="text-[#143D2B] underline hover:text-[#C84B5B]">
                {BUSINESS_EMAIL}
              </a>
            </li>
            <li>Phone: <a href={`tel:${BUSINESS_PHONE}`} className="text-[#143D2B] underline hover:text-[#C84B5B]">{BUSINESS_PHONE}</a></li>
            <li>WhatsApp: <a href={`https://wa.me/${BUSINESS_WHATSAPP.replace(/\D/g, '')}`} className="text-[#143D2B] underline hover:text-[#C84B5B]">{BUSINESS_WHATSAPP}</a></li>
          </ul>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-stone-200 flex gap-4 text-sm">
        <Link to="/" className="text-[#143D2B] font-semibold hover:underline">
          Back to Home
        </Link>
        <Link to="/privacy-policy" className="text-stone-500 hover:text-[#143D2B] hover:underline">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
};
