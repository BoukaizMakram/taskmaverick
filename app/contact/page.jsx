import AuthLayout from '@/components/AuthLayout';
import ContactForm from '@/components/forms/ContactForm';

export const metadata = {
  title: 'Contact · Taskmaverick',
  description: 'Get in touch with the Taskmaverick team.',
};

export default function ContactPage() {
  return (
    <AuthLayout heading="Get in touch">
      <ContactForm />
    </AuthLayout>
  );
}
