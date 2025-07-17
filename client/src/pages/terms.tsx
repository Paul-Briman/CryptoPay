import React from "react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6">Terms of Service</h1>
        <div className="space-y-6 text-sm text-gray-300">
          <p>
            By accessing or using CryptoPay, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.
          </p>
          <p>
            CryptoPay is not a licensed financial institution. All investments carry inherent risk. While we aim to deliver fixed returns on each investment plan, profits are not guaranteed in cases of fraud, misuse, or violation of our terms.
          </p>
          <p>
            Users must be at least 18 years of age. It is your responsibility to ensure your activities on this platform comply with local laws.
          </p>
          <p>
            CryptoPay reserves the right to suspend or terminate accounts that violate our policies or exploit the platform.
          </p>
          <p>
            All BTC payments are final and irreversible. Ensure you double-check the wallet address before transferring.
          </p>
          <p>
            We may update our terms occasionally. Continued use of the platform after changes implies acceptance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
