const BACKEND_URL = 'https://gritshub.onrender.com';
// Function to handle signup
async function signup(username, email, password) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Needed for cookies/sessions
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    console.log('Signup successful:', data);
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

// Function to handle login
async function login(email, password) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    console.log('Login successful:', data);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Function to check if user is logged in
async function checkAuthStatus() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

// Function to handle logout
async function logout() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }

    console.log('Logout successful');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Connect forms to logic
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const userData = await login(email, password);
        window.location.href = '/dashboard.html';
      } catch (error) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
          errorElement.textContent = error.message;
        }
      }
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('signup-username').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      try {
        const userData = await signup(username, email, password);
        window.location.href = '/dashboard.html';
      } catch (error) {
        const errorElement = document.getElementById('signup-error');
        if (errorElement) {
          errorElement.textContent = error.message;
        }
      }
    });
  }

  // Check session on load
  checkAuthStatus().then(user => {
    if (user) {
      console.log('User is logged in:', user);
    }
  });
});