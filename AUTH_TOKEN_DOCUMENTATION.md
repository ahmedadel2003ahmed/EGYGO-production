# 🔐 دليل التوكن الخاص بالمستخدم السياحي (auth_token_tourist)

## 📋 ملخص سريع

**اسم التوكن في المشروع:** `access_token`
**مكان التخزين:** `localStorage`
**نوع التوكن:** JWT (JSON Web Token)
**الاستخدام:** Bearer Token في Authorization Header

---

## 🎯 معلومات التوكن الأساسية

### 1. اسم التوكن
```javascript
const TOKEN_NAME = "access_token";
```

### 2. مكان التخزين
```javascript
// تخزين التوكن
localStorage.setItem("access_token", token);

// قراءة التوكن
const token = localStorage.getItem("access_token");

// حذف التوكن (عند تسجيل الخروج)
localStorage.removeItem("access_token");
```

### 3. معلومات المستخدم المصاحبة
```javascript
// يتم تخزين بيانات المستخدم أيضاً
localStorage.setItem("laqtaha_user", JSON.stringify(user));

// قراءة بيانات المستخدم
const user = JSON.parse(localStorage.getItem("laqtaha_user"));
```

---

## 🔄 مراحل الحصول على التوكن

### المرحلة 1: التسجيل (Register)
**الملف:** `src/app/(auth)/register/page.jsx`

```javascript
// البيانات المطلوبة
{
  email: "user@example.com",
  password: "password123",
  name: "اسم المستخدم"
}

// API Endpoint
POST http://localhost:5000/api/auth/register

// الاستجابة (لا تعطي توكن مباشرة - تحتاج OTP أولاً)
{
  success: true,
  data: {
    userId: "507f1f77bcf86cd799439011"
  }
}
```

### المرحلة 2: التحقق من OTP
**الملف:** `src/app/(auth)/otp/page.jsx`

```javascript
// البيانات المطلوبة
{
  email: "user@example.com",
  otp: "1234"
}

// API Endpoint
POST http://localhost:5000/api/auth/verify-otp

// الاستجابة (قد تعطي توكن للتسجيل التلقائي)
{
  success: true,
  data: {
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
      id: "507f1f77bcf86cd799439011",
      email: "user@example.com",
      name: "اسم المستخدم"
    }
  }
}
```

### المرحلة 3: تسجيل الدخول (Login)
**الملف:** `src/app/(auth)/login/page.jsx`

```javascript
// البيانات المطلوبة
{
  email: "user@example.com",
  password: "password123"
}

// API Endpoint
POST http://localhost:5000/api/auth/login

// الاستجابة (تعطي التوكن)
{
  success: true,
  data: {
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
      id: "507f1f77bcf86cd799439011",
      email: "user@example.com",
      name: "اسم المستخدم",
      role: "tourist"
    }
  }
}

// الكود في المشروع
const token = response.data?.data?.accessToken || 
              response.data?.accessToken || 
              response.data?.token;

localStorage.setItem("access_token", token);
localStorage.setItem("laqtaha_user", JSON.stringify(user));
```

---

## 🛡️ استخدام التوكن في الطلبات (API Requests)

### 1. طريقة الاستخدام القياسية

```javascript
const token = localStorage.getItem('access_token');

const response = await axios.get('http://localhost:5000/api/tourist/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. أمثلة من المشروع الحالي

#### مثال 1: إنشاء رحلة
**الملف:** `src/app/(pages)/create-trip/page.jsx`
```javascript
const token = localStorage.getItem('access_token');

const response = await axios.post(
  'http://localhost:5000/api/tourist/trips',
  tripData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);
```

#### مثال 2: جلب الرحلات
**الملف:** `src/app/(pages)/my-trips/page.jsx`
```javascript
const response = await axios.get(
  'http://localhost:5000/api/tourist/trips',
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  }
);
```

#### مثال 3: جلب تفاصيل رحلة
**الملف:** `src/app/(pages)/my-trips/[tripId]/page.jsx`
```javascript
const response = await axios.get(
  `http://localhost:5000/api/tourist/trips/${tripId}`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  }
);
```

---

## 👤 إنشاء صفحة البروفايل للمستخدم

### 1. API Endpoint لجلب بيانات المستخدم

```javascript
// GET Profile
GET http://localhost:5000/api/tourist/profile

// Headers
Authorization: Bearer {token}

