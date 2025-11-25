import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegisterUserMutation } from '../store/apiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import type { AppDispatch } from '../store';
import { useNavigate, Link } from 'react-router-dom';

const registrationFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  displayName: z.string().min(1, 'Display name is required'),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export const RegisterPage = () => {
  const dispatchFunction = useDispatch<AppDispatch>();
  const navigateFunction = useNavigate();
  const [registerUserMutation, registerResult] = useRegisterUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  async function handleFormSubmit(formValues: RegistrationFormValues) {
    try {
      const authResponse = await registerUserMutation(formValues).unwrap();
      dispatchFunction(
        setCredentials({
          token: authResponse.token,
          user: authResponse.user,
          defaultAccountId: authResponse.defaultAccountId,
        }),
      );
      navigateFunction('/');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Registration failed', error);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="email"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Display Name</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="text"
            {...register('displayName')}
          />
          {errors.displayName && (
            <p className="text-red-600 text-sm mt-1">
              {errors.displayName.message}
            </p>
          )}
        </div>

        {registerResult.isError && (
          <p className="text-red-600 text-sm">
            Could not register. This email may already be in use.
          </p>
        )}

        <button
          type="submit"
          className="border rounded px-4 py-2 font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 underline">
          Log in
        </Link>
      </p>
    </div>
  );
};
