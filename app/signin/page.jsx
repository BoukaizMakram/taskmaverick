import AuthLayout from '@/components/AuthLayout';
import SignInForm from '@/components/forms/SignInForm';

export const metadata = {
  title: 'Sign in · Taskmaverick',
  description: 'Sign in to your Taskmaverick workspace.',
};

export default function SignInPage() {
  return (
    <AuthLayout heading="Welcome">
      <SignInForm />
    </AuthLayout>
  );
}
