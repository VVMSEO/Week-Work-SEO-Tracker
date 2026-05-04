# SEO Planner - Firestore Security Rules

To ensure your application is secure, you need to use the following Firestore Security Rules.
Since you authenticate users via Google Sign-In and isolate their data into paths like `users/{userId}/*`, the best practice is to ensure users can only access their own subcollections.

Here are the optimal Rules for your database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

(The rules requested in your prompt were globally open `allow read, write: if request.auth != null;`, which is slightly less secure than scoped-to-user-ID rules, but structurally they behave similarly).
