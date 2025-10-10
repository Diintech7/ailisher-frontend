import React from 'react'
import Cookies from "js-cookie";
const { API_BASE_URL } = require('../../config');

export default function CreditManagement() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [info, setInfo] = React.useState('')
  const [toasts, setToasts] = React.useState([])

  function showToast(message, type = 'info') {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }

  const [balance, setBalance] = React.useState({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    lastActivity: null,
  })

  const [history, setHistory] = React.useState([])
  const [status, setStatus] = React.useState({
    kycStatus: 'not_submitted',
    bankDetailsComplete: false,
    withdrawalEnabled: false,
    creditStatus: 'pending',
    balance: 0,
    minWithdrawal: 0,
    maxWithdrawal: 0,
    eligibility: { canWithdraw: false, reasons: [] },
  })

  const [bankForm, setBankForm] = React.useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'savings',
    upiId: '',
  })

  const [kycForm, setKycForm] = React.useState({
    panNumber: '',
    aadharNumber: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
  })

  const [docs, setDocs] = React.useState({
    panDocument: null,
    aadharFront: null,
    aadharBack: null,
    bankPassbook: null,
  })

  const [withAmount, setWithAmount] = React.useState('')
  const [withdrawalMethod, setWithdrawalMethod] = React.useState('upi')

  // Modal controls
  const [showBankModal, setShowBankModal] = React.useState(false)
  const [showKycModal, setShowKycModal] = React.useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false)

  const token = React.useMemo(() => {
    // Adjust if your token key differs
    return Cookies.get("evaluatortoken");

  }, [])

  const authHeaders = React.useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  )

  const fetchAll = React.useCallback(async () => {
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [balanceRes, histRes, statusRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/evaluator/credit-balance`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/evaluator/credit-history?page=1&limit=20`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/evaluator/profile/finance/status`, { headers: authHeaders }),
      ])

      const balanceJson = await balanceRes.json()
      const histJson = await histRes.json()
      const statusJson = await statusRes.json()

      if (!balanceJson.success) {
        console.error('Balance fetch error', { status: balanceRes.status, body: balanceJson })
        throw new Error(balanceJson.message || 'Failed to load balance')
      }
      if (!histJson.success) {
        console.error('History fetch error', { status: histRes.status, body: histJson })
        throw new Error(histJson.message || 'Failed to load history')
      }
      if (!statusJson.success) {
        console.error('Status fetch error', { status: statusRes.status, body: statusJson })
        throw new Error(statusJson.message || 'Failed to load status')
      }

      console.log("see",balanceJson,histJson,statusJson)

      setBalance(balanceJson.data)
      setHistory(histJson.data || [])
      setStatus(statusJson.data)
    } catch (e) {
      console.error('fetchAll failed', e)
      setError(e.message || 'Failed to load')
      showToast(e.message || 'Failed to load', 'error')
    } finally {
      setLoading(false)
    }
  }, [authHeaders, token])

  React.useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function submitBankDetails(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluator/bank-details`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(bankForm),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to save bank details')
      setInfo('Bank details saved')
      showToast('Bank details saved', 'success')
      setShowBankModal(false)
      await fetchAll()
      // If KYC still not verified, guide to KYC next
      if (status.kycStatus !== 'verified') setShowKycModal(true)
    } catch (err) {
      console.error('submitBankDetails failed', err)
      setError(err.message)
      showToast(err.message || 'Failed to save bank details', 'error')
    }
  }

  async function uploadKycDoc(docType, file) {
    if (!file) return
    try {
      // 1) Ask backend for presigned URL
      const signRes = await fetch(`${API_BASE_URL}/api/evaluator/upload-document`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          docType,
        }),
      })
      const signJson = await signRes.json()
      if (!signJson.success) throw new Error(signJson.message || 'Failed to init upload')

      const { downloadUrl } = signJson.data || {}
      // 2) PUT file to the returned URL (controller stores doc immediately too)
      if (downloadUrl) {
        await fetch(downloadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        })
      }

      // Keep local state of uploaded docs
      setDocs((prev) => ({ ...prev, [docType]: signJson.data }))
    } catch (err) {
      console.error('uploadKycDoc failed', { docType, err })
      setError(err.message)
      showToast(err.message || 'Failed to upload document', 'error')
    }
  }

  async function submitKYC(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluator/kyc-details`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          panNumber: kycForm.panNumber,
          aadharNumber: kycForm.aadharNumber,
          address: kycForm.address,
          documents: docs,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to submit KYC')
      setInfo('KYC submitted. Await admin verification.')
      showToast('KYC submitted. Await verification', 'success')
      setShowKycModal(false)
      await fetchAll()
    } catch (err) {
      console.error('submitKYC failed', err)
      setError(err.message)
      showToast(err.message || 'Failed to submit KYC', 'error')
    }
  }

  async function submitWithdrawal(e) {
    e.preventDefault()
    setError('')
    try {
      const amount = Number(withAmount)
      const res = await fetch(`${API_BASE_URL}/api/evaluator/withdrawal`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          amount,
          withdrawalMethod,
          paymentMethod: withdrawalMethod
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Withdrawal failed')
      setWithAmount('')
      setWithdrawalMethod('upi')
      setShowWithdrawModal(false)
      setInfo('Withdrawal request submitted')
      // Toast.info("'Withdrawal request submitted'")
      showToast('Withdrawal request submitted', 'success')
      await fetchAll()
    } catch (err) {
      console.error('submitWithdrawal failed', err)
      setError(err.message)
      showToast(err.message || 'Withdrawal failed', 'error')
    }
  }

  function startWithdrawFlow() {
    setError('')
    setInfo('')

    // Bank gate
    if (!status.bankDetailsComplete) {
      setShowBankModal(true)
      return
    }
    // KYC gate
    if (status.kycStatus == 'not_submitted') {
      // If not submitted or pending, guide to KYC modal
      setShowKycModal(true)
      return
    }
    
    // Both completed: inform user
    showToast('KYC and bank details already completed', 'success')
    // Eligibility gate
    if (!status.eligibility?.canWithdraw) {
      setError((status.eligibility?.reasons || []).join(', ') || 'Not eligible to withdraw')
      return
    }
    setShowWithdrawModal(true)
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading credit info…</p>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Credit Management</h1>
            <p className="mt-1 text-white/80 text-sm">Manage your earnings, verify KYC, and request withdrawals.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge color={status.kycStatus === 'verified' ? 'green' : status.kycStatus === 'pending' ? 'amber' : 'gray'}>
                KYC: {status.kycStatus || 'not_submitted'}
              </Badge>
              <Badge color={status.bankDetailsComplete ? 'green' : 'gray'}>
                Bank: {status.bankDetailsComplete ? 'complete' : 'incomplete'}
              </Badge>
              <Badge color={status.eligibility?.canWithdraw ? 'green' : 'red'}>
                {status.eligibility?.canWithdraw ? 'Eligible' : 'Not eligible'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startWithdrawFlow}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 text-white transition shadow-md"
            >
              <span>Withdraw Credits</span>
            </button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Overview */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Balance" value={balance.balance} prefix="₹" accent="from-emerald-500 to-teal-500" />
        <Stat label="Total Earned" value={balance.totalEarned} prefix="₹" accent="from-indigo-500 to-blue-500" />
        <Stat label="Total Withdrawn" value={balance.totalWithdrawn} prefix="₹" accent="from-rose-500 to-pink-500" />
        <Stat label="Min/Max" value={`${status.minWithdrawal} / ${status.maxWithdrawal}`} prefix="₹" accent="from-amber-500 to-orange-500" />
      </section>

      {/* Eligibility banner */}
      {!status.eligibility?.canWithdraw && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
          <p className="font-medium">Withdrawals are currently blocked:</p>
          <ul className="list-disc pl-5">
            {(status.eligibility?.reasons || []).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* History */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Credit History</h2>
          <button onClick={fetchAll} className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50">Refresh</button>
        </div>
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {history.length === 0 ? (
                <tr>
                  <td className="p-2 text-gray-500" colSpan={4}>No transactions</td>
                </tr>
              ) : (
                history.map((t) => (
                  <tr key={t._id} className="border-t hover:bg-gray-50/60">
                    <td className="p-2">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="p-2">{t.type || '-'}</td>
                    <td className="p-2">₹{t.amount}</td>
                    <td className="p-2">{t.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      <Modal open={showBankModal} onClose={() => setShowBankModal(false)} title="Bank Details">
        <BankForm bankForm={bankForm} setBankForm={setBankForm} onSubmit={submitBankDetails} />
      </Modal>
      <Modal open={showKycModal} onClose={() => setShowKycModal(false)} title="KYC Details">
        <KYCForm kycForm={kycForm} setKycForm={setKycForm} onSubmit={submitKYC} onUpload={uploadKycDoc} docs={docs} />
      </Modal>
      <Modal open={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} title="Withdraw Credits">
        <WithdrawForm 
          amount={withAmount} 
          setAmount={setWithAmount} 
          withdrawalMethod={withdrawalMethod}
          setWithdrawalMethod={setWithdrawalMethod}
          onSubmit={submitWithdrawal} 
          min={status.minWithdrawal} 
          max={status.maxWithdrawal} 
          canWithdraw={status.eligibility?.canWithdraw} 
        />
      </Modal>
    </div>
  )
}

function Stat({ label, value, prefix, accent = 'from-indigo-500 to-purple-500' }) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm">
      <div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{prefix}{value}</p>
    </div>
  )
}

function Badge({ children, color }) {
  const map = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs ${map[color] || map.gray}`}>
      {children}
    </span>
  )
}