// الاستجابة المتوقعة
{
  success: true,
  data: {
    id: "507f1f77bcf86cd799439011",
    name: "اسم المستخدم",
    email: "user@example.com",
    phone: "+201234567890",
    profilePicture: "https://example.com/avatar.jpg",
    bio: "معلومات عن المستخدم",
    createdAt: "2025-01-01T00:00:00.000Z"
  }
}
```

### 2. مثال كود لصفحة البروفايل

```javascript
// src/app/(pages)/profile/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/tourist/profile',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setProfile(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('laqtaha_user');
        router.push('/login');
      } else {
        setError('فشل تحميل البيانات');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await axios.put(
        'http://localhost:5000/api/tourist/profile',
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.success) {
        setProfile(response.data.data);
        alert('تم تحديث البيانات بنجاح');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('فشل تحديث البيانات');
    }
  };

  if (loading) {
    return <div className={styles.loading}>جاري التحميل...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.profileWrapper}>
      <h1>الملف الشخصي</h1>
      {profile && (
        <div className={styles.profileCard}>
          <img src={profile.profilePicture || '/default-avatar.png'} alt={profile.name} />
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
          <p>{profile.phone}</p>
          <p>{profile.bio}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 التحقق من صلاحية التوكن

### 1. التحقق قبل الوصول للصفحات المحمية

```javascript
useEffect(() => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    router.push('/login');
  }
}, [router]);
```

### 2. معالجة انتهاء صلاحية التوكن

```javascript
try {
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
} catch (err) {
  if (err.response?.status === 401) {
    // التوكن غير صالح أو منتهي
    localStorage.removeItem('access_token');
    localStorage.removeItem('laqtaha_user');
    router.push('/login');
  }
}
```

---

## 📦 Context API للتوكن

### الملف: `src/app/context/AuthContext.js`

```javascript
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const u = localStorage.getItem("laqtaha_user");
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
  }, []);

  function setAuth({ token: newToken, user: newUser }) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("laqtaha_user", JSON.stringify(newUser));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("laqtaha_user");
  }

  return (
    <AuthContext.Provider value={{ token, user, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### استخدام Context

```javascript
import { useAuth } from '@/app/context/AuthContext';

function MyComponent() {
  const { token, user, logout } = useAuth();
  
  // يمكنك استخدام token و user مباشرة
}
```

---

## 🔍 معلومات إضافية عن التوكن

### 1. محتوى JWT Token (مشفر)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsInJvbGUiOiJ0b3VyaXN0IiwiaWF0IjoxNzMzODY0MDAwLCJleHAiOjE3MzM5NTA0MDB9.abc123xyz
```

### 2. محتوى Token بعد فك التشفير
```json
{
  "id": "507f1f77bcf86cd799439011",
  "role": "tourist",
  "iat": 1733864000,
  "exp": 1733950400
}
```

### 3. مدة صلاحية التوكن
- عادة: 24 ساعة
- يمكن التحديث باستخدام Refresh Token

---

## 📝 ملاحظات مهمة

1. **الأمان:** لا تشارك التوكن أبداً في الكود أو على GitHub
2. **التخزين:** localStorage آمن نسبياً ولكن يمكن استخدام httpOnly cookies للأمان الأفضل
3. **التحقق:** دائماً تحقق من وجود التوكن قبل عمل أي طلب محمي
4. **معالجة الأخطاء:** تعامل مع حالة 401 (Unauthorized) بإعادة توجيه للـ login
5. **Context API:** استخدم AuthContext لتجنب تكرار الكود

---

## 🚀 قائمة مرجعية للبروفايل

### ✅ خطوات إنشاء صفحة بروفايل كاملة:

1. **إنشاء الصفحة**
   ```
   src/app/(pages)/profile/page.jsx
   src/app/(pages)/profile/Profile.module.css
   ```

2. **جلب بيانات المستخدم**
   ```javascript
   GET http://localhost:5000/api/tourist/profile
   Authorization: Bearer {token}
   ```

3. **عرض البيانات**
   - الاسم
   - البريد الإلكتروني
   - رقم الهاتف
   - الصورة الشخصية
   - Bio
   - تاريخ التسجيل

4. **تحديث البيانات**
   ```javascript
   PUT http://localhost:5000/api/tourist/profile
   Authorization: Bearer {token}
   Body: { name, phone, bio, profilePicture }
   ```

5. **رفع الصورة الشخصية**
   ```javascript
   POST http://localhost:5000/api/tourist/profile/upload-picture
   Authorization: Bearer {token}
   Content-Type: multipart/form-data
   Body: FormData with 'profilePicture' field
   ```

---

## 📞 الاتصال بالـ Backend

### Base URL
```
http://localhost:5000/api
```

### Tourist Endpoints
```
POST   /auth/register          - التسجيل
POST   /auth/verify-otp        - التحقق من OTP
POST   /auth/login             - تسجيل الدخول
GET    /tourist/profile        - جلب البروفايل
PUT    /tourist/profile        - تحديث البروفايل
POST   /tourist/trips          - إنشاء رحلة
GET    /tourist/trips          - جلب جميع الرحلات
GET    /tourist/trips/:id      - جلب رحلة محددة
```

---

## 📊 ملخص سريع للتوكن في المشروع

| المفتاح | القيمة |
|---------|--------|
| **اسم التوكن** | `access_token` |
| **مكان التخزين** | `localStorage` |
| **نوع التوكن** | JWT (accessToken) |
| **الاستخدام** | `Authorization: Bearer {token}` |
| **ملف Context** | `src/app/context/AuthContext.js` |
| **مدة الصلاحية** | 24 ساعة (تقريباً) |
| **Base URL** | `http://localhost:5000/api` |

---

هذا الدليل يغطي كل ما تحتاجه للعمل مع التوكن وإنشاء صفحة البروفايل! 🎉
