import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message. Please try again later.");
      }
      
      setIsSuccess(true);
      reset();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto px-6 py-[80px] min-h-[calc(100vh-200px)]">
      <h1 className="text-[64px] font-medium leading-[0.8] tracking-[-0.64px] mb-6 text-[#292929]">
        Contact
      </h1>
      <p className="text-[23px] text-[#6f6f6e] mb-12 max-w-[600px]">
        Interested in Kleos for your team? Have feedback? Reach out to us.
      </p>
      
      <div className="max-w-[600px] w-full">
        {isSuccess ? (
          <div className="p-6 bg-[#e4e4e0] rounded-[12px] border border-[#c0c0c0]">
            <h3 className="text-[19px] font-medium text-[#292929] mb-2">Message sent successfully!</h3>
            <p className="text-[14px] text-[#6f6f6e]">Thank you for reaching out. We'll get back to you shortly.</p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="mt-4 text-[14px] text-[#353535] underline cursor-pointer bg-transparent border-none p-0"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-600 rounded-[8px] text-[14px]">
                {errorMsg}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-[14px] font-medium text-[#292929]">Name</label>
              <input
                {...register('name')}
                id="name"
                className={`px-4 py-3 rounded-[8px] border ${errors.name ? 'border-red-500' : 'border-[#c0c0c0]'} bg-[#ffffff] focus:outline-none focus:border-[#292929] transition-colors`}
                placeholder="Jane Doe"
              />
              {errors.name && <span className="text-[12px] text-red-500">{errors.name.message}</span>}
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[14px] font-medium text-[#292929]">Email</label>
              <input
                {...register('email')}
                id="email"
                type="email"
                className={`px-4 py-3 rounded-[8px] border ${errors.email ? 'border-red-500' : 'border-[#c0c0c0]'} bg-[#ffffff] focus:outline-none focus:border-[#292929] transition-colors`}
                placeholder="jane@example.com"
              />
              {errors.email && <span className="text-[12px] text-red-500">{errors.email.message}</span>}
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-[14px] font-medium text-[#292929]">Message</label>
              <textarea
                {...register('message')}
                id="message"
                rows={5}
                className={`px-4 py-3 rounded-[8px] border ${errors.message ? 'border-red-500' : 'border-[#c0c0c0]'} bg-[#ffffff] focus:outline-none focus:border-[#292929] transition-colors resize-y`}
                placeholder="How can we help you?"
              />
              {errors.message && <span className="text-[12px] text-red-500">{errors.message.message}</span>}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#141414] text-[#ffffff] px-[24px] h-[48px] rounded-[200px] text-[16px] font-medium hover:bg-[#292929] transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 focus:ring-offset-[#edede8]"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
