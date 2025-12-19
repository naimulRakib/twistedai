// app/legal/page.tsx
'use client';

import { useState } from 'react';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-green-500 selection:text-black">
      <div className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white tracking-tighter mb-4">
            LEGAL <span className="text-green-500">PROTOCOLS</span>
          </h1>
          <p className="text-gray-500 text-lg">
            The rules of the chaos. Read them before you get roasted.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-4 px-8 text-lg font-medium transition-all ${
              activeTab === 'privacy' 
                ? 'text-green-500 border-b-2 border-green-500' 
                : 'text-gray-600 hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-4 px-8 text-lg font-medium transition-all ${
              activeTab === 'terms' 
                ? 'text-green-500 border-b-2 border-green-500' 
                : 'text-gray-600 hover:text-white'
            }`}
          >
            Terms of Service
          </button>
        </div>

        {/* Content Container */}
        <div className="prose prose-invert prose-lg max-w-none">
          {activeTab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-gray-900 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Twisted App. All rights reserved.</p>
          <p>Contact: legal@twst.fun</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// CONTENT COMPONENTS (Copy/Paste the text below into these sections)
// ------------------------------------------------------------------

function PrivacyContent() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-white text-2xl font-bold mb-4">1. The Data We Snitch On</h3>
        <p>We are transparent about being a "Device Detective." When you use Twisted, we automatically collect:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Device Vitals:</strong> Battery percentage, charging status, and device model.</li>
          <li><strong>Digital Footprint:</strong> IP address, browser type, and approximate location (City/Country level).</li>
          <li><strong>Usage Data:</strong> Messages sent, roasting preferences, and time spent lurking.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-white text-2xl font-bold mb-4">2. Identity & Anonymity</h3>
        <p>
          <strong>We protect your identity from other users.</strong> Your name and exact address are never revealed to the recipient unless you voluntarily disclose them in a chat.
        </p>
        <div className="bg-gray-900 p-4 border-l-4 border-green-500 rounded-r">
          <p className="text-sm">
            <strong>Exception:</strong> If you use our service for death threats, terrorism, or severe harassment, we will cooperate with law enforcement and provide them your IP address.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-white text-2xl font-bold mb-4">3. AI Processing</h3>
        <p>
          Your messages are processed by Artificial Intelligence (OpenAI/Anthropic) to generate "Roasts" and analyze "Vibes." By using the service, you consent to your anonymized text being processed by these third-party LLMs.
        </p>
      </section>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-white text-2xl font-bold mb-4">1. Acceptance of Roast</h3>
        <p>
          Twisted is an entertainment app designed for satire and humor. By using the "Roast Mode" or "Brutal Honesty" features, you explicitly consent to receiving AI-generated content that may be insulting, sarcastic, or rude. 
          <br /><br />
          <strong>If you are easily offended, do not use this app.</strong>
        </p>
      </section>

      <section>
        <h3 className="text-white text-2xl font-bold mb-4">2. Zero Tolerance Policy</h3>
        <p>While we allow "roasting," we draw the line at hate.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>No Hate Speech:</strong> Racism, sexism, homophobia, or religious intolerance.</li>
          <li><strong>No Bullying:</strong> Encouraging self-harm or releasing private personal information (doxing).</li>
          <li><strong>No Sexual Violence:</strong> Any sexually explicit content involving non-consensual acts or minors.</li>
        </ul>
        <p className="mt-4">Violation of these rules results in an instant IP ban.</p>
      </section>

      <section>
        <h3 className="text-white text-2xl font-bold mb-4">3. Premium Features (The "Pro Vault")</h3>
        <p>
          Purchases for "Pro Vault," "Reveal Hints," or "Super Roasts" are non-refundable. We do not guarantee that hints will lead to the definitive identification of a sender (as that defeats the purpose of anonymity).
        </p>
      </section>
    </div>
  );
}