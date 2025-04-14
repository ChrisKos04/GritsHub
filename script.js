document.addEventListener('DOMContentLoaded', function() {
  // Check if login form exists on the page
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          // Here you would normally send this data to your server
          console.log('Login attempt:', email);
          
          // For demonstration, simulate a successful login
          alert('Login successful! Redirecting to dashboard...');
          window.location.href = 'dashboard.html'; // Create this page for logged-in users
      });
  }
  
  // Check if signup form exists on the page
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
      signupForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const userType = document.getElementById('user-type').value;
          const name = document.getElementById('name').value;
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirm-password').value;
          
          // Validate passwords match
          if (password !== confirmPassword) {
              alert('Passwords do not match!');
              return;
          }
          
          // Here you would normally send this data to your server
          console.log('Signup attempt:', { userType, name, email });
          
          // For demonstration, simulate a successful signup
          alert('Account created successfully! Redirecting to onboarding...');
          
          // Redirect based on user type
          if (userType === 'recipient') {
              window.location.href = 'recipient-onboarding.html';
          } else {
              window.location.href = 'business-onboarding.html';
          }
      });
  }
});