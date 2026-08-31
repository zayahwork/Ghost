# Custom Sign-Up Flow (Core 2)

> This document covers the **older SDK** (`@clerk/nextjs` v5–v6, `@clerk/clerk-react` v5–v6, `@clerk/clerk-expo` v1–v2). For the current SDK, see `core-3/custom-sign-up.md`.

Build a custom sign-up experience using the `useSignUp()` hook.

## Hook API

```typescript
import { useSignUp } from '@clerk/nextjs' // or @clerk/clerk-react, @clerk/clerk-expo

const { signUp, isLoaded, setActive } = useSignUp()
```

| Property | Type | Description |
|----------|------|-------------|
| `signUp` | `SignUp` | Sign-up object with methods |
| `isLoaded` | `boolean` | Whether the hook has loaded |
| `setActive` | `(params) => Promise` | Sets the active session |

## Sign-Up Flow

### 1. Create Sign-Up

```typescript
const result = await signUp.create({
  emailAddress: 'user@example.com',
  password: 'securePassword123',
  firstName: 'Jane',  // optional
  lastName: 'Doe',    // optional
})
```

### 2. Prepare Verification

Send a verification code to the user's email or phone:

```typescript
await signUp.prepareVerification({
  strategy: 'email_code', // or 'phone_code', 'email_link'
})
```

### 3. Attempt Verification

Verify the code the user received:

```typescript
const result = await signUp.attemptVerification({
  strategy: 'email_code',
  code: '123456',
})
```

### 4. Finalize

Set the active session after successful sign-up:

```typescript
await setActive({ session: signUp.createdSessionId })
```

### SSO (OAuth)

```typescript
await signUp.authenticateWithRedirect({
  strategy: 'oauth_google',
  redirectUrl: '/sso-callback',
  redirectUrlComplete: '/',
})
```

## Error Handling

Use try/catch with `isClerkAPIResponseError()`:

```typescript
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'

try {
  await signUp.create({ emailAddress, password })
} catch (err) {
  if (isClerkAPIResponseError(err)) {
    err.errors.forEach((e) => {
      console.log(e.code)        // e.g. 'form_password_pwned'
      console.log(e.message)     // Human-readable message
      console.log(e.longMessage) // Detailed message
    })
  }
}
```

## Sign-Up Statuses

`attemptVerification()` resolves to a sign-up whose `status` is one of:

| Status | Meaning | What to do |
|--------|---------|------------|
| `complete` | Account created | `setActive({ session: createdSessionId })` |
| `missing_requirements` | Verified, but required fields remain | Read `signUp.missingFields`, collect them, then `signUp.update({ ... })` |
| `abandoned` | Attempt expired | Restart the flow |

Handle all three. Branching only on `complete` strands the user on the
verification step with no feedback when the instance requires extra fields
(for example first/last name enabled in **User & Authentication**).

The example below collects `first_name` and `last_name` only. Any other entry
`missingFields` can report (`username`, `phone_number`, `legal_accepted`, custom
attributes) needs its own input and its own handling — see the scope note under
the example. Ignoring an entry leaves the sign-up stuck on
`missing_requirements`, so surface anything you do not handle instead of
dropping it.

## Complete Example: Email/Password with Email Verification

Scope: the completion form below covers instances whose only extra required
fields are first and last name. If your instance requires anything else
(username, phone number, custom attributes), add the matching inputs and pass
them to `signUp.update()` — `missingFields` reports snake_case keys, while
`update()` takes camelCase props. `phone_number` needs more than an update: after
`signUp.update({ phoneNumber })`, run `prepareVerification({ strategy:
'phone_code' })` and `attemptVerification({ strategy: 'phone_code', code })`
before the sign-up can complete.

```tsx
'use client'
import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [step, setStep] = useState<'register' | 'verify' | 'complete-profile'>('register')
  const [error, setError] = useState('')

  if (!isLoaded) return <div>Loading...</div>

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareVerification({ strategy: 'email_code' })
      setStep('verify')
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Sign up failed')
      }
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const result = await signUp.attemptVerification({
        strategy: 'email_code',
        code,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
        return
      }

      if (result.status === 'missing_requirements') {
        // Email is verified, but the instance still requires fields before the
        // account can be created. Collect them rather than stalling on 'verify'.
        setMissingFields(result.missingFields)
        setStep('complete-profile')
        return
      }

      // 'abandoned' — the sign-up attempt expired; send the user back to the start.
      setError('This sign-up has expired. Please start again.')
      setStep('register')
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Verification failed')
      }
    }
  }

  async function handleCompleteProfile(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    try {
      // Only send what Clerk actually asked for. This form handles first/last
      // name only — extend both branches for any other required field.
      const result = await signUp.update({
        ...(missingFields.includes('first_name') && { firstName }),
        ...(missingFields.includes('last_name') && { lastName }),
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
        return
      }

      // Still incomplete — refresh the list so the form reflects what remains.
      setMissingFields(result.missingFields)
      setError('Some required information is still missing.')
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setError(err.errors[0]?.message || 'Could not complete sign up')
      }
    }
  }

  if (step === 'complete-profile') {
    return (
      <form onSubmit={handleCompleteProfile}>
        <p>We need a little more information to finish your account.</p>
        {missingFields.includes('first_name') && (
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        )}
        {missingFields.includes('last_name') && (
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        )}
        {error && <p>{error}</p>}
        <button type="submit">Finish Sign Up</button>
      </form>
    )
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify}>
        <p>Check your email for a verification code.</p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Verification code"
        />
        {error && <p>{error}</p>}
        <button type="submit">Verify Email</button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRegister}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p>{error}</p>}
      <button type="submit">Sign Up</button>
    </form>
  )
}
```

## Docs

- [Custom sign-up flow](https://clerk.com/docs/custom-flows/overview)
- [useSignUp() reference](https://clerk.com/docs/references/react/use-sign-up)
