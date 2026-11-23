import React, { useState, useEffect } from 'react';
import { AuthSession, BarangaySchedule, UserRole } from '../types';
import {
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Truck,
  KeyRound,
  Lock,
} from 'lucide-react';
import { LogoMark } from './LogoMark';

interface AuthScreenProps {
  onLogin: (session: AuthSession, token: string) => void;
  availableBarangays: BarangaySchedule[];
}

interface SetupStatus {
  officialConfigured: boolean;
  driverConfigured: boolean;
}

export function AuthScreen({ onLogin, availableBarangays }: AuthScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('RESIDENT');
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    officialConfigured: true,
    driverConfigured: true,
  });

  // Resident Auth State
  const [residentMode, setResidentMode] = useState<'login' | 'register'>('register');
  const [fullName, setFullName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedBarangayId, setSelectedBarangayId] = useState(
    availableBarangays[0]?.id || 'brgy-batasan-hills'
  );
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [residentError, setResidentError] = useState('');
  const [isResidentSubmitting, setIsResidentSubmitting] = useState(false);

  // Official Auth State
  const [officialEmployeeId, setOfficialEmployeeId] = useState('');
  const [officialBadgeNumber, setOfficialBadgeNumber] = useState('');
  const [officialPasscode, setOfficialPasscode] = useState('');
  const [officialConfirmPasscode, setOfficialConfirmPasscode] = useState('');
  const [officialError, setOfficialError] = useState('');
  const [isOfficialSubmitting, setIsOfficialSubmitting] = useState(false);

  // Driver Auth State
  const [driverEmployeeId, setDriverEmployeeId] = useState('');
  const [driverTruckCode, setDriverTruckCode] = useState('');
  const [driverPin, setDriverPin] = useState('');
  const [driverConfirmPin, setDriverConfirmPin] = useState('');
  const [driverError, setDriverError] = useState('');
  const [isDriverSubmitting, setIsDriverSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSetupStatus({
            officialConfigured: Boolean(data.officialConfigured),
            driverConfigured: Boolean(data.driverConfigured),
          });
        }
      })
      .catch(() => {
        // Keep safe defaults if check fails
      });
  }, []);

  const handleResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResidentError('');

    if (residentMode === 'register') {
      if (!fullName.trim()) return setResidentError('Please enter your full name.');
      if (!streetAddress.trim()) return setResidentError('Please enter your house and street address.');
      if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
        return setResidentError('Please enter a valid 11-digit mobile number (e.g. 0917 123 4567).');
      }
      if (!password.trim() || password.trim().length < 4) {
        return setResidentError('Please create a password or PIN with at least 4 characters.');
      }

      setIsResidentSubmitting(true);
      try {
        const res = await fetch('/api/auth/resident/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            streetAddress: streetAddress.trim(),
            homeBarangayId: selectedBarangayId,
            mobileNumber: mobileNumber.trim(),
            password: password.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return setResidentError(data.message || 'Could not complete registration. Please try again.');
        }
        onLogin(data.session, data.token);
      } catch {
        setResidentError('Unable to reach the server. Please try again.');
      } finally {
        setIsResidentSubmitting(false);
      }
    } else {
      if (!mobileNumber.trim()) return setResidentError('Please enter your registered mobile number.');
      if (!password.trim()) return setResidentError('Please enter your password or PIN.');

      setIsResidentSubmitting(true);
      try {
        const res = await fetch('/api/auth/resident/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobileNumber: mobileNumber.trim(),
            password: password.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return setResidentError(
            data.message || 'Mobile number or password is incorrect. Register first if you are new.'
          );
        }
        onLogin(data.session, data.token);
      } catch {
        setResidentError('Unable to reach the server. Please try again.');
      } finally {
        setIsResidentSubmitting(false);
      }
    }
  };

  const handleOfficialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficialError('');

    if (!officialEmployeeId.trim() || !officialBadgeNumber.trim() || !officialPasscode.trim()) {
      return setOfficialError('Please fill in your Employee ID, Badge Number, and Passcode.');
    }

    const isClaimMode = !setupStatus.officialConfigured;
    if (isClaimMode) {
      if (officialPasscode.trim().length < 6) {
        return setOfficialError('Please choose an Official Passcode of at least 6 characters.');
      }
      if (officialPasscode !== officialConfirmPasscode) {
        return setOfficialError('Passcodes do not match. Please re-enter to confirm.');
      }
    }

    setIsOfficialSubmitting(true);
    try {
      const endpoint = isClaimMode ? '/api/auth/official/claim' : '/api/auth/official/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: officialEmployeeId.trim(),
          badgeNumber: officialBadgeNumber.trim(),
          passcode: officialPasscode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return setOfficialError(data.message || 'Invalid City Official credentials.');
      }
      setSetupStatus((prev) => ({ ...prev, officialConfigured: true }));
      onLogin(data.session, data.token);
    } catch {
      setOfficialError('Unable to reach the server. Please try again.');
    } finally {
      setIsOfficialSubmitting(false);
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError('');

    if (!driverEmployeeId.trim() || !driverTruckCode.trim() || !driverPin.trim()) {
      return setDriverError('Please enter your Driver Employee ID, Truck Code, and PIN.');
    }

    const isClaimMode = !setupStatus.driverConfigured;
    if (isClaimMode) {
      if (driverPin.trim().length < 4) {
        return setDriverError('Please choose a Driver PIN of at least 4 characters.');
      }
      if (driverPin !== driverConfirmPin) {
        return setDriverError('PIN entries do not match. Please re-enter to confirm.');
      }
    }

    setIsDriverSubmitting(true);
    try {
      const endpoint = isClaimMode ? '/api/auth/driver/claim' : '/api/auth/driver/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: driverEmployeeId.trim(),
          truckCode: driverTruckCode.trim(),
          pin: driverPin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return setDriverError(data.message || 'Invalid Truck Driver credentials.');
      }
      setSetupStatus((prev) => ({ ...prev, driverConfigured: true }));
      onLogin(data.session, data.token);
    } catch {
      setDriverError('Unable to reach the server. Please try again.');
    } finally {
      setIsDriverSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Official QC Waste Watch Logo & Role Overview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-4">
            <LogoMark size="lg" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-700">
                Quezon City EPWMD
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight text-balance">
                QC Waste Watch
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Official garbage collection schedule tracker and community delay alert portal for Quezon City barangays.
          </p>

          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Residents</h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Check your barangay pickup days, follow multiple neighborhoods, and get instant delay alerts.
              </p>
            </div>

            <div className="border-t border-slate-200/80 pt-3">
              <h2 className="text-sm font-bold text-slate-900">City Officials</h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Update collection windows, post weather or traffic delay reasons, and notify residents.
              </p>
            </div>

            <div className="border-t border-slate-200/80 pt-3">
              <h2 className="text-sm font-bold text-slate-900">Truck Drivers</h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Check in when you arrive on site, update arrival times, and report road problems.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Role-Specific Sign In Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Step 1 · Choose Your Account Type
            </p>
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                id="role-tab-resident"
                onClick={() => setSelectedRole('RESIDENT')}
                className={`py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedRole === 'RESIDENT'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Resident</span>
              </button>

              <button
                type="button"
                id="role-tab-official"
                onClick={() => setSelectedRole('OFFICIAL')}
                className={`py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedRole === 'OFFICIAL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>City Official</span>
              </button>

              <button
                type="button"
                id="role-tab-driver"
                onClick={() => setSelectedRole('DRIVER')}
                className={`py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedRole === 'DRIVER'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Truck className="w-4 h-4 text-cyan-200 shrink-0" />
                <span>Truck Driver</span>
              </button>
            </div>
          </div>

          {/* FORM 1: RESIDENT USER AUTHENTICATION */}
          {selectedRole === 'RESIDENT' && (
            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setResidentMode('register');
                    setResidentError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    residentMode === 'register' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  New Resident Registration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResidentMode('login');
                    setResidentError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    residentMode === 'login' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Returning Resident Sign In
                </button>
              </div>

              {residentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{residentError}</span>
                </div>
              )}

              <form onSubmit={handleResidentSubmit} className="space-y-3.5 text-xs">
                {residentMode === 'register' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Juan / Juana Dela Cruz"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Home Barangay (Quezon City) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedBarangayId}
                        onChange={(e) => setSelectedBarangayId(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                      >
                        {availableBarangays.map((b) => (
                          <option key={b.id} value={b.id}>
                            Brgy. {b.name} (District {b.district})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        House / Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Blk 12 Lot 4, Kalayaan St."
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0917 123 4567"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password / PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-resident-auth"
                  disabled={isResidentSubmitting}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    {isResidentSubmitting
                      ? 'Please wait...'
                      : residentMode === 'register'
                      ? 'Register as Resident'
                      : 'Sign In as Resident'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* FORM 2: GOVERNMENT / CITY OFFICIAL AUTHENTICATION */}
          {selectedRole === 'OFFICIAL' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {!setupStatus.officialConfigured
                    ? 'First-time setup: Verify your EPWMD Employee ID and create the City Official access passcode.'
                    : 'For Quezon City Environmental Protection & Waste Management Department staff.'}
                </span>
              </div>

              {officialError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{officialError}</span>
                </div>
              )}

              <form onSubmit={handleOfficialSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QC-EPWMD-8821"
                    value={officialEmployeeId}
                    onChange={(e) => setOfficialEmployeeId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Your assigned City Hall / EPWMD Employee ID
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Badge Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BDG-8821"
                      value={officialBadgeNumber}
                      onChange={(e) => setOfficialBadgeNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {!setupStatus.officialConfigured ? 'Create Access Passcode' : 'Access Passcode'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={officialPasscode}
                      onChange={(e) => setOfficialPasscode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {!setupStatus.officialConfigured && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Confirm Access Passcode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter passcode"
                      value={officialConfirmPasscode}
                      onChange={(e) => setOfficialConfirmPasscode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-official-auth"
                  disabled={isOfficialSubmitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {!setupStatus.officialConfigured ? (
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Building2 className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {isOfficialSubmitting
                      ? 'Verifying...'
                      : !setupStatus.officialConfigured
                      ? 'Set Official Passcode & Sign In'
                      : 'Sign In as City Official'}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* FORM 3: TRUCK DRIVER AUTHENTICATION */}
          {selectedRole === 'DRIVER' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 rounded-2xl border border-cyan-200 flex items-center gap-2 text-xs text-cyan-900 font-medium">
                <Truck className="w-4 h-4 text-cyan-700 shrink-0" />
                <span>
                  {!setupStatus.driverConfigured
                    ? 'First-time setup: Verify your Driver ID and Truck Code to set the fleet access PIN.'
                    : 'For Quezon City garbage truck drivers and collection crews.'}
                </span>
              </div>

              {driverError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{driverError}</span>
                </div>
              )}

              <form onSubmit={handleDriverSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Driver Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QC-DRV-2041"
                    value={driverEmployeeId}
                    onChange={(e) => setDriverEmployeeId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Truck Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. QC-TRK-204"
                      value={driverTruckCode}
                      onChange={(e) => setDriverTruckCode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {!setupStatus.driverConfigured ? 'Create Driver PIN' : 'Driver PIN'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••"
                      value={driverPin}
                      onChange={(e) => setDriverPin(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {!setupStatus.driverConfigured && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Confirm Driver PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter PIN"
                      value={driverConfirmPin}
                      onChange={(e) => setDriverConfirmPin(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-submit-driver-auth"
                  disabled={isDriverSubmitting}
                  className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4 text-cyan-200" />
                  <span>
                    {isDriverSubmitting
                      ? 'Verifying...'
                      : !setupStatus.driverConfigured
                      ? 'Set Driver PIN & Sign In'
                      : 'Sign In as Truck Driver'}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="border-t border-slate-200 pt-4 flex items-start gap-3 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">Privacy Notice</p>
              <p className="leading-relaxed">
                Your personal information is safe and protected. Your details are collected strictly for account sign-in and delivering your Quezon City garbage collection updates, and will never be shared or used for any other purpose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
