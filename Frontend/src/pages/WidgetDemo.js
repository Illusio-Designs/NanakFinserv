import React, { useState } from 'react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import DatePicker from '../components/common/DatePicker';
import Select from '../components/common/Select';
import Loader from '../components/common/Loader';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import Search from '../components/common/Search';
import Stepper from '../components/common/Stepper';
import Toaster from '../components/common/Toaster';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

const WidgetDemo = () => {
  const [inputValue, setInputValue] = useState('');
  const [file, setFile] = useState(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [date, setDate] = useState(null);
  const [selectValue, setSelectValue] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

  const handleOtpChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    // Auto-focus next
    if (val && idx < 5) {
      const next = document.querySelector(`.otp-input-box:nth-child(${idx + 2})`);
      if (next) next.focus();
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>Widget Demo (Modern SaaS UI)</h2>
      <Toaster open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, open: false })} />
      <Card>
        <div style={{ display: 'grid', gap: 24 }}>
          <div>
            <label>Text Input</label>
            <Input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Enter text"
              style={{ marginTop: 8, width: '100%' }}
            />
          </div>
          <div>
            <label>File Upload</label>
            <Input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              style={{ marginTop: 8, width: '100%' }}
            />
            {file && <div style={{ marginTop: 8, color: '#6366f1' }}>{file.name}</div>}
          </div>
          <div>
            <label>Phone Input (with Flag, auto India)</label>
            <Input
              type="tel"
              value={phone}
              onChange={setPhone}
              style={{ marginTop: 8, width: '100%' }}
            />
          </div>
          <div>
            <label>OTP Input (6 digits)</label>
            <Input
              type="otp"
              otpValues={otp}
              onChange={handleOtpChange}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <label>Date Picker (with Calendar)</label>
            <DatePicker
              value={date}
              onChange={setDate}
              style={{ marginTop: 8, width: '100%' }}
            />
          </div>
          <div>
            <label>Select</label>
            <Select
              value={selectValue}
              onChange={setSelectValue}
              options={options}
              placeholder="Choose option"
              style={{ marginTop: 8, width: '100%' }}
            />
          </div>
          <div>
            <label>Search</label>
            <Search
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search..."
              style={{ marginTop: 8, width: '100%' }}
            />
          </div>
          <div>
            <label>Button</label>
            <Button style={{ marginTop: 8 }}>Primary Button</Button>
          </div>
          <div>
            <label>Loader</label>
            <Loader />
          </div>
          <div>
            <label>Modal</label>
            <Button onClick={() => setModalOpen(true)} style={{ marginTop: 8 }}>Open Modal</Button>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Demo Modal">
              <div>This is a modern SaaS modal!</div>
            </Modal>
          </div>
          <div>
            <label>Pagination</label>
            <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />
          </div>
          <div>
            <label>Stepper</label>
            <Stepper
              steps={[
                { label: 'Start' },
                { label: 'Details' },
                { label: 'Finish' }
              ]}
              currentStep={step}
              onStepClick={setStep}
            />
            <Button onClick={() => setStep(s => (s + 1) % 3)} style={{ marginTop: 8 }}>Next Step</Button>
          </div>
          <div>
            <label>Toaster Notification</label>
            <Button onClick={() => setToast({ open: true, message: 'This is a success notification!', type: 'success' })} style={{ marginTop: 8 }}>Show Success Toast</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WidgetDemo; 