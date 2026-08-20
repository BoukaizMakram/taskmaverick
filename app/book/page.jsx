import AuthLayout from '@/components/AuthLayout';
import DemoForm from '@/components/forms/DemoForm';

export const metadata = {
  title: 'Book a demo · Taskmaverick',
  description: 'See Taskmaverick run your everyday operations — book a tailored walkthrough.',
};

export default function BookDemoPage() {
  return (
    <AuthLayout heading="Book a demo">
      <DemoForm />
    </AuthLayout>
  );
}
