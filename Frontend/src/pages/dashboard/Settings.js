import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import {
  getVerticalSettings,
  updateVerticalSettings,
  wipeData,
} from '../../serviceAPI/adminApi';

const VERTICALS = [
  { key: 'loan', label: 'Loan' },
  { key: 'vehicle', label: 'Vehicle Insurance' },
  { key: 'mediclaim', label: 'Mediclaim' },
  { key: 'life', label: 'Life Insurance' },
  { key: 'builder', label: 'Builder' },
];

const Settings = () => {
  const [verticals, setVerticals] = useState({
    loan: true,
    vehicle: true,
    mediclaim: true,
    life: true,
    builder: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  // Data-wipe modal state
  const [showWipe, setShowWipe] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getVerticalSettings();
      if (res && res.verticals) setVerticals(res.verticals);
      setLoading(false);
    })();
  }, []);

  const toggle = async (key) => {
    const next = { ...verticals, [key]: !verticals[key] };
    setVerticals(next); // optimistic
    setSavingKey(key);
    const res = await updateVerticalSettings({ [key]: next[key] });
    setSavingKey(null);
    if (res && res.verticals) {
      setVerticals(res.verticals);
      toast.success(`${key} ${res.verticals[key] ? 'enabled' : 'disabled'}`);
    } else {
      // revert on failure
      setVerticals(verticals);
    }
  };

  const doWipe = async () => {
    if (confirmText !== 'WIPE') return;
    setWiping(true);
    const res = await wipeData();
    setWiping(false);
    if (res && res.status) {
      toast.success('Data wiped successfully');
      setShowWipe(false);
      setConfirmText('');
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-4" style={{ maxWidth: 760 }}>
        <h3 className="mb-4">Settings</h3>

        {/* Vertical switches */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Vertical availability</h5>
            <p className="text-muted">
              Turn a module on or off. When a module is off, it is unavailable across the app
              (only the enabled modules can be used).
            </p>
            {loading ? (
              <p>Loading…</p>
            ) : (
              VERTICALS.map(({ key, label }) => (
                <div
                  key={key}
                  className="d-flex justify-content-between align-items-center py-2 border-bottom"
                >
                  <span>{label}</span>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={!!verticals[key]}
                      disabled={savingKey === key}
                      onChange={() => toggle(key)}
                      aria-label={`Toggle ${label}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danger zone — data wipe */}
        <div className="card border-danger">
          <div className="card-body">
            <h5 className="card-title text-danger">Danger zone — Data wipe-out</h5>
            <p className="text-muted">
              Permanently deletes all business and master data (loans, policies, consumers,
              companies, products, etc.). User accounts and roles are kept. This cannot be undone.
            </p>
            <button className="btn btn-danger" onClick={() => setShowWipe(true)}>
              Wipe all data
            </button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showWipe && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Confirm data wipe</h5>
                <button type="button" className="btn-close" onClick={() => setShowWipe(false)} />
              </div>
              <div className="modal-body">
                <p>
                  This will permanently delete all business &amp; master data. Type{' '}
                  <strong>WIPE</strong> to confirm.
                </p>
                <input
                  className="form-control"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type WIPE"
                  aria-label="Type WIPE to confirm"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowWipe(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={confirmText !== 'WIPE' || wiping}
                  onClick={doWipe}
                >
                  {wiping ? 'Wiping…' : 'Permanently wipe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Settings;
