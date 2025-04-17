
async function signup(username, email, password) {
  try {
    const response = await fetch('http://localhost:5000/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies/sessions
      body: JSON.stringify({ username, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    
    // Handle successful signup (e.g., redirect to dashboard)
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
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies/sessions
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Handle successful login (e.g., redirect to dashboard)
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
    const response = await fetch('http://localhost:5000/api/me', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null; // Not logged in or error
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
    const response = await fetch('http://localhost:5000/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }
    
    // Handle successful logout (e.g., redirect to home)
    console.log('Logout successful');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// 2. Example of how to connect these functions to your login/signup buttons

document.addEventListener('DOMContentLoaded', () => {
  // Handle login form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        const userData = await login(email, password);
        // Redirect to dashboard or update UI
        window.location.href = '/dashboard.html';
      } catch (error) {
        // Display error message to user
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
          errorElement.textContent = error.message;
        }
      }
    });
  }
  
  // Handle signup form submission
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('signup-username').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      try {
        const userData = await signup(username, email, password);
        // Redirect to dashboard or update UI
        window.location.href = '/dashboard.html';
      } catch (error) {
        // Display error message to user
        const errorElement = document.getElementById('signup-error');
        if (errorElement) {
          errorElement.textContent = error.message;
        }
      }
    });
  }

  // Check if user is already logged in on page load
  checkAuthStatus().then(user => {
    if (user) {
      // User is logged in, update UI accordingly
      console.log('User is logged in:', user);
      // You might want to show/hide certain elements
    }
  });
});