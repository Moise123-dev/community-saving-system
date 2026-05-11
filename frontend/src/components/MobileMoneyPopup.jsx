import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, AlertCircle, X } from 'lucide-react';

const networks = [
  { id: 'mtn', name: 'MTN Mobile Money', color: '#fbbf24', bg: '#fffbeb', prefix: ['078', '079'] },
  { id: 'airtel', name: 'Airtel Money', color: '#ef4444', bg: '#fef2f2', prefix: ['073', '072'] },
  { id: 'tigo', name: 'Tigo Pesa', color: '#3b82f6', bg: '#eff6ff', prefix: ['065', '067'] },
];

function detectNetwork(phone) {
  const clean = phone.replace(/\s|-/g, '');
  const local = clean.startsWith('+250') ? '0' + clean.slice(4) : clean;
  return networks.find(n => n.prefix.some(p => local.startsWith(p))) || null;
}

export default function MobileMoneyPopup({ isOpen, onClose, onConfirm, amount, saving }) {
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState(null);
  const [txId, setTxId] = useState('');
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = confirm & enter txId

  useEffect(() => {
    if (!isOpen) {
      setPhone('');
      setNetwork(null);
      setTxId('');
      setStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (phone.length >= 9) {
      setNetwork(detectNetwork(phone));
    } else {
      setNetwork(null);
    }
  }, [phone]);

  const fmt = (n) => new Intl.NumberFormat().format(n || 0);

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!phone) return;
    onConfirm({ phone, network: network?.name || 'Mobile Money', txId });
  };

  if (!isOpen) return null;

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-popup" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mm-header">
          <div className="mm-header-icon">
            <Smartphone size={22} />
          </div>
          <div>
            <h3>Mobile Money Payment</h3>
            <p>Amount: <strong>TZS {fmt(amount)}</strong></p>
          </div>
          <button className="mm-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="mm-steps">
          <div className={`mm-step ${step >= 1 ? 'active' : ''}`}>
            <span>1</span> Phone Number
          </div>
          <div className="mm-step-line" />
          <div className={`mm-step ${step >= 2 ? 'active' : ''}`}>
            <span>2</span> Confirm Payment
          </div>
        </div>

        <form onSubmit={handleConfirm}>
          {/* Step 1 — Phone number */}
          {step === 1 && (
            <div className="mm-body">
              <p className="mm-instruction">
                Injiza numero ya telefone yawe ya Mobile Money
              </p>

              {/* Network selector */}
              <div className="mm-networks">
                {networks.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    className={`mm-network-btn ${network?.id === n.id ? 'selected' : ''}`}
                    style={network?.id === n.id ? { borderColor: n.color, background: n.bg } : {}}
                    onClick={() => setNetwork(n)}
                  >
                    <span className="mm-network-dot" style={{ background: n.color }} />
                    {n.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <div className="mm-phone-input">
                <span className="mm-flag">🇷🇼 +250</span>
                <input
                  type="tel"
                  placeholder="078 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={13}
                  autoFocus
                  required
                />
              </div>

              {/* Network detected */}
              {network && (
                <div className="mm-detected" style={{ background: network.bg, borderColor: network.color }}>
                  <span className="mm-network-dot" style={{ background: network.color }} />
                  <span style={{ color: network.color, fontWeight: 600 }}>{network.name} detected</span>
                  <CheckCircle size={16} style={{ color: network.color, marginLeft: 'auto' }} />
                </div>
              )}

              {phone.length >= 9 && !network && (
                <div className="mm-detected mm-unknown">
                  <AlertCircle size={16} />
                  <span>Network not recognized — please select manually above</span>
                </div>
              )}

              <div className="mm-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={phone.length < 9}
                  onClick={() => setStep(2)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Confirm & Transaction ID */}
          {step === 2 && (
            <div className="mm-body">
              {/* Payment summary */}
              <div className="mm-summary">
                <div className="mm-summary-row">
                  <span>Phone Number</span>
                  <strong>{phone}</strong>
                </div>
                <div className="mm-summary-row">
                  <span>Network</span>
                  <strong style={{ color: network?.color }}>{network?.name || 'Mobile Money'}</strong>
                </div>
                <div className="mm-summary-row mm-summary-amount">
                  <span>Amount to Pay</span>
                  <strong>TZS {fmt(amount)}</strong>
                </div>
              </div>

              {/* Instructions */}
              <div className="mm-instructions">
                <p className="mm-instruction-title">📱 Inzira yo kwishyura:</p>
                {network?.id === 'mtn' && (
                  <ol>
                    <li>Kanda <strong>*182#</strong> kuri telefone yawe</li>
                    <li>Hitamo <strong>1. Payments</strong></li>
                    <li>Shyiramo numero: <strong>{phone}</strong></li>
                    <li>Shyiramo amafaranga: <strong>TZS {fmt(amount)}</strong></li>
                    <li>Injiza PIN yawe kugira ngo wemeze</li>
                    <li>Injiza Transaction ID wabonye hano munsi</li>
                  </ol>
                )}
                {network?.id === 'airtel' && (
                  <ol>
                    <li>Kanda <strong>*185#</strong> kuri telefone yawe</li>
                    <li>Hitamo <strong>Send Money</strong></li>
                    <li>Shyiramo numero: <strong>{phone}</strong></li>
                    <li>Shyiramo amafaranga: <strong>TZS {fmt(amount)}</strong></li>
                    <li>Injiza PIN yawe kugira ngo wemeze</li>
                    <li>Injiza Transaction ID wabonye hano munsi</li>
                  </ol>
                )}
                {network?.id === 'tigo' && (
                  <ol>
                    <li>Kanda <strong>*150*01#</strong> kuri telefone yawe</li>
                    <li>Hitamo <strong>Send Money</strong></li>
                    <li>Shyiramo numero: <strong>{phone}</strong></li>
                    <li>Shyiramo amafaranga: <strong>TZS {fmt(amount)}</strong></li>
                    <li>Injiza PIN yawe kugira ngo wemeze</li>
                    <li>Injiza Transaction ID wabonye hano munsi</li>
                  </ol>
                )}
                {!network && (
                  <ol>
                    <li>Kanda code ya Mobile Money yawe</li>
                    <li>Hitamo Send Money</li>
                    <li>Shyiramo numero: <strong>{phone}</strong></li>
                    <li>Shyiramo amafaranga: <strong>TZS {fmt(amount)}</strong></li>
                    <li>Injiza PIN yawe kugira ngo wemeze</li>
                    <li>Injiza Transaction ID wabonye hano munsi</li>
                  </ol>
                )}
              </div>

              {/* Transaction ID */}
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Transaction ID (wavuye kuri SMS) *</label>
                <input
                  type="text"
                  placeholder="e.g. TXN1234567890"
                  value={txId}
                  onChange={e => setTxId(e.target.value)}
                  required
                  autoFocus
                  style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                />
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Transaction ID iri kuri SMS wavuye nyuma yo kwishyura
                </p>
              </div>

              <div className="mm-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!txId || saving}
                >
                  {saving ? <span className="spinner-sm" /> : <CheckCircle size={16} />}
                  {saving ? 'Processing...' : `Confirm Payment`}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
