# Quick Reference: Auth Implementation

## 🚀 Quick Start Guide

### Using Authentication in Your Component

```javascript
import { useAuth } from '@/app/context/AuthContext';

function MyComponent() {
  const auth = useAuth();
  
  // Check if user is authenticated
  const isLoggedIn = !!auth.token;
  
  // Get user info
  const userName = auth.user?.name;
  
  // Protect an action
  const handleProtectedAction = () => {
    auth.requireAuth(() => {
      // This runs only if authenticated
      performAction();
    });
  };
  
  // Logout
  const handleLogout = () => {
    auth.logout();
    router.push('/');
  };
  
  return (
    <div>
      {isLoggedIn ? (
        <p>Welcome, {userName}!</p>
      ) : (
        <button onClick={() => auth.requireAuth(() => {})}>
          Login
        </button>
      )}
    </div>
  );
}
```

---

## 📝 Common Use Cases

### 1. Protect a Button Click
```javascript
<button onClick={() => auth.requireAuth(() => createTrip())}>
  Create Trip
</button>
```

### 2. Protect Form Submission
```javascript
const handleSubmit = (values) => {
  auth.requireAuth(async () => {
    await submitForm(values);
  });
};
```

### 3. Check Auth Status
```javascript
if (auth.token) {
  // User is logged in
} else {
  // User is guest
}
```

### 4. Handle 401 Errors
```javascript
try {
  await api.request();
} catch (err) {
  if (err.response?.status === 401) {
    auth.requireAuth(() => {
      // Retry after login
      api.request();
    });
  }
}
```

### 5. Manual Logout
```javascript
const handleLogout = () => {
  if (confirm('Are you sure?')) {
    auth.logout();
    router.push('/');
  }
};
```

---

## 🎯 Auth Context API

### State
```javascript
const auth = useAuth();

// Available properties:
auth.token          // string | null
auth.user           // object | null
auth.loading        // boolean
auth.showLoginModal // boolean
```

### Methods
```javascript
// Set authentication after login
auth.setAuth({ token, user });

// Request authentication for an action
auth.requireAuth(() => {
  // Your protected code
});

// Logout
auth.logout();

// Close login modal
auth.closeLoginModal();

// Complete onboarding
auth.completeOnboarding(data);
```

---

## 🔑 When to Use What

### Use `requireAuth()` for:
- ✅ Creating trips
- ✅ Booking guides
- ✅ Sending messages
- ✅ Submitting forms
- ✅ Any write operation

### Don't use authentication for:
- ❌ Viewing pages
- ❌ Browsing content
- ❌ Reading data
- ❌ Navigation

---

## ⚡ Custom Hook Alternative

```javascript
// Import
import { useAuthAction } from '@/app/hooks/useAuthAction';

// Use
const requireAuth = useAuthAction();

// Wrap your action
const createTrip = requireAuth(() => {
  performTripCreation();
});

// Call it
<button onClick={createTrip}>Create</button>
```

---

## 🐛 Debugging Tips

### Check Auth State
```javascript
console.log('Auth State:', {
  token: auth.token,
  user: auth.user,
  loading: auth.loading,
  showModal: auth.showLoginModal
});
```

### Test Modal Trigger
```javascript
// Force show login modal
auth.requireAuth(() => {
  console.log('This runs after login');
});
```

### Verify Token
```javascript
const token = localStorage.getItem('access_token');
console.log('Token exists:', !!token);
```

---

## ✅ Migration Checklist

When migrating existing code:

- [ ] Remove `router.push('/login')` calls
- [ ] Remove manual token checks followed by redirects
- [ ] Replace with `auth.requireAuth()`
- [ ] Change logout to redirect to `/` not `/login`
- [ ] Remove `window.location.reload()` after login
- [ ] Test protected actions without auth
- [ ] Test protected actions with auth
- [ ] Test logout flow

---

## 🎨 UI Patterns

### Conditional Rendering
```javascript
{auth.token ? (
  <AuthenticatedView />
) : (
  <GuestView />
)}
```

### Protected Button
```javascript
<button 
  onClick={() => auth.requireAuth(() => action())}
  disabled={!auth.token}
>
  {auth.token ? 'Create Trip' : 'Login to Create'}
</button>
```

### Loading State
```javascript
{auth.loading ? (
  <Spinner />
) : (
  <Content />
)}
```

---

## 📦 Installation

Already installed! These files were added:
- ✅ `src/app/context/AuthContext.js` (enhanced)
- ✅ `src/app/hooks/useAuthAction.js` (new)
- ✅ `src/app/components/LoginModal.jsx` (updated)
- ✅ `src/app/components/Navbar.jsx` (updated)

---

## 🔗 Related Files

**Core:**
- [AuthContext.js](src/app/context/AuthContext.js)
- [useAuthAction.js](src/app/hooks/useAuthAction.js)

**Components:**
- [Navbar.jsx](src/app/components/Navbar.jsx)
- [LoginModal.jsx](src/app/components/LoginModal.jsx)

**Documentation:**
- [AUTH_IMPLEMENTATION_COMPLETE.md](AUTH_IMPLEMENTATION_COMPLETE.md)
- [AUTH_FLOW_DIAGRAMS.md](AUTH_FLOW_DIAGRAMS.md)

---

## 💡 Pro Tips

1. **Always use `requireAuth()` for protected actions**
2. **Never redirect to /login manually**
3. **Logout should go to home page**
4. **Handle 401 errors with `requireAuth()`**
5. **Test as guest user frequently**

---

## 📞 Need Help?

Common issues solved in [AUTH_IMPLEMENTATION_COMPLETE.md](AUTH_IMPLEMENTATION_COMPLETE.md)

Check the flow diagrams in [AUTH_FLOW_DIAGRAMS.md](AUTH_FLOW_DIAGRAMS.md)

---

**Last Updated:** December 24, 2025
**Quick Reference v1.0**
