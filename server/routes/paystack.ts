import type { RequestHandler } from 'express'

export const resolvePaystackAccount: RequestHandler = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    res.status(503).json({ error: 'Paystack is not configured on the server' })
    return
  }

  const account_number = String(req.body?.account_number ?? '').trim()
  const bank_code = String(req.body?.bank_code ?? '').trim()

  if (!/^\d{10}$/.test(account_number)) {
    res.status(400).json({ error: 'Account number must be 10 digits' })
    return
  }
  if (!bank_code || bank_code === '000') {
    res.status(400).json({ error: 'Select a valid bank' })
    return
  }

  try {
    const url = `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    const data = await response.json()
    if (!data.status) {
      res.status(400).json({ error: data.message || 'Could not verify account' })
      return
    }
    res.json({
      account_name: data.data.account_name as string,
      account_number: data.data.account_number as string,
    })
  } catch {
    res.status(500).json({ error: 'Verification service unavailable' })
  }
}
