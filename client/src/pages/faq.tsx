// src/pages/faq.tsx
import React from "react";

const FAQ = () => {
  return (
    <div className="text-white px-4 md:px-16 py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">1. How does CryptoPay work?</h2>
        <p className="text-sm text-gray-300 mt-2">
          CryptoPay allows you to invest in Bitcoin with flexible plans. Choose a plan, send your BTC, and watch your investment grow.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">2. How do I know my payment is received?</h2>
        <p className="text-sm text-gray-300 mt-2">
          Once you send BTC to the provided address, your plan status will change to “Pending” and then “Active” once confirmed.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">3. When can I withdraw?</h2>
        <p className="text-sm text-gray-300 mt-2">
          You can withdraw once your plan duration is completed. The balance will be reflected on your dashboard.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">4. What if I need support?</h2>
        <p className="text-sm text-gray-300 mt-2">
          Use the WhatsApp support button at the bottom-right to talk to our customer care.
        </p>
      </div>
    </div>
  );
};

export default FAQ;
