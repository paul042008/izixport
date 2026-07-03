import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'   // adjust path as needed

const schema = z.object({ email: z.string().email() })
type Form = z.infer<typeof schema>

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo: `${window.location.origin}/update-password` })
    if (error) toast.error(error.message)
    else toast.success('Reset link sent!')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#002E1A] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-2xl font-black text-[#002E1A]">Reset your password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
          <input {...register('email')} placeholder="Email address" className="w-full border rounded-xl p-2" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          <button type="submit" disabled={loading} className="w-full bg-[#C8991A] font-bold py-3 rounded-xl">{loading ? 'Sending...' : 'Send reset link'}</button>
          <p className="text-center text-sm"><a href="/login" className="text-[#006B3F]">Back to login</a></p>
        </form>
      </div>
    </div>
  )
}