function BankForm({ bankForm, setBankForm, onSubmit }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Bank Details</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Account Holder Name" value={bankForm.accountHolderName} onChange={(v) => setBankForm({ ...bankForm, accountHolderName: v })} />
        <Input label="Account Number" value={bankForm.accountNumber} onChange={(v) => setBankForm({ ...bankForm, accountNumber: v })}/>
        <Input label="IFSC Code" value={bankForm.ifscCode} onChange={(v) => setBankForm({ ...bankForm, ifscCode: v })}/>
        <Input label="Bank Name" value={bankForm.bankName} onChange={(v) => setBankForm({ ...bankForm, bankName: v })}/>
        <Input label="Branch Name" value={bankForm.branchName} onChange={(v) => setBankForm({ ...bankForm, branchName: v })} />
        <Input label="UPI ID" value={bankForm.upiId} onChange={(v) => setBankForm({ ...bankForm, upiId: v })} required={true}/>
        {/* <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Account Type</label>
          <select
            className="border rounded p-2"
            value={bankForm.accountType}
            onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
          >
            <option value="savings">Savings</option>
            <option value="current">Current</option>
          </select>
        </div> */}
        {/* <Input className="md:col-span-2" label="UPI Id" value={bankForm.upiId} onChange={(v)=>setBankForm({...bankForm,upiId:v})}/> */}

        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Save Bank Details</button>
        </div>
      </form>
    </section>
  )
}

