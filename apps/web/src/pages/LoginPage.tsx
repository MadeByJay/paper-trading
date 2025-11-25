import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { type AppDispatch } from '../store';
import { Link, redirect, useNavigate } from 'react-router-dom';
import { useLoginUserMutation } from '../store/apiSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setCredentials } from '../store/authSlice';

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export const LoginPage = () => {
  const dispatchFunction = useDispatch<AppDispatch>();
  const navigateFunction = useNavigate();
  const [loginUserMutation, loginResult] = useLoginUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleFormSubmit(formValues: LoginFormValues) {
    try {
      const authResponse = await loginUserMutation(formValues).unwrap();
      dispatchFunction(
        setCredentials({
          token: authResponse.token,
          user: authResponse.user,
          defaultAccountId: authResponse.defaultAccountId,
        }),
      );
      navigateFunction('/');
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Log In</h1>

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

        {loginResult.isError && (
          <p className="text-red-600 text-sm">
            Could not log in. Please check your email and password.
          </p>
        )}

        <button
          type="submit"
          className="border rounded px-4 py-2 font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Do not have an account?{' '}
        <Link to="/register" className="text-blue-600 underline">
          Register
        </Link>
      </p>
    </div>
  );
};
