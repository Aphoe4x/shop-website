const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Browse our products, add items to your cart, then proceed to checkout. Fill in your shipping details and submit your order. You will receive a confirmation email.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept major credit/debit cards, bank transfer, and cash on delivery (available in select cities).',
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery typically takes 2-5 business days depending on your location. Lagos deliveries are usually within 24-48 hours.',
  },
  {
    q: 'Do you deliver outside Lagos?',
    a: 'Yes! We deliver nationwide across all 36 states in Nigeria. Delivery fees vary by location.',
  },
  {
    q: 'Can I return or exchange an item?',
    a: 'Yes, we accept returns within 7 days of delivery. Items must be unused and in original packaging. Contact us to initiate a return.',
  },
  {
    q: 'How do I track my order?',
    a: 'Once your order ships, you will receive a tracking number via email. You can also check your order status in the "My Orders" page.',
  },
  {
    q: 'Are your products authentic?',
    a: 'Absolutely. We source all our products directly from authorized distributors and trusted suppliers. Every item is 100% genuine.',
  },
  {
    q: 'How do I contact customer support?',
    a: 'You can reach us via email at abdulbasitafolabi7@gmail.com, by phone at +234 800 000 0000, or through the Contact page on our website.',
  },
];

function FAQ() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions</p>
        </div>
      </section>
      <div className="faq-content">
        {FAQS.map((faq, index) => (
          <div key={index} className="faq-item">
            <h3>{faq.q}</h3>
            <p>{faq.a}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default FAQ;
