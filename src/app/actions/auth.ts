//server Actions for user registration, login, logout, and profile management

'use server';

import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import User, { IUser } from '@/models/User';
import { setAuthCookie, removeAuthCookie, getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

//validation schemas
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number').optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

//response types
type ActionResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

//REGISTER NEW USER
export async function registerUser(
  formData: FormData
): Promise<ActionResponse<{ userId: string }>> {
  try {
    await connectDB();
    
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      phone: formData.get('phone') as string || undefined
    };
    
    //validate input
    const validated = registerSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors
      };
    }
    
    //check if user exists
    const existingUser = await User.findOne({ email: validated.data.email });
    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email already exists'
      };
    }
    
    //create user
    const user = await User.create(validated.data);
    
    //set auth cookie
    await setAuthCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    
    return {
      success: true,
      message: 'Account created successfully',
      data: { userId: user._id.toString() }
    };
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed. Please try again.'
    };
  }
}

//LOGIN USER
export async function loginUser(
  formData: FormData
): Promise<ActionResponse> {
  try {
    await connectDB();
    
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };
    
    //validate input
    const validated = loginSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors
      };
    }
    
    //Find user with password field
    const user = await User.findOne({ email: validated.data.email }).select('+password');
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }
    
    //verify password
    const isValid = await user.comparePassword(validated.data.password);
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }
    
    //set auth cookie
    await setAuthCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    
    return {
      success: true,
      message: 'Login successful'
    };
  } catch (error: unknown) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Login failed. Please try again.'
    };
  }
}

//LOGOUT USER
export async function logoutUser(): Promise<void> {
  await removeAuthCookie();
  redirect('/');
}


//get current user profile
export async function getUserProfile(): Promise<ActionResponse<Partial<IUser>>> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }
    
    await connectDB();
    const user = await User.findById(currentUser.userId).select('-password').lean() as IUser | null;
    
        
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const serializedUser = {
      ...user,
      _id: user._id?.toString(),
    };
    
    return {
      success: true,
      data: serializedUser as IUser
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
    console.error('Get profile error:', errorMessage);
    return {
      success: false,
      message: 'Failed to fetch profile'
    };
  }
}


//update user profile
export async function updateUserProfile(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }
    
    await connectDB();
    
    const updates: Partial<IUser> = {};

    const firstName = formData.get('firstName') as string | null;
    const lastName = formData.get('lastName') as string | null;
    const phone = formData.get('phone') as string | null;
    
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    
    const user = await User.findByIdAndUpdate(
      currentUser.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: 'Failed to update profile'
    };
  }
}