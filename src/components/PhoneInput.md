# Phone Input Component

This component provides a phone number input with country code selection and validation.

## Features

- Country code dropdown with flags
- Phone number validation
- Turkey-specific validation (10 digits, starts with 5)
- Clean numeric input (removes non-digits)
- Error handling and display

## Usage

```tsx
import PhoneInput, { validatePhoneNumber } from '@/components/PhoneInput';

function MyComponent() {
  const [phone, setPhone] = useState('+905551234567');
  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (newPhone: string) => {
    setPhone(newPhone);
    setPhoneError('');
  };

  const handleSave = () => {
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      setPhoneError(validation.message);
      return;
    }
    // Save phone number
  };

  return (
    <PhoneInput
      value={phone}
      onChange={handlePhoneChange}
      error={!!phoneError}
      helperText={phoneError}
      label="Phone Number"
    />
  );
}
```

## Country Codes Supported

- Turkey (+90) - with specific validation
- US (+1)
- UK (+44)
- Germany (+49)
- France (+33)
- And many more...

## Validation Rules

- General: 7-15 digits
- Turkey (+90): Exactly 10 digits, must start with 5
- Only numeric characters allowed
- Country code is required

## Props

- `value`: Current phone number (with country code)
- `onChange`: Callback when phone number changes
- `error`: Boolean to show error state
- `helperText`: Error message to display
- `label`: Input label (default: "Phone Number")
- `fullWidth`: Whether input should take full width (default: true)