function KYCForm({ kycForm, setKycForm, onSubmit, onUpload, docs }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">KYC Details</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="PAN Number" value={kycForm.panNumber} onChange={(v) => setKycForm({ ...kycForm, panNumber: v.toUpperCase() })} required />
        <Input label="Aadhar Number" value={kycForm.aadharNumber} onChange={(v) => setKycForm({ ...kycForm, aadharNumber: v })} required />

        <Input label="Street" value={kycForm.address.street} onChange={(v) => setKycForm({ ...kycForm, address: { ...kycForm.address, street: v } })} required />
        <Input label="City" value={kycForm.address.city} onChange={(v) => setKycForm({ ...kycForm, address: { ...kycForm.address, city: v } })} required />
        <Input label="State" value={kycForm.address.state} onChange={(v) => setKycForm({ ...kycForm, address: { ...kycForm.address, state: v } })} required />
        <Input label="Pincode" value={kycForm.address.pincode} onChange={(v) => setKycForm({ ...kycForm, address: { ...kycForm.address, pincode: v } })} required />

        <FileInput label="PAN Document" onChange={(f) => onUpload('panDocument', f)} hint={docs.panDocument?.s3Key} />
        <FileInput label="Aadhar Front" onChange={(f) => onUpload('aadharFront', f)} hint={docs.aadharFront?.s3Key} />
        <FileInput label="Aadhar Back" onChange={(f) => onUpload('aadharBack', f)} hint={docs.aadharBack?.s3Key} />
        <FileInput label="Bank Passbook" onChange={(f) => onUpload('bankPassbook', f)} hint={docs.bankPassbook?.s3Key} />

        <div className="md:col-span-2">
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Submit KYC</button>
        </div>
      </form>
    </section>
  )
}

function WithdrawForm({ amount, setAmount, withdrawalMethod, setWithdrawalMethod, onSubmit, min, max, canWithdraw }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Withdraw Credits</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Withdrawal Method</label>
          <select
            className="border rounded p-2 w-full"
            value={withdrawalMethod}
            onChange={(e) => setWithdrawalMethod(e.target.value)}
          >
            <option value="upi">UPI Payment</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {withdrawalMethod === 'upi' 
              ? 'Payment will be sent to your UPI ID' 
              : 'Payment will be sent to your bank account'
            }
          </p>
        </div>
        
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Amount (₹{min} - ₹{max})</label>
          <input
            className="border rounded p-2 w-full"
            type="number"
            min={min}
            max={max}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to withdraw"
            required
          />
        </div>
        
        {/* <div className="flex gap-3">
          <button 
            type="button" 
            onClick={() => setWithdrawalMethod('upi')}
            className={`px-4 py-2 rounded text-sm ${
              withdrawalMethod === 'upi' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            UPI
          </button>
          <button 
            type="button" 
            onClick={() => setWithdrawalMethod('bank_transfer')}
            className={`px-4 py-2 rounded text-sm ${
              withdrawalMethod === 'bank_transfer' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Bank Transfer
          </button>
        </div> */}
        
        <button 
          type="submit" 
          className="w-full px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" 
          disabled={!canWithdraw || !amount}
        >
          Request Withdrawal
        </button>
      </form>
    </section>
  )
}

function Input({ label, value, onChange, required }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        className="border rounded p-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}

function FileInput({ label, onChange, hint }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 mb-1">{label}</label>
      <input
        className="border rounded p-2"
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      {hint ? <span className="text-xs text-gray-500 mt-1 truncate">Uploaded: {hint}</span> : null}
    </div>
  )
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-[101] bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  )
}

function Toast({ message, type = 'info', onClose }) {
  const style = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-indigo-600 text-white',
  }[type] || 'bg-gray-800 text-white'

  const icon = {
    success: '✓',
    error: '⚠',
    info: 'ℹ',
  }[type] || 'ℹ'

  return (
    <div className={`transform transition-all duration-300 ease-out translate-y-0 opacity-100 rounded-lg shadow-lg px-4 py-3 text-sm flex items-center gap-3 ${style}`}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 font-bold">{icon}</span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-xs underline">Dismiss</button>
    </div>
  )
}

