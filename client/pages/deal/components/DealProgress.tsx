// src/pages/deal/components/DealProgress.tsx
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface Order {
  order_status: string
  escrow_status: string
}

interface Props {
  order: Order
}

export default function DealProgress({ order }: Props) {
  const steps = [
    { key: 'payment', title: 'Payment Secured', subtitle: 'Escrow funded' },
    { key: 'pre_shipment', title: 'Pre-Shipment Verification', subtitle: 'Quality check' },
    { key: 'documents', title: 'Documents Prepared', subtitle: 'Export docs' },
    { key: 'booked', title: 'Shipment Booked', subtitle: 'Carrier assigned' },
    { key: 'pickup', title: 'Goods Picked Up', subtitle: 'From warehouse' },
    { key: 'export_clearance', title: 'Export Customs Cleared', subtitle: 'Nigeria customs' },
    { key: 'transit', title: 'In Transit', subtitle: 'On the way' },
    { key: 'arrived', title: 'Arrived Destination', subtitle: 'Port of entry' },
    { key: 'import_clearance', title: 'Import Customs', subtitle: 'Destination customs' },
    { key: 'delivered', title: 'Delivered', subtitle: 'To buyer address' },
    { key: 'release', title: 'Confirm & Release Escrow', subtitle: 'Payment to exporter' },
  ]

  const getStepStatus = (stepKey: string) => {
    if (order.order_status === 'enquiring') return 'pending'
    if (order.order_status === 'escrow_confirmed') return stepKey === 'payment' ? 'completed' : 'pending'
    if (order.order_status === 'shipped') return stepKey === 'transit' ? 'active' : (stepKey === 'payment' || stepKey === 'pre_shipment' || stepKey === 'documents' || stepKey === 'booked' || stepKey === 'pickup' || stepKey === 'export_clearance') ? 'completed' : 'pending'
    if (order.order_status === 'delivered') return stepKey === 'delivered' ? 'completed' : (stepKey === 'release' ? 'active' : 'completed')
    return 'pending'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 max-h-80 overflow-y-auto shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
        Deal Progress
      </h3>
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.key)
          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                {status === 'completed' && <CheckCircle2 size={20} className="text-green-600" />}
                {status === 'active' && <Loader2 size={20} className="text-amber-500 animate-spin" />}
                {status === 'pending' && <Circle size={20} className="text-gray-300" />}
                {idx !== steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-1 ${status === 'completed' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
              <div>
                <p className={`font-semibold text-sm ${
                  status === 'active' ? 'text-amber-600' :
                  status === 'completed' ? 'text-gray-900' :
                  'text-gray-400'
                }`}>
                  {step.title}
                </p>
                <p className="text-gray-400 text-xs">{step.subtitle}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}