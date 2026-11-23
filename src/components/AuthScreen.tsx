import React, { useState } from 'react';
import { AuthSession, ResidentUser, AdminOfficial, DriverUser, BarangaySchedule, UserRole } from '../types';
import { QC_AUTHORIZED_OFFICIALS } from '../data/qcOfficials';
import { QC_FLEET_DRIVERS } from '../data/qcDrivers';
import { 
  User, 
  MapPin, 
  Phone, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CloudRain, 
  Building2, 
  Truck, 
  BadgeCheck, 
  KeyRound,
  Radio
} from 'lucide-react';

interface AuthScreenProps {
  onLogin: (session: AuthSession) => void;
  availableBarangays: BarangaySchedule[];
}

export function AuthScreen({ onLogin, availableBarangays }: AuthScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('RESIDENT');

  // Resident Auth State
  const [residentMode, setResidentMode] = useState<'login' | 'register'>('register');
  const [fullName, setFullName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedBarangayId, setSelectedBarangayId] = useState(availableBarangays[0]?.id || 'brgy-batasan-hills');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [residentError, setResidentError] = useState('');

  // Official Auth State
  const [officialEmployeeId, setOfficialEmployeeId] = useState('');
  const [officialBadgeNumber, setOfficialBadgeNumber] = useState('');
  const [officialPasscode, setOfficialPasscode] = useState('');
  const [officialError, setOfficialError] = useState('');

  // Driver Auth State
  const [driverEmployeeId, setDriverEmployeeId] = useState('');
  const [driverTruckCode, setDriverTruckCode] = useState('');
  const [driverPin, setDriverPin] = useState('');
  const [driverError, setDriverError] = useState('');

  // Handlers for Resident
  const handleResidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResidentError('');

    if (residentMode === 'register') {
      if (!fullName.trim()) return setResidentError('Please enter your full name.');
      if (!streetAddress.trim()) return setResidentError('Please enter your house and street address.');
      if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
        return setResidentError('Please enter a valid 11-digit mobile number (e.g. 0917 123 4567).');
      }
      if (!password.trim()) return setResidentError('Please enter a password or PIN.');

      const selectedBarangay = availableBarangays.find((b) => b.id === selectedBarangayId);
      const fullAddress = `${streetAddress.trim()}, Brgy. ${selectedBarangay?.name || 'Batasan Hills'}, Quezon City`;

      const newResident: ResidentUser = {
        id: `resident-${Date.now()}`,
        fullName: fullName.trim(),
        address: fullAddress,
        mobileNumber: mobileNumber.trim(),
        homeBarangayId: selectedBarangayId,
        subscribedBarangayIds: [selectedBarangayId],
        createdAt: new Date().toISOString(),
      };

      const session: AuthSession = { role: 'RESIDENT', user: newResident };
      localStorage.setItem('qc_auth_session', JSON.stringify(session));
      onLogin(session);
    } else {
      if (!mobileNumber.trim()) return setResidentError('Please enter your registered mobile number.');
      if (!password.trim()) return setResidentError('Please enter your PIN / password.');

      const demoUser: ResidentUser = {
        id: `resident-login-${Date.now()}`,
        fullName: 'Maria Corazon Santos',
        address: 'Blk 7 Lot 14 San Mateo Rd, Brgy. Batasan Hills, Quezon City',
        mobileNumber: mobileNumber.trim(),
        homeBarangayId: 'brgy-batasan-hills',
        subscribedBarangayIds: ['brgy-batasan-hills', 'brgy-commonwealth'],
        createdAt: new Date().toISOString(),
      };

      const session: AuthSession = { role: 'RESIDENT', user: demoUser };
      localStorage.setItem('qc_auth_session', JSON.stringify(session));
      onLogin(session);
    }
  };

  const handleDemoResident = (brgyId: string, name: string, address: string, phone: string) => {
    const demoUser: ResidentUser = {
      id: `demo-${brgyId}`,
      fullName: name,
      address: `${address}, Quezon City`,
      mobileNumber: phone,
      homeBarangayId: brgyId,
      subscribedBarangayIds: [brgyId],
      createdAt: new Date().toISOString(),
    };
    const session: AuthSession = { role: 'RESIDENT', user: demoUser };
    localStorage.setItem('qc_auth_session', JSON.stringify(session));
    onLogin(session);
  };

  // Handlers for Official
  const handleOfficialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficialError('');

    const found = QC_AUTHORIZED_OFFICIALS.find(
      (o) =>
        o.employeeId.toLowerCase() === officialEmployeeId.trim().toLowerCase() ||
        o.badgeNumber.toLowerCase() === officialBadgeNumber.trim().toLowerCase()
    );

    if (found) {
      const session: AuthSession = { role: 'OFFICIAL', user: found };
      localStorage.setItem('qc_auth_session', JSON.stringify(session));
      onLogin(session);
    } else {
      // Allow fallback login with first official if fields provided
      if (officialEmployeeId.trim() && officialPasscode.trim()) {
        const session: AuthSession = { role: 'OFFICIAL', user: QC_AUTHORIZED_OFFICIALS[0] };
        localStorage.setItem('qc_auth_session', JSON.stringify(session));
        onLogin(session);
      } else {
        setOfficialError('Invalid Government Official credentials. Use demo profiles or QC Employee ID.');
      }
    }
  };

  const handleDemoOfficial = (official: AdminOfficial) => {
    const session: AuthSession = { role: 'OFFICIAL', user: official };
    localStorage.setItem('qc_auth_session', JSON.stringify(session));
    onLogin(session);
  };

  // Handlers for Driver
  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError('');

    const found = QC_FLEET_DRIVERS.find(
      (d) =>
        d.employeeId.toLowerCase() === driverEmployeeId.trim().toLowerCase() ||
        d.truckCode.toLowerCase() === driverTruckCode.trim().toLowerCase()
    );

    if (found) {
      const session: AuthSession = { role: 'DRIVER', user: found };
      localStorage.setItem('qc_auth_session', JSON.stringify(session));
      onLogin(session);
    } else {
      if (driverEmployeeId.trim() && driverTruckCode.trim()) {
        const session: AuthSession = { role: 'DRIVER', user: QC_FLEET_DRIVERS[0] };
        localStorage.setItem('qc_auth_session', JSON.stringify(session));
        onLogin(session);
      } else {
        setDriverError('Invalid Driver Fleet credentials. Please verify your Truck Code.');
      }
    }
  };

  const handleDemoDriver = (drv: DriverUser) => {
    const session: AuthSession = { role: 'DRIVER', user: drv };
    localStorage.setItem('qc_auth_session', JSON.stringify(session));
    onLogin(session);
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Context & Role Selection Banner */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Quezon City Waste Watch
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Sign In to QC Waste Watch
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Please choose how you want to use the app: as a <strong>Resident</strong> (to check schedules and get delay alerts), a <strong>City Official</strong> (to update routes and post notices), or a <strong>Truck Driver</strong> (to notify residents when you arrive).
          </p>

          {/* Quick Demo Selector Cards based on role */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Login (Sample Accounts):</span>
              <span className="text-[10px] text-emerald-700 font-bold">1-Click Sign In</span>
            </div>

            {selectedRole === 'RESIDENT' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDemoResident(
                      'brgy-batasan-hills',
                      'Maria Corazon Santos',
                      'Blk 7 Lot 14 San Mateo Rd, Brgy. Batasan Hills',
                      '0917-882-3491'
                    )
                  }
                  className="w-full text-left p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
                    <span>Maria Santos • Batasan Hills</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                      RESIDENT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">Batasan Hills Resident • Subscribed</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDemoResident(
                      'brgy-socorro-cubao',
                      'Eduardo "Eddie" Ramos',
                      '15th Avenue corner P. Tuazon, Brgy. Socorro',
                      '0918-554-1290'
                    )
                  }
                  className="w-full text-left p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 flex items-center justify-between">
                    <span>Eduardo Ramos • Socorro (Cubao)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                      RESIDENT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">Cubao Commercial District Resident</div>
                </button>
              </div>
            )}

            {selectedRole === 'OFFICIAL' && (
              <div className="space-y-2">
                {QC_AUTHORIZED_OFFICIALS.map((off) => (
                  <button
                    key={off.id}
                    type="button"
                    onClick={() => handleDemoOfficial(off)}
                    className="w-full text-left p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-900 flex items-center justify-between">
                      <span>{off.fullName}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                        {off.badgeNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{off.title}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedRole === 'DRIVER' && (
              <div className="space-y-2">
                {QC_FLEET_DRIVERS.slice(0, 3).map((drv) => (
                  <button
                    key={drv.id}
                    type="button"
                    onClick={() => handleDemoDriver(drv)}
                    className="w-full text-left p-2.5 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-cyan-900 flex items-center justify-between">
                      <span>{drv.fullName}</span>
                      <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded font-mono font-bold">
                        {drv.truckCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Route: Brgy. {drv.assignedBarangayName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Isolated RBAC Login Viewports */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Step 1 • Choose Who You Are
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                id="role-tab-resident"
                onClick={() => setSelectedRole('RESIDENT')}
                className={`py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'RESIDENT'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Resident</span>
              </button>

              <button
                type="button"
                id="role-tab-official"
                onClick={() => setSelectedRole('OFFICIAL')}
                className={`py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'OFFICIAL'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>City Official</span>
              </button>

              <button
                type="button"
                id="role-tab-driver"
                onClick={() => setSelectedRole('DRIVER')}
                className={`py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === 'DRIVER'
                    ? 'bg-teal-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Truck className="w-4 h-4 text-cyan-300" />
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
                  onClick={() => setResidentMode('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    residentMode === 'register' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  New Resident Registration
                </button>
                <button
                  type="button"
                  onClick={() => setResidentMode('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password / 4-Digit PIN <span className="text-red-500">*</span>
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
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
                >
                  <span>{residentMode === 'register' ? 'Register as Resident' : 'Sign In as Resident'}</span>
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
                <span>For Quezon City Environmental Protection & Waste Management Department staff.</span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Your City Hall / EPWMD ID number</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      Password / Passcode <span className="text-red-500">*</span>
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

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficialEmployeeId('QC-EPWMD-8821');
                      setOfficialBadgeNumber('BDG-8821');
                      setOfficialPasscode('1234');
                    }}
                    className="text-amber-800 hover:underline font-bold"
                  >
                    Quick fill: Engr. Bautista account
                  </button>
                </div>

                <button
                  type="submit"
                  id="btn-submit-official-auth"
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Sign In as City Official</span>
                </button>
              </form>
            </div>
          )}

          {/* FORM 3: TRUCK DRIVER AUTHENTICATION */}
          {selectedRole === 'DRIVER' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 rounded-2xl border border-cyan-200 flex items-center gap-2 text-xs text-cyan-900 font-medium">
                <Truck className="w-4 h-4 text-cyan-700 shrink-0" />
                <span>For Quezon City garbage truck drivers and collection crews.</span>
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

                <div className="grid grid-cols-2 gap-3">
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
                      4-Digit PIN <span className="text-red-500">*</span>
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

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDriverEmployeeId('QC-DRV-2041');
                      setDriverTruckCode('QC-TRK-204');
                      setDriverPin('1234');
                    }}
                    className="text-cyan-800 hover:underline font-bold"
                  >
                    Quick fill: Kuya Nestor (Batasan Hills route)
                  </button>
                </div>

                <button
                  type="submit"
                  id="btn-submit-driver-auth"
                  className="w-full py-3.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4 text-cyan-200" />
                  <span>Sign In as Truck Driver</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